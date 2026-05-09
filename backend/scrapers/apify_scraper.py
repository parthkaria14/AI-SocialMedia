"""
apify_scraper.py — Apify Instagram scraper adapter (v3 — accuracy-first)

Two-phase architecture using purpose-built actors:
  Phase 1: apify/instagram-profile-scraper  → profile data + follower count
  Phase 2: apify/instagram-post-scraper     → N posts with full metrics

Why two actors?
  • Profile scraper gives accurate follower count (needed for ER calc)
  • Post scraper is purpose-built for posts — returns videoPlayCount,
    hashtags, mentions, comments, tagged users, etc. at $1/1000 posts

View count fix:
  Instagram exposes TWO view metrics:
    videoPlayCount  → what Instagram shows publicly as "views"  ← USE THIS
    videoViewCount  → internal/partial metric, always lower
  Previous code used videoViewCount first — causing ~60% undercount.

Returns IDENTICAL data shape to InstagramScraper.get_complete_brand_data()
so main.py needs zero changes.
"""

import os, time, re, math, requests
from datetime import datetime
from dotenv import load_dotenv
try:
    from apify_token_manager import get_active_token          # direct run
except ImportError:
    from scrapers.apify_token_manager import get_active_token  # via main.py

load_dotenv()

APIFY_BASE    = "https://api.apify.com/v2"
POLL_INTERVAL = 10   # seconds between status checks
MAX_WAIT      = 900  # 15 minutes max

# Purpose-built actors for maximum accuracy
PROFILE_ACTOR = "apify~instagram-profile-scraper"   # profile metadata + followers
POSTS_ACTOR   = "apify~instagram-post-scraper"      # dedicated post scraper


