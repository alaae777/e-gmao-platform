import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Typography, Collapse, Tag, Skeleton, Progress as AntProgress, List,
  Button, Space, Empty, Card, Breadcrumb,
} from "antd";
import {
  PlayCircleOutlined, LockOutlined, CheckCircleFilled,
  QuestionCircleOutlined, RightOutlined, ClockCircleOutlined,
  SafetyCertificateOutlined, TrophyOutlined, ArrowLeftOutlined,
} from "@ant-design/icons";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme";
import { calculateTrainingDuration, formatDuration } from "../../utils/duration";
import FinalCertificateModal from "../../components/FinalCertificateModal";

export default function TrainingDetail() {
  const { trainingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(null);
  const [unlockByModule, setUnlockByModule] = useState({});
  const [progress, setProgress] = useState(null);
  
  // Certificate Modal State
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certificateData, setCertificateData] = useState(null);

  const load = useCallback(async () => {
    try {
      const t = await api.catalog.getTraining(trainingId);
      setTraining(t);
      const states = {};
      for (const m of t.modules) {
        states[m.id] = await api.learning.getModuleUnlockState(user.id, m.id);
      }
      setUnlockByModule(states);

      const [pList, certs] = await Promise.all([
        api.progress.list(user.id),
        api.progress.listCertificates(user.id),
      ]);
      const p = pList.find((row) => row.training_id === Number(trainingId)) || null;
      setProgress(p);

      const c = certs.find((row) => row.training_id === Number(trainingId)) || null;
      setCertificateData(c);
    } catch (e) {
      console.error("Training load error:", e);
    } finally {
      setLoading(false);
    }
  }, [trainingId, user.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;
  if (!training) return <Empty description="Formation introuvable." />;

  const isFullyCompleted = progress && (progress.completed || Number(progress.percentage) >= 100);
  const totalDurationMinutes = calculateTrainingDuration(training);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* Breadcrumb & Navigation */}
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <a onClick={() => navigate("/app")}>Tableau de bord</a> },
          { title: <a onClick={() => navigate("/app/catalogue")}>Catalogue</a> },
          { title: training.title },
        ]}
      />

      {/* Header Card */}
      <Card className="enterprise-card" style={{ marginBottom: 24 }} bodyStyle={{ padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <Tag color="orange" style={{ borderRadius: 6, fontWeight: 600, marginBottom: 8 }}>
              Parcours GMAO ONCF
            </Tag>
            <Typography.Title level={2} style={{ marginTop: 0, marginBottom: 8, color: colors.ink }}>
              {training.title}
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ fontSize: 15, maxWidth: 720 }}>
              {training.description}
            </Typography.Paragraph>

            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
              <Tag icon={<ClockCircleOutlined />} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 13 }}>
                Durée estimée : <strong>{formatDuration(totalDurationMinutes)}</strong>
              </Tag>
              <Tag style={{ padding: "4px 10px", borderRadius: 6, fontSize: 13 }}>
                {training.modules.length} modules de formation
              </Tag>
            </div>
          </div>

          {progress && (
            <div style={{ textAlign: "center", background: colors.canvas, padding: "16px 24px", borderRadius: 12, border: `1px solid ${colors.border}` }}>
              <AntProgress
                type="circle"
                percent={Number(progress.percentage)}
                size={80}
                strokeColor={colors.primary}
                strokeWidth={8}
              />
              <div style={{ marginTop: 8, fontWeight: 600, fontSize: 13, color: colors.ink }}>
                {isFullyCompleted ? "Formation Validée 🎉" : "Progression"}
              </div>
            </div>
          )}
        </div>

        {/* Final Certificate Banner when 100% Completed */}
        {isFullyCompleted && (
          <div
            style={{
              marginTop: 24,
              padding: "16px 20px",
              borderRadius: 12,
              background: `linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%)`,
              border: `1px solid ${colors.primaryHover}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <SafetyCertificateOutlined style={{ fontSize: 32, color: colors.primary }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: colors.ink }}>
                  Certificat Final de Formation Disponible !
                </div>
                <div style={{ fontSize: 13, color: colors.inkSoft }}>
                  Félicitations, vous avez validé 100% des modules de cette formation.
                </div>
              </div>
            </div>
            <Button
              type="primary"
              icon={<TrophyOutlined />}
              onClick={() => setCertModalOpen(true)}
              style={{ background: colors.primary, borderRadius: 8 }}
            >
              Télécharger le Certificat Final
            </Button>
          </div>
        )}
      </Card>

      {/* Modules Collapse List */}
      <Typography.Title level={4} style={{ marginBottom: 16, color: colors.ink }}>
        Programme & Modules
      </Typography.Title>

      <Collapse
        defaultActiveKey={[training.modules[0]?.id]}
        style={{ background: "transparent", border: 0 }}
        items={training.modules.map((module, index) => {
          const state = unlockByModule[module.id];
          const allDone = state?.chapters.every((c) => c.completed);

          return {
            key: module.id,
            label: (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 12 }}>
                <Space>
                  <span style={{ fontWeight: 700, color: colors.primary, fontSize: 14 }}>
                    Module {index + 1}
                  </span>
                  <Typography.Text strong style={{ fontSize: 15, color: colors.ink }}>
                    {module.title}
                  </Typography.Text>
                </Space>
                {allDone && state?.quiz && (
                  <Tag color="success" icon={<CheckCircleFilled />} style={{ borderRadius: 6 }}>
                    Module validé
                  </Tag>
                )}
              </div>
            ),
            children: (
              <Card className="enterprise-card" bodyStyle={{ padding: 16 }} style={{ background: colors.surface }}>
                <List
                  itemLayout="horizontal"
                  dataSource={state?.chapters || []}
                  renderItem={(chapter) => (
                    <List.Item
                      style={{
                        padding: "12px 16px",
                        borderRadius: 8,
                        marginBottom: 6,
                        cursor: chapter.unlocked ? "pointer" : "not-allowed",
                        opacity: chapter.unlocked ? 1 : 0.55,
                        background: chapter.unlocked ? colors.surfaceRaised : "transparent",
                        border: `1px solid ${colors.border}`,
                        transition: "all 0.2s ease",
                      }}
                      onClick={() =>
                        chapter.unlocked &&
                        navigate(`/app/formations/${trainingId}/chapitres/${chapter.id}`)
                      }
                      actions={[chapter.unlocked ? <RightOutlined key="go" style={{ color: colors.primary }} /> : <LockOutlined key="lock" />]}
                    >
                      <List.Item.Meta
                        avatar={
                          chapter.completed ? (
                            <CheckCircleFilled style={{ color: colors.success, fontSize: 20 }} />
                          ) : (
                            <PlayCircleOutlined style={{ fontSize: 20, color: colors.inkSoft }} />
                          )
                        }
                        title={<span style={{ fontWeight: 600, color: colors.ink }}>{chapter.title}</span>}
                      />
                    </List.Item>
                  )}
                />

                {state?.quiz && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 16,
                      borderRadius: 10,
                      background: colors.canvas,
                      border: `1px solid ${colors.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <Space size="middle">
                      <QuestionCircleOutlined style={{ color: colors.primary, fontSize: 20 }} />
                      <div>
                        <Typography.Text strong style={{ display: "block", color: colors.ink }}>
                          Evaluation : {state.quiz.title}
                        </Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {state.quiz.question_count} questions • Score requis : {state.quiz.score_minimal}%
                        </Typography.Text>
                      </div>
                    </Space>
                    <Button
                      type="primary"
                      disabled={!state.quiz.unlocked}
                      icon={!state.quiz.unlocked ? <LockOutlined /> : null}
                      onClick={() => navigate(`/app/quiz/${state.quiz.id}?training=${trainingId}`)}
                      style={{ borderRadius: 8 }}
                    >
                      {state.quiz.unlocked ? "Passer le quiz de module" : "Terminez les chapitres d'abord"}
                    </Button>
                  </div>
                )}
              </Card>
            ),
          };
        })}
      />

      {/* Render Final Certificate Modal */}
      <FinalCertificateModal
        open={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        user={user}
        training={training}
        certData={certificateData}
      />
    </div>
  );
}
