# Google Drive Integration - File Reading Fix

## Problem Fixed
OmniCopilot was not reading the actual content from PDF files retrieved from Google Drive. It would find the file but couldn't extract the text content.

## What Was Added

### 1. Google Drive API Functions
Added three new functions to `google_service.py`:

- **`search_drive_files(query, max_results)`** - Search for files in Drive
- **`get_drive_file_content(file_id)`** - Download file content as bytes
- **`get_drive_file_metadata(file_id)`** - Get file metadata (name, size, etc.)

### 2. Intelligent File Retrieval in Chat
Updated the chat router to:
- Detect when users ask about Drive files
- Extract filenames from the message (with or without quotes)
- Search for matching files in Drive
- Download the file content
- Extract text using PyPDF2 (for PDFs) or python-docx (for DOCX)
- Include the extracted text in the AI's context

## How to Use

### Example Queries:

1. **Retrieve a specific file**:
   ```
   retrieve Tamanna_Resume.pdf from drive
   ```

2. **Get file with quotes**:
   ```
   get "Tamanna_Resume.pdf" from my drive
   ```

3. **List recent files**:
   ```
   show me my recent drive files
   ```

4. **Ask about file content**:
   ```
   what's in the resume file on my drive?
   ```

## Setup Requirements

### 1. Enable Google Drive API

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/library/drive.googleapis.com)
2. Select your project
3. Click **Enable** for Google Drive API

### 2. Verify OAuth Scope

The OAuth configuration already includes the Drive scope:
```python
https://www.googleapis.com/auth/drive.readonly
```

### 3. Re-authenticate (if needed)

If you connected Google before this fix:
1. Go to **Data Sources** in OmniCopilot
2. Disconnect Google
3. Connect Google again
4. Grant all permissions including Drive

## Supported File Types

The document processor supports:

- **PDF** - Uses PyPDF2 to extract text
- **DOCX** - Uses python-docx to extract text
- **TXT/MD** - Direct UTF-8 decoding
- **Code files** - Python, JavaScript, TypeScript, Java, etc.

## How It Works

1. **User asks about a file**: "retrieve Tamanna_Resume.pdf from drive"

2. **Filename extraction**: The system uses regex to find the filename in the message

3. **Drive search**: Searches Google Drive for files matching the name

4. **File download**: Downloads the file content as bytes

5. **Text extraction**: 
   - For PDFs: PyPDF2 extracts text from all pages
   - For DOCX: python-docx extracts paragraphs
   - For text files: Direct UTF-8 decoding

6. **Context injection**: The extracted text is added to the AI's context

7. **AI response**: The AI can now answer questions about the file content

## Example Flow

```
User: "retrieve Tamanna_Resume.pdf from drive"

System:
1. Detects "drive" and "Tamanna_Resume.pdf" in message
2. Calls search_drive_files(query="Tamanna Resume")
3. Finds matching file with ID "abc123"
4. Calls get_drive_file_content("abc123")
5. Receives PDF bytes
6. Calls extract_text_from_file(bytes, "Tamanna_Resume.pdf")
7. PyPDF2 extracts: "John Doe\nSoftware Engineer\n..."
8. Adds to context: "## Real Google Drive Data\n### File: Tamanna_Resume.pdf\n### File Content:\nJohn Doe\n..."
9. AI responds with file details and content summary
```

## Error Handling

### 403 Forbidden Error
If you see this error:
```
Google Drive API access denied (403)
```

**Fix**:
1. Enable Google Drive API in Cloud Console
2. Re-authenticate your Google account
3. Make sure the drive.readonly scope is granted

### File Not Found
If the file isn't found:
```
No files found matching 'filename.pdf'
```

**Fix**:
- Check the filename spelling
- Make sure the file is in your Drive (not shared with you)
- Try searching with part of the filename

### Text Extraction Failed
If you see:
```
[PyPDF2 not installed — install it to process PDFs]
```

**Fix**:
```bash
pip install PyPDF2==3.0.1
```

## Testing

### Test 1: List Files
```
User: "show me my drive files"
Expected: List of recent files with names and types
```

### Test 2: Retrieve PDF
```
User: "retrieve Tamanna_Resume.pdf from drive"
Expected: File details + extracted text content
```

### Test 3: Ask About Content
```
User: "what skills are mentioned in the resume?"
Expected: AI analyzes the extracted text and lists skills
```

## API Endpoints

You can also use the Drive functions directly via API:

### Search Files
```bash
# This would require creating a new router endpoint
GET /api/drive/search?query=resume&max_results=10
```

### Get File Content
```bash
# This would require creating a new router endpoint
GET /api/drive/files/{file_id}/content
```

## Limitations

1. **File Size**: Large files (>10MB) may take longer to download
2. **Text Extraction**: 
   - Scanned PDFs without OCR won't extract text
   - Complex formatting may not preserve perfectly
3. **Permissions**: Can only access files you own or have access to
4. **Rate Limits**: Google Drive API has rate limits (10,000 requests/day for free tier)

## Future Improvements

Consider adding:
1. **OCR Support**: Use pytesseract for scanned PDFs
2. **Caching**: Cache extracted text to avoid re-downloading
3. **Batch Processing**: Process multiple files at once
4. **File Upload**: Upload files to Drive from OmniCopilot
5. **Folder Navigation**: Browse Drive folders
6. **File Sharing**: Share files via OmniCopilot

## Security Notes

- Files are downloaded temporarily and not stored permanently
- Only the text content is extracted and used
- Original file bytes are discarded after extraction
- OAuth tokens are stored securely in `tokens.json`

## Dependencies

Required packages (already in requirements.txt):
```
PyPDF2==3.0.1
python-docx==1.1.0
httpx==0.27.0
```
