from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.permissions import IsAdminOrReadOnly

from .models import Choice, Question, Quiz, QuizAttempt
from .serializers import (
    ChoiceSerializer,
    QuestionSerializer,
    QuizAttemptSerializer,
    QuizPublicSerializer,
    QuizSerializer,
    QuizSubmitSerializer,
)


class QuizViewSet(viewsets.ModelViewSet):
  
    queryset = Quiz.objects.select_related("module").prefetch_related("questions__choices")
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ["module"]
    pagination_class = None

    def get_serializer_class(self):
        # Employees never see `is_correct` ahead of time, on list or retrieve.
        if self.action in ("list", "retrieve") and not getattr(
            self.request.user, "is_administrator", False
        ):
            return QuizPublicSerializer
        return QuizSerializer

    @action(detail=True, methods=["post"], url_path="submit", permission_classes=[IsAuthenticated])
    def submit(self, request, pk=None):
        quiz = self.get_object()
        serializer = QuizSubmitSerializer(
            data=request.data, context={"quiz": quiz, "request": request}
        )
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        return Response(result)

    @action(detail=True, methods=["get"], url_path="attempts", permission_classes=[IsAuthenticated])
    def attempts(self, request, pk=None):
        quiz = self.get_object()
        qs = QuizAttempt.objects.filter(quiz=quiz)
        if not getattr(request.user, "is_administrator", False):
            qs = qs.filter(user=request.user)
        return Response(QuizAttemptSerializer(qs, many=True).data)


class QuestionViewSet(viewsets.ModelViewSet):
  
    queryset = Question.objects.prefetch_related("choices")
    serializer_class = QuestionSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ["quiz"]
    pagination_class = None


class ChoiceViewSet(viewsets.ModelViewSet):
 
    queryset = Choice.objects.all()
    serializer_class = ChoiceSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ["question"]
    pagination_class = None