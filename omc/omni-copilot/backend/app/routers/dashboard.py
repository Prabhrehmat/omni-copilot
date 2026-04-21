from fastapi import APIRouter
from ..core.ai import chat_completion
from ..services.token_store import all_connected
from ..services import google_service, slack_service

router = APIRouter()


@router.get("/stats")
async def get_stats():
    """Aggregate real stats from connected services."""
    stats = {
        "emails_unread": 0,
        "emails_processed": 0,
        "meetings_today": 0,
        "tasks_pending": 0,
        "connected_sources": 0,
    }

    connected = all_connected()
    stats["connected_sources"] = sum(1 for v in connected.values() if v)

    # Real Gmail stats
    if connected.get("gmail"):
        try:
            emails = await google_service.get_gmail_messages(max_results=50)
            stats["emails_unread"] = sum(1 for e in emails if e.get("unread"))
            stats["emails_processed"] = len(emails)
        except Exception:
            pass

    # Real Calendar stats
    if connected.get("googleCalendar"):
        try:
            from datetime import datetime, timezone, timedelta
            now = datetime.now(timezone.utc)
            end_of_day = now.replace(hour=23, minute=59, second=59)
            events = await google_service.get_calendar_events(
                time_min=now.isoformat(),
                time_max=end_of_day.isoformat(),
                max_results=20,
            )
            stats["meetings_today"] = len(events)
        except Exception:
            pass

    return stats


@router.get("/insights")
async def get_insights():
    """Generate AI insights from real connected data."""
    connected = all_connected()
    context_parts = []

    if connected.get("gmail"):
        try:
            emails = await google_service.get_gmail_messages(max_results=10)
            unread = sum(1 for e in emails if e.get("unread"))
            context_parts.append(f"Gmail: {unread} unread emails out of {len(emails)} recent.")
        except Exception:
            pass

    if connected.get("googleCalendar"):
        try:
            from datetime import datetime, timezone
            events = await google_service.get_calendar_events(
                time_min=datetime.now(timezone.utc).isoformat(), max_results=5
            )
            context_parts.append(f"Calendar: {len(events)} upcoming events.")
        except Exception:
            pass

    if not context_parts:
        return {
            "insights": [
                {"icon": "🔌", "text": "Connect your data sources to get personalized insights.", "priority": "high"}
            ]
        }

    prompt = f"""Generate 4 actionable productivity insights based on this real data:
{chr(10).join(context_parts)}

Return as JSON array: [{{"icon": "emoji", "text": "insight", "priority": "high|medium|low|positive"}}]"""

    response = await chat_completion(
        [{"role": "user", "content": prompt}],
        system_prompt="You are a productivity analyst. Return valid JSON only.",
        temperature=0.5,
    )

    try:
        import json
        start = response.find('[')
        end = response.rfind(']') + 1
        if start >= 0 and end > start:
            return {"insights": json.loads(response[start:end])}
    except Exception:
        pass

    return {"insights": [{"icon": "📊", "text": "Could not generate insights at this time.", "priority": "low"}]}
