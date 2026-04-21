"""Central AI service — Groq (llama-3.3-70b-versatile)."""
from groq import AsyncGroq
from typing import List, Dict, Optional
from .config import settings

_groq_client: Optional[AsyncGroq] = None


def get_groq_client() -> AsyncGroq:
    global _groq_client
    # Always re-read the key so a restart picks up .env changes
    if _groq_client is None:
        key = settings.groq_api_key.strip().strip('"').strip("'")
        if not key:
            raise ValueError("GROQ_API_KEY is not set in your .env file.")
        _groq_client = AsyncGroq(api_key=key)
    return _groq_client


async def chat_completion(
    messages: List[Dict],
    model: str = None,
    temperature: float = 0.7,
    max_tokens: int = 2048,
    system_prompt: str = None,
    integrations: Dict = None,
) -> str:
    """Run a chat completion via Groq and return the response text."""
    model = model or settings.default_model
    integrations = integrations or {}

    full_messages = []
    if system_prompt:
        full_messages.append({"role": "system", "content": system_prompt})
    full_messages.extend(messages)

    try:
        client = get_groq_client()
        response = await client.chat.completions.create(
            model=model,
            messages=full_messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content
    except ValueError as e:
        return f"⚠️ Configuration error: {str(e)}"
    except Exception as e:
        err = str(e)
        if "invalid_api_key" in err or "401" in err:
            return "⚠️ Invalid Groq API key. Please check `GROQ_API_KEY` in your `.env` file and **restart the backend**."
        return f"⚠️ Groq API error: {err}"


async def summarize(text: str, context: str = "") -> str:
    """Summarize a block of text."""
    prompt = f"Summarize the following{' ' + context if context else ''} concisely, highlighting key points and action items:\n\n{text[:8000]}"
    return await chat_completion(
        [{"role": "user", "content": prompt}],
        system_prompt="You are an expert summarizer. Be concise, structured, and highlight actionable insights.",
        temperature=0.3,
    )


async def extract_tasks(text: str) -> List[Dict]:
    """Extract tasks and deadlines from text."""
    prompt = f"""Extract all tasks, action items, and deadlines from this text.
Return as JSON array: [{{"task": "...", "deadline": "...", "priority": "high|medium|low", "assignee": "..."}}]

Text: {text[:4000]}"""
    result = await chat_completion(
        [{"role": "user", "content": prompt}],
        system_prompt="You are a task extraction expert. Return only valid JSON.",
        temperature=0.1,
    )
    try:
        import json
        start = result.find('[')
        end = result.rfind(']') + 1
        if start >= 0 and end > start:
            return json.loads(result[start:end])
    except Exception:
        pass
    return []


async def analyze_image(image_base64: str, question: str = "Describe this image in detail") -> str:
    """Groq does not support vision yet — return a clear message."""
    return "Image analysis is not supported with the current Groq model. Use a vision-capable model (e.g. GPT-4o) for image analysis."
