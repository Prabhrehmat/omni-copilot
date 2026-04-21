"""Simple in-memory conversation store (swap for Redis/Firestore in production)."""
from typing import Dict, List
from collections import defaultdict
import time

# conversation_id -> list of messages
_store: Dict[str, List[Dict]] = defaultdict(list)
_timestamps: Dict[str, float] = {}
MAX_MESSAGES = 50
TTL_SECONDS = 3600 * 24  # 24 hours


def get_history(conversation_id: str) -> List[Dict]:
    _cleanup()
    return _store.get(conversation_id, [])


def add_message(conversation_id: str, role: str, content: str):
    _store[conversation_id].append({"role": role, "content": content})
    _timestamps[conversation_id] = time.time()
    # Keep only last N messages
    if len(_store[conversation_id]) > MAX_MESSAGES:
        _store[conversation_id] = _store[conversation_id][-MAX_MESSAGES:]


def clear_conversation(conversation_id: str):
    _store.pop(conversation_id, None)
    _timestamps.pop(conversation_id, None)


def _cleanup():
    now = time.time()
    expired = [k for k, t in _timestamps.items() if now - t > TTL_SECONDS]
    for k in expired:
        _store.pop(k, None)
        _timestamps.pop(k, None)
