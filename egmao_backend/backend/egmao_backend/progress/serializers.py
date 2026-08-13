from rest_framework import serializers

from .models import ChapterProgress, Certificate, Progress


class ChapterProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChapterProgress
        fields = ["id", "user", "chapter", "completed", "completed_at"]
        read_only_fields = ["id", "completed_at"]


class ProgressSerializer(serializers.ModelSerializer):
    training_title = serializers.CharField(source="training.title", read_only=True)

    class Meta:
        model = Progress
        fields = [
            "id", "user", "training", "training_title", "percentage",
            "completed", "status", "last_consulted_at",
        ]
        read_only_fields = ["percentage", "completed", "status", "last_consulted_at"]


class CertificateSerializer(serializers.ModelSerializer):
    training_title = serializers.CharField(source="training.title", read_only=True)
    user_full_name = serializers.CharField(source="user.get_full_name", read_only=True)

    class Meta:
        model = Certificate
        fields = ["id", "number", "obtained_at", "url_pdf", "user", "user_full_name", "training", "training_title"]
        read_only_fields = fields
