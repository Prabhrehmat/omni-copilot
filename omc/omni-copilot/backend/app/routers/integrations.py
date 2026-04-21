from fastapi import APIRouter, HTTPException
from ..services.token_store import all_connected, delete_token, is_connected
from ..core.config import settings

router = APIRouter()

# Map provider keys to their OAuth start endpoints
OAUTH_ROUTES = {
    "gmail":           "http://localhost:8000/api/auth/google",
    "googleDrive":     "http://localhost:8000/api/auth/google",
    "googleCalendar":  "http://localhost:8000/api/auth/google",
    "googleForms":     "http://localhost:8000/api/auth/google",
    "googleMeet":      "http://localhost:8000/api/auth/google",
    "slack":           "http://localhost:8000/api/auth/slack",
    "notion":          "http://localhost:8000/api/auth/notion",
    "discord":         "http://localhost:8000/api/auth/discord",
}


@router.get("/status")
async def get_status():
    return all_connected()


@router.post("/{provider}/connect")
async def connect_integration(provider: str):
    if provider not in OAUTH_ROUTES:
        raise HTTPException(
            status_code=400,
            detail=f"'{provider}' is not supported. Supported: {list(OAUTH_ROUTES.keys())}"
        )
    return {"provider": provider, "oauth_url": OAUTH_ROUTES[provider]}


@router.delete("/{provider}")
async def disconnect_integration(provider: str):
    delete_token(provider)
    # If it's a Google service, disconnect all Google services together
    if provider in ("gmail", "googleDrive", "googleCalendar", "googleForms", "googleMeet"):
        for p in ("gmail", "googleDrive", "googleCalendar", "googleForms", "googleMeet"):
            delete_token(p)
    return {"provider": provider, "status": "disconnected"}
