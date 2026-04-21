"""Real Google API service — Gmail, Calendar, Drive."""
from typing import List, Dict, Optional
import httpx
from ..services.token_store import get_valid_google_token
from ..core.config import settings


async def _auth_headers(provider: str) -> Dict:
    """Get auth headers with a fresh (auto-refreshed) token."""
    token = await get_valid_google_token(provider)
    if not token:
        raise ValueError(f"{provider} is not connected. Please connect it in Data Sources.")
    return {"Authorization": f"Bearer {token}"}


# ── Gmail ──────────────────────────────────────────────────────────────────────

async def get_gmail_messages(max_results: int = 20, unread_only: bool = False) -> List[Dict]:
    q = "is:unread" if unread_only else ""
    params = {"maxResults": max_results, "q": q}
    headers = await _auth_headers("gmail")
    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages",
            headers=headers, params=params, timeout=15,
        )
        r.raise_for_status()
        msg_list = r.json().get("messages", [])

    emails = []
    headers = await _auth_headers("gmail")
    async with httpx.AsyncClient() as client:
        for msg in msg_list[:max_results]:
            detail = await client.get(
                f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg['id']}",
                headers=headers,
                params={"format": "metadata", "metadataHeaders": ["From", "Subject", "Date"]},
                timeout=15,
            )
            detail.raise_for_status()
            data = detail.json()
            hdrs = {h["name"]: h["value"] for h in data.get("payload", {}).get("headers", [])}
            emails.append({
                "id": msg["id"],
                "from": hdrs.get("From", ""),
                "subject": hdrs.get("Subject", "(no subject)"),
                "date": hdrs.get("Date", ""),
                "snippet": data.get("snippet", ""),
                "unread": "UNREAD" in data.get("labelIds", []),
                "labels": data.get("labelIds", []),
            })
    return emails


async def get_gmail_message_body(message_id: str) -> Dict:
    headers = await _auth_headers("gmail")
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}",
            headers=headers,
            params={"format": "full"},
            timeout=15,
        )
        r.raise_for_status()
        return r.json()


async def send_gmail(to: str, subject: str, body: str) -> Dict:
    import base64
    from email.mime.text import MIMEText
    msg = MIMEText(body)
    msg["to"] = to
    msg["subject"] = subject
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    
    try:
        headers = await _auth_headers("gmail")
        async with httpx.AsyncClient() as client:
            r = await client.post(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
                headers=headers,
                json={"raw": raw},
                timeout=15,
            )
            r.raise_for_status()
            return r.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 403:
            error_detail = e.response.json() if e.response.text else {}
            error_msg = error_detail.get("error", {}).get("message", "Access denied")
            raise ValueError(
                f"Gmail API access denied (403). This usually means:\n"
                f"1. The Gmail API is not enabled in your Google Cloud Console project\n"
                f"2. Your OAuth token doesn't have the required gmail.send scope\n"
                f"3. You need to re-authenticate your Google account\n\n"
                f"Error details: {error_msg}\n\n"
                f"To fix:\n"
                f"- Go to https://console.cloud.google.com/apis/library/gmail.googleapis.com\n"
                f"- Enable the Gmail API for your project\n"
                f"- Disconnect and reconnect Google in Data Sources to refresh permissions"
            )
        raise


# ── Google Calendar ────────────────────────────────────────────────────────────

async def get_calendar_events(time_min: str = None, time_max: str = None, max_results: int = 20) -> List[Dict]:
    from datetime import datetime, timezone
    if not time_min:
        time_min = datetime.now(timezone.utc).isoformat()
    params = {
        "maxResults": max_results,
        "singleEvents": True,
        "orderBy": "startTime",
        "timeMin": time_min,
    }
    if time_max:
        params["timeMax"] = time_max
    
    try:
        headers = await _auth_headers("googleCalendar")
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                headers=headers, params=params, timeout=15,
            )
            r.raise_for_status()
            items = r.json().get("items", [])
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 403:
            error_detail = e.response.json() if e.response.text else {}
            error_msg = error_detail.get("error", {}).get("message", "Access denied")
            raise ValueError(
                f"Google Calendar API access denied (403). This usually means:\n"
                f"1. The Google Calendar API is not enabled in your Google Cloud Console project\n"
                f"2. Your OAuth token doesn't have the required calendar scope\n"
                f"3. You need to re-authenticate your Google account\n\n"
                f"Error details: {error_msg}\n\n"
                f"To fix:\n"
                f"- Go to https://console.cloud.google.com/apis/library/calendar-json.googleapis.com\n"
                f"- Enable the Google Calendar API for your project\n"
                f"- Disconnect and reconnect Google in Data Sources to refresh permissions"
            )
        raise
    
    return [
        {
            "id": e["id"],
            "title": e.get("summary", "(no title)"),
            "start": e.get("start", {}).get("dateTime") or e.get("start", {}).get("date"),
            "end": e.get("end", {}).get("dateTime") or e.get("end", {}).get("date"),
            "description": e.get("description", ""),
            "location": e.get("location", ""),
            "participants": [a.get("email") for a in e.get("attendees", [])],
            "meeting_link": e.get("hangoutLink") or e.get("location", ""),
            "status": e.get("status"),
        }
        for e in items
    ]


