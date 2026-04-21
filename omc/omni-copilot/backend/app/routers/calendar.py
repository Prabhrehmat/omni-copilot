from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from ..core.ai import chat_completion
from ..services.google_service import get_calendar_events, create_calendar_event, send_gmail
from ..services.token_store import get_token, is_connected
import httpx

router = APIRouter()


@router.get("/status")
async def calendar_status():
    """Check Google Calendar connection and API status."""
    connected = is_connected("googleCalendar")
    
    if not connected:
        return {
            "connected": False,
            "api_enabled": None,
            "message": "Google Calendar is not connected. Please connect it in Data Sources.",
            "fix_url": "http://localhost:3000/sources"
        }
    
    # Try to check if the API is enabled by making a test request
    token_data = get_token("googleCalendar")
    access_token = token_data.get("access_token") if token_data else None
    
    api_enabled = False
    error_message = None
    
    if access_token:
        try:
            async with httpx.AsyncClient() as client:
                r = await client.get(
                    "https://www.googleapis.com/calendar/v3/calendars/primary",
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=10,
                )
                if r.status_code == 200:
                    api_enabled = True
                elif r.status_code == 403:
                    error_detail = r.json() if r.text else {}
                    error_message = error_detail.get("error", {}).get("message", "Access denied")
        except Exception as e:
            error_message = str(e)
    
    return {
        "connected": connected,
        "api_enabled": api_enabled,
        "error": error_message,
        "message": (
            "Google Calendar is working correctly!" if api_enabled else
            "Google Calendar API is not enabled or accessible. Please enable it in Google Cloud Console."
        ),
        "fix_steps": [
            "1. Go to https://console.cloud.google.com/apis/library/calendar-json.googleapis.com",
            "2. Select your project",
            "3. Click 'Enable' for Google Calendar API",
            "4. Go to Data Sources in OmniCopilot and disconnect/reconnect Google"
        ] if not api_enabled else None
    }


@router.get("/events")
async def get_events(start: Optional[str] = None, end: Optional[str] = None, max_results: int = 20):
    try:
        events = await get_calendar_events(time_min=start, time_max=end, max_results=max_results)
        return {"events": events, "total": len(events)}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Google Calendar API error: {str(e)}")


class CreateEventRequest(BaseModel):
    title: str
    start: str
    end: str
    participants: List[str] = []
    description: Optional[str] = None
    send_invites: bool = True  # auto-send email invites


@router.post("/events")
async def create_event(req: CreateEventRequest):
    try:
        event = await create_calendar_event(
            title=req.title,
            start=req.start,
            end=req.end,
            participants=req.participants,
            description=req.description or "",
        )

        invite_results = []
        if req.send_invites and req.participants:
            meeting_link = event.get("hangoutLink") or event.get("htmlLink", "")
            invite_body = _build_invite_email(
                title=req.title,
                start=req.start,
                end=req.end,
                description=req.description or "",
                meeting_link=meeting_link,
            )
            for email in req.participants:
                try:
                    await send_gmail(
                        to=email,
                        subject=f"Meeting Invite: {req.title}",
                        body=invite_body,
                    )
                    invite_results.append({"email": email, "status": "sent"})
                except Exception as ex:
                    invite_results.append({"email": email, "status": "failed", "error": str(ex)})

        return {
            "event": event,
            "status": "created",
            "invites_sent": invite_results,
        }
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Google Calendar API error: {str(e)}")


def _build_invite_email(title: str, start: str, end: str, description: str, meeting_link: str) -> str:
    return f"""You have been invited to a meeting.

Meeting: {title}
Start: {start}
End: {end}
{f'Description: {description}' if description else ''}
{f'Join: {meeting_link}' if meeting_link else ''}

This invite was sent via OmniCopilot.
"""


class ScheduleMeetingRequest(BaseModel):
    """Natural-language meeting scheduler — AI picks the time slot."""
    title: str
    participants: List[str]
    duration_minutes: int = 60
    preferred_date: Optional[str] = None   # e.g. "tomorrow", "next Monday", ISO date
    description: Optional[str] = None
    send_invites: bool = True


