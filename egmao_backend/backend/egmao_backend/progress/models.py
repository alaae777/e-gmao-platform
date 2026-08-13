"""
progress.models
================
Per-learner consumption state and certification.

Design note — addition vs. the validated MCD/MLD
--------------------------------------------------
The MCD/MLD track `Progress` only at the Training level (one row per
user/training, with a completion percentage). That is enough to *display*
"you are 63% through this training", but the business rules explicitly
requested also require fine-grained locking:

    - "The next chapter remains locked until the previous chapter has
      been completed."
    - "Employees cannot access the quiz until all chapters of the module
      are completed."

Neither rule can be enforced from a single training-level percentage
alone. This app therefore introduces one additional table,
`ChapterProgress`, purely as an implementation detail to support the
locking rules and to let `Progress.percentage` be computed automatically
rather than stored by hand. It does not change the validated MCD/MLD
entities (Progress still exposes exactly the fields agreed on); it is an
implementation-level addition, not a redesign.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone

from catalog.models import Chapter, Training


class ChapterProgress(models.Model):
    """
    Tracks whether a given employee has completed a given chapter.

    Used to enforce sequential chapter unlocking and quiz unlocking
    (see catalog.Chapter.previous_chapter and Module.quiz).
    """

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chapter_progresses"
    )
    chapter = models.ForeignKey(
        Chapter, on_delete=models.CASCADE, related_name="user_progresses"
    )
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "progression_chapitre"
        verbose_name = "Chapter progress"
        verbose_name_plural = "Chapter progresses"
        constraints = [
            models.UniqueConstraint(fields=["user", "chapter"], name="uniq_user_chapter_progress")
        ]

    def __str__(self):
        state = "done" if self.completed else "in progress"
        return f"{self.user} — {self.chapter} ({state})"

    def mark_completed(self):
        self.completed = True
        self.completed_at = timezone.now()
        self.save(update_fields=["completed", "completed_at"])


class Progress(models.Model):
    """
    Overall completion state of one employee on one training
    (validated MCD/MLD entity — one row per couple user/training).
    """

    class Status(models.TextChoices):
        IN_PROGRESS = "IN_PROGRESS", "In progress"
        COMPLETED = "COMPLETED", "Completed"

    id = models.BigAutoField(primary_key=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    completed = models.BooleanField(default=False)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.IN_PROGRESS
    )
    last_consulted_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="progresses"
    )
    training = models.ForeignKey(
        Training, on_delete=models.CASCADE, related_name="progresses"
    )

    class Meta:
        db_table = "progression"
        verbose_name = "Progress"
        verbose_name_plural = "Progress records"
        constraints = [
            models.UniqueConstraint(fields=["user", "training"], name="uniq_user_training_progress")
        ]

    def __str__(self):
        return f"{self.user} — {self.training} — {self.percentage}%"

    def recompute(self):
        """
        Recalculate `percentage` from chapter completions + passed module
        quizzes, update `completed` / `status`, and issue a certificate
        the moment the training reaches 100%.

        Kept intentionally simple here (equal weight per module); wire
        this up to a signal (post_save on ChapterProgress / QuizAttempt)
        in the services layer of the next phase.
        """
        from catalog.models import Module
        from quizzes.models import QuizAttempt

        modules = list(Module.objects.filter(training=self.training))
        if not modules:
            self.percentage = 0
        else:
            done = 0
            for module in modules:
                chapters = list(module.chapters.all())
                chapters_ok = all(
                    ChapterProgress.objects.filter(
                        user=self.user, chapter=ch, completed=True
                    ).exists()
                    for ch in chapters
                ) if chapters else True
                quiz_ok = True
                if hasattr(module, "quiz"):
                    quiz_ok = QuizAttempt.objects.filter(
                        user=self.user, quiz=module.quiz, passed=True
                    ).exists()
                if chapters_ok and quiz_ok:
                    done += 1
            self.percentage = round(done / len(modules) * 100, 2)

        self.completed = self.percentage >= 100
        self.status = self.Status.COMPLETED if self.completed else self.Status.IN_PROGRESS
        self.save()

        if self.completed:
            Certificate.objects.get_or_create(
                user=self.user,
                training=self.training,
                defaults={"number": Certificate.generate_number(self.user, self.training)},
            )


class Certificate(models.Model):
    """
    Certificate delivered to an employee who has fully validated a
    training. One certificate per couple (user, training).
    """

    id = models.BigAutoField(primary_key=True)
    number = models.CharField(max_length=50, unique=True)
    obtained_at = models.DateTimeField(auto_now_add=True)
    url_pdf = models.FileField(
        upload_to="certificates/%Y/%m/", blank=True, null=True,
        help_text="Generated PDF certificate file.",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="certificates"
    )
    training = models.ForeignKey(
        Training, on_delete=models.CASCADE, related_name="certificates"
    )

    class Meta:
        db_table = "certificat"
        verbose_name = "Certificate"
        verbose_name_plural = "Certificates"
        constraints = [
            models.UniqueConstraint(fields=["user", "training"], name="uniq_user_training_certificate")
        ]

    def __str__(self):
        return f"{self.number} — {self.user} — {self.training}"

    @staticmethod
    def generate_number(user, training) -> str:
        stamp = timezone.now().strftime("%Y%m%d%H%M%S")
        return f"CERT-{training.id}-{user.id.hex[:8]}-{stamp}"
