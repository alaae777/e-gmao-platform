import { useMemo } from "react";
import { Layout, Menu, Avatar, Dropdown, Typography, Tag } from "antd";
import {
  DashboardOutlined,
  AppstoreOutlined,
  ReadOutlined,
  BlockOutlined,
  QuestionCircleOutlined,
  TeamOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";
import AssistantWidget from "../components/AssistantWidget";

const { Header, Sider, Content } = Layout;

const NAV_ITEMS = [
  { key: "/admin", icon: <DashboardOutlined />, label: "Tableau de bord" },
  { key: "/admin/utilisateurs", icon: <TeamOutlined />, label: "Utilisateurs" },
  { key: "/admin/categories", icon: <AppstoreOutlined />, label: "Catégories" },
  { key: "/admin/formations", icon: <ReadOutlined />, label: "Formations" },
  { key: "/admin/modules", icon: <BlockOutlined />, label: "Modules & chapitres" },
  { key: "/admin/quiz", icon: <QuestionCircleOutlined />, label: "Quiz" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = useMemo(() => {
    const match = NAV_ITEMS.find(
      (item) =>
        location.pathname === item.key ||
        (item.key !== "/admin" && location.pathname.startsWith(item.key))
    );
    return match ? match.key : "/admin";
  }, [location.pathname]);

  const userMenu = {
    items: [{ key: "logout", icon: <LogoutOutlined />, label: "Se déconnecter", danger: true }],
    onClick: () => {
      logout();
      navigate("/login");
    },
  };

  return (
    <Layout style={{ minHeight: "100vh", background: colors.canvas }}>
      <Sider
        breakpoint="lg"
        collapsedWidth={80}
        width={240}
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "auto",
          background: colors.surface,
          borderRight: `1px solid ${colors.border}`,
          zIndex: 10,
        }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            paddingInline: 20,
            gap: 10,
            borderBottom: `1px solid ${colors.border}`,
            cursor: "pointer",
          }}
          onClick={() => navigate("/admin")}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${colors.primary} 0%, #F97316 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFF",
              fontWeight: 800,
              fontSize: 16,
              boxShadow: "0 2px 8px rgba(41, 71, 167, 0.3)",
            }}
          >
          e-G
          </div>
          <div>
            <div style={{ color: colors.ink, fontWeight: 700, fontSize: 16, lineHeight: 1.1 }}>
              e-GMAO
            </div>
            <div style={{ color: colors.primary, fontSize: 11, fontWeight: 600 }}>
              Administration
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 0 8px 0" }}>
          <div style={{ paddingInline: 20, marginBottom: 8, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, color: colors.inkMuted, fontWeight: 700 }}>
            Gestion Platform
          </div>
          <Menu
            mode="inline"
            className="custom-enterprise-menu"
            selectedKeys={[selectedKey]}
            items={NAV_ITEMS}
            onClick={({ key }) => navigate(key)}
            style={{ borderRight: 0 }}
          />
        </div>
      </Sider>

      <Layout style={{ background: colors.canvas }}>
        <Header
          style={{
            background: colors.surface,
            borderBottom: `1px solid ${colors.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingInline: 28,
            height: 64,
            position: "sticky",
            top: 0,
            zIndex: 9,
          }}
        >
          <Typography.Text strong style={{ color: colors.ink, fontSize: 15 }}>
            Administration centrale — e-GMAO 
          </Typography.Text>
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <Tag color="red" style={{ borderRadius: 6, fontWeight: 600, border: 0 }}>
                Administrateur
              </Tag>
              <span style={{ fontWeight: 600, fontSize: 13, color: colors.ink }}>
                {user?.first_name} {user?.last_name}
              </span>
              <Avatar style={{ backgroundColor: colors.ink }} icon={<UserOutlined />} />
            </div>
          </Dropdown>
        </Header>
        <Content style={{ padding: "28px 32px", minHeight: "calc(100vh - 64px)" }} className="fade-in-page">
          <Outlet />
        </Content>
      </Layout>
      <AssistantWidget />
    </Layout>
  );
}
