"""Real Slack API service."""
from typing import List, Dict
import httpx
from ..services.token_store import get_token


def _headers() -> Dict:
    token = get_token("slack")
    if not token:
        raise ValueError("Slack is not connected. Please connect it in Data Sources.")
    return {"Authorization": f"Bearer {token['access_token']}"}


async def get_channels(limit: int = 50) -> List[Dict]:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://slack.com/api/conversations.list",
            headers=_headers(),
            params={"limit": limit, "exclude_archived": True, "types": "public_channel,private_channel"},
            timeout=15,
        )
        r.raise_for_status()
        data = r.json()
        if not data.get("ok"):
            raise ValueError(f"Slack API error: {data.get('error')}")
        return [
            {
                "id": c["id"],
                "name": c["name"],
                "is_private": c.get("is_private", False),
                "topic": c.get("topic", {}).get("value", ""),
                "member_count": c.get("num_members", 0),
                "unread": c.get("unread_count", 0),
            }
            for c in data.get("channels", [])
        ]


async def get_channel_messages(channel_id: str, limit: int = 50) -> List[Dict]:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://slack.com/api/conversations.history",
            headers=_headers(),
            params={"channel": channel_id, "limit": limit},
            timeout=15,
        )
        r.raise_for_status()
        data = r.json()
        if not data.get("ok"):
            raise ValueError(f"Slack API error: {data.get('error')}")
        return [
            {
                "id": m.get("ts"),
                "user": m.get("user", "unknown"),
                "text": m.get("text", ""),
                "timestamp": m.get("ts"),
                "reactions": m.get("reactions", []),
            }
            for m in data.get("messages", [])
            if m.get("type") == "message" and not m.get("subtype")
        ]
