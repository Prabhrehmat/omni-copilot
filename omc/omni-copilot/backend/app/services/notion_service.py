"""Real Notion API service."""
from typing import List, Dict
import httpx
from ..services.token_store import get_token


def _headers() -> Dict:
    token = get_token("notion")
    if not token:
        raise ValueError("Notion is not connected. Please connect it in Data Sources.")
    return {
        "Authorization": f"Bearer {token['access_token']}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
    }


async def search_pages(query: str = "", limit: int = 20) -> List[Dict]:
    body = {"filter": {"value": "page", "property": "object"}, "page_size": limit}
    if query:
        body["query"] = query
    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://api.notion.com/v1/search",
            headers=_headers(), json=body, timeout=15,
        )
        r.raise_for_status()
        results = r.json().get("results", [])
    return [
        {
            "id": p["id"],
            "title": _extract_title(p),
            "last_edited": p.get("last_edited_time"),
            "url": p.get("url"),
            "created": p.get("created_time"),
        }
        for p in results
    ]


async def get_page_content(page_id: str) -> str:
    """Fetch all block content from a Notion page."""
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"https://api.notion.com/v1/blocks/{page_id}/children",
            headers=_headers(), timeout=15,
        )
        r.raise_for_status()
        blocks = r.json().get("results", [])
    return _blocks_to_text(blocks)


def _extract_title(page: Dict) -> str:
    props = page.get("properties", {})
    for key in ("title", "Name", "Title"):
        if key in props:
            rich = props[key].get("title", [])
            return "".join(t.get("plain_text", "") for t in rich)
    return "(untitled)"


def _blocks_to_text(blocks: List[Dict]) -> str:
    lines = []
    for b in blocks:
        btype = b.get("type", "")
        content = b.get(btype, {})
        rich = content.get("rich_text", [])
        text = "".join(t.get("plain_text", "") for t in rich)
        if text:
            lines.append(text)
    return "\n".join(lines)
