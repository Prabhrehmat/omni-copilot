# Quick Start: Fix Google Drive File Reading

## 🚨 The Problem
OmniCopilot finds your PDF files but can't read the content.

## ✅ The Fix (3 Steps - 3 Minutes)

### Step 1: Enable Google Drive API
Click: https://console.cloud.google.com/apis/library/drive.googleapis.com
→ Select your project → Click **"Enable"**

### Step 2: Restart Backend
```bash
cd om/omc/omni-copilot/backend
python run.py
```

### Step 3: Test It
In OmniCopilot chat:
```
retrieve Tamanna_Resume.pdf from drive
```

## 🎯 Done!
Your PDF content should now appear in the response.

---

## 📝 What Was Fixed

**Added**:
- Google Drive file search
- File download functionality  
- PDF text extraction (PyPDF2)
- DOCX text extraction (python-docx)
- Intelligent filename detection

**Files Modified**:
- `backend/app/services/google_service.py` (added 3 functions)
- `backend/app/routers/chat.py` (enhanced Drive integration)

---

## 💬 Try These Commands

```
show me my drive files
retrieve [filename].pdf from drive
what's in the resume file?
summarize the document on my drive
```

---

## 🔧 Troubleshooting

**Still not working?**
1. Check if Drive API is enabled
2. Make sure backend restarted
3. Try disconnecting/reconnecting Google in Data Sources

**See full guide**: `GOOGLE_DRIVE_SETUP.md`
