from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # AI
    groq_api_key: str = ""
    default_model: str = "llama-3.3-70b-versatile"

    # Google
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/auth/google/callback"

    # Microsoft
    microsoft_client_id: str = ""
    microsoft_client_secret: str = ""
    microsoft_redirect_uri: str = "http://localhost:8000/api/auth/microsoft/callback"

    # Slack
    slack_client_id: str = ""
    slack_client_secret: str = ""
    slack_redirect_uri: str = "http://localhost:8000/api/auth/slack/callback"

    # Discord
    discord_client_id: str = ""
    discord_client_secret: str = ""
    discord_redirect_uri: str = "http://localhost:8000/api/auth/discord/callback"

    # Notion
    notion_client_id: str = ""
    notion_client_secret: str = ""

    # Zoom
    zoom_client_id: str = ""
    zoom_client_secret: str = ""

    # Firebase
    firebase_project_id: str = ""
    firebase_private_key_id: str = ""
    firebase_private_key: str = ""
    firebase_client_email: str = ""

    # App
    secret_key: str = "dev-secret-key-change-in-production"
    frontend_url: str = "http://localhost:3000"
    environment: str = "development"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
