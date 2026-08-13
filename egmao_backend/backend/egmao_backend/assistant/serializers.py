from rest_framework import serializers

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "role", "content", "sources", "created_at"]
        read_only_fields = fields


class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ["id", "title", "chapter", "created_at", "updated_at", "messages"]
        read_only_fields = ["id", "created_at", "updated_at", "messages"]


class ChatRequestSerializer(serializers.Serializer):
    """Body: {"conversation_id": 12 (optional), "message": "...", "chapter_id": 4 (optional)}."""

    conversation_id = serializers.IntegerField(required=False, allow_null=True)
    message = serializers.CharField()
    chapter_id = serializers.IntegerField(required=False, allow_null=True)
