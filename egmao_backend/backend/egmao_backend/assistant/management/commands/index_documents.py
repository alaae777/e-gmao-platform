"""
Management command: (re)index all training Documents for the AI assistant's
RAG retrieval.

Usage:
    python manage.py index_documents
"""
from django.core.management.base import BaseCommand

from assistant.rag import index_all_documents


class Command(BaseCommand):
    help = "Extrait et découpe le texte des documents de formation pour l'assistant IA (RAG)."

    def handle(self, *args, **options):
        results = index_all_documents()
        for doc_id, outcome in results.items():
            self.stdout.write(f"Document #{doc_id}: {outcome}")
        self.stdout.write(self.style.SUCCESS(f"{len(results)} document(s) traité(s)."))
