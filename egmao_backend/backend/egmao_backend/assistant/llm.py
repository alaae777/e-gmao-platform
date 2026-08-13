"""
assistant.llm
=============
Thin abstraction over the LLM provider. Swap providers by changing
`LLM_PROVIDER` in settings/.env — nothing else in the codebase needs to
change.

Supported today: "ollama" (local, free — recommended during development),
"openai", "gemini". Each `complete()` implementation takes the same
(system_prompt, messages) shape and returns a plain string.
"""
from django.conf import settings


class LLMError(Exception):
    pass


def get_llm_client():
    provider = settings.LLM_PROVIDER
    if provider == "ollama":
        return OllamaClient()
    if provider == "openai":
        return OpenAIClient()
    if provider == "gemini":
        return GeminiClient()
    raise LLMError(f"Fournisseur LLM inconnu: {provider}")


class BaseLLMClient:
    def complete(self, system_prompt: str, messages: list[dict]) -> str:
        raise NotImplementedError


class OllamaClient(BaseLLMClient):
    """Client Ollama optimisé pour des réponses rapides."""

    def complete(self, system_prompt, messages):
        import requests

        payload = {
            "model": settings.LLM_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                *messages,
            ],
            "stream": False,
            "options": {
                "num_predict": 250,
                "temperature": 0.2,
                "num_ctx": 2048,
            },
            "keep_alive": "10m",
        }

        try:
            resp = requests.post(
                f"{settings.OLLAMA_BASE_URL}/api/chat",
                json=payload,
                timeout=120,
            )
            resp.raise_for_status()
            return resp.json()["message"]["content"]

        except Exception as exc:
            raise LLMError(f"Erreur Ollama: {exc}") from exc

class OpenAIClient(BaseLLMClient):
    def complete(self, system_prompt, messages):
        from openai import OpenAI

        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        try:
            resp = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "system", "content": system_prompt}, *messages],
            )
            return resp.choices[0].message.content
        except Exception as exc:  # noqa: BLE001
            raise LLMError(f"Erreur OpenAI: {exc}") from exc


class GeminiClient(BaseLLMClient):
    def complete(self, system_prompt, messages):
        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(settings.GEMINI_MODEL, system_instruction=system_prompt)
        history = "\n".join(f"{m['role']}: {m['content']}" for m in messages[:-1])
        prompt = f"{history}\nuser: {messages[-1]['content']}" if history else messages[-1]["content"]
        try:
            resp = model.generate_content(prompt)
            return resp.text
        except Exception as exc:  # noqa: BLE001
            raise LLMError(f"Erreur Gemini: {exc}") from exc
