from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from ..services.token_store import is_connected
from ..services import google_service, slack_service, notion_service

router = APIRouter()


class SearchRequest(BaseModel):
    query: str
    sources: List[str] = []


@router.post("/")
async def universal_search(req: SearchRequest):
    """Search across all connected real platforms."""
    results = []
    query = req.query.lower()

    # Gmail search
    if is_connected("gmail") and (not req.sources or "gmail" in req.sources):
        try:
            emails = await google_service.get_gmail_messages(max_results=5)
            for e in emails:
                if query in e.get("subject", "").lower() or query in e.get("snippet", "").lower():
                    results.append({
                        "source": "Gmail",
                        "title": e.get("subject", "(no subject)"),
                        "snippet": e.get("snippet", ""),
                        "relevance": 90,
                        "id": e["id"],
                    })
        except Exception:
            pass

    # Notion search
    if is_connected("notion") and (not req.sources or "notion" in req.sources):
        try:
            pages = await notion_service.search_pages(query=req.query, limit=5)
            for p in pages:
                results.append({
                    "source": "Notion",
                    "title": p["title"],
                    "snippet": f"Last edited: {p.get('last_edited', '')}",
                    "relevance": 85,
                    "url": p.get("url", ""),
                    "id": p["id"],
                })
        except Exception:
            pass

    # Slack search
    if is_connected("slack") and (not req.sources or "slack" in req.sources):
        try:
            channels = await slack_service.get_channels(limit=10)
            for ch in channels:
                if query in ch.get("name", "").lower() or query in ch.get("topic", "").lower():
                    results.append({
                        "source": "Slack",
                        "title": f"#{ch['name']}",
                        "snippet": ch.get("topic", ""),
                        "relevance": 75,
                        "id": ch["id"],
                    })
        except Exception:
            pass

    # Calendar search
    if is_connected("googleCalendar") and (not req.sources or "googleCalendar" in req.sources):
        try:
            events = await google_service.get_calendar_events(max_results=10)
            for e in events:
                if query in e.get("title", "").lower() or query in e.get("description", "").lower():
                    results.append({
                        "source": "Google Calendar",
                        "title": e["title"],
                        "snippet": f"{e['start']} — {e.get('description', '')}",
                        "relevance": 80,
                        "id": e["id"],
                    })
        except Exception:
            pass

    results.sort(key=lambda x: x.get("relevance", 0), reverse=True)

    if not results:
        return {
            "results": [],
            "total": 0,
            "query": req.query,
            "message": "No results found. Make sure your data sources are connected in Data Sources.",
        }

    return {"results": results, "total": len(results), "query": req.query}
