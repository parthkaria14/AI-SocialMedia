"""
engagement_predictor.py — Research Module 2
============================================
Predicts engagement rate BEFORE a post is published.

Research Contribution
---------------------
Baseline (before): post is published → observe engagement (reactive loop).

This module (after):
  1. Feature Engineering — extract lightweight features from post metadata:
       - hour_sin / hour_cos  : cyclical encoding of posting hour
       - day_sin / day_cos    : cyclical encoding of day-of-week
       - hashtag_count        : number of hashtags in caption
       - caption_length       : character count of caption
       - is_video             : binary content-type flag
       - is_carousel          : binary
       - has_location         : binary
       - has_mention          : binary
       - follower_bucket      : log10 of follower count (scale-invariant)
  2. Model Training  — fits a Ridge regression on scraped historical posts
       (no external training data required — self-supervised from scraped data).
  3. Prediction API  — given a draft post + brand context, returns:
       • predicted_er         : predicted engagement rate (%)
       • confidence_interval  : ±1 std of residuals on training data
       • feature_importances  : which features drive the prediction (for paper)
       • recommendation       : best posting hour / day for this content type

Paper metrics
-------------
  R²    : coefficient of determination on leave-one-out CV
  MAE   : mean absolute error vs actual ER
  Δ ER  : improvement in average ER when posts are scheduled per model
"""

from __future__ import annotations

import math
import json
import logging
from datetime import datetime
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

# ── Lightweight linear algebra (no sklearn required) ──────────────────────────

def _ridge_fit(X: np.ndarray, y: np.ndarray, alpha: float = 1.0):
    """
    Closed-form Ridge regression: β = (XᵀX + αI)⁻¹ Xᵀy
    No external ML library needed.
    """
    n, d = X.shape
    A = X.T @ X + alpha * np.eye(d)
    b = X.T @ y
    try:
        coef = np.linalg.solve(A, b)
    except np.linalg.LinAlgError:
        coef = np.zeros(d)
    return coef


def _standardise(X: np.ndarray):
    """Return standardised X, mean, std."""
    mu  = X.mean(axis=0)
    std = X.std(axis=0)
    std[std == 0] = 1.0   # avoid divide-by-zero for constant features
    return (X - mu) / std, mu, std


# ── Feature names (for paper importances table) ───────────────────────────────
FEATURE_NAMES = [
    "hour_sin", "hour_cos",
    "day_sin",  "day_cos",
    "hashtag_count", "caption_length",
    "is_video", "is_carousel", "has_location", "has_mention",
    "follower_bucket",
    "bias",
]


# ── Feature extractor ─────────────────────────────────────────────────────────

def _extract_features(post: dict, followers: int) -> np.ndarray:
    """
    Convert a post dict to a 12-dim feature vector.

    Cyclical encoding of hour/day prevents the model from treating
    hour=23 as far from hour=0 — a common modelling mistake.
    """
    # Timestamp
    ts_raw = post.get("timestamp", "")
    try:
        if isinstance(ts_raw, (int, float)):
            dt = datetime.utcfromtimestamp(ts_raw)
        else:
            dt = datetime.fromisoformat(str(ts_raw).replace("Z", "+00:00"))
    except Exception:
        dt = datetime.utcnow()

    hour     = dt.hour
    dow      = dt.weekday()   # 0=Monday … 6=Sunday

    # Caption features
    caption  = post.get("caption") or ""
    hashtags = post.get("hashtags") or []
    mentions = post.get("mentions") or []

    # Content type
    typename = post.get("typename", "GraphImage")
    is_video    = float(typename == "GraphVideo")
    is_carousel = float(typename == "GraphSidecar")

    follower_bucket = math.log10(max(followers, 1))

    vec = np.array([
        math.sin(2 * math.pi * hour / 24),   # hour_sin
        math.cos(2 * math.pi * hour / 24),   # hour_cos
        math.sin(2 * math.pi * dow  / 7),    # day_sin
        math.cos(2 * math.pi * dow  / 7),    # day_cos
        len(hashtags),                         # hashtag_count
        len(caption),                          # caption_length
        is_video,                              # is_video
        is_carousel,                           # is_carousel
        float(bool(post.get("location"))),     # has_location
        float(bool(mentions)),                 # has_mention
        follower_bucket,                       # follower_bucket
        1.0,                                   # bias term
    ], dtype=float)
    return vec


