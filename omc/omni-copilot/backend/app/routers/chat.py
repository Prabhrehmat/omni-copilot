from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import base64

from ..core.ai import chat_completion, analyze_image, summarize
from ..core.memory import get_history, add_message
from ..services.document_processor import extract_text_from_file
from ..services.token_store import is_connected

router = APIRouter()

BASE_SYSTEM_PROMPT = """You are OmniCopilot, an AI assistant with direct access to the user's real data.
You will be given REAL data fetched live from the user's connected accounts.
Be concise, actionable, and structured. Use markdown formatting. Always suggest next steps.
NEVER make up or hallucinate data — only reference what is explicitly provided to you."""


def build_system_prompt(integrations: Dict[str, bool]) -> str:
    connected = [k for k, v in integrations.items() if v]
    not_connected = [k for k, v in integrations.items() if not v]
    prompt = BASE_SYSTEM_PROMPT
    if connected:
        prompt += f"\n\nConnected integrations: {', '.join(connected)}."
    if not_connected:
        prompt += f"\nNot connected: {', '.join(not_connected)}. Only mention connecting these if directly relevant."
    return prompt


async def fetch_real_context(message: str, integrations: Dict[str, bool]) -> str:
    """Fetch real data from connected services based on what the message is asking about."""
    msg = message.lower()
    context_parts = []

    # Google Drive
    if is_connected("googleDrive") and any(w in msg for w in ["drive", "file", "document", "pdf", "retrieve", "get file", "download"]):
        try:
            from ..services.google_service import search_drive_files, get_drive_file_content, get_drive_file_metadata
            from ..services.document_processor import extract_text_from_file
            
            # Extract potential filename from message
            import re
            # Look for quoted filenames or common file patterns
            filename_match = re.search(r'["\']([^"\']+\.(pdf|docx|txt|doc))["\']', msg, re.IGNORECASE)
            if not filename_match:
                # Try to find filename without quotes
                filename_match = re.search(r'(\w+_\w+\.(pdf|docx|txt|doc))', msg, re.IGNORECASE)
            
            if filename_match:
                filename = filename_match.group(1)
                # Search for the file
                files = await search_drive_files(query=filename.replace('_', ' ').replace('.pdf', '').replace('.docx', ''), max_results=5)
                
                if files:
                    lines = ["## Real Google Drive Data (live)\n"]
                    lines.append(f"Found {len(files)} file(s) matching '{filename}':\n")
                    
                    # Get the first matching file and extract its content
                    target_file = files[0]
                    lines.append(f"### File: {target_file['name']}")
                    lines.append(f"- Type: {target_file['mimeType']}")
                    lines.append(f"- Size: {target_file.get('size', 'N/A')} bytes")
                    lines.append(f"- Modified: {target_file.get('modifiedTime', 'N/A')}")
                    lines.append(f"- Link: {target_file.get('webViewLink', 'N/A')}\n")
                    
                    # Download and extract content
                    try:
                        file_content = await get_drive_file_content(target_file['id'])
                        extracted_text = await extract_text_from_file(file_content, target_file['name'])
                        
                        if extracted_text and not extracted_text.startswith("["):
                            lines.append("### File Content:\n")
                            lines.append(extracted_text[:5000])  # Limit to 5000 chars
                            if len(extracted_text) > 5000:
                                lines.append(f"\n\n... (truncated, total length: {len(extracted_text)} characters)")
                        else:
                            lines.append(f"\n⚠️ Could not extract text: {extracted_text}")
                    except Exception as ex:
                        lines.append(f"\n⚠️ Error downloading file: {str(ex)}")
                    
                    context_parts.append("\n".join(lines))
                else:
                    context_parts.append(f"## Google Drive\n\nNo files found matching '{filename}'. Please check the filename and try again.")
            else:
                # Just list recent files
                files = await search_drive_files(max_results=10)
                if files:
                    lines = ["## Real Google Drive Data (live)\n"]
                    lines.append("Recent files in your Drive:\n")
                    for f in files[:10]:
                        lines.append(f"- **{f['name']}** ({f['mimeType']})")
                        lines.append(f"  Modified: {f.get('modifiedTime', 'N/A')[:10]}")
                    context_parts.append("\n".join(lines))
        except ValueError as ex:
            # This is our custom 403 error with helpful message
            context_parts.append(f"\n## ⚠️ Google Drive Error\n\n{str(ex)}\n")
        except Exception as ex:
            context_parts.append(f"[Drive fetch error: {ex}]")

    # Gmail
    if is_connected("gmail") and any(w in msg for w in ["email", "mail", "inbox", "gmail", "unread", "message"]):
        try:
            from ..services.google_service import get_gmail_messages
            emails = await get_gmail_messages(max_results=15)
            if emails:
                lines = ["## Real Gmail Data (live)\n"]
                for e in emails:
                    unread_flag = " 🔴 UNREAD" if e.get("unread") else ""
                    lines.append(f"- **{e.get('subject', '(no subject)')}**{unread_flag}")
                    lines.append(f"  From: {e.get('from', '')}")
                    lines.append(f"  Preview: {e.get('snippet', '')[:120]}")
                    lines.append("")
                context_parts.append("\n".join(lines))
        except Exception as ex:
            context_parts.append(f"[Gmail fetch error: {ex}]")

    # Google Calendar
    if is_connected("googleCalendar") and any(w in msg for w in ["calendar", "meeting", "schedule", "event", "today", "tomorrow", "week"]):
        try:
            from ..services.google_service import get_calendar_events
            from datetime import datetime, timezone, timedelta
            now = datetime.now(timezone.utc)
            week_end = now + timedelta(days=7)
            events = await get_calendar_events(
                time_min=now.isoformat(),
                time_max=week_end.isoformat(),
                max_results=15,
            )
            if events:
                lines = ["## Real Google Calendar Data (live)\n"]
                for e in events:
                    participants = ", ".join(e.get("participants", [])[:3])
                    lines.append(f"- **{e.get('title', '(no title)')}**")
                    lines.append(f"  Start: {e.get('start', '')}")
                    lines.append(f"  End: {e.get('end', '')}")
                    if participants:
                        lines.append(f"  Participants: {participants}")
                    if e.get("description"):
                        lines.append(f"  Description: {e['description'][:100]}")
                    lines.append("")
                context_parts.append("\n".join(lines))
        except ValueError as ex:
            # This is our custom 403 error with helpful message
            context_parts.append(f"\n## ⚠️ Google Calendar Error\n\n{str(ex)}\n")
        except Exception as ex:
            context_parts.append(f"[Calendar fetch error: {ex}]")

    # Slack
    if is_connected("slack") and any(w in msg for w in ["slack", "channel", "message"]):
        try:
            from ..services.slack_service import get_channels, get_channel_messages
            channels = await get_channels(limit=5)
            if channels:
                lines = ["## Real Slack Data (live)\n"]
                for ch in channels[:3]:
                    lines.append(f"### #{ch['name']}")
                    try:
                        msgs = await get_channel_messages(ch["id"], limit=5)
                        for m in msgs:
                            lines.append(f"  - {m.get('user', 'unknown')}: {m.get('text', '')[:100]}")
                    except Exception:
                        pass
                    lines.append("")
                context_parts.append("\n".join(lines))
        except Exception as ex:
            context_parts.append(f"[Slack fetch error: {ex}]")

    # Notion
    if is_connected("notion") and any(w in msg for w in ["notion", "note", "page", "doc", "workspace"]):
        try:
            from ..services.notion_service import search_pages, get_page_content
            pages = await search_pages(limit=5)
            if pages:
                lines = ["## Real Notion Data (live)\n"]
                for p in pages[:4]:
                    lines.append(f"- **{p['title']}** (last edited: {p.get('last_edited', '')[:10]})")
                context_parts.append("\n".join(lines))
        except Exception as ex:
            context_parts.append(f"[Notion fetch error: {ex}]")

    # Discord
    if is_connected("discord") and any(w in msg for w in ["discord", "server", "guild"]):
        try:
            from ..services.discord_service import get_guilds
            guilds = await get_guilds()
            if guilds:
                lines = ["## Real Discord Data (live)\n"]
                for g in guilds[:5]:
                    lines.append(f"- **{g['name']}**")
                context_parts.append("\n".join(lines))
        except Exception as ex:
            context_parts.append(f"[Discord fetch error: {ex}]")

    return "\n\n".join(context_parts)


