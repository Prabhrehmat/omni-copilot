# Quick Fix: Google Calendar 403 Error

## 🚨 The Problem
You're seeing: **"403 Forbidden error when attempting to access your Google Calendar"**

## ✅ The Solution (3 Steps)

### Step 1: Enable the API (2 minutes)
1. Click this link: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com
2. Select your project
3. Click the blue **"Enable"** button

### Step 2: Re-authenticate (1 minute)
1. Open OmniCopilot: http://localhost:3000
2. Go to **Data Sources** page
3. Click **Disconnect** next to Google
4. Click **Connect** and authorize all permissions

### Step 3: Test (30 seconds)
Ask OmniCopilot: **"What meetings do I have today?"**

## 🎯 That's It!

Your Google Calendar should now work perfectly.

---

## 🔍 Want to Check Status First?

Run this in your terminal:
```bash
curl http://localhost:8000/api/calendar/status
```

Or visit: http://localhost:8000/api/calendar/status in your browser

---

## 📚 Need More Help?

See the full guide: `GOOGLE_CALENDAR_SETUP.md`

## 🛠️ What Was Fixed?

The code now:
- ✅ Shows clear error messages with fix instructions
- ✅ Provides a status endpoint to check configuration
- ✅ Handles 403 errors gracefully
- ✅ Guides you through the fix process

All changes are in:
- `backend/app/services/google_service.py`
- `backend/app/routers/calendar.py`
- `backend/app/routers/chat.py`