class ApifyScraper:

    def __init__(self, token: str = ""):
        # If caller passes explicit token use it; otherwise auto-rotate
        self.token = token if token else get_active_token(check_usage=True)
        if not self.token:
            raise ValueError(
                "No APIFY_TOKEN set. Add APIFY_TOKEN_1/2/3 to .env"
            )

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"}

    # ── Actor helpers ─────────────────────────────────────────────────────────

    def _start_actor(self, actor_id: str, input_json: dict) -> str:
        """Start an actor run, return run_id."""
        resp = requests.post(
            f"{APIFY_BASE}/acts/{actor_id}/runs",
            headers=self._headers(),
            json=input_json,
            timeout=60,
        )
        if resp.status_code not in (200, 201):
            raise Exception(f"Apify run start failed ({actor_id}): {resp.status_code} {resp.text[:300]}")

        run_id = resp.json()["data"]["id"]
        print(f"    🚀 {actor_id} → run {run_id}")
        return run_id

    def _wait_for_run(self, run_id: str) -> str:
        """Poll until run finishes. Returns 'SUCCEEDED' or raises."""
        start = time.time()
        while time.time() - start < MAX_WAIT:
            resp   = requests.get(f"{APIFY_BASE}/actor-runs/{run_id}", headers=self._headers(), timeout=30)
            status = resp.json()["data"]["status"]
            print(f"    ⏳ {status}")

            if status == "SUCCEEDED":
                return status
            if status in ("FAILED", "ABORTED", "TIMED-OUT"):
                raise Exception(f"Apify run {run_id} ended with: {status}")

            time.sleep(POLL_INTERVAL)

        raise Exception(f"Apify run {run_id} timed out after {MAX_WAIT}s")

    def _get_results(self, run_id: str) -> list:
        """Fetch dataset items from completed run."""
        resp = requests.get(
            f"{APIFY_BASE}/actor-runs/{run_id}/dataset/items",
            headers=self._headers(),
            params={"format": "json"},
            timeout=120,
        )
        if resp.status_code != 200:
            raise Exception(f"Apify result fetch failed: {resp.status_code}")
        return resp.json()

    # ── Phase 1: Profile data ─────────────────────────────────────────────────

    def _fetch_profile(self, username: str) -> dict:
        """Use instagram-profile-scraper to get profile metadata + follower count."""
        print(f"  📋 Phase 1: profile data for @{username}")
        run_id = self._start_actor(PROFILE_ACTOR, {
            "usernames": [username],
            "proxy":     {"useApifyProxy": True},
        })
        self._wait_for_run(run_id)
        results = self._get_results(run_id)

        if not results:
            raise Exception(f"Profile scraper returned no data for @{username}")

        raw = results[0]
        followers = raw.get("followersCount", 0) or 0
        print(f"    ✅ Profile: {followers:,} followers, {raw.get('postsCount', '?')} posts")
        return raw

    # ── Phase 2: Posts ────────────────────────────────────────────────────────

    def _fetch_posts(self, username: str, max_posts: int) -> list:
        """Use instagram-post-scraper (dedicated) to get N posts with full metrics."""
        print(f"  📝 Phase 2: {max_posts} posts for @{username}")
        run_id = self._start_actor(POSTS_ACTOR, {
            "username":     [username],
            "resultsLimit": max_posts,
        })
        self._wait_for_run(run_id)
        results = self._get_results(run_id)
        print(f"    ✅ Posts: {len(results)} items returned")
        return results

    # ── Hashtag / mention extraction (fallback) ───────────────────────────────

    @staticmethod
    def _extract_hashtags(caption: str) -> list[str]:
        if not caption:
            return []
        return [m.lower() for m in re.findall(r"#(\w+)", caption)]

    @staticmethod
    def _extract_mentions(caption: str) -> list[str]:
        if not caption:
            return []
        return [m.lower() for m in re.findall(r"@(\w+)", caption)]

    # ── Data normalisation ────────────────────────────────────────────────────

    def _normalise_profile(self, raw: dict) -> dict:
        """Map Apify profile fields → our schema."""
        return {
            "username":        raw.get("username", ""),
            "full_name":       raw.get("fullName", ""),
            "bio":             raw.get("biography", ""),
            "followers":       raw.get("followersCount", 0),
            "following":       raw.get("followsCount", 0),
            "posts_count":     raw.get("postsCount", 0),
            "is_verified":     raw.get("verified", False),
            "is_private":      raw.get("private", False),
            "profile_pic_url": raw.get("profilePicUrl", ""),
            "external_url":    raw.get("externalUrl", None),
            # Bonus fields
            "category":        raw.get("businessCategoryName", None),
            "business_email":  raw.get("businessEmail", None),
            "business_phone":  raw.get("businessPhoneNumber", None),
        }

    def _normalise_post(self, raw: dict, followers: int) -> dict:
        """Map Apify post fields → our schema with correct view counts."""
        likes    = max(raw.get("likesCount", 0) or 0, 0)      # clamp -1 → 0
        comments = max(raw.get("commentsCount", 0) or 0, 0)
        engagement = likes + comments

        # ── View count: videoPlayCount is what Instagram shows publicly ──
        # videoViewCount is an internal/partial metric, always lower
        views = (
            raw.get("videoPlayCount")
            or raw.get("videoViewCount")
            or None
        )
        # Ensure views is int or None
        if views is not None:
            views = int(views)

        # Normalise post type
        type_map = {
            "Image":        "GraphImage",
            "Video":        "GraphVideo",
            "Sidecar":      "GraphSidecar",
            "GraphImage":   "GraphImage",
            "GraphVideo":   "GraphVideo",
            "GraphSidecar": "GraphSidecar",
        }
        raw_type = raw.get("type", "Image")
        typename = type_map.get(raw_type, "GraphImage")

        # Timestamp
        ts_raw = raw.get("timestamp") or raw.get("takenAt", "")
        try:
            if isinstance(ts_raw, (int, float)):
                timestamp = datetime.utcfromtimestamp(ts_raw).isoformat()
            else:
                timestamp = datetime.fromisoformat(str(ts_raw).replace("Z", "+00:00")).isoformat()
        except Exception:
            timestamp = datetime.utcnow().isoformat()

        # Hashtags — prefer structured array, fall back to regex
        caption = raw.get("caption", "") or ""
        raw_hashtags = raw.get("hashtags")
        if raw_hashtags and isinstance(raw_hashtags, list) and len(raw_hashtags) > 0:
            hashtags = [str(h).lstrip("#").lower() for h in raw_hashtags]
        else:
            hashtags = self._extract_hashtags(caption)

        # Mentions
        raw_mentions = raw.get("mentions")
        if raw_mentions and isinstance(raw_mentions, list) and len(raw_mentions) > 0:
            # Clean trailing punctuation Apify sometimes leaves (e.g. "hulu.")
            mentions = [re.sub(r"[^a-zA-Z0-9_.]", "", str(m)).lower() for m in raw_mentions]
        else:
            mentions = self._extract_mentions(caption)

        shortcode = raw.get("shortCode") or raw.get("shortcode") or raw.get("id", "")

        # Engagement rate — uses verified follower count from Phase 1
        er       = round((engagement / followers * 100), 4) if followers > 0 else 0
        er_views = round((engagement / views * 100), 4) if views and views > 0 else None

        return {
            "post_id":               shortcode,
            "url":                   raw.get("url") or f"https://instagram.com/p/{shortcode}/",
            "caption":               caption,
            "likes":                 likes,
            "comments":              comments,
            "views":                 views,
            "timestamp":             timestamp,
            "is_video":              typename == "GraphVideo",
            "typename":              typename,
            "media_url":             raw.get("displayUrl") or raw.get("thumbnailUrl", ""),
            "hashtags":              hashtags,
            "mentions":              mentions,
            "location":              raw.get("locationName", None),
            "engagement_rate":       er,
            "engagement_rate_views": er_views,
            "display_url":           raw.get("displayUrl", ""),
        }

    # ── Analysis ──────────────────────────────────────────────────────────────

    def _analyze_patterns(self, posts: list, followers: int) -> dict:
        if not posts:
            return {}

        hour_eng: dict = {}
        day_eng:  dict = {}

        for post in posts:
            try:
                dt = datetime.fromisoformat(post["timestamp"].replace("Z", "+00:00"))
            except Exception:
                continue
            er = post.get("engagement_rate", 0)
            hour_eng.setdefault(dt.hour,          []).append(er)
            day_eng.setdefault(dt.strftime("%A"), []).append(er)

        best_hours = sorted(hour_eng.items(), key=lambda x: sum(x[1])/len(x[1]), reverse=True)[:3]
        best_days  = sorted(day_eng.items(),  key=lambda x: sum(x[1])/len(x[1]), reverse=True)[:3]

        all_er    = [p["engagement_rate"] for p in posts]
        avg_er    = sum(all_er) / len(all_er) if all_er else 0
        sorted_er = sorted(all_er)
        mid       = len(sorted_er) // 2
        median_er = (
            (sorted_er[mid-1] + sorted_er[mid]) / 2
            if len(sorted_er) % 2 == 0 else sorted_er[mid]
        ) if sorted_er else 0

        # Outlier detection — 95th-percentile threshold + hard cap at 5% of posts.
        # IQR breaks on skewed ER data: compressed IQR → fence too tight → too many outliers.
        max_outliers = max(1, math.ceil(len(posts) * 0.05))   # e.g. 50 posts → 3
        p95_idx      = math.ceil(len(sorted_er) * 0.95) - 1
        fence        = sorted_er[max(p95_idx, 0)]
        # Sort descending so the hardest outliers are capped first
        outlier_candidates = sorted(
            [p for p in posts if p["engagement_rate"] > fence],
            key=lambda p: p["engagement_rate"],
            reverse=True,
        )
        outliers = outlier_candidates[:max_outliers]
        outlier_er_set = {p["post_id"] for p in outliers}
        clean    = [e for e in all_er if e <= fence or
                    next((p for p in posts if p["engagement_rate"] == e and p["post_id"] in outlier_er_set), None) is None]

        video_views = [p["views"] for p in posts if p.get("views") is not None]
        view_ers    = [p["engagement_rate_views"] for p in posts if p.get("engagement_rate_views")]

        return {
            "best_posting_hours":            [h[0] for h in best_hours],
            "best_posting_days":             [d[0] for d in best_days],
            "average_likes":                 round(sum(p["likes"]    for p in posts) / len(posts)),
            "average_comments":              round(sum(p["comments"] for p in posts) / len(posts)),
            "average_views":                 round(sum(video_views) / len(video_views)) if video_views else 0,
            "total_views":                   sum(video_views),
            "average_engagement_rate":       round(avg_er, 4),
            "median_engagement_rate":        round(median_er, 4),
            "adjusted_avg_engagement_rate":  round(sum(clean)/len(clean), 4) if clean else round(avg_er, 4),
            "outlier_count":                 len(outliers),
            "outlier_shortcodes":            [p["post_id"] for p in outliers[:3]],
            "average_engagement_rate_views": round(sum(view_ers)/len(view_ers), 4) if view_ers else None,
            "posting_frequency":             len(posts),
        }

    def _extract_brand_elements(self, posts: list) -> dict:
        if not posts:
            return {}

        hashtag_freq: dict = {}
        captions = []

        for post in posts:
            if post.get("caption"):
                captions.append(post["caption"])
            for tag in post.get("hashtags", []):
                hashtag_freq[tag] = hashtag_freq.get(tag, 0) + 1

        top_tags = sorted(hashtag_freq.items(), key=lambda x: x[1], reverse=True)[:20]

        return {
            "top_hashtags":         [t[0] for t in top_tags],
            "total_posts_analyzed": len(posts),
            "captions_sample":      captions[:10],
            "has_videos":           sum(1 for p in posts if p.get("typename") == "GraphVideo"),
            "has_images":           sum(1 for p in posts if p.get("typename") == "GraphImage"),
            "has_carousels":        sum(1 for p in posts if p.get("typename") == "GraphSidecar"),
        }

    # ── Main entry point ──────────────────────────────────────────────────────

    def get_complete_brand_data(self, username: str, max_posts: int = 50) -> dict | None:
        """
        Two-phase scrape for maximum accuracy:
          1. Profile scraper → verified follower count + profile metadata
          2. Post scraper    → N posts with accurate videoPlayCount views
        """
        print(f"🔍 Apify scraping @{username} ({max_posts} posts)...")

        # ── Phase 1: Profile data ─────────────────────────────────────────
        raw_profile = self._fetch_profile(username)
        followers   = raw_profile.get("followersCount", 0) or 0
        profile     = self._normalise_profile(raw_profile)

        if followers == 0:
            print(f"  ⚠️  followersCount is 0 — ER will be 0% for all posts")

        # ── Phase 2: Posts ────────────────────────────────────────────────
        raw_posts = self._fetch_posts(username, max_posts)

        if not raw_posts:
            # Fall back to ~12 latestPosts embedded in profile scraper output
            raw_posts = raw_profile.get("latestPosts") or raw_profile.get("posts") or []
            print(f"  ⚠️  Post scraper returned 0 items, using {len(raw_posts)} from profile scraper")

        posts = [self._normalise_post(p, followers) for p in raw_posts]

        # ── Debug stats ───────────────────────────────────────────────────
        posts_with_tags  = sum(1 for p in posts if p.get("hashtags"))
        total_tags       = sum(len(p.get("hashtags", [])) for p in posts)
        posts_with_views = sum(1 for p in posts if p.get("views") is not None)
        total_views      = sum(p["views"] for p in posts if p.get("views") is not None)
        print(f"  📊 Stats: {len(posts)} posts | {followers:,} followers")
        print(f"     #️⃣  {total_tags} hashtags across {posts_with_tags} posts")
        print(f"     👁️  {posts_with_views} videos, {total_views:,} total views (using videoPlayCount)")

        patterns = self._analyze_patterns(posts, followers)
        brand    = self._extract_brand_elements(posts)

        avg_er = patterns.get("average_engagement_rate", 0)
        avg_views = patterns.get("average_views", 0)
        print(f"✅ Done: {len(posts)} posts | avg ER {avg_er:.2f}% | avg views {avg_views:,}")

        return {
            "profile":        profile,
            "posts":          posts,
            "patterns":       patterns,
            "brand_elements": brand,
            "scraped_at":     datetime.utcnow().isoformat(),
            "source":         "apify",
        }