class MessageRequest(BaseModel):
    message: str
    conversation_id: str
    model: Optional[str] = None
    temperature: Optional[float] = 0.7
    integrations: Optional[Dict[str, bool]] = {}


class MessageResponse(BaseModel):
    response: str
    conversation_id: str


@router.post("/message", response_model=MessageResponse)
async def send_message(req: MessageRequest):
    history = get_history(req.conversation_id)
    add_message(req.conversation_id, "user", req.message)

    # Fetch real live data relevant to the user's message
    real_context = await fetch_real_context(req.message, req.integrations or {})

    # Check if user wants to send an email
    msg_lower = req.message.lower()
    email_sent = False
    email_result = ""
    
    # More comprehensive email detection
    email_keywords = [
        "send email", "send an email", "send the email", "email to", 
        "compose and send", "send mail", "mail to", "send a message to",
        "email", "send it to"
    ]
    
    # Check if message contains email-related keywords and an email address
    has_email_keyword = any(keyword in msg_lower for keyword in email_keywords)
    has_email_address = "@" in req.message and "." in req.message
    
    if has_email_keyword or (has_email_address and any(word in msg_lower for word in ["send", "email", "mail"])):
        # Try to extract email details from the message
        email_details = await _extract_email_details(req.message, history)
        if email_details and email_details.get("to") and email_details.get("subject"):
            try:
                from ..services.google_service import send_gmail
                result = await send_gmail(
                    to=email_details["to"],
                    subject=email_details["subject"],
                    body=email_details["body"]
                )
                email_sent = True
                email_result = f"\n\n✅ **Email Sent Successfully!**\n- To: {email_details['to']}\n- Subject: {email_details['subject']}\n- Message ID: {result.get('id', 'N/A')}"
            except Exception as e:
                email_result = f"\n\n❌ **Email Failed to Send**\n- Error: {str(e)}\n- Please check your Gmail connection in Data Sources"

    # Inject real data into the user message so the AI works with actual content
    if real_context:
        augmented_message = (
            f"{req.message}\n\n"
            f"---\n"
            f"Here is the REAL live data fetched from the user's connected accounts. "
            f"Use ONLY this data in your response:\n\n"
            f"{real_context}"
        )
    else:
        augmented_message = req.message

    messages = history + [{"role": "user", "content": augmented_message}]
    system_prompt = build_system_prompt(req.integrations or {})

    response = await chat_completion(
        messages=messages,
        model=req.model,
        temperature=req.temperature or 0.7,
        system_prompt=system_prompt,
        integrations=req.integrations or {},
    )
    
    # Append email result if email was sent
    if email_result:
        response = response + email_result

    add_message(req.conversation_id, "assistant", response)
    return MessageResponse(response=response, conversation_id=req.conversation_id)


