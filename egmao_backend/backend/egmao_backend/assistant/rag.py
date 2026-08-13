"""
assistant.rag
=============
Minimal Retrieval-Augmented Generation layer over training Documents.

Indexing: extracts text from PDF documents (pypdf), splits it into
~800-character chunks, and stores them as DocumentChunk rows.

Retrieval: today, a keyword-overlap scorer (no external calls, no extra
infra) — good enough to ground answers in the right chapter's material.
`DocumentChunk.embedding` and `settings.RAG_TOP_K` are already in place so
this can be swapped for real vector similarity (pgvector, FAISS, etc.)
without touching the calling code in `assistant.views`.
"""
import re
from collections import Counter

from django.conf import settings

from catalog.models import Document

from .models import DocumentChunk

CHUNK_SIZE = 800
CHUNK_OVERLAP = 100
_WORD_RE = re.compile(r"[a-zà-ÿ0-9]+", re.IGNORECASE)


def _tokenize(text: str) -> list[str]:
    return _WORD_RE.findall(text.lower())


def extract_text_from_document(document: Document) -> str:
    """Extract raw text from a Document's file (PDF supported; others best-effort)."""
    name = document.file.name.lower()
    if name.endswith(".pdf"):
        from pypdf import PdfReader

        reader = PdfReader(document.file.path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    if name.endswith(".docx"):
        import docx

        doc = docx.Document(document.file.path)
        return "\n".join(p.text for p in doc.paragraphs)
    # pptx or other formats: skip silently, indexing is best-effort.
    return ""


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    text = re.sub(r"\s+", " ", text).strip()
    chunks = []
    start = 0
    while start < len(text):
        end = start + size
        chunks.append(text[start:end])
        start = end - overlap
    return [c for c in chunks if c.strip()]


def index_document(document: Document) -> int:
    """(Re)index one Document: extract -> chunk -> store. Returns chunk count."""
    DocumentChunk.objects.filter(document=document).delete()
    text = extract_text_from_document(document)
    chunks = chunk_text(text)
    DocumentChunk.objects.bulk_create(
        [DocumentChunk(document=document, order=i, content=c) for i, c in enumerate(chunks)]
    )
    return len(chunks)


def index_all_documents() -> dict:
    """Bulk (re)index every Document in the catalog. Call from a management command."""
    results = {}
    for document in Document.objects.all():
        try:
            results[document.id] = index_document(document)
        except Exception as exc:  # noqa: BLE001
            results[document.id] = f"error: {exc}"
    return results


def retrieve_relevant_chunks(query: str, chapter=None, top_k: int | None = None) -> list[DocumentChunk]:
    """
    Keyword-overlap retrieval: scores every candidate chunk by the number of
    query tokens it contains. Scoped to the current chapter's documents when
    provided, otherwise searches the whole catalog.
    """
    top_k = top_k or settings.RAG_TOP_K
    query_tokens = set(_tokenize(query))
    if not query_tokens:
        return []

    qs = DocumentChunk.objects.select_related("document")
    if chapter is not None:
        qs = qs.filter(document__chapter=chapter)

    scored = []
    for chunk in qs.iterator():
        chunk_tokens = Counter(_tokenize(chunk.content))
        score = sum(chunk_tokens[t] for t in query_tokens if t in chunk_tokens)
        if score > 0:
            scored.append((score, chunk))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [chunk for _, chunk in scored[:top_k]]
