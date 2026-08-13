import { Typography, Card, Descriptions, Avatar, Form, Input, Button, message, Tag } from "antd";
import { UserOutlined, KeyOutlined, IdcardOutlined } from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <Tag color="orange" style={{ borderRadius: 6, fontWeight: 600, marginBottom: 6 }}>
          Compte Utilisateur
        </Tag>
        <Typography.Title level={2} style={{ marginTop: 0, marginBottom: 4, color: colors.ink }}>
          Mon profil
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ margin: 0, fontSize: 15 }}>
          Gérez vos informations personnelles et votre sécurité d'accès.
        </Typography.Paragraph>
      </div>

      <Card className="enterprise-card" bodyStyle={{ padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${colors.border}` }}>
          <Avatar
            size={72}
            icon={<UserOutlined />}
            style={{
              backgroundColor: colors.primaryActiveBg,
              color: colors.primary,
              border: `2px solid ${colors.primaryHover}`,
              fontWeight: 700,
              fontSize: 28,
            }}
          >
            {user?.first_name?.[0]}
          </Avatar>
          <div>
            <Typography.Title level={3} style={{ margin: 0, color: colors.ink }}>
              {user?.first_name} {user?.last_name}
            </Typography.Title>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
              <Tag style={{ borderRadius: 6, fontFamily: "monospace", fontSize: 12 }}>
                Matricule: {user?.matricule}
              </Tag>
              <Tag color="orange" style={{ borderRadius: 6, fontWeight: 600 }}>
                {user?.role === "ADMIN" ? "Administrateur" : "Apprenant ONCF"}
              </Tag>
            </div>
          </div>
        </div>

        <Descriptions column={1} bordered size="middle" style={{ marginBottom: 32 }}>
          <Descriptions.Item label="Nom complet">
            <strong>{user?.first_name} {user?.last_name}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Adresse e-mail">{user?.email || "Non renseigné"}</Descriptions.Item>
          <Descriptions.Item label="Matricule Agent">{user?.matricule}</Descriptions.Item>
          <Descriptions.Item label="Rôle Système">
            {user?.role === "ADMIN" ? "Administrateur Système GMAO" : "Agent d'Exploitation / Maintenance"}
          </Descriptions.Item>
        </Descriptions>

        <Typography.Title level={4} style={{ marginBottom: 16, color: colors.ink }}>
          <KeyOutlined style={{ color: colors.primary, marginRight: 8 }} />
          Sécurité du compte
        </Typography.Title>
        <Form
          layout="vertical"
          onFinish={() => message.success("Mot de passe mis à jour avec succès.")}
          style={{ maxWidth: 480 }}
        >
          <Form.Item label="Mot de passe actuel" name="current" rules={[{ required: true, message: "Veuillez entrer votre mot de passe actuel" }]}>
            <Input.Password placeholder="••••••••" style={{ borderRadius: 8, height: 40 }} />
          </Form.Item>
          <Form.Item label="Nouveau mot de passe" name="next" rules={[{ required: true, message: "Veuillez entrer un nouveau mot de passe" }]}>
            <Input.Password placeholder="••••••••" style={{ borderRadius: 8, height: 40 }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" style={{ borderRadius: 8, height: 40, background: colors.primary }}>
            Mettre à jour le mot de passe
          </Button>
        </Form>
      </Card>
    </div>
  );
}