@router.post("/schedule-meeting")
async def schedule_meeting(req: ScheduleMeetingRequest):
    """
    AI-assisted meeting scheduler:
    1. Fetches existing calendar events to avoid conflicts
    2. Uses AI to pick the best time slot
    3. Creates the calendar event
    4. Sends email invites to all participants
    """
    try:
        events = await get_calendar_events(max_results=20)
        existing = [f"{e['title']} from {e['start']} to {e['end']}" for e in events]
    except Exception:
        existing = []

    from datetime import datetime, timezone
    now_iso = datetime.now(timezone.utc).isoformat()

    prompt = f"""You are a scheduling assistant. Pick the single best meeting time slot.

Meeting details:
- Title: {req.title}
- Duration: {req.duration_minutes} minutes
- Participants: {', '.join(req.participants)}
- Description: {req.description or 'N/A'}
- Preferred date hint: {req.preferred_date or 'as soon as possible'}
- Current UTC time: {now_iso}

Existing calendar events to avoid:
{chr(10).join(existing) if existing else 'None'}

Rules:
- Work hours only: 9 AM – 6 PM local (assume UTC for now)
- No weekends
- Leave at least 15 min buffer between meetings
- Return ONLY valid JSON, no extra text

Return exactly this JSON:
{{"start": "<ISO 8601 datetime with timezone>", "end": "<ISO 8601 datetime with timezone>", "reason": "<brief reason>"}}"""

    ai_response = await chat_completion(
        [{"role": "user", "content": prompt}],
        system_prompt="You are a scheduling assistant. Return only valid JSON.",
        temperature=0.2,
    )

    import json
    try:
        start_idx = ai_response.find('{')
        end_idx = ai_response.rfind('}') + 1
        slot = json.loads(ai_response[start_idx:end_idx])
        start_time = slot["start"]
        end_time = slot["end"]
        reason = slot.get("reason", "")
    except Exception:
        raise HTTPException(status_code=500, detail=f"AI could not determine a time slot. Raw: {ai_response}")

    event = await create_calendar_event(
        title=req.title,
        start=start_time,
        end=end_time,
        participants=req.participants,
        description=req.description or "",
    )

    invite_results = []
    if req.send_invites and req.participants:
        meeting_link = event.get("hangoutLink") or event.get("htmlLink", "")
        invite_body = _build_invite_email(
            title=req.title,
            start=start_time,
            end=end_time,
            description=req.description or "",
            meeting_link=meeting_link,
        )
        for email in req.participants:
            try:
                await send_gmail(to=email, subject=f"Meeting Invite: {req.title}", body=invite_body)
                invite_results.append({"email": email, "status": "sent"})
            except Exception as ex:
                invite_results.append({"email": email, "status": "failed", "error": str(ex)})

    return {
        "event": event,
        "status": "scheduled",
        "scheduled_start": start_time,
        "scheduled_end": end_time,
        "ai_reason": reason,
        "invites_sent": invite_results,
    }


class SuggestTimeRequest(BaseModel):
    duration_minutes: int
    participants: List[str]
    description: Optional[str] = None


@router.post("/suggest-time")
async def suggest_meeting_time(req: SuggestTimeRequest):
    try:
        events = await get_calendar_events(max_results=10)
        existing = [f"{e['title']} from {e['start']} to {e['end']}" for e in events]
    except Exception:
        existing = []

    prompt = f"""Suggest 3 optimal meeting times for:
- Duration: {req.duration_minutes} minutes
- Participants: {', '.join(req.participants)}
- Description: {req.description or 'General meeting'}
- Existing meetings: {existing}

Consider work hours (9 AM - 6 PM), avoid conflicts, suggest times in the next 3 business days.
Return as JSON array: [{{"time": "ISO datetime", "reason": "why this time works"}}]"""

    response = await chat_completion(
        [{"role": "user", "content": prompt}],
        system_prompt="You are a smart scheduling assistant. Return valid JSON only.",
        temperature=0.3,
    )
    return {"suggestions": response, "duration_minutes": req.duration_minutes}
