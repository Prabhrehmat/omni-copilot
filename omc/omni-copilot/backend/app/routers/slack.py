from fastapi import APIRouter, HTTPException
from ..core.ai import summarize, extract_tasks
from ..services.slack_service import get_channels, get_channel_messages

router = APIRouter()


@router.get("/channels")
async def list_channels():
    try:
        channels = await get_channels()
        return {"channels": channels}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Slack API error: {str(e)}")


@router.get("/channels/{channel_id}/messages")
async def get_messages(channel_id: str, limit: int = 50):
    try:
        messages = await get_channel_messages(channel_id, limit)
        return {"messages": messages, "channel_id": channel_id}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Slack API error: {str(e)}")


@router.post("/channels/{channel_id}/summarize")
async def summarize_channel(channel_id: str):
    try:
        messages = await get_channel_messages(channel_id, 50)
        if not messages:
            return {"summary": "No messages found in this channel.", "tasks": []}
        text = "\n".join([f"{m['user']}: {m['text']}" for m in messages if m.get("text")])
        summary = await summarize(text, "Slack channel conversation")
        tasks = await extract_tasks(text)
        return {"summary": summary, "tasks": tasks, "channel_id": channel_id, "message_count": len(messages)}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Slack API error: {str(e)}")
