"""
assistant.models
=================
Chat history + a minimal RAG index over the platform's PDF/text documents.

The index is deliberately storage-agnostic about *how* similarity is
computed (see `assistant.rag`): `DocumentChunk.embedding` is a JSON list of
floats, populated only if an embedding-capable provider is configured.
When it's empty, retrieval falls back to keyword scoring — so the feature
works out of the box with zero external API calls, and gets better the
moment an embedding model is wired in.
"""
from django.conf import settings
from django.db import models

from catalog.models import Chapter, Document


class Conversation(models.Model):
    """One chat thread between a user and the e-GMAO AI Assistant."""

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="assistant_conversations"
    )
    title = models.CharField(max_length=150, blank=True)
    # Optional context: the chapter the user was viewing when they opened the chat,
    # used to bias retrieval towards the relevant training material.
    chapter = models.ForeignKey(
        Chapter, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "assistant_conversation"
        ordering = ["-updated_at"]

    def __str__(self):
        return self.title or f"Conversation #{self.id}"


class Message(models.Model):
    class Role(models.TextChoices):
        USER = "USER", "User"
        ASSISTANT = "ASSISTANT", "Assistant"
        SYSTEM = "SYSTEM", "System"

    id = models.BigAutoField(primary_key=True)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=10, choices=Role.choices)
    content = models.TextField()
    # Chunk ids used as context for this answer, for traceability/debugging.
    sources = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "assistant_message"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.role}: {self.content[:50]}"


class DocumentChunk(models.Model):
    """A chunk of extracted text from a training Document, used for RAG retrieval."""

    id = models.BigAutoField(primary_key=True)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="chunks")
    order = models.PositiveIntegerField(default=0)
    content = models.TextField()
    embedding = models.JSONField(null=True, blank=True, help_text="Vector embedding, if computed.")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "assistant_document_chunk"
        ordering = ["document_id", "order"]

    def __str__(self):
        return f"{self.document.title} chunk #{self.order}"
