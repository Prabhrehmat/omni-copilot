# OmniCopilot

AI-powered unified assistant that connects all your productivity platforms through a single intelligent chat interface.

## Stack

- **Frontend**: React 18 + Tailwind CSS + Framer Motion + Zustand
- **Backend**: FastAPI + Python
- **Database**: Firebase Firestore (configurable)
- **AI**: OpenAI GPT-4o / Google Gemini

## Quick Start

### 1. Backend

```bash
cd omni-copilot/backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env and add your API keys

python run.py
# API runs at http://localhost:8000
# Docs at http://localhost:8000/api/docs
```

### 2. Frontend

```bash
cd omni-copilot/frontend
npm install
npm run dev
# App runs at http://localhost:3000
```

## Configuration

Edit `backend/.env`:

| Key | Description |
|-----|-------------|
| `OPENAI_API_KEY` | OpenAI API key (required for AI features) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `SLACK_CLIENT_ID` | Slack app client ID |
| `DISCORD_CLIENT_ID` | Discord app client ID |
| `NOTION_CLIENT_ID` | Notion integration client ID |
| `ZOOM_CLIENT_ID` | Zoom app client ID |
| `MICROSOFT_CLIENT_ID` | Microsoft Azure app client ID |

## Features

- Unified AI chat across all platforms
- Gmail / Outlook email summarization and smart replies
- Google Calendar / Outlook Calendar management
- Slack / Teams / Discord message summarization
- Notion workspace search and chat
- Google Meet / Zoom meeting summaries
- Document upload and Q&A (PDF, DOCX, TXT)
- Image analysis and OCR
- Code file analysis and explanation
- Google Forms response analytics
- Automation workflows
- Productivity dashboard with analytics

## Demo Mode

The app works in demo mode without any API keys — it uses mock data and simulated AI responses. Add your OpenAI API key in Settings to enable real AI capabilities.

## Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy dist/ to Vercel
```

### Backend (Railway / Render)
```bash
# Set environment variables in your hosting platform
# Start command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```
