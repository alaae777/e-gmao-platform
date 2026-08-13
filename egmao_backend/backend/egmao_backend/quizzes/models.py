"""
quizzes.models
===============
Evaluation engine: one Quiz per Module, made of Questions and Choices,
plus the historisation of learner attempts (QuizAttempt / UserAnswer).
"""
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from catalog.models import Module


class Quiz(models.Model):
    """
    Evaluation attached to a Module.

    The relation to Module is a strict one-to-one (OneToOneField): each
    module has exactly one quiz, and a quiz belongs to exactly one module
    (validated MCD cardinality 1,1—1,1).
    """

    id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    score_minimal = models.PositiveSmallIntegerField(
        default=50, help_text="Minimum score (%) required to pass the quiz."
    )
    duration_minutes = models.PositiveIntegerField(
        default=0, help_text="0 = untimed."
    )
    module = models.OneToOneField(
        Module, on_delete=models.CASCADE, related_name="quiz"
    )

    class Meta:
        db_table = "quiz"
        verbose_name = "Quiz"
        verbose_name_plural = "Quizzes"

    def __str__(self):
        return self.title

    @property
    def total_questions(self) -> int:
        return self.questions.count()


class Question(models.Model):
    """A question belonging to a quiz."""

    id = models.BigAutoField(primary_key=True)
    content = models.TextField()
    order = models.PositiveIntegerField(default=0)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")

    class Meta:
        db_table = "question"
        verbose_name = "Question"
        verbose_name_plural = "Questions"
        ordering = ["quiz_id", "order"]

    def __str__(self):
        return self.content[:60]


class Choice(models.Model):
    """A possible answer to a question, correct or not."""

    id = models.BigAutoField(primary_key=True)
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="choices")

    class Meta:
        db_table = "choix"
        verbose_name = "Choice"
        verbose_name_plural = "Choices"

    def __str__(self):
        return self.text


class QuizAttempt(models.Model):
    """
    A single attempt of an employee at a quiz.

    Historised so that scoring history and analytics (average score,
    number of retries, etc.) remain available even if the employee
    retries the quiz.
    """

    id = models.BigAutoField(primary_key=True)
    score = models.DecimalField(max_digits=5, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)
    passed = models.BooleanField(default=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quiz_attempts"
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")

    class Meta:
        db_table = "tentative_quiz"
        verbose_name = "Quiz attempt"
        verbose_name_plural = "Quiz attempts"
        ordering = ["-date"]

    def __str__(self):
        return f"{self.user} — {self.quiz} — {self.score}%"


class UserAnswer(models.Model):
    """A single answer given by the employee, within one QuizAttempt."""

    id = models.BigAutoField(primary_key=True)
    is_correct = models.BooleanField()
    answered_at = models.DateTimeField(auto_now_add=True)
    attempt = models.ForeignKey(
        QuizAttempt, on_delete=models.CASCADE, related_name="answers"
    )
    question = models.ForeignKey(Question, on_delete=models.PROTECT, related_name="+")
    choice = models.ForeignKey(Choice, on_delete=models.PROTECT, related_name="+")

    class Meta:
        db_table = "reponse_utilisateur"
        verbose_name = "User answer"
        verbose_name_plural = "User answers"

    def clean(self):
        if self.choice_id and self.question_id and self.choice.question_id != self.question_id:
            raise ValidationError("The selected choice does not belong to the given question.")

    def __str__(self):
        return f"{self.attempt} — Q{self.question_id}"
