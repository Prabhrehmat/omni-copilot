from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
import httpx
from ..core.config import settings
from ..services.token_store import save_token, delete_token, all_connected

router = APIRouter()


def _google_oauth_url(scopes: str) -> str:
    base = "https://accounts.google.com/o/oauth2/v2/auth"
    return (
        f"{base}?client_id={settings.google_client_id}"
        f"&redirect_uri={settings.google_redirect_uri}"
        f"&response_type=code"
        f"&scope={scopes}"
        f"&access_type=offline"
        f"&prompt=consent"
    )


@router.get("/google")
async def google_oauth():
    scopes = (
        "email profile "
        "https://www.googleapis.com/auth/gmail.readonly "
        "https://www.googleapis.com/auth/gmail.send "
        "https://www.googleapis.com/auth/calendar "
        "https://www.googleapis.com/auth/drive.readonly"
    )
    return RedirectResponse(url=_google_oauth_url(scopes))


@router.get("/google/callback")
async def google_callback(code: str):
    """Exchange auth code for tokens and store them."""
    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
            timeout=15,
        )
        r.raise_for_status()
        tokens = r.json()

    # Store tokens for all Google services
    for provider in ("gmail", "googleCalendar", "googleDrive", "googleForms", "googleMeet"):
        save_token(provider, tokens)

    return RedirectResponse(url=f"{settings.frontend_url}/sources?connected=google")


@router.get("/slack")
async def slack_oauth():
    scopes = "channels:read,channels:history,groups:read,groups:history,users:read,chat:write"
    url = (
        f"https://slack.com/oauth/v2/authorize"
        f"?client_id={settings.slack_client_id}"
        f"&scope={scopes}"
        f"&redirect_uri={settings.slack_redirect_uri}"
    )
    return RedirectResponse(url=url)


@router.get("/slack/callback")
async def slack_callback(code: str):
    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://slack.com/api/oauth.v2.access",
            data={
                "code": code,
                "client_id": settings.slack_client_id,
                "client_secret": settings.slack_client_secret,
                "redirect_uri": settings.slack_redirect_uri,
            },
            timeout=15,
        )
        r.raise_for_status()
        data = r.json()
        if not data.get("ok"):
            raise HTTPException(status_code=400, detail=data.get("error", "Slack OAuth failed"))

    save_token("slack", {"access_token": data["access_token"]})
    return RedirectResponse(url=f"{settings.frontend_url}/sources?connected=slack")


@router.get("/discord")
async def discord_oauth():
    scopes = "identify guilds"
    url = (
        f"https://discord.com/api/oauth2/authorize"
        f"?client_id={settings.discord_client_id}"
        f"&redirect_uri={settings.discord_redirect_uri}"
        f"&response_type=code"
        f"&scope={scopes}"
    )
    return RedirectResponse(url=url)


@router.get("/discord/callback")
async def discord_callback(code: str):
    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://discord.com/api/oauth2/token",
            data={
                "client_id": settings.discord_client_id,
                "client_secret": settings.discord_client_secret,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.discord_redirect_uri,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15,
        )
        r.raise_for_status()
        tokens = r.json()

    save_token("discord", tokens)
    return RedirectResponse(url=f"{settings.frontend_url}/sources?connected=discord")


@router.get("/notion")
async def notion_oauth():
    url = (
        f"https://api.notion.com/v1/oauth/authorize"
        f"?client_id={settings.notion_client_id}"
        f"&response_type=code"
        f"&owner=user"
        f"&redirect_uri=http://localhost:8000/api/auth/notion/callback"
    )
    return RedirectResponse(url=url)


@router.get("/notion/callback")
async def notion_callback(code: str):
    import base64
    creds = base64.b64encode(f"{settings.notion_client_id}:{settings.notion_client_secret}".encode()).decode()
    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://api.notion.com/v1/oauth/token",
            headers={"Authorization": f"Basic {creds}", "Content-Type": "application/json"},
            json={"grant_type": "authorization_code", "code": code,
                  "redirect_uri": "http://localhost:8000/api/auth/notion/callback"},
            timeout=15,
        )
        r.raise_for_status()
        tokens = r.json()

    save_token("notion", {"access_token": tokens["access_token"]})
    return RedirectResponse(url=f"{settings.frontend_url}/sources?connected=notion")


@router.delete("/{provider}/disconnect")
async def disconnect(provider: str):
    delete_token(provider)
    return {"provider": provider, "status": "disconnected"}


@router.get("/status")
async def connection_status():
    return all_connected()
