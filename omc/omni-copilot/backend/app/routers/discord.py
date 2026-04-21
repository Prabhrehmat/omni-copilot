from fastapi import APIRouter, HTTPException
from ..core.ai import summarize, extract_tasks
from ..services.discord_service import get_guilds, get_guild_channels, get_channel_messages

router = APIRouter()


@router.get("/servers")
async def get_servers():
    try:
        guilds = await get_guilds()
        return {"servers": guilds}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Discord API error: {str(e)}")


@router.get("/servers/{server_id}/channels")
async def get_channels(server_id: str):
    try:
        channels = await get_guild_channels(server_id)
        return {"channels": channels, "server_id": server_id}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Discord API error: {str(e)}")


@router.get("/channels/{channel_id}/messages")
async def get_messages(channel_id: str, limit: int = 50):
    try:
        messages = await get_channel_messages(channel_id, limit)
        return {"messages": messages}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Discord API error: {str(e)}")


@router.post("/channels/{channel_id}/summarize")
async def summarize_channel(channel_id: str):
    try:
        messages = await get_channel_messages(channel_id, 50)
        if not messages:
            return {"summary": "No messages found in this channel.", "tasks": []}
        text = "\n".join([f"{m['author']}: {m['content']}" for m in messages if m.get("content")])
        summary = await summarize(text, "Discord channel conversation")
        tasks = await extract_tasks(text)
        return {"summary": summary, "tasks": tasks, "channel_id": channel_id}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Discord API error: {str(e)}")
