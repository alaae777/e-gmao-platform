"""
catalog.models
==============
Training content structure: Category > Training > Module > Chapter,
with Video and Document as the two supported content types of a chapter.

This app only models *content* (what exists). Per-user consumption state
(what a given employee has completed, and locking rules derived from it)
lives in the `progress` app, to keep content authoring decoupled from
individual learner state.
"""
from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.db import models


class Category(models.Model):
    """Thematic grouping of trainings (e.g. GMAO, Maintenance, Sécurité)."""

    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "categorie"
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Training(models.Model):
    """A full training path (Formation), made of ordered modules."""

    class Level(models.TextChoices):
        BEGINNER = "BEGINNER", "Beginner"
        INTERMEDIATE = "INTERMEDIATE", "Intermediate"
        ADVANCED = "ADVANCED", "Advanced"

    id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="trainings/covers/%Y/%m/", blank=True, null=True)
    level = models.CharField(max_length=20, choices=Level.choices, default=Level.BEGINNER)
    duration_estimated_minutes = models.PositiveIntegerField(
        default=0, help_text="Estimated total duration, in minutes."
    )
    order = models.PositiveIntegerField(default=0, help_text="Display order in the catalog.")
    created_at = models.DateTimeField(auto_now_add=True)
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="trainings"
    )

    class Meta:
        db_table = "formation"
        verbose_name = "Training"
        verbose_name_plural = "Trainings"
        ordering = ["order", "title"]

    def __str__(self):
        return self.title

  


class Module(models.Model):
    """A subdivision of a Training. Owns exactly one Quiz (see quizzes app)."""

    id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    training = models.ForeignKey(
        Training, on_delete=models.CASCADE, related_name="modules"
    )

    class Meta:
        db_table = "module"
        verbose_name = "Module"
        verbose_name_plural = "Modules"
        ordering = ["training_id", "order"]
        constraints = [
            models.UniqueConstraint(
                fields=["training", "order"], name="uniq_module_order_per_training"
            )
        ]

    def __str__(self):
        return f"{self.training.title} — {self.title}"


class Chapter(models.Model):
    """A unit of content within a Module: one or more videos and/or documents."""

    id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    module = models.ForeignKey(
        Module, on_delete=models.CASCADE, related_name="chapters"
    )

    class Meta:
        db_table = "chapitre"
        verbose_name = "Chapter"
        verbose_name_plural = "Chapters"
        ordering = ["module_id", "order"]
        constraints = [
            models.UniqueConstraint(
                fields=["module", "order"], name="uniq_chapter_order_per_module"
            )
        ]

    def __str__(self):
        return f"{self.module} — {self.title}"

    def previous_chapter(self):
        """Chapter that must be completed before this one unlocks."""
        return (
            Chapter.objects.filter(module=self.module, order__lt=self.order)
            .order_by("-order")
            .first()
        )


class Video(models.Model):
    """A video attached to a chapter (uploaded file)."""

    id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=150)
    file = models.FileField(
        upload_to="chapters/videos/%Y/%m/",
        validators=[FileExtensionValidator(["mp4", "webm", "mov", "m4v"])],
    )
    duration_seconds = models.PositiveIntegerField(default=0)
    chapter = models.ForeignKey(
        Chapter, on_delete=models.CASCADE, related_name="videos"
    )

    class Meta:
        db_table = "video"
        verbose_name = "Video"
        verbose_name_plural = "Videos"

    def __str__(self):
        return self.title


class Document(models.Model):
    """A PDF / support document attached to a chapter (uploaded file)."""

    class DocType(models.TextChoices):
        PDF = "PDF", "PDF"
        GUIDE = "GUIDE", "Guide"
        SUPPORT = "SUPPORT", "Support"

    id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=150)
    file = models.FileField(
        upload_to="chapters/documents/%Y/%m/",
        validators=[FileExtensionValidator(["pdf", "doc", "docx", "ppt", "pptx"])],
    )
    doc_type = models.CharField(max_length=20, choices=DocType.choices, default=DocType.PDF)
    chapter = models.ForeignKey(
        Chapter, on_delete=models.CASCADE, related_name="documents"
    )

    class Meta:
        db_table = "document"
        verbose_name = "Document"
        verbose_name_plural = "Documents"

    def __str__(self):
        return self.title
