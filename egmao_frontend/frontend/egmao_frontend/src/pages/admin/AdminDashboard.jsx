import { useEffect, useState } from "react";
import { Row, Col, Card, Statistic, Typography, Skeleton, Tag } from "antd";
import {
  TeamOutlined, ReadOutlined, AppstoreOutlined, SafetyCertificateOutlined,
  BarChartOutlined, FileDoneOutlined, CheckCircleFilled,
} from "@ant-design/icons";
import { api } from "../../api/client";
import { colors } from "../../theme";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await api.admin.stats();
        setStats(s);
      } catch (e) {
        console.error("Admin stats load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />;

  const cards = [
    { title: "Utilisateurs inscrits", value: stats?.totalUsers || 0, icon: <TeamOutlined />, color: colors.primary, bg: colors.primaryActiveBg },
    { title: "Formations actives", value: stats?.totalTrainings || 0, icon: <ReadOutlined />, color: "#2563EB", bg: "#EFF6FF" },
    { title: "Catégories", value: stats?.totalCategories || 0, icon: <AppstoreOutlined />, color: "#8B5CF6", bg: "#F5F3FF" },
    { title: "Certificats délivrés", value: stats?.totalCertificatesIssued || 0, icon: <SafetyCertificateOutlined />, color: colors.success, bg: "#F0FDF4" },
    { title: "Progression globale", value: stats?.averageProgress || 0, suffix: "%", icon: <BarChartOutlined />, color: "#D97706", bg: "#FEF3C7" },
    { title: "Taux de réussite quiz", value: stats?.quizSuccessRate != null ? `${stats.quizSuccessRate}%` : "100%", icon: <CheckCircleFilled />, color: "#06B6D4", bg: "#ECFEFF" },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <Tag color="orange" style={{ borderRadius: 6, fontWeight: 600, marginBottom: 6 }}>
          Administration Centrale ONCF
        </Tag>
        <Typography.Title level={2} style={{ marginTop: 0, marginBottom: 4, color: colors.ink }}>
          Tableau de bord d'administration
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ margin: 0, fontSize: 15 }}>
          Vue d'ensemble de l'activité, des métriques d'apprentissage et des utilisateurs de la plateforme e-GMAO.
        </Typography.Paragraph>
      </div>

      <Row gutter={[20, 20]}>
        {cards.map((c) => (
          <Col xs={24} sm={12} lg={8} key={c.title}>
            <Card className="enterprise-card" bodyStyle={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>
                    {c.title}
                  </Typography.Text>
                  <div style={{ fontSize: 32, fontWeight: 800, color: colors.ink, marginTop: 4 }}>
                    {c.value}{c.suffix || ""}
                  </div>
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: c.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: c.color,
                    fontSize: 22,
                  }}
                >
                  {c.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
