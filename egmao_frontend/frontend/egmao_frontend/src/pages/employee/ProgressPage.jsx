import { useEffect, useState } from "react";
import { Typography, Card, Progress as AntProgress, Skeleton, Empty, Tag, Row, Col, Button } from "antd";
import { ClockCircleOutlined, RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme";
import { calculateTrainingDuration, formatDuration } from "../../utils/duration";

export default function ProgressPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState([]);
  const [trainings, setTrainings] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [p, t] = await Promise.all([api.progress.list(user.id), api.catalog.listTrainings()]);
        setProgress(p);
        setTrainings(t);
      } catch (e) {
        console.error("Progress fetch error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id]);

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <Tag color="orange" style={{ borderRadius: 6, fontWeight: 600, marginBottom: 6 }}>
          Suivi d'Apprentissage
        </Tag>
        <Typography.Title level={2} style={{ marginTop: 0, marginBottom: 4, color: colors.ink }}>
          Ma progression
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ margin: 0, fontSize: 15 }}>
          Consultez l'avancement de vos formations en cours et terminées.
        </Typography.Paragraph>
      </div>

      {progress.length === 0 ? (
        <Card className="enterprise-card" style={{ textAlign: "center", padding: 40 }}>
          <Empty description="Vous n'avez commencé aucune formation pour le moment." />
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          {progress.map((p) => {
            const training = trainings.find((t) => t.id === p.training_id);
            if (!training) return null;
            const duration = calculateTrainingDuration(training);

            return (
              <Col xs={24} md={12} key={p.id}>
                <Card
                  className="enterprise-card"
                  hoverable
                  onClick={() => navigate(`/app/formations/${training.id}`)}
                  style={{ cursor: "pointer" }}
                  bodyStyle={{ padding: 24 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <Typography.Text strong style={{ fontSize: 17, color: colors.ink }}>
                        {training.title}
                      </Typography.Text>
                      <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                        <Tag color={p.completed || Number(p.percentage) >= 100 ? "success" : "processing"} style={{ borderRadius: 6 }}>
                          {p.completed || Number(p.percentage) >= 100 ? "Terminée" : "En cours"}
                        </Tag>
                        <span style={{ fontSize: 12, color: colors.inkSoft }}>
                          <ClockCircleOutlined /> {formatDuration(duration)}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: colors.primary }}>
                      {p.percentage}%
                    </div>
                  </div>
                  <AntProgress
                    percent={Number(p.percentage)}
                    strokeColor={colors.primary}
                    strokeWidth={8}
                    showInfo={false}
                    style={{ marginTop: 16 }}
                  />
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}
