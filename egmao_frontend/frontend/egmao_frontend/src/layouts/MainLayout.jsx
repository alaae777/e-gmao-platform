import { useMemo } from "react";
import { Layout, Menu, Avatar, Dropdown, Typography, Grid, Tag } from "antd";
import {
  DashboardOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  IdcardOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";
import AssistantWidget from "../components/AssistantWidget";

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const NAV_ITEMS = [
  { key: "/app", icon: <DashboardOutlined />, label: "Tableau de bord" },
  { key: "/app/catalogue", icon: <ReadOutlined />, label: "Catalogue" },
  { key: "/app/progression", icon: <BarChartOutlined />, label: "Ma progression" },
  { key: "/app/certificats", icon: <SafetyCertificateOutlined />, label: "Mes certificats" },
  { key: "/app/profil", icon: <UserOutlined />, label: "Mon profil" },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();

  const selectedKey = useMemo(() => {
    // Match exact or startsWith for subroutes
    const match = NAV_ITEMS.find(
      (item) =>
        location.pathname === item.key ||
        (item.key !== "/app" && location.pathname.startsWith(item.key))
    );
    return match ? match.key : "/app";
  }, [location.pathname]);

  const userMenu = {
    items: [
      { key: "profile", icon: <IdcardOutlined />, label: "Mon profil" },
      { type: "divider" },
      { key: "logout", icon: <LogoutOutlined />, label: "Se déconnecter", danger: true },
    ],
    onClick: ({ key }) => {
      if (key === "logout") {
        logout();
        navigate("/login");
      }
      if (key === "profile") navigate("/app/profil");
    },
  };

  return (
    <Layout style={{ minHeight: "100vh", background: colors.canvas }}>
      <Sider
        breakpoint="lg"
        collapsedWidth={screens.md ? 80 : 0}
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
          onClick={() => navigate("/app")}
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
              boxShadow: "0 2px 8px rgba(231,106,31,0.3)",
            }}
          >e-G
            
          </div>
          <div>
            <div style={{ color: colors.ink, fontWeight: 700, fontSize: 16, lineHeight: 1.1 }}>
              e-GMAO
            </div>
            <div style={{ color: colors.inkSoft, fontSize: 11, fontWeight: 500 }}>
              Learning Platform
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 0 8px 0" }}>
          <div style={{ paddingInline: 20, marginBottom: 8, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, color: colors.inkMuted, fontWeight: 700 }}>
            Navigation
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Typography.Text strong style={{ color: colors.ink, fontSize: 15 }}>
              e-GMAO- Plateforme de Formation 
            </Typography.Text>
            <Tag color="orange" style={{ borderRadius: 6, fontWeight: 600, border: 0 }}>
              Entreprise
            </Tag>
          </div>
          
          <Dropdown menu={userMenu} placement="bottomRight" arrow>
            <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "4px 8px", borderRadius: 8, transition: "background 0.2s" }}>
              <div style={{ textAlign: "right", lineHeight: 1.2 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: colors.ink }}>
                  {user?.first_name} {user?.last_name}
                </div>
                <div style={{ fontSize: 11, color: colors.inkSoft }}>
                  {user?.matricule || "Agent ONCF"}
                </div>
              </div>
              <Avatar
                style={{
                  backgroundColor: colors.primaryActiveBg,
                  color: colors.primary,
                  fontWeight: 700,
                  border: `1px solid ${colors.primaryHover}`,
                }}
                icon={<UserOutlined />}
              >
                {user?.first_name?.[0]}
              </Avatar>
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
