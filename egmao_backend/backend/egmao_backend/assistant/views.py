from django.shortcuts import get_object_or_404
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Chapter

from .llm import LLMError, get_llm_client
from .models import Conversation, Message
from .rag import retrieve_relevant_chunks
from .serializers import ChatRequestSerializer, ConversationSerializer

SYSTEM_PROMPT = """Tu es l'Assistant IA e-GMAO, intégré à une plateforme e-learning
interne dédiée à la formation sur la GMAO (Gestion de Maintenance Assistée
par Ordinateur) et notamment sur l'outil CARL Source.

Ton rôle :
- répondre aux questions sur la GMAO et sur CARL Source ;
- guider l'utilisateur dans une formation, expliquer un chapitre ;
- aider à comprendre une question de quiz sans donner directement la
  réponse si cela ressemble à de la triche pendant une évaluation notée ;
- répondre aux questions sur les documents PDF et vidéos de formation ;
- aider les nouveaux employés à utiliser la plateforme (navigation,
  catalogue, progression, certificats).

Règle stricte : tu ne réponds qu'aux questions liées à la GMAO, aux
formations proposées sur la plateforme, ou à l'utilisation de la
plateforme elle-même. Pour toute autre question, indique poliment que
cela sort de ton domaine et réoriente vers la formation en cours.

Utilise le contexte ci-dessous (extrait des supports de formation) quand
il est pertinent, et indique-le naturellement dans ta réponse."""


class ConversationViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user).prefetch_related("messages")


class ChatView(APIView):
    """POST /api/assistant/chat/ — send a message, get the assistant's reply."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if data.get("conversation_id"):
            conversation = get_object_or_404(
                Conversation, pk=data["conversation_id"], user=request.user
            )
        else:
            chapter = None
            if data.get("chapter_id"):
                chapter = Chapter.objects.filter(pk=data["chapter_id"]).first()
            conversation = Conversation.objects.create(
                user=request.user,
                chapter=chapter,
                title=data["message"][:60],
            )

        Message.objects.create(conversation=conversation, role=Message.Role.USER, content=data["message"])

        chunks = retrieve_relevant_chunks(data["message"], chapter=conversation.chapter)
        context_text = "\n\n---\n\n".join(c.content for c in chunks)
        system_prompt = SYSTEM_PROMPT
        if context_text:
            system_prompt += f"\n\nContexte des supports de formation :\n{context_text}"

        history = [
    {"role": "user" if m.role == Message.Role.USER else "assistant", "content": m.content}
    for m in conversation.messages.order_by("-created_at")[:8]
][::-1]

        try:
            reply = get_llm_client().complete(system_prompt, history)
        except LLMError as exc:
            reply = (
                "Je ne parviens pas à contacter le moteur IA pour le moment "
                f"({exc}). Vérifie la configuration LLM_PROVIDER côté serveur."
            )

        assistant_message = Message.objects.create(
            conversation=conversation,
            role=Message.Role.ASSISTANT,
            content=reply,
            sources=[c.id for c in chunks],
        )

        return Response(
            {
                "conversation_id": conversation.id,
                "reply": assistant_message.content,
                "sources": [
                    {"chunk_id": c.id, "document": c.document.title, "document_id": c.document_id}
                    for c in chunks
                ],
            }
        )
