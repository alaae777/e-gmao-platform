import { useState } from "react";
import { Form, Input, Button, Typography, Alert, Card } from "antd";
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../../api/client";
import { colors } from "../../theme";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    try {
      await api.auth.register(values);
      navigate("/login", { state: { registered: true } });
    } catch (e) {
      const data = e.response?.data;
      const firstError =
        (data && Object.values(data).flat().find(Boolean)) || "Échec de l'inscription.";
      setError(firstError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(160deg, ${colors.sidebar} 0%, #12151b 60%)`,
        padding: 16,
      }}
    >
      <Card style={{ width: 420 }} styles={{ body: { padding: 32 } }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: colors.primary,
              margin: "0 auto 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 20,
            }}
          >
            e-G
          </div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Créer un compte
          </Typography.Title>
          <Typography.Text type="secondary">
            Accédez à la plateforme de formation e-GMAO
          </Typography.Text>
        </div>

        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            label="Matricule"
            name="matricule"
            rules={[{ required: true, message: "Merci de saisir votre matricule." }]}
          >
            <Input prefix={<IdcardOutlined />} placeholder="Votre matricule" size="large" autoFocus />
          </Form.Item>
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item
              label="Prénom"
              name="first_name"
              rules={[{ required: true, message: "Requis." }]}
              style={{ flex: 1 }}
            >
              <Input size="large" />
            </Form.Item>
            <Form.Item
              label="Nom"
              name="last_name"
              rules={[{ required: true, message: "Requis." }]}
              style={{ flex: 1 }}
            >
              <Input size="large" />
            </Form.Item>
          </div>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Merci de saisir votre email." },
              { type: "email", message: "Email invalide." },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="vous@exemple.com" size="large" />
          </Form.Item>
          <Form.Item
            label="Mot de passe"
            name="password"
            rules={[
              { required: true, message: "Merci de choisir un mot de passe." },
              { min: 8, message: "8 caractères minimum." },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
          </Form.Item>
          <Form.Item style={{ marginTop: 8 }}>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              Créer mon compte
            </Button>
          </Form.Item>
        </Form>

        <Typography.Paragraph style={{ textAlign: "center", marginTop: 8, marginBottom: 0 }}>
          <Typography.Text type="secondary">Déjà un compte ? </Typography.Text>
          <Link to="/login">Se connecter</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
