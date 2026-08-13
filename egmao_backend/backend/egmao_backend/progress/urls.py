from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminStatsView,
    CertificateViewSet,
    ChapterCompleteView,
    ModuleUnlockStateView,
    ProgressViewSet,
    CertificateVerifyView,
)

router = DefaultRouter()
router.register("progress", ProgressViewSet, basename="progress")
router.register("certificates", CertificateViewSet, basename="certificate")

urlpatterns = [
    path("certificates/verify/<str:number>/", CertificateVerifyView.as_view(), name="certificate_verify"),
    path("chapters/<int:chapter_id>/complete/", ChapterCompleteView.as_view(), name="chapter_complete"),
    path("modules/<int:module_id>/unlock-state/", ModuleUnlockStateView.as_view(), name="module_unlock_state"),
    path("admin/stats/", AdminStatsView.as_view(), name="admin_stats"),
] + router.urls
