from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..core.ai import summarize, chat_completion
from ..services.notion_service import search_pages, get_page_content

router = APIRouter()


@router.get("/pages")
async def get_pages(query: str = ""):
    try:
        pages = await search_pages(query=query)
        return {"pages": pages}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Notion API error: {str(e)}")


@router.get("/pages/{page_id}")
async def get_page(page_id: str):
    try:
        content = await get_page_content(page_id)
        return {"id": page_id, "content": content}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Notion API error: {str(e)}")


@router.post("/pages/{page_id}/summarize")
async def summarize_page(page_id: str):
    try:
        content = await get_page_content(page_id)
        if not content.strip():
            return {"summary": "This page appears to be empty.", "page_id": page_id}
        summary = await summarize(content, "Notion page")
        return {"summary": summary, "page_id": page_id}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Notion API error: {str(e)}")


class AskNotionRequest(BaseModel):
    question: str


@router.post("/ask")
async def ask_notion(req: AskNotionRequest):
    try:
        pages = await search_pages(query=req.question, limit=5)
        contents = []
        for p in pages:
            content = await get_page_content(p["id"])
            if content.strip():
                contents.append(f"Page: {p['title']}\n{content[:2000]}")

        if not contents:
            return {"answer": "No relevant Notion pages found for your question."}

        prompt = f"""Answer this question using the Notion workspace content:

{chr(10).join(contents[:3])}

Question: {req.question}"""

        answer = await chat_completion(
            [{"role": "user", "content": prompt}],
            system_prompt="You are a Notion workspace assistant. Answer based on the provided pages.",
            temperature=0.3,
        )
        return {"answer": answer}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Notion API error: {str(e)}")
