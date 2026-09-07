from typing import Type, Optional
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings


def get_chat_llm(model_name: str, temperature: float = 0.0, schema: Optional[Type[BaseModel]] = None):
    """
    Creates a ChatGoogleGenerativeAI instance with optional Pydantic structured output.
    Uses Google Gemini as the sole LLM provider.
    """
    primary_llm = ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=temperature
    )

    if schema:
        return primary_llm.with_structured_output(schema)

    return primary_llm
