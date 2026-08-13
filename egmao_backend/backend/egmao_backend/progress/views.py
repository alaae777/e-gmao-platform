from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import mixins, viewsets
from rest_framework.permissions import AllowAny , IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Category, Chapter, Module, Training
from common.permissions import IsAdministrator
from quizzes.models import Quiz, QuizAttempt

from .models import ChapterProgress, Certificate, Progress
from .serializers import CertificateSerializer, ChapterProgressSerializer, ProgressSerializer

User = get_user_model()


class ProgressViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Employees see only their own progress; administrators see everyone's."""

    serializer_class = ProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Progress.objects.select_related("training", "user").order_by("-last_consulted_at")
        if getattr(self.request.user, "is_administrator", False):
            return qs
        return qs.filter(user=self.request.user)


class CertificateViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Certificate.objects.select_related("training", "user").order_by("-obtained_at")
        if getattr(self.request.user, "is_administrator", False):
            return qs
        return qs.filter(user=self.request.user)


class ChapterCompleteView(APIView):
    """POST /api/progress/chapters/{chapter_id}/complete/ — marks a chapter done for the caller."""

    permission_classes = [IsAuthenticated]

    def post(self, request, chapter_id):
        chapter = Chapter.objects.select_related("module__training").get(pk=chapter_id)
        cp, _ = ChapterProgress.objects.get_or_create(user=request.user, chapter=chapter)
        cp.mark_completed()

        progress, _ = Progress.objects.get_or_create(user=request.user, training=chapter.module.training)
        progress.recompute()

        return Response(
            {
                "chapter": ChapterProgressSerializer(cp).data,
                "training_progress": ProgressSerializer(progress).data,
            }
        )


class ModuleUnlockStateView(APIView):
    """
    GET /api/progress/modules/{module_id}/unlock-state/
    Returns, per chapter, whether it is unlocked for the caller (sequential
    unlock: a chapter opens once the previous one is completed), and
    whether the module's quiz is unlocked (all chapters completed).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, module_id):
        module = Module.objects.prefetch_related("chapters").get(pk=module_id)
        chapters = list(module.chapters.order_by("order"))
        completed_ids = set(
            ChapterProgress.objects.filter(
                user=request.user, chapter__in=chapters, completed=True
            ).values_list("chapter_id", flat=True)
        )

        chapter_states = []
        unlocked_so_far = True
        for chapter in chapters:
            chapter_states.append(
                {
                    "chapter_id": chapter.id,
                    "unlocked": unlocked_so_far,
                    "completed": chapter.id in completed_ids,
                }
            )
            unlocked_so_far = unlocked_so_far and chapter.id in completed_ids

        all_chapters_done = all(c["completed"] for c in chapter_states) if chapter_states else True
        quiz_unlocked = all_chapters_done and hasattr(module, "quiz")

        return Response(
            {
                "module_id": module.id,
                "chapters": chapter_states,
                "quiz_unlocked": quiz_unlocked,
            }
        )


class AdminStatsView(APIView):
    """GET /api/progress/admin/stats/ — dashboard KPIs for the admin area."""

    permission_classes = [IsAdministrator]

    def get(self, request):
        total_users = User.objects.count()
        total_trainings = Training.objects.count()
        total_modules = Module.objects.count()
        total_chapters = Chapter.objects.count()
        total_quizzes = Quiz.objects.count()
        total_certificates = Certificate.objects.count()

        progresses = Progress.objects.all()
        avg_progress = (
            sum(float(p.percentage) for p in progresses) / progresses.count()
            if progresses.exists()
            else 0
        )

        attempts = QuizAttempt.objects.all()
        success_rate = (
            round(attempts.filter(passed=True).count() / attempts.count() * 100, 2)
            if attempts.exists()
            else 0
        )

        return Response(
            {
                "total_users": total_users,
                "total_categories": Category.objects.count(),
                "total_trainings": total_trainings,
                "total_modules": total_modules,
                "total_chapters": total_chapters,
                "total_quizzes": total_quizzes,
                "total_certificates": total_certificates,
                "global_progress_avg": round(avg_progress, 2),
                "quiz_success_rate": success_rate,
                "generated_at": timezone.now(),
            }
        )
class CertificateVerifyView(APIView):
    """
    GET /api/progress/certificates/verify/<number>/ — public, no auth.
    Used by the QR code on the printed certificate: scanning it confirms
    the certificate is genuine and shows who it was issued to.
    """

    permission_classes = [AllowAny]

    def get(self, request, number):
        cert = Certificate.objects.select_related("user", "training").filter(number=number).first()
        if not cert:
            return Response({"valid": False}, status=404)
        return Response(
            {
                "valid": True,
                "number": cert.number,
                "obtained_at": cert.obtained_at,
                "training_title": cert.training.title,
                "holder_name": f"{cert.user.first_name} {cert.user.last_name}".strip() or cert.user.matricule,
                "matricule": cert.user.matricule,
            }
        )
