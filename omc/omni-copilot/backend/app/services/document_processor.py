"""Extract text from various file types."""
import io
from typing import Optional


async def extract_text_from_file(content: bytes, filename: str) -> Optional[str]:
    """Extract text from PDF, DOCX, TXT, or code files."""
    filename_lower = filename.lower()

    try:
        if filename_lower.endswith(".pdf"):
            return _extract_pdf(content)
        elif filename_lower.endswith(".docx"):
            return _extract_docx(content)
        elif filename_lower.endswith(".txt") or filename_lower.endswith(".md"):
            return content.decode("utf-8", errors="ignore")
        elif _is_code_file(filename_lower):
            return _extract_code(content, filename)
        else:
            # Try UTF-8 decode for any text-like file
            return content.decode("utf-8", errors="ignore")
    except Exception as e:
        return f"[Could not extract text: {str(e)}]"


def _extract_pdf(content: bytes) -> str:
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(content))
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        return "\n\n".join(pages)
    except ImportError:
        return "[PyPDF2 not installed — install it to process PDFs]"


def _extract_docx(content: bytes) -> str:
    try:
        from docx import Document
        doc = Document(io.BytesIO(content))
        return "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
    except ImportError:
        return "[python-docx not installed — install it to process DOCX files]"


def _is_code_file(filename: str) -> bool:
    code_extensions = {
        ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".cpp", ".c", ".h",
        ".go", ".rs", ".rb", ".php", ".swift", ".kt", ".cs", ".html", ".css",
        ".json", ".yaml", ".yml", ".toml", ".sh", ".bash", ".sql",
    }
    return any(filename.endswith(ext) for ext in code_extensions)


def _extract_code(content: bytes, filename: str) -> str:
    code = content.decode("utf-8", errors="ignore")
    lang = _detect_language(filename)
    return f"```{lang}\n{code}\n```"


def _detect_language(filename: str) -> str:
    ext_map = {
        ".py": "python", ".js": "javascript", ".ts": "typescript",
        ".jsx": "jsx", ".tsx": "tsx", ".java": "java", ".cpp": "cpp",
        ".c": "c", ".go": "go", ".rs": "rust", ".rb": "ruby",
        ".php": "php", ".swift": "swift", ".kt": "kotlin", ".cs": "csharp",
        ".html": "html", ".css": "css", ".json": "json", ".sql": "sql",
        ".sh": "bash", ".yaml": "yaml", ".yml": "yaml",
    }
    for ext, lang in ext_map.items():
        if filename.endswith(ext):
            return lang
    return "text"


def chunk_text(text: str, chunk_size: int = 2000, overlap: int = 200) -> list[str]:
    """Split text into overlapping chunks for processing."""
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        # Try to break at sentence boundary
        last_period = chunk.rfind('. ')
        if last_period > chunk_size * 0.7:
            chunk = chunk[:last_period + 1]
        chunks.append(chunk)
        start += len(chunk) - overlap

    return chunks
