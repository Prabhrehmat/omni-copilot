from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .core.config import settings
from .routers import chat, integrations, email, calendar, documents, notion
from .routers import slack, discord, meetings, dashboard, search, auth

app = FastAPI(
    title="OmniCopilot API",
    description="AI-powered unified assistant backend",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(integrations.router, prefix="/api/integrations", tags=["Integrations"])
app.include_router(email.router, prefix="/api/email", tags=["Email"])
app.include_router(calendar.router, prefix="/api/calendar", tags=["Calendar"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(notion.router, prefix="/api/notion", tags=["Notion"])
app.include_router(slack.router, prefix="/api/slack", tags=["Slack"])
app.include_router(discord.router, prefix="/api/discord", tags=["Discord"])
app.include_router(meetings.router, prefix="/api/meetings", tags=["Meetings"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
