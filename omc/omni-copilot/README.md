# OmniCopilot 🚀

An AI-powered personal assistant that integrates with your Google services (Gmail, Calendar, Drive), Slack, Discord, and Notion to help you manage emails, schedule meetings, retrieve documents, and more.

## 🌟 Features

### ✅ Implemented
- **Gmail Integration**: Read emails, send emails, compose with AI
- **Google Calendar**: View events, schedule meetings with AI assistance
- **Google Drive**: Search files, download and read PDF/DOCX content
- **Chat Interface**: Natural language interaction with AI
- **Document Processing**: Extract text from PDFs and DOCX files
- **OAuth Authentication**: Secure Google, Slack, Discord, Notion login

### 🔧 Core Capabilities
- AI-powered email composition
- Smart meeting scheduling (finds optimal time slots)
- Document summarization
- Task extraction from emails
- Real-time data fetching from connected services

## 📋 Prerequisites

- Python 3.9+
- Node.js 16+
- Google Cloud Project with APIs enabled:
  - Gmail API
  - Google Calendar API
  - Google Drive API
- Groq API key (for AI features)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Tamanna1615/OmniCopilot.git
cd OmniCopilot/omc/omni-copilot
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env

# Edit .env and add your API keys:
# - GROQ_API_KEY
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# (See Configuration section below)

# Run the backend
python run.py
```

Backend will run on: http://localhost:8000

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Run the frontend
npm run dev
```

Frontend will run on: http://localhost:3000

## ⚙️ Configuration

### Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - Gmail API: https://console.cloud.google.com/apis/library/gmail.googleapis.com
   - Google Calendar API: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com
   - Google Drive API: https://console.cloud.google.com/apis/library/drive.googleapis.com

4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URIs:
     - `http://localhost:8000/api/auth/google/callback`
   - Copy the **Client ID** and **Client Secret**

5. Configure OAuth consent screen:
   - Add scopes:
     - `email`
     - `profile`
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/drive.readonly`
   - Add test users (if in testing mode)

### Groq API Setup

1. Go to [Groq Console](https://console.groq.com/)
2. Create an account
3. Generate an API key
4. Copy the key to your `.env` file

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# AI
GROQ_API_KEY=your-groq-api-key
DEFAULT_MODEL=llama-3.3-70b-versatile

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback

# App
SECRET_KEY=your-super-secret-jwt-key-change-this
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
```

## 📖 Usage

### Connecting Services

1. Open http://localhost:3000
2. Go to **Data Sources** page
3. Click **Connect** next to Google
4. Authorize all requested permissions
5. You'll be redirected back to OmniCopilot

### Chat Commands

#### Email
```
show me my unread emails
summarize my inbox
send email to user@example.com about meeting tomorrow
```

#### Calendar
```
what meetings do I have today?
schedule a meeting at 3pm today
show my calendar for next week
```

#### Drive
```
retrieve Tamanna_Resume.pdf from drive
show me my recent drive files
what's in the document on my drive?
```

## 🏗️ Project Structure

```
omni-copilot/
├── backend/
│   ├── app/
│   │   ├── core/           # AI, config, memory
│   │   ├── routers/        # API endpoints
│   │   └── services/       # Google, Slack, Discord services
│   ├── requirements.txt
│   ├── run.py
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── store/          # State management
│   │   └── utils/          # API utilities
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/status` - Check connection status

### Email
- `GET /api/email/inbox` - Get inbox emails
- `POST /api/email/send` - Send email
- `POST /api/email/compose` - AI compose email

### Calendar
- `GET /api/calendar/events` - Get calendar events
- `POST /api/calendar/events` - Create event
- `POST /api/calendar/schedule-meeting` - AI schedule meeting
- `GET /api/calendar/status` - Check Calendar API status

### Chat
- `POST /api/chat/message` - Send chat message
- `POST /api/chat/upload` - Upload file and chat

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/` - List documents
- `POST /api/documents/{id}/summarize` - Summarize document

## 🐛 Troubleshooting

### Email Not Sending

**Issue**: AI claims email is sent but it's not received

**Solution**:
1. Restart the backend: `python run.py`
2. Test with: `python test_email.py`
3. Check Gmail Sent folder
4. See `EMAIL_NOT_SENT_FIX.md` for details

### Calendar 403 Error

**Issue**: "403 Forbidden" when accessing calendar

**Solution**:
1. Enable Google Calendar API in Cloud Console
2. Disconnect and reconnect Google in Data Sources
3. See `GOOGLE_CALENDAR_SETUP.md` for details

### Drive Files Not Reading

**Issue**: Files found but content not extracted

**Solution**:
1. Enable Google Drive API in Cloud Console
2. Restart backend
3. See `GOOGLE_DRIVE_SETUP.md` for details

## 📚 Documentation

- [Google Calendar Setup](GOOGLE_CALENDAR_SETUP.md)
- [Google Drive Setup](GOOGLE_DRIVE_SETUP.md)
- [Email Fix Guide](EMAIL_NOT_SENT_FIX.md)
- [Quick Start Guide](QUICK_START.md)
- [Fixes Applied](FIXES_APPLIED.md)

## 🔐 Security

- **Never commit** `.env` files or `tokens.json`
- OAuth tokens are stored locally in `tokens.json`
- Tokens are auto-refreshed when expired
- All API calls use HTTPS

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Web framework
- **Groq** - AI/LLM (Llama 3.3 70B)
- **httpx** - HTTP client
- **PyPDF2** - PDF text extraction
- **python-docx** - DOCX text extraction

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Zustand** - State management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m "Add feature"`
4. Push to branch: `git push origin feature-name`
5. Open a Pull Request

## 📝 License

This project is for educational purposes.

## 👤 Author

**Tamanna Singla**
- GitHub: [@Tamanna1615](https://github.com/Tamanna1615)
- Email: tamannasingla793@gmail.com

## 🙏 Acknowledgments

- Groq for AI capabilities
- Google for API integrations
- FastAPI and React communities

## 📞 Support

For issues and questions:
1. Check the documentation files in the repository
2. Open an issue on GitHub
3. Contact: tamannasingla793@gmail.com

---

**Note**: This is a development project. For production use, additional security measures and error handling should be implemented.
