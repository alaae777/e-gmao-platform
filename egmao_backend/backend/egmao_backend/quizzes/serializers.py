from django.db import transaction
from rest_framework import serializers

from .models import Choice, Question, Quiz, QuizAttempt, UserAnswer


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ["id", "text", "is_correct", "question"]


class ChoicePublicSerializer(serializers.ModelSerializer):
    """Same as ChoiceSerializer but hides `is_correct` (used for employees taking the quiz)."""

    class Meta:
        model = Choice
        fields = ["id", "text", "question"]


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "content", "order", "quiz", "choices"]


class QuestionPublicSerializer(serializers.ModelSerializer):
    choices = ChoicePublicSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "content", "order", "choices"]


class QuizSerializer(serializers.ModelSerializer):
    """Admin shape: includes correct answers."""

    questions = QuestionSerializer(many=True, read_only=True)
    total_questions = serializers.IntegerField(read_only=True)

    class Meta:
        model = Quiz
        fields = [
            "id", "title", "description", "score_minimal", "duration_minutes",
            "module", "questions", "total_questions",
        ]


class QuizPublicSerializer(serializers.ModelSerializer):
    """Employee-facing shape: no `is_correct` leaked before submission."""

    questions = QuestionPublicSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ["id", "title", "description", "score_minimal", "duration_minutes", "module", "questions"]


class QuizSubmitSerializer(serializers.Serializer):
    """
    Body: {"answers": [{"question": 1, "choice": 3}, ...]}
    Grades server-side (never trust a client-computed score), stores the
    QuizAttempt + UserAnswer rows, and triggers Progress.recompute().
    """

    answers = serializers.ListField(child=serializers.DictField())

    def validate_answers(self, value):
        for item in value:
            if "question" not in item or "choice" not in item:
                raise serializers.ValidationError("Chaque réponse doit contenir 'question' et 'choice'.")
        return value

    @transaction.atomic
    def save(self, **kwargs):
        quiz: Quiz = self.context["quiz"]
        user = self.context["request"].user
        answers = self.validated_data["answers"]

        questions = {q.id: q for q in quiz.questions.prefetch_related("choices")}
        correct_count = 0
        total = len(questions)

        attempt = QuizAttempt.objects.create(user=user, quiz=quiz, score=0, passed=False)

        for item in answers:
            question = questions.get(item["question"])
            if not question:
                continue
            choice = next((c for c in question.choices.all() if c.id == item["choice"]), None)
            if not choice:
                continue
            is_correct = choice.is_correct
            if is_correct:
                correct_count += 1
            UserAnswer.objects.create(
                attempt=attempt, question=question, choice=choice, is_correct=is_correct
            )

        score = round((correct_count / total) * 100, 2) if total else 0
        passed = score >= quiz.score_minimal
        attempt.score = score
        attempt.passed = passed
        attempt.save(update_fields=["score", "passed"])

        # Recompute training-level progress + issue certificate if 100%.
        from progress.models import Progress

        progress, _ = Progress.objects.get_or_create(user=user, training=quiz.module.training)
        progress.recompute()

        return {
            "attempt_id": attempt.id,
            "score": score,
            "passed": passed,
            "score_minimal": quiz.score_minimal,
            "correct_count": correct_count,
            "total_questions": total,
        }


class QuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = ["id", "user", "quiz", "score", "passed", "date"]
        read_only_fields = fields