async def _extract_email_details(message: str, history: List[Dict]) -> Optional[Dict]:
    """Extract email recipient, subject, and body from user message using AI."""
    prompt = f"""Extract email details from this message. Return ONLY valid JSON.

Message: {message}

Return format:
{{"to": "email@example.com", "subject": "Email subject", "body": "Email body content"}}

If you cannot extract all required fields (to, subject, body), return {{"error": "missing_info"}}"""

    result = await chat_completion(
        [{"role": "user", "content": prompt}],
        system_prompt="You are an email parser. Extract email details and return only valid JSON.",
        temperature=0.1,
    )
    
    try:
        import json
        start = result.find('{')
        end = result.rfind('}') + 1
        if start >= 0 and end > start:
            details = json.loads(result[start:end])
            if details.get("error"):
                return None
            return details
    except Exception:
        pass
    return None


@router.post("/upload")
async def upload_and_chat(
    message: str = Form(""),
    conversation_id: str = Form(...),
    files: List[UploadFile] = File(default=[]),
):
    context_parts = []

    for file in files:
        content = await file.read()
        if file.content_type and file.content_type.startswith("image/"):
            b64 = base64.b64encode(content).decode()
            image_analysis = await analyze_image(b64, message or "Describe this image in detail")
            context_parts.append(f"[Image: {file.filename}]\n{image_analysis}")
        else:
            text = await extract_text_from_file(content, file.filename or "")
            if text:
                context_parts.append(f"[File: {file.filename}]\n{text[:3000]}")

    full_message = message
    if context_parts:
        full_message = "\n\n".join(context_parts)
        if message:
            full_message = f"{message}\n\nContext from uploaded files:\n{full_message}"

    history = get_history(conversation_id)
    add_message(conversation_id, "user", full_message)

    messages = history + [{"role": "user", "content": full_message}]
    system_prompt = BASE_SYSTEM_PROMPT
    response = await chat_completion(messages=messages, system_prompt=system_prompt)
    add_message(conversation_id, "assistant", response)

    return {"response": response, "conversation_id": conversation_id}
