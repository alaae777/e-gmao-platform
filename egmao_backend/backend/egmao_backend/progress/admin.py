from django.contrib import admin

from .models import ChapterProgress, Certificate, Progress


@admin.register(ChapterProgress)
class ChapterProgressAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "chapter", "completed", "completed_at")
    list_filter = ("completed",)
    search_fields = ("user__matricule",)


@admin.register(Progress)
class ProgressAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "training", "percentage", "status", "last_consulted_at")
    list_filter = ("status", "training")
    search_fields = ("user__matricule",)
    readonly_fields = ("percentage", "completed", "status", "last_consulted_at")


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ("id", "number", "user", "training", "obtained_at")
    search_fields = ("number", "user__matricule")
