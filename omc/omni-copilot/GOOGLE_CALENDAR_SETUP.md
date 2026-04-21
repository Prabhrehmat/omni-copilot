# Google Calendar API Setup Guide

## Problem: 403 Forbidden Error

If you're seeing a "403 Forbidden" error when trying to access Google Calendar, it means the Google Calendar API is not enabled for your Google Cloud project or your OAuth token doesn't have the required permissions.

## Solution Steps

### 1. Enable Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (the one with Client ID: `574840584116-iv30m4pp0p2ofomqin21atqs1vo0kuea`)
3. Navigate to **APIs & Services** → **Library**
4. Search for "Google Calendar API"
5. Click on it and press **Enable**

Direct link: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com

### 2. Verify OAuth Consent Screen

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Make sure these scopes are added:
   - `https://www.googleapis.com/auth/calendar` (Full calendar access)
   - `https://www.googleapis.com/auth/gmail.readonly` (Read Gmail)
   - `https://www.googleapis.com/auth/gmail.send` (Send Gmail)
   - `https://www.googleapis.com/auth/drive.readonly` (Read Drive)
3. If your app is in "Testing" mode, ensure your Google account email is added to the **Test users** list

### 3. Re-authenticate Your Google Account

After enabling the API, you need to reconnect your Google account to get fresh tokens with the Calendar scope:

1. Open OmniCopilot in your browser: http://localhost:3000
2. Go to **Data Sources** page
3. Find Google in the list and click **Disconnect**
4. Click **Connect** again
5. Go through the OAuth flow and grant all requested permissions
6. Make sure you see "Google Calendar" in the list of granted permissions

### 4. Test the Connection

You can test if the Calendar API is working by:

1. Making a GET request to: `http://localhost:8000/api/calendar/status`
2. Or asking OmniCopilot: "What meetings do I have today?"

## Common Issues

### Issue: "Access Not Configured"
**Solution**: The Google Calendar API is not enabled. Follow Step 1 above.

### Issue: "Insufficient Permission"
**Solution**: Your OAuth token doesn't have the calendar scope. Follow Step 3 to re-authenticate.

### Issue: "Invalid Credentials"
**Solution**: Check that your `.env` file has the correct `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### Issue: "Redirect URI Mismatch"
**Solution**: In Google Cloud Console, go to **APIs & Services** → **Credentials**, click on your OAuth 2.0 Client ID, and make sure `http://localhost:8000/api/auth/google/callback` is in the list of authorized redirect URIs.

## Required OAuth Scopes

The application requests these Google scopes during authentication:

```
email profile
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/drive.readonly
```

## API Endpoints

- **Calendar Status**: `GET /api/calendar/status` - Check if Calendar API is working
- **Get Events**: `GET /api/calendar/events` - Fetch calendar events
- **Create Event**: `POST /api/calendar/events` - Create a new calendar event
- **Schedule Meeting**: `POST /api/calendar/schedule-meeting` - AI-assisted meeting scheduling

## Need More Help?

If you're still experiencing issues:

1. Check the backend logs for detailed error messages
2. Verify your Google Cloud project quotas
3. Make sure your Google account has calendar access
4. Try using a different Google account for testing

## Security Note

Never commit your `.env` file to version control. It contains sensitive API keys and secrets.
