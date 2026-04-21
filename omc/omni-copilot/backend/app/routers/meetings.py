from fastapi import APIRouter, HTTPException
from ..core.ai import summarize, extract_tasks, chat_completion
from ..services.google_service import get_calendar_events
from ..services.token_store import is_connected

router = APIRouter()


@router.get("/")
async def get_meetings():
    """Return upcoming meetings from Google Calendar."""
    if not is_connected("googleCalendar"):
        raise HTTPException(status_code=403, detail="Google Calendar is not connected. Please connect it in Data Sources.")
    try:
        events = await get_calendar_events(max_results=20)
        # Filter to events that look like meetings (have participants or meeting links)
        meetings = [
            e for e in events
            if e.get("participants") or e.get("meeting_link")
        ]
        return {"meetings": meetings}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Calendar API error: {str(e)}")


@router.get("/{event_id}")
async def get_meeting(event_id: str):
    if not is_connected("googleCalendar"):
        raise HTTPException(status_code=403, detail="Google Calendar is not connected.")
    try:
        events = await get_calendar_events(max_results=50)
        event = next((e for e in events if e["id"] == event_id), None)
        if not event:
            raise HTTPException(status_code=404, detail="Meeting not found")
        return event
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Calendar API error: {str(e)}")


@router.post("/{event_id}/summarize")
async def summarize_meeting(event_id: str):
    """Summarize a meeting using its description and details (no transcript available without recording service)."""
    if not is_connected("googleCalendar"):
        raise HTTPException(status_code=403, detail="Google Calendar is not connected.")
    try:
        events = await get_calendar_events(max_results=50)
        event = next((e for e in events if e["id"] == event_id), None)
        if not event:
            raise HTTPException(status_code=404, detail="Meeting not found")

        text = f"""Meeting: {event['title']}
Start: {event['start']}
End: {event['end']}
Participants: {', '.join(event.get('participants', []))}
Description: {event.get('description', 'No description')}
Location/Link: {event.get('meeting_link', 'N/A')}"""

        summary = await summarize(text, "meeting details")
        tasks = await extract_tasks(event.get("description", ""))
        return {
            "summary": summary,
            "action_items": tasks,
            "event_id": event_id,
            "title": event["title"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Calendar API error: {str(e)}")
