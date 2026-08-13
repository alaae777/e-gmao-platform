import { Form, Input, Button, Typography, Alert, Card } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme";
import { Link } from "react-router-dom";   
export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const onFinish = async ({ matricule, password }) => {
    try {
      const user = await login(matricule, password);
      const from = location.state?.from?.pathname;
      navigate(from || (user.role === "ADMIN" ? "/admin" : "/app"), { replace: true });
    } catch {
      
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
      <Card
        style={{ width: 380, borderRadius: 16 }}
        styles={{ body: { padding: 32 } }}
      >
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
            e-GMAO
          </Typography.Title>
          <Typography.Text type="secondary">
            Plateforme de formation du personnel e-GMAO 
          </Typography.Text>
        </div>

        {error && <Alert
    type="error"
    message={error}
    style={{
        color: "#b42318",
        background: "#fff1f0",
        border: "1px solid #ffccc7",
    }}
/>}

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            label="Matricule"
            name="matricule"
            rules={[{ required: true, message: "Merci de saisir votre matricule." }]}
          >
            <Input prefix={<UserOutlined />} placeholder="ONCF-00123" size="large" autoFocus />
          </Form.Item>
          <Form.Item
            label="Mot de passe"
            name="password"
            rules={[{ required: true, message: "Merci de saisir votre mot de passe." }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
          </Form.Item>
          <Form.Item style={{ marginTop: 8 }}>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              Se connecter
            </Button>
          </Form.Item>
        </Form>
<Typography.Paragraph style={{ textAlign: "center", marginTop: 8, marginBottom: 0 }}>
  <Typography.Text type="secondary">Pas encore de compte ? </Typography.Text>
  <Link to="/inscription">Créer un compte</Link>
</Typography.Paragraph>
       
      </Card>
    </div>
  );
}
