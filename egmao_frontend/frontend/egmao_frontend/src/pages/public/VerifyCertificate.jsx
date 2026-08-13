import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Typography, Spin, Result } from "antd";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import { colors } from "../../theme";

export default function VerifyCertificate() {
  const { number } = useParams();
  const [state, setState] = useState({ loading: true, data: null });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || "/api"}/progress/certificates/verify/${number}/`
        );
        const data = await res.json();
        setState({ loading: false, data });
      } catch {
        setState({ loading: false, data: { valid: false } });
      }
    })();
  }, [number]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colors.canvas,
        padding: 16,
      }}
    >
      <Card style={{ width: 460 }} styles={{ body: { padding: 32, textAlign: "center" } }}>
        {state.loading ? (
          <Spin size="large" />
        ) : state.data?.valid ? (
          <>
            <SafetyCertificateOutlined style={{ fontSize: 48, color: colors.primary, marginBottom: 16 }} />
            <Typography.Title level={4} style={{ marginBottom: 4 }}>
              Certificat authentique
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 20 }}>
              Ce certificat a bien été délivré par la plateforme e-GMAO.
            </Typography.Paragraph>
            <div style={{ textAlign: "left", background: colors.surfaceRaised, borderRadius: 10, padding: 16 }}>
              <Row label="Titulaire" value={state.data.holder_name} />
              <Row label="Matricule" value={state.data.matricule} mono />
              <Row label="Formation" value={state.data.training_title} />
              <Row
                label="Obtenu le"
                value={new Date(state.data.obtained_at).toLocaleDateString("fr-FR")}
              />
              <Row label="N° certificat" value={state.data.number} mono last />
            </div>
          </>
        ) : (
          <Result
            status="error"
            title="Certificat introuvable"
            subTitle="Ce numéro de certificat ne correspond à aucun enregistrement valide."
          />
        )}
      </Card>
    </div>
  );
}

function Row({ label, value, mono, last }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: last ? "none" : `1px solid ${colors.border}`,
      }}
    >
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        {label}
      </Typography.Text>
      <Typography.Text
        strong
        className={mono ? "data-mono" : undefined}
        style={{ fontSize: 13, color: colors.ink }}
      >
        {value}
      </Typography.Text>
    </div>
  );
}
