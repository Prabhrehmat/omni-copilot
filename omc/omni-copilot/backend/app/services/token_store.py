"""
Token store — persists to a local JSON file so tokens survive backend restarts.
Auto-refreshes expired Google tokens using the refresh_token.
"""
import json
import time
import os
from typing import Dict, Optional
import httpx

_TOKEN_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "tokens.json")
_TOKEN_FILE = os.path.normpath(_TOKEN_FILE)

# In-memory cache
_tokens: Dict[str, Dict] = {}
_loaded = False


def _load():
    global _tokens, _loaded
    if _loaded:
        return
    _loaded = True
    if os.path.exists(_TOKEN_FILE):
        try:
            with open(_TOKEN_FILE, "r") as f:
                _tokens = json.load(f)
        except Exception:
            _tokens = {}


def _persist():
    try:
        with open(_TOKEN_FILE, "w") as f:
            json.dump(_tokens, f, indent=2)
    except Exception:
        pass


def save_token(provider: str, token_data: Dict):
    _load()
    # Record when the token was saved so we can check expiry
    token_data["saved_at"] = time.time()
    _tokens[provider] = token_data
    _persist()


def get_token(provider: str) -> Optional[Dict]:
    _load()
    return _tokens.get(provider)


def delete_token(provider: str):
    _load()
    _tokens.pop(provider, None)
    _persist()


def is_connected(provider: str) -> bool:
    _load()
    return provider in _tokens and bool(_tokens[provider].get("access_token"))


def all_connected() -> Dict[str, bool]:
    _load()
    providers = ["gmail", "googleCalendar", "googleDrive", "googleForms", "googleMeet",
                 "slack", "notion", "discord", "oneDrive", "teams", "outlook", "zoom"]
    return {p: is_connected(p) for p in providers}


async def get_valid_google_token(provider: str) -> Optional[str]:
    """
    Return a valid Google access token, refreshing it if expired.
    Google access tokens expire after 3600 seconds.
    """
    _load()
    token_data = _tokens.get(provider)
    if not token_data:
        return None

    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")
    saved_at = token_data.get("saved_at", 0)
    expires_in = token_data.get("expires_in", 3600)

    # Refresh if token is within 5 minutes of expiry or already expired
    age = time.time() - saved_at
    if age >= (expires_in - 300) and refresh_token:
        try:
            from ..core.config import settings
            async with httpx.AsyncClient() as client:
                r = await client.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "client_id": settings.google_client_id,
                        "client_secret": settings.google_client_secret,
                        "refresh_token": refresh_token,
                        "grant_type": "refresh_token",
                    },
                    timeout=10,
                )
                r.raise_for_status()
                new_tokens = r.json()
                # Merge — refresh responses don't include a new refresh_token
                token_data.update(new_tokens)
                token_data["saved_at"] = time.time()
                # Apply refreshed token to all Google providers
                for p in ("gmail", "googleCalendar", "googleDrive", "googleForms", "googleMeet"):
                    if p in _tokens:
                        _tokens[p] = token_data.copy()
                _persist()
                access_token = token_data.get("access_token")
        except Exception as e:
            # Return existing token and let the caller handle the 401
            pass

    return access_token
