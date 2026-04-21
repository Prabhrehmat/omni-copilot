from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List
import uuid

from ..core.ai import summarize, chat_completion
from ..services.document_processor import extract_text_from_file

router = APIRouter()

# In-memory store — use Firestore in production
_documents = {}


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    content = await file.read()
    text = await extract_text_from_file(content, file.filename or "")

    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text from file")

    doc_id = str(uuid.uuid4())
    _documents[doc_id] = {
        "id": doc_id,
        "name": file.filename,
        "content_type": file.content_type,
        "text": text,
        "size": len(content),
        "word_count": len(text.split()),
    }

    return {"id": doc_id, "name": file.filename, "word_count": len(text.split()), "status": "processed"}


@router.get("/")
async def list_documents():
    docs = [{"id": d["id"], "name": d["name"], "word_count": d["word_count"]} for d in _documents.values()]
    return {"documents": docs}


@router.post("/{doc_id}/summarize")
async def summarize_document(doc_id: str):
    doc = _documents.get(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    summary = await summarize(doc["text"], f"document titled '{doc['name']}'")
    return {"summary": summary, "doc_id": doc_id, "name": doc["name"]}


class AskDocumentRequest(BaseModel):
    question: str


@router.post("/{doc_id}/ask")
async def ask_document(doc_id: str, req: AskDocumentRequest):
    doc = _documents.get(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    prompt = f"""Answer this question based on the document content:

Document: {doc['name']}
Content: {doc['text'][:6000]}

Question: {req.question}

Provide a clear, accurate answer based only on the document content."""

    answer = await chat_completion(
        [{"role": "user", "content": prompt}],
        system_prompt="You are a document analysis expert. Answer questions accurately based on provided content.",
        temperature=0.2,
    )
    return {"answer": answer, "doc_id": doc_id, "question": req.question}
