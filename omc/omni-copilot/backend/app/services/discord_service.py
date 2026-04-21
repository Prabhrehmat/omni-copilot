"""Real Discord API service."""
from typing import List, Dict
import httpx
from ..services.token_store import get_token


def _headers() -> Dict:
    token = get_token("discord")
    if not token:
        raise ValueError("Discord is not connected. Please connect it in Data Sources.")
    return {"Authorization": f"Bearer {token['access_token']}"}


async def get_guilds() -> List[Dict]:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://discord.com/api/v10/users/@me/guilds",
            headers=_headers(), timeout=15,
        )
        r.raise_for_status()
        return [
            {
                "id": g["id"],
                "name": g["name"],
                "icon": g.get("icon"),
                "owner": g.get("owner", False),
                "permissions": g.get("permissions"),
            }
            for g in r.json()
        ]


async def get_guild_channels(guild_id: str) -> List[Dict]:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"https://discord.com/api/v10/guilds/{guild_id}/channels",
            headers=_headers(), timeout=15,
        )
        r.raise_for_status()
        return [
            {
                "id": c["id"],
                "name": c.get("name", ""),
                "type": c.get("type"),
                "topic": c.get("topic", ""),
                "position": c.get("position", 0),
            }
            for c in r.json()
            if c.get("type") == 0  # text channels only
        ]


async def get_channel_messages(channel_id: str, limit: int = 50) -> List[Dict]:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"https://discord.com/api/v10/channels/{channel_id}/messages",
            headers=_headers(),
            params={"limit": min(limit, 100)},
            timeout=15,
        )
        r.raise_for_status()
        return [
            {
                "id": m["id"],
                "author": m.get("author", {}).get("username", "unknown"),
                "content": m.get("content", ""),
                "timestamp": m.get("timestamp"),
                "attachments": [a.get("url") for a in m.get("attachments", [])],
            }
            for m in r.json()
        ]
