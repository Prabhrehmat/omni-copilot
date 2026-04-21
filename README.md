# OmniCopilot 🤖

An AI-powered personal assistant that connects with your Google services (Gmail, Calendar, Drive), Slack, Discord, and Notion — letting you manage emails, schedule meetings, retrieve documents, and more through natural language chat.

---

## Features

- **Gmail** — Read, summarize, and send emails with AI assistance
- **Google Calendar** — View events and schedule meetings intelligently
- **Google Drive** — Search files and extract content from PDFs/DOCX
- **Chat Interface** — Natural language interaction powered by Llama 3.3 70B via Groq
- **Document Processing** — Upload and summarize documents
- **OAuth Authentication** — Secure login for Google, Slack, Discord, and Notion

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, TailwindCSS, Zustand |
| Backend | FastAPI, Python 3.9+ |
| AI | Groq (Llama 3.3 70B) |
| Integrations | Google APIs, Slack SDK, Notion Client |
| Document Parsing | PyPDF2, python-docx |

---

## Prerequisites

- Python 3.9+
- Node.js 16+
- [Groq API key](https://console.groq.com/)
- Google Cloud Project with these APIs enabled:
  - Gmail API
  - Google Calendar API
  - Google Drive API

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Prabhrehmat/omni-copilot.git
cd omni-copilot/omc/omni-copilot
```

### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
copy .env.example .env
# Edit .env with your keys (see Configuration below)

# Start the backend
python run.py
```

Backend runs at: `http://localhost:8000`

### 3. Frontend setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## Configuration

Create a `.env` file inside `backend/` with the following:

```env
# AI
GROQ_API_KEY=your-groq-api-key
DEFAULT_MODEL=llama-3.3-70b-versatile

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback

# App
SECRET_KEY=your-secret-key
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
```

### Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create/select a project
2. Enable: Gmail API, Google Calendar API, Google Drive API
3. Create OAuth 2.0 credentials (Web application type)
4. Add redirect URI: `http://localhost:8000/api/auth/google/callback`
5. Add required scopes on the OAuth consent screen:
   - `email`, `profile`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/drive.readonly`

---

## Project Structure

```
omni-copilot/
├── backend/
│   ├── app/
│   │   ├── core/           # AI, config, memory
│   │   ├── routers/        # API endpoints
│   │   └── services/       # Google, Slack, Discord, Notion services
│   ├── requirements.txt
│   ├── run.py
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/     # Reusable UI components
    │   ├── pages/          # Page-level components
    │   ├── store/          # Zustand state management
    │   └── utils/          # API helpers
    └── package.json
```

---

## API Overview

| Category | Endpoint | Description |
|----------|----------|-------------|
| Auth | `GET /api/auth/google` | Initiate Google OAuth |
| Auth | `GET /api/auth/status` | Check connection status |
| Email | `GET /api/email/inbox` | Fetch inbox |
| Email | `POST /api/email/send` | Send email |
| Calendar | `GET /api/calendar/events` | List events |
| Calendar | `POST /api/calendar/schedule-meeting` | AI schedule meeting |
| Chat | `POST /api/chat/message` | Send chat message |
| Documents | `POST /api/documents/upload` | Upload document |

---

## Example Chat Commands

```
# Email
show me my unread emails
send email to user@example.com about the project update

# Calendar
what meetings do I have today?
schedule a meeting at 3pm tomorrow

# Drive
retrieve my resume from drive
summarize the document named Q1 Report
```

---

## Security Notes

- Never commit `.env` or `tokens.json` to version control
- OAuth tokens are stored locally and auto-refreshed when expired
- All API communication uses HTTPS

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## Author

**Prabhrehmat**
- GitHub: [@Prabhrehmat](https://github.com/Prabhrehmat)

---

## License

This project is for educational purposes.
