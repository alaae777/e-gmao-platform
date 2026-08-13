import { Button, Typography, Row, Col, Card } from "antd";
import {
  ReadOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
  ToolOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";

const { Title, Paragraph, Text } = Typography;

const FEATURES = [
  {
    icon: <ToolOutlined />,
    title: "Maîtrisez le GMAO",
    text: "Des parcours structurés par catégories et formations pour monter en compétence sur l'outil de gestion de maintenance assistée par ordinateur.",
  },
  {
    icon: <ReadOutlined />,
    title: "Modules par chapitre",
    text: "Vidéos, documents et exercices organisés module par module, à votre rythme.",
  },
  {
    icon: <BarChartOutlined />,
    title: "Suivi de progression",
    text: "Visualisez votre avancement et reprenez exactement où vous vous étiez arrêté.",
  },
  {
    icon: <SafetyCertificateOutlined />,
    title: "Certification",
    text: "Validez vos acquis avec des quiz et obtenez un certificat à l'issue de chaque module.",
  },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const primaryCta = user
    ? {
        label: "Accéder à mon espace",
        onClick: () => navigate(user.role === "ADMIN" ? "/admin" : "/app"),
      }
    : {
        label: "Se connecter",
        onClick: () => navigate("/login"),
      };

  return (
    <div style={{ minHeight: "100vh", background: colors.canvas }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 40px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: colors.railBlue,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFF",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            eG
          </div>
          <Text strong style={{ color: colors.ink, fontSize: 16 }}>
            e-GMAO
          </Text>
        </div>
        <Button type="primary" onClick={primaryCta.onClick}>
          {primaryCta.label}
        </Button>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 780, margin: "60px auto 80px", textAlign: "center", padding: "0 24px" }}>
        <Title level={1} style={{ color: colors.ink, marginBottom: 16 }}>
          La plateforme de formation e-GMAO
        </Title>
        <Paragraph style={{ fontSize: 17, color: colors.inkSoft, marginBottom: 32 }}>
          Formez-vous à la gestion de maintenance assistée par ordinateur (GMAO) :
          modules vidéo, documents de référence et quiz de validation, réunis dans
          un seul espace de formation en ligne.
        </Paragraph>
        <Button
          type="primary"
          size="large"
          icon={<ArrowRightOutlined />}
          iconPosition="end"
          onClick={primaryCta.onClick}
        >
          {primaryCta.label}
        </Button>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px 80px" }}>
        <Row gutter={[20, 20]}>
          {FEATURES.map((f) => (
            <Col xs={24} sm={12} lg={6} key={f.title}>
              <Card
                className="enterprise-card"
                style={{ height: "100%" }}
                styles={{ body: { padding: 24 } }}
              >
                <div style={{ fontSize: 26, color: colors.primary, marginBottom: 14 }}>
                  {f.icon}
                </div>
                <Text strong style={{ display: "block", marginBottom: 8, color: colors.ink }}>
                  {f.title}
                </Text>
                <Text style={{ color: colors.inkSoft, fontSize: 13.5 }}>{f.text}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          padding: "24px",
          borderTop: `1px solid ${colors.border}`,
          color: colors.inkMuted,
          fontSize: 12.5,
        }}
      >
        e-GMAO — Plateforme de formation interne
      </div>
    </div>
  );
}
