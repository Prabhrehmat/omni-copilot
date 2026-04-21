# Fixes Applied for Google Calendar 403 Error

## Date: April 21, 2026

## Problem
Users were experiencing a "403 Forbidden" error when trying to access Google Calendar through OmniCopilot. The error occurred when attempting to schedule meetings or view calendar events.

## Root Cause
The Google Calendar API was not enabled in the Google Cloud Console project, or the OAuth token didn't have the required calendar scope.

## Changes Made

### 1. Enhanced Error Handling in `google_service.py`

**File**: `om/omc/omni-copilot/backend/app/services/google_service.py`

- Added comprehensive error handling for 403 errors in `get_calendar_events()`
- Added comprehensive error handling for 403 errors in `create_calendar_event()`
- Errors now provide:
  - Clear explanation of what went wrong
  - Step-by-step instructions to fix the issue
  - Direct link to enable the API in Google Cloud Console

**Example error message**:
```
Google Calendar API access denied (403). This usually means:
1. The Google Calendar API is not enabled in your Google Cloud Console project
2. Your OAuth token doesn't have the required calendar scope
3. You need to re-authenticate your Google account

To fix:
- Go to https://console.cloud.google.com/apis/library/calendar-json.googleapis.com
- Enable the Google Calendar API for your project
- Disconnect and reconnect Google in Data Sources to refresh permissions
```

### 2. Added Calendar Status Endpoint

**File**: `om/omc/omni-copilot/backend/app/routers/calendar.py`

- Added new `GET /api/calendar/status` endpoint
- Checks if Google Calendar is connected
- Tests if the Calendar API is enabled and accessible
- Returns detailed status and fix instructions

**Usage**:
```bash
curl http://localhost:8000/api/calendar/status
```

**Response**:
```json
{
  "connected": true,
  "api_enabled": false,
  "error": "Access denied",
  "message": "Google Calendar API is not enabled or accessible...",
  "fix_steps": [
    "1. Go to https://console.cloud.google.com/apis/library/calendar-json.googleapis.com",
    "2. Select your project",
    "3. Click 'Enable' for Google Calendar API",
    "4. Go to Data Sources in OmniCopilot and disconnect/reconnect Google"
  ]
}
```

### 3. Improved Chat Error Messages

**File**: `om/omc/omni-copilot/backend/app/routers/chat.py`

- Updated `fetch_real_context()` to catch `ValueError` exceptions separately
- ValueError exceptions (our custom 403 errors) are now displayed with full helpful messages
- Users will see the fix instructions directly in the chat interface

### 4. Created Setup Documentation

**File**: `om/omc/omni-copilot/GOOGLE_CALENDAR_SETUP.md`

- Comprehensive guide for setting up Google Calendar API
- Step-by-step instructions with screenshots references
- Common issues and solutions
- Direct links to Google Cloud Console
- Security best practices

## What Users Need to Do

### Immediate Action Required:

1. **Enable Google Calendar API**:
   - Go to https://console.cloud.google.com/apis/library/calendar-json.googleapis.com
   - Select your project (Client ID: `574840584116-iv30m4pp0p2ofomqin21atqs1vo0kuea`)
   - Click "Enable"

2. **Re-authenticate**:
   - Open OmniCopilot: http://localhost:3000
   - Go to Data Sources
   - Disconnect Google
   - Connect Google again
   - Grant all requested permissions

3. **Test**:
   - Try scheduling a meeting again
   - Or ask: "What meetings do I have today?"

## Testing

To verify the fixes are working:

1. **Check status endpoint**:
   ```bash
   curl http://localhost:8000/api/calendar/status
   ```

2. **Try to get events**:
   ```bash
   curl http://localhost:8000/api/calendar/events
   ```

3. **Use the chat interface**:
   - Ask: "Schedule a meeting at 3pm today"
   - The error message should now be clear and actionable

## Technical Details

### OAuth Scopes Required:
```
https://www.googleapis.com/auth/calendar
```

### API Endpoints Modified:
- `GET /api/calendar/status` (NEW)
- `GET /api/calendar/events` (Enhanced error handling)
- `POST /api/calendar/events` (Enhanced error handling)
- `POST /api/calendar/schedule-meeting` (Inherits enhanced error handling)

### Error Flow:
1. User requests calendar operation
2. Backend attempts to access Google Calendar API
3. If 403 error occurs:
   - Custom ValueError is raised with detailed message
   - Error is caught in router layer
   - HTTPException 403 is returned with full instructions
   - Chat interface displays the helpful error message

## Benefits

1. **Better User Experience**: Users now know exactly what to do when they encounter the error
2. **Reduced Support Burden**: Clear instructions reduce the need for manual support
3. **Faster Resolution**: Direct links and step-by-step guides speed up problem resolution
4. **Proactive Diagnostics**: Status endpoint allows checking configuration before errors occur

## Future Improvements

Consider adding:
1. Automatic API enablement via Google Cloud API (if possible)
2. In-app OAuth scope verification
3. Automated testing of all Google APIs on connection
4. Visual setup wizard in the frontend
5. Health check dashboard for all integrations

## Notes

- The `.env` file was not modified (no changes needed)
- All changes are backward compatible
- No database migrations required
- No frontend changes required (errors display in chat)