async def create_calendar_event(title: str, start: str, end: str,
                                 participants: List[str] = None,
                                 description: str = "") -> Dict:
    body = {
        "summary": title,
        "start": {"dateTime": start, "timeZone": "UTC"},
        "end": {"dateTime": end, "timeZone": "UTC"},
        "description": description,
        "attendees": [{"email": e} for e in (participants or [])],
        "conferenceData": {"createRequest": {"requestId": title.replace(" ", "-")}},
    }
    
    try:
        headers = await _auth_headers("googleCalendar")
        async with httpx.AsyncClient() as client:
            r = await client.post(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                headers=headers,
                params={"conferenceDataVersion": 1},
                json=body, timeout=15,
            )
            r.raise_for_status()
            return r.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 403:
            error_detail = e.response.json() if e.response.text else {}
            error_msg = error_detail.get("error", {}).get("message", "Access denied")
            raise ValueError(
                f"Google Calendar API access denied (403). This usually means:\n"
                f"1. The Google Calendar API is not enabled in your Google Cloud Console project\n"
                f"2. Your OAuth token doesn't have the required calendar scope\n"
                f"3. You need to re-authenticate your Google account\n\n"
                f"Error details: {error_msg}\n\n"
                f"To fix:\n"
                f"- Go to https://console.cloud.google.com/apis/library/calendar-json.googleapis.com\n"
                f"- Enable the Google Calendar API for your project\n"
                f"- Disconnect and reconnect Google in Data Sources to refresh permissions"
            )
        raise


# ── Google Drive ───────────────────────────────────────────────────────────────

async def search_drive_files(query: str = "", max_results: int = 20) -> List[Dict]:
    """Search for files in Google Drive."""
    params = {
        "pageSize": max_results,
        "fields": "files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,iconLink)",
    }
    if query:
        params["q"] = f"name contains '{query}'"
    
    try:
        headers = await _auth_headers("googleDrive")
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://www.googleapis.com/drive/v3/files",
                headers=headers,
                params=params,
                timeout=15,
            )
            r.raise_for_status()
            files = r.json().get("files", [])
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 403:
            error_detail = e.response.json() if e.response.text else {}
            error_msg = error_detail.get("error", {}).get("message", "Access denied")
            raise ValueError(
                f"Google Drive API access denied (403). This usually means:\n"
                f"1. The Google Drive API is not enabled in your Google Cloud Console project\n"
                f"2. Your OAuth token doesn't have the required drive scope\n"
                f"3. You need to re-authenticate your Google account\n\n"
                f"Error details: {error_msg}\n\n"
                f"To fix:\n"
                f"- Go to https://console.cloud.google.com/apis/library/drive.googleapis.com\n"
                f"- Enable the Google Drive API for your project\n"
                f"- Disconnect and reconnect Google in Data Sources to refresh permissions"
            )
        raise
    
    return [
        {
            "id": f["id"],
            "name": f.get("name", ""),
            "mimeType": f.get("mimeType", ""),
            "size": f.get("size", "0"),
            "createdTime": f.get("createdTime", ""),
            "modifiedTime": f.get("modifiedTime", ""),
            "webViewLink": f.get("webViewLink", ""),
            "iconLink": f.get("iconLink", ""),
        }
        for f in files
    ]


async def get_drive_file_content(file_id: str) -> bytes:
    """Download file content from Google Drive."""
    try:
        headers = await _auth_headers("googleDrive")
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://www.googleapis.com/drive/v3/files/{file_id}",
                headers=headers,
                params={"alt": "media"},
                timeout=30,
            )
            r.raise_for_status()
            return r.content
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 403:
            error_detail = e.response.json() if e.response.text else {}
            error_msg = error_detail.get("error", {}).get("message", "Access denied")
            raise ValueError(
                f"Google Drive API access denied (403). This usually means:\n"
                f"1. The Google Drive API is not enabled in your Google Cloud Console project\n"
                f"2. Your OAuth token doesn't have the required drive scope\n"
                f"3. You need to re-authenticate your Google account\n\n"
                f"Error details: {error_msg}\n\n"
                f"To fix:\n"
                f"- Go to https://console.cloud.google.com/apis/library/drive.googleapis.com\n"
                f"- Enable the Google Drive API for your project\n"
                f"- Disconnect and reconnect Google in Data Sources to refresh permissions"
            )
        raise


async def get_drive_file_metadata(file_id: str) -> Dict:
    """Get file metadata from Google Drive."""
    try:
        headers = await _auth_headers("googleDrive")
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://www.googleapis.com/drive/v3/files/{file_id}",
                headers=headers,
                params={"fields": "id,name,mimeType,size,createdTime,modifiedTime,webViewLink,description"},
                timeout=15,
            )
            r.raise_for_status()
            return r.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 403:
            error_detail = e.response.json() if e.response.text else {}
            error_msg = error_detail.get("error", {}).get("message", "Access denied")
            raise ValueError(
                f"Google Drive API access denied (403). This usually means:\n"
                f"1. The Google Drive API is not enabled in your Google Cloud Console project\n"
                f"2. Your OAuth token doesn't have the required drive scope\n"
                f"3. You need to re-authenticate your Google account\n\n"
                f"Error details: {error_msg}\n\n"
                f"To fix:\n"
                f"- Go to https://console.cloud.google.com/apis/library/drive.googleapis.com\n"
                f"- Enable the Google Drive API for your project\n"
                f"- Disconnect and reconnect Google in Data Sources to refresh permissions"
            )
        raise
