from django.db.models import Count
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import IsAdminOrReadOnly

from .models import Category, Chapter, Document, Module, Training, Video
from .serializers import (
    CategorySerializer,
    ChapterReorderSerializer,
    ChapterSerializer,
    DocumentSerializer,
    ModuleReorderSerializer,
    ModuleSerializer,
    TrainingDetailSerializer,
    TrainingListSerializer,
    VideoSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.annotate(training_count=Count("trainings"))
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "description"]
    pagination_class = None


class TrainingViewSet(viewsets.ModelViewSet):
    queryset = Training.objects.select_related("category").annotate(
        module_count=Count("modules", distinct=True)
    )
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = ["order", "title", "created_at"]
    filterset_fields = ["category", "level"]
    pagination_class = None

    def get_serializer_class(self):
        if self.action == "retrieve":
            return TrainingDetailSerializer
        return TrainingListSerializer


class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.select_related("training").prefetch_related("chapters")
    serializer_class = ModuleSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ["training"]
    pagination_class = None

    @action(detail=False, methods=["post"], url_path="reorder")
    def reorder(self, request):
        """Body: {"ordered_ids": [...]} — renumbers order 0..n for those modules."""
        serializer = ModuleReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        for index, module_id in enumerate(serializer.validated_data["ordered_ids"]):
            Module.objects.filter(id=module_id).update(order=index)
        return Response({"detail": "Ordre des modules mis à jour."})


class ChapterViewSet(viewsets.ModelViewSet):
    queryset = Chapter.objects.select_related("module").prefetch_related("videos", "documents")
    serializer_class = ChapterSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ["module"]
    pagination_class = None

    @action(detail=False, methods=["post"], url_path="reorder")
    def reorder(self, request):
        serializer = ChapterReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        for index, chapter_id in enumerate(serializer.validated_data["ordered_ids"]):
            Chapter.objects.filter(id=chapter_id).update(order=index)
        return Response({"detail": "Ordre des chapitres mis à jour."})


class VideoViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.select_related("chapter")
    serializer_class = VideoSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ["chapter"]
    pagination_class = None


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.select_related("chapter")
    serializer_class = DocumentSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ["chapter", "doc_type"]
    pagination_class = None