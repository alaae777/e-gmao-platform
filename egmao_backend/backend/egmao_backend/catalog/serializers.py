from rest_framework import serializers

from common.validators import validate_document_file, validate_image_file, validate_video_file

from .models import Category, Chapter, Document, Module, Training, Video


class CategorySerializer(serializers.ModelSerializer):
    training_count = serializers.IntegerField(source="trainings.count", read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "description", "training_count"]


class VideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = ["id", "title", "file", "duration_seconds", "chapter"]

    def validate_file(self, value):
        validate_video_file(value)
        return value


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ["id", "title", "file", "doc_type", "chapter"]

    def validate_file(self, value):
        validate_document_file(value)
        return value


class ChapterSerializer(serializers.ModelSerializer):
    videos = VideoSerializer(many=True, read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Chapter
        fields = ["id", "title", "description", "order", "module", "videos", "documents"]


class ChapterReorderSerializer(serializers.Serializer):
    """Body: {"ordered_ids": [3, 1, 2]} — re-numbers `order` 0..n within the module."""

    ordered_ids = serializers.ListField(child=serializers.IntegerField())


class ModuleSerializer(serializers.ModelSerializer):
    chapters = ChapterSerializer(many=True, read_only=True)
    has_quiz = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = ["id", "title", "description", "order", "training", "chapters", "has_quiz"]

    def get_has_quiz(self, obj):
        return hasattr(obj, "quiz")


class ModuleReorderSerializer(serializers.Serializer):
    ordered_ids = serializers.ListField(child=serializers.IntegerField())


class TrainingListSerializer(serializers.ModelSerializer):
    """Lightweight shape for catalog listing pages."""

    category_name = serializers.CharField(source="category.name", read_only=True)
    module_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Training
        fields = [
            "id", "title", "description", "image", "level", "category", "category_name",
            "duration_estimated_minutes", "order", "module_count", "created_at",
        ]

    def validate_image(self, value):
        if value:
            validate_image_file(value)
        return value


class TrainingDetailSerializer(TrainingListSerializer):
    modules = ModuleSerializer(many=True, read_only=True)

    class Meta(TrainingListSerializer.Meta):
        fields = TrainingListSerializer.Meta.fields + ["modules"]
