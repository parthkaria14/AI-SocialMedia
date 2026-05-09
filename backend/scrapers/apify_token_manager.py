"""
apify_token_manager.py — Auto-rotate Apify tokens when usage > $4.70/month.

Reads APIFY_TOKEN_1, APIFY_TOKEN_2, APIFY_TOKEN_3 from env.
On each call to get_active_token(), checks the current token's
monthly usage. If >= USAGE_LIMIT_USD, rotates to next key.
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

USAGE_LIMIT_USD = 4.70
APIFY_BASE      = "https://api.apify.com/v2"

# Load all keys (skip empty ones)
_ALL_TOKENS: list[str] = [
    t for t in [
        os.getenv("APIFY_TOKEN_1", ""),
        os.getenv("APIFY_TOKEN_2", ""),
        os.getenv("APIFY_TOKEN_3", ""),
        os.getenv("APIFY_TOKEN_4", ""),
        os.getenv("APIFY_TOKEN_5", ""),
        os.getenv("APIFY_TOKEN_6", ""),
    ] if t
]

if not _ALL_TOKENS:
    raise EnvironmentError(
        "No Apify tokens found. Set APIFY_TOKEN_1, APIFY_TOKEN_2, APIFY_TOKEN_3 in .env"
    )

# Persist index in memory (lives for the lifetime of the server process)
_current_index: int = 0


def get_monthly_usage_usd(token: str) -> float:
    """Return total USD usage this billing cycle for given token. Returns -1 on error."""
    try:
        r = requests.get(
            f"{APIFY_BASE}/users/me/usage/monthly",
            headers={"Authorization": f"Bearer {token}"},
            timeout=15,
        )
        if r.status_code != 200:
            print(f"  ⚠️  Usage check failed ({r.status_code}) for token ...{token[-6:]}")
            return -1
        data = r.json()["data"]
        usage = data.get("totalUsageCreditsUsdAfterVolumeDiscount") or \
                data.get("totalUsageCreditsUsdBeforeVolumeDiscount") or 0.0
        return float(usage)
    except Exception as e:
        print(f"  ⚠️  Usage check error: {e}")
        return -1


def get_active_token(check_usage: bool = True) -> str:
    """
    Return the active Apify token.
    If current token usage >= USAGE_LIMIT_USD, rotate to next.
    """
    global _current_index

    if not check_usage:
        return _ALL_TOKENS[_current_index]

    # Try tokens starting from current index
    attempts = 0
    while attempts < len(_ALL_TOKENS):
        token = _ALL_TOKENS[_current_index]
        usage = get_monthly_usage_usd(token)
        label = f"token #{_current_index + 1} (...{token[-6:]})"

        if usage < 0:
            # Error fetching usage — use token anyway, don't rotate
            print(f"  ℹ️  Using {label} (usage check unavailable)")
            return token

        print(f"  💳 {label} usage: ${usage:.4f} / ${USAGE_LIMIT_USD}")

        if usage < USAGE_LIMIT_USD:
            return token

        # Over limit — rotate
        next_index = (_current_index + 1) % len(_ALL_TOKENS)
        if next_index == _current_index:
            print(f"  ⚠️  All {len(_ALL_TOKENS)} tokens are over ${USAGE_LIMIT_USD}. Using current anyway.")
            return token

        print(f"  🔄 Token #{_current_index + 1} over ${USAGE_LIMIT_USD} (${usage:.2f}). Rotating to #{next_index + 1}...")
        _current_index = next_index
        attempts += 1

    # All tokens exhausted — use last one
    print(f"  ⚠️  All tokens over limit. Using token #{_current_index + 1}.")
    return _ALL_TOKENS[_current_index]


def status() -> list[dict]:
    """Return usage status of all tokens (for diagnostics)."""
    results = []
    for i, token in enumerate(_ALL_TOKENS):
        usage = get_monthly_usage_usd(token)
        results.append({
            "index":     i + 1,
            "token_end": token[-6:],
            "usage_usd": usage,
            "over_limit": usage >= USAGE_LIMIT_USD if usage >= 0 else None,
            "active":    i == _current_index,
        })
    return results
