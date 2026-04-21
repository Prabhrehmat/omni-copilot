from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from ..core.ai import summarize, chat_completion, extract_tasks
from ..services.google_service import get_gmail_messages, get_gmail_message_body, send_gmail
import base64

router = APIRouter()


def _decode_body(payload: dict) -> str:
    """Recursively extract plain text body from Gmail message payload."""
    mime = payload.get("mimeType", "")
    if mime == "text/plain":
        data = payload.get("body", {}).get("data", "")
        return base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="ignore") if data else ""
    if mime.startswith("multipart/"):
        for part in payload.get("parts", []):
            text = _decode_body(part)
            if text:
                return text
    return ""


@router.get("/inbox")
async def get_inbox(limit: int = Query(20, le=100), unread_only: bool = False):
    try:
        emails = await get_gmail_messages(max_results=limit, unread_only=unread_only)
        return {
            "emails": emails,
            "total": len(emails),
            "unread": sum(1 for e in emails if e.get("unread")),
        }
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gmail API error: {str(e)}")


@router.get("/{email_id}")
async def get_email(email_id: str):
    try:
        data = await get_gmail_message_body(email_id)
        headers = {h["name"]: h["value"] for h in data.get("payload", {}).get("headers", [])}
        body = _decode_body(data.get("payload", {}))
        return {
            "id": email_id,
            "from": headers.get("From", ""),
            "subject": headers.get("Subject", "(no subject)"),
            "date": headers.get("Date", ""),
            "body": body,
            "snippet": data.get("snippet", ""),
            "unread": "UNREAD" in data.get("labelIds", []),
            "labels": data.get("labelIds", []),
        }
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gmail API error: {str(e)}")


@router.post("/{email_id}/summarize")
async def summarize_email(email_id: str):
    try:
        data = await get_gmail_message_body(email_id)
        headers = {h["name"]: h["value"] for h in data.get("payload", {}).get("headers", [])}
        body = _decode_body(data.get("payload", {})) or data.get("snippet", "")
        text = f"From: {headers.get('From', '')}\nSubject: {headers.get('Subject', '')}\n\n{body}"
        summary = await summarize(text, "email")
        tasks = await extract_tasks(body)
        return {"summary": summary, "tasks": tasks, "email_id": email_id}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gmail API error: {str(e)}")


@router.post("/{email_id}/reply")
async def generate_reply(email_id: str):
    try:
        data = await get_gmail_message_body(email_id)
        headers = {h["name"]: h["value"] for h in data.get("payload", {}).get("headers", [])}
        body = _decode_body(data.get("payload", {})) or data.get("snippet", "")
        prompt = f"""Generate a professional, concise reply to this email:
From: {headers.get('From', '')}
Subject: {headers.get('Subject', '')}
Body: {body[:2000]}

Write a helpful, professional reply."""
        reply = await chat_completion(
            [{"role": "user", "content": prompt}],
            system_prompt="You are a professional email assistant. Write clear, concise, professional replies.",
            temperature=0.6,
        )
        return {"reply": reply, "email_id": email_id}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gmail API error: {str(e)}")


class SendEmailRequest(BaseModel):
    to: str
    subject: str
    body: str


@router.post("/send")
async def send_email_endpoint(req: SendEmailRequest):
    try:
        result = await send_gmail(req.to, req.subject, req.body)
        return {"status": "sent", "message_id": result.get("id"), "to": req.to}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gmail send error: {str(e)}")


class ComposeRequest(BaseModel):
    to: str
    subject: str
    context: Optional[str] = None   # user's rough notes / intent
    tone: Optional[str] = "professional"  # professional | friendly | formal


@router.post("/compose")
async def ai_compose_email(req: ComposeRequest):
    """Use AI to draft a full email from a brief context/intent."""
    prompt = f"""Write a complete email with the following details:
To: {req.to}
Subject: {req.subject}
Tone: {req.tone}
Context / intent: {req.context or 'Write a general email about the subject'}

Return ONLY the email body text (no subject line, no headers). Be concise and professional."""

    draft = await chat_completion(
        [{"role": "user", "content": prompt}],
        system_prompt="You are a professional email writer. Write clear, concise emails.",
        temperature=0.6,
    )
    return {"draft": draft, "to": req.to, "subject": req.subject}


class SendWithAIRequest(BaseModel):
    to: str
    subject: str
    context: str
    tone: Optional[str] = "professional"
    auto_send: bool = False


@router.post("/compose-and-send")
async def compose_and_send(req: SendWithAIRequest):
    """AI drafts the email, then optionally sends it immediately."""
    prompt = f"""Write a complete email with the following details:
To: {req.to}
Subject: {req.subject}
Tone: {req.tone}
Context / intent: {req.context}

Return ONLY the email body text (no subject line, no headers)."""

    draft = await chat_completion(
        [{"role": "user", "content": prompt}],
        system_prompt="You are a professional email writer. Write clear, concise emails.",
        temperature=0.6,
    )

    if req.auto_send:
        try:
            result = await send_gmail(req.to, req.subject, draft)
            return {"status": "sent", "draft": draft, "message_id": result.get("id")}
        except ValueError as e:
            raise HTTPException(status_code=403, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Gmail send error: {str(e)}")

    return {"status": "draft_ready", "draft": draft, "to": req.to, "subject": req.subject}


@router.post("/inbox/summarize")
async def summarize_inbox():
    try:
        emails = await get_gmail_messages(max_results=10)
        all_text = "\n\n".join([
            f"From: {e['from']}\nSubject: {e['subject']}\n{e['snippet']}"
            for e in emails
        ])
        summary = await summarize(all_text, "email inbox")
        return {"summary": summary, "email_count": len(emails)}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gmail API error: {str(e)}")