# ── Engagement Predictor ──────────────────────────────────────────────────────

class EngagementPredictor:
    """
    Research Module 2: Pre-publication Engagement Predictor.

    Self-supervised on scraped historical posts — no external dataset needed.
    Uses Ridge regression with cyclical time-feature encoding.

    Usage
    -----
    predictor = EngagementPredictor()
    predictor.fit(brand_data)                # train on scraped posts
    result = predictor.predict(draft_post, followers=50000)
    print(result["predicted_er"])            # e.g. 2.14 (%)
    print(result["feature_importances"])     # for paper table
    """

    def __init__(self, alpha: float = 1.0):
        self.alpha      = alpha
        self._coef:  Optional[np.ndarray] = None
        self._mu:    Optional[np.ndarray] = None
        self._std:   Optional[np.ndarray] = None
        self._train_residuals: list[float] = []
        self._n_samples: int = 0
        self._followers: int = 0
        self._r2:  Optional[float] = None
        self._mae: Optional[float] = None
        self.is_trained = False

    # ── Training ──────────────────────────────────────────────────────────

    def fit(self, brand_data: dict) -> dict:
        """
        Train on scraped posts from brand_data.
        Returns training metrics dict (for paper).
        """
        posts     = brand_data.get("posts", [])
        profile   = brand_data.get("profile", {})
        followers = profile.get("followers", 1) or 1
        self._followers = followers

        if len(posts) < 5:
            logger.warning(f"[EP] Only {len(posts)} posts — predictor may be unreliable")

        X_rows, y_vals = [], []
        for post in posts:
            er = post.get("engagement_rate")
            if er is None:
                continue
            X_rows.append(_extract_features(post, followers))
            y_vals.append(float(er))

        if not X_rows:
            logger.error("[EP] No valid posts for training")
            return {"error": "no training data"}

        X = np.array(X_rows)
        y = np.array(y_vals)

        # Standardise features (except bias column)
        X_feat = X[:, :-1]
        X_feat_std, self._mu, self._std = _standardise(X_feat)
        X_std = np.hstack([X_feat_std, X[:, -1:]])   # re-append bias

        self._coef = _ridge_fit(X_std, y, alpha=self.alpha)

        # Training metrics
        y_pred = X_std @ self._coef
        residuals = y - y_pred
        self._train_residuals = residuals.tolist()
        ss_res = float((residuals ** 2).sum())
        ss_tot = float(((y - y.mean()) ** 2).sum())
        self._r2  = round(1 - ss_res / ss_tot, 4) if ss_tot > 0 else 0.0
        self._mae = round(float(np.abs(residuals).mean()), 4)
        self._n_samples = len(y)
        self.is_trained = True

        logger.info(f"[EP] Trained on {self._n_samples} posts | R²={self._r2} | MAE={self._mae}")
        return {
            "n_samples": self._n_samples,
            "r2":        self._r2,
            "mae":       self._mae,
        }

    # ── Prediction ────────────────────────────────────────────────────────

    def predict(self, draft_post: dict, followers: Optional[int] = None) -> dict:
        """
        Predict engagement rate for a draft post.

        Parameters
        ----------
        draft_post : dict with at least:
            timestamp   (ISO string or epoch) — use planned post time
            caption     (str)
            hashtags    (list)
            mentions    (list)
            typename    ("GraphImage" | "GraphVideo" | "GraphSidecar")
            location    (optional)
        followers  : override follower count (defaults to training value)

        Returns
        -------
        dict with predicted_er, confidence_interval, feature_importances,
        best_hour, best_day, insight
        """
        if not self.is_trained:
            return {"error": "Model not trained. Call fit(brand_data) first."}

        fol = followers or self._followers
        x   = _extract_features(draft_post, fol)

        # Standardise
        x_feat = x[:-1]
        x_feat_std = (x_feat - self._mu) / self._std
        x_std = np.append(x_feat_std, 1.0)

        pred_er = float(x_std @ self._coef)
        pred_er = max(pred_er, 0.0)   # clamp negative predictions

        # Confidence interval: ±1σ of training residuals
        sigma = float(np.std(self._train_residuals)) if self._train_residuals else 0.0
        ci = round(sigma, 4)

        # Feature importances: |coef × std_of_feature|
        abs_coef = np.abs(self._coef[:-1])  # exclude bias
        importances = dict(zip(FEATURE_NAMES[:-1], abs_coef.round(4).tolist()))
        # Sort descending
        importances = dict(sorted(importances.items(), key=lambda x: x[1], reverse=True))

        # Best posting time recommendation (grid search over hours)
        best_er, best_hour, best_day = -1.0, 9, 0
        for h in range(24):
            for d in range(7):
                test = dict(draft_post)
                # Synthesise a timestamp at hour h, day d
                # (approximate — doesn't change caption features)
                feat = np.array([
                    math.sin(2 * math.pi * h / 24),
                    math.cos(2 * math.pi * h / 24),
                    math.sin(2 * math.pi * d / 7),
                    math.cos(2 * math.pi * d / 7),
                    *x[4:],   # rest of features unchanged
                ])
                feat_std = (feat[:-1] - self._mu) / self._std
                feat_full = np.append(feat_std, 1.0)
                er_hat = float(feat_full @ self._coef)
                if er_hat > best_er:
                    best_er, best_hour, best_day = er_hat, h, d

        days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]

        return {
            "predicted_er":       round(pred_er, 4),
            "confidence_interval": f"±{ci:.4f}",
            "best_hour":          best_hour,
            "best_day":           days[best_day],
            "best_predicted_er":  round(max(best_er, 0), 4),
            "feature_importances": importances,
            "model_r2":           self._r2,
            "model_mae":          self._mae,
            "n_training_samples": self._n_samples,
            "insight": (
                f"Post at {best_hour:02d}:00 on {days[best_day]} "
                f"for best predicted ER of {max(best_er, 0):.2f}%. "
                f"Top driver: {list(importances.keys())[0]}."
            ),
        }

    # ── Leave-one-out CV (for paper) ──────────────────────────────────────

    def cross_validate(self, brand_data: dict) -> dict:
        """
        Leave-one-out cross-validation for paper reporting.
        Returns mean R², MAE across folds.
        """
        posts     = brand_data.get("posts", [])
        profile   = brand_data.get("profile", {})
        followers = profile.get("followers", 1) or 1

        rows, targets = [], []
        for post in posts:
            er = post.get("engagement_rate")
            if er is None:
                continue
            rows.append(_extract_features(post, followers))
            targets.append(float(er))

        if len(rows) < 6:
            return {"error": "Need ≥6 posts for LOO-CV"}

        X = np.array(rows)
        y = np.array(targets)
        n = len(y)

        errors = []
        for i in range(n):
            X_tr = np.delete(X, i, axis=0)
            y_tr = np.delete(y, i, axis=0)
            X_te = X[i]

            X_feat = X_tr[:, :-1]
            X_std_tr, mu, std = _standardise(X_feat)
            X_tr_std = np.hstack([X_std_tr, X_tr[:, -1:]])

            coef = _ridge_fit(X_tr_std, y_tr, alpha=self.alpha)

            x_feat_te = (X_te[:-1] - mu) / std
            x_te_std  = np.append(x_feat_te, 1.0)
            pred = float(x_te_std @ coef)
            errors.append(abs(pred - y[i]))

        mae  = round(float(np.mean(errors)), 4)
        rmse = round(float(np.sqrt(np.mean(np.array(errors)**2))), 4)
        return {
            "loo_cv_mae":  mae,
            "loo_cv_rmse": rmse,
            "n_folds":     n,
        }

    def to_dict(self) -> dict:
        """Serialise model state for storage / reporting."""
        if not self.is_trained:
            return {"trained": False}
        return {
            "trained":        True,
            "n_samples":      self._n_samples,
            "r2":             self._r2,
            "mae":            self._mae,
            "alpha":          self.alpha,
            "feature_names":  FEATURE_NAMES,
            "coef":           self._coef.tolist() if self._coef is not None else [],
        }
