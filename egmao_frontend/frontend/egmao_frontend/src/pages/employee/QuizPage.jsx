import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  Typography, Card, Radio, Button, Space, Skeleton, Progress as AntProgress,
  Result, Tag, message,
} from "antd";
import { CheckCircleFilled, CloseCircleFilled, TrophyOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme";

export default function QuizPage() {
  const { quizId } = useParams();
  const [params] = useSearchParams();
  const trainingId = params.get("training");
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [certIssued, setCertIssued] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const q = await api.learning.getQuiz(quizId);
        setQuiz(q);
      } catch (e) {
        console.error("Quiz fetch error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [quizId]);

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;
  if (!quiz) return <Result status="404" title="Quiz introuvable" />;

  const question = quiz.questions[step];
  const answered = Object.keys(answers).length;

  const selectAnswer = (choiceId) => {
    setAnswers((prev) => ({ ...prev, [question.id]: choiceId }));
  };

  const goNext = () => {
    if (step < quiz.questions.length - 1) setStep(step + 1);
  };
  const goPrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const attempt = await api.learning.submitQuiz(user.id, quiz.id, answers);
      setResult(attempt);
      if (trainingId) {
        const certs = await api.progress.listCertificates(user.id);
        setCertIssued(certs.some((c) => c.training_id === Number(trainingId)));
      }
    } catch {
      message.error("Une erreur est survenue pendant la soumission du quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div style={{ maxWidth: 640, margin: "20px auto" }}>
        <Card className="enterprise-card" bodyStyle={{ padding: 32 }}>
          <Result
            status={result.passed ? "success" : "warning"}
            icon={
              result.passed ? (
                <CheckCircleFilled style={{ color: colors.success, fontSize: 64 }} />
              ) : (
                <CloseCircleFilled style={{ color: colors.warning, fontSize: 64 }} />
              )
            }
            title={result.passed ? "Quiz réussi avec succès !" : "Quiz non validé"}
            subTitle={`Score obtenu : ${result.score}% (Score minimal requis : ${quiz.score_minimal}%)`}
            extra={[
              certIssued && (
                <Tag key="cert" color="gold" icon={<TrophyOutlined />} style={{ padding: "8px 16px", fontSize: 14, borderRadius: 8 }}>
                  Certificat débloqué 🎉
                </Tag>
              ),
              <div key="actions" style={{ marginTop: 24 }}>
                {!result.passed && (
                  <Button
                    type="primary"
                    onClick={() => {
                      setResult(null);
                      setAnswers({});
                      setStep(0);
                    }}
                    style={{ marginRight: 12, borderRadius: 8, height: 40 }}
                  >
                    Réessayer le quiz
                  </Button>
                )}
                <Button
                  onClick={() =>
                    navigate(trainingId ? `/app/formations/${trainingId}` : "/app")
                  }
                  style={{ borderRadius: 8, height: 40 }}
                >
                  Retour à la formation
                </Button>
              </div>,
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {trainingId && (
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/app/formations/${trainingId}`)}
          style={{ marginBottom: 16, paddingLeft: 0 }}
        >
          Retour à la formation
        </Button>
      )}

      <Card className="enterprise-card" bodyStyle={{ padding: 28 }}>
        <Tag color="orange" style={{ borderRadius: 6, fontWeight: 600, marginBottom: 8 }}>
          Évaluation de connaissances
        </Tag>
        <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 8, color: colors.ink }}>
          {quiz.title}
        </Typography.Title>

        <Space style={{ marginBottom: 20 }} size="middle">
          <Tag style={{ borderRadius: 6 }}>{quiz.questions.length} questions</Tag>
          <Tag style={{ borderRadius: 6 }}>Score min : {quiz.score_minimal}%</Tag>
          {quiz.duration_minutes > 0 && <Tag style={{ borderRadius: 6 }}>Durée : {quiz.duration_minutes} min</Tag>}
        </Space>

        <AntProgress
          percent={Math.round(((step + 1) / quiz.questions.length) * 100)}
          showInfo={false}
          strokeColor={colors.primary}
          style={{ marginBottom: 24 }}
        />

        <div style={{ background: colors.canvas, padding: 20, borderRadius: 12, border: `1px solid ${colors.border}`, marginBottom: 24 }}>
          <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 16, color: colors.ink }}>
            Question {step + 1} / {quiz.questions.length}
          </Typography.Title>
          <Typography.Text strong style={{ fontSize: 16, color: colors.ink, display: "block", marginBottom: 16 }}>
            {question.content}
          </Typography.Text>

          <Radio.Group
            value={answers[question.id]}
            onChange={(e) => selectAnswer(e.target.value)}
            style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}
          >
            {question.choices.map((choice) => {
              const isSelected = answers[question.id] === choice.id;
              return (
                <Radio
                  key={choice.id}
                  value={choice.id}
                  style={{
                    padding: "12px 16px",
                    border: `1px solid ${isSelected ? colors.primary : colors.border}`,
                    borderRadius: 10,
                    background: isSelected ? colors.primaryActiveBg : colors.surface,
                    transition: "all 0.2s ease",
                  }}
                >
                  <span style={{ fontWeight: isSelected ? 600 : 400, color: colors.ink }}>{choice.text}</span>
                </Radio>
              );
            })}
          </Radio.Group>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Button onClick={goPrev} disabled={step === 0} style={{ borderRadius: 8 }}>
            Précédent
          </Button>
          {step < quiz.questions.length - 1 ? (
            <Button type="primary" onClick={goNext} disabled={!answers[question.id]} style={{ borderRadius: 8, height: 40 }}>
              Suivant
            </Button>
          ) : (
            <Button
              type="primary"
              loading={submitting}
              disabled={answered < quiz.questions.length}
              onClick={submit}
              style={{ borderRadius: 8, height: 40, background: colors.primary }}
            >
              Valider le quiz
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
