import { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, Typography, Input, Select, Tag, Skeleton, Empty, Progress as AntProgress } from "antd";
import { SearchOutlined, ClockCircleOutlined, BookOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme";
import { calculateTrainingDuration, formatDuration } from "../../utils/duration";

const LEVEL_LABEL = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

export default function Catalog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trainings, setTrainings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [progress, setProgress] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [t, c, p] = await Promise.all([
          api.catalog.listTrainings(),
          api.catalog.listCategories(),
          api.progress.list(user.id),
        ]);
        setTrainings(t);
        setCategories(c);
        setProgress(p);
      } catch (err) {
        console.error("Catalog fetch error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id]);

  const filtered = useMemo(() => {
    return trainings
      .filter((t) => !categoryFilter || t.category_id === categoryFilter)
      .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.order - b.order);
  }, [trainings, search, categoryFilter]);

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Tag color="orange" style={{ borderRadius: 6, fontWeight: 600, marginBottom: 6 }}>
          Catalogue Professionnel ONCF
        </Tag>
        <Typography.Title level={2} style={{ marginTop: 0, marginBottom: 4, color: colors.ink }}>
          Catalogue de formations GMAO
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ margin: 0, fontSize: 15 }}>
          Découvrez et suivez les parcours certifiants pour maîtriser les outils et processus de gestion de la maintenance.
        </Typography.Paragraph>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          background: colors.surface,
          padding: 16,
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          marginBottom: 28,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Input
          allowClear
          placeholder="Rechercher une formation..."
          prefix={<SearchOutlined style={{ color: colors.inkSoft }} />}
          style={{ maxWidth: 360, borderRadius: 8, height: 40 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          allowClear
          placeholder="Toutes les catégories"
          style={{ minWidth: 240, height: 40 }}
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={categories.map((c) => ({ label: c.name, value: c.id }))}
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="enterprise-card" style={{ textAlign: "center", padding: 40 }}>
          <Empty description="Aucune formation ne correspond à vos critères de recherche." />
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          {filtered.map((training) => {
            const category = categories.find((c) => c.id === training.category_id);
            const p = progress.find((pr) => pr.training_id === training.id);
            const estimatedDuration = calculateTrainingDuration(training);

            return (
              <Col xs={24} sm={12} lg={8} key={training.id}>
                <Card
                  className="enterprise-card"
                  hoverable
                  style={{ height: "100%", display: "flex", flexDirection: "column" }}
                  bodyStyle={{ padding: 20, flex: 1, display: "flex", flexDirection: "column" }}
                  onClick={() => navigate(`/app/formations/${training.id}`)}
                  cover={
                    <div
                      style={{
                        height: 110,
                        background: `linear-gradient(135deg, ${colors.primary} 0%, #F97316 100%)`,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        padding: 16,
                        position: "relative",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Tag style={{ background: "rgba(255,255,255,0.9)", border: 0, fontWeight: 700, color: colors.ink }}>
                          {category?.name || "GMAO"}
                        </Tag>
                        <Tag style={{ background: "rgba(15,23,42,0.4)", border: 0, color: "#FFF" }}>
                          {LEVEL_LABEL[training.level] || "Formation"}
                        </Tag>
                      </div>
                      <BookOutlined style={{ fontSize: 24, color: "rgba(255,255,255,0.7)", alignSelf: "flex-end" }} />
                    </div>
                  }
                >
                  <Typography.Text strong style={{ fontSize: 17, color: colors.ink }}>
                    {training.title}
                  </Typography.Text>
                  <Typography.Paragraph
                    type="secondary"
                    ellipsis={{ rows: 2 }}
                    style={{ marginTop: 6, marginBottom: 16, fontSize: 13, flex: 1 }}
                  >
                    {training.description}
                  </Typography.Paragraph>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${colors.border}`, paddingTop: 12, marginTop: "auto" }}>
                    <Tag color="default" style={{ borderRadius: 6 }}>
                      {training.module_count || 1} modules
                    </Tag>
                    {/* Requirement 5: Automatically computed training duration */}
                    <span style={{ fontSize: 12, color: colors.inkSoft, fontWeight: 600 }}>
                      <ClockCircleOutlined /> {formatDuration(estimatedDuration)}
                    </span>
                  </div>

                  {p && (
                    <AntProgress
                      percent={Number(p.percentage)}
                      size="small"
                      strokeColor={colors.primary}
                      style={{ marginTop: 12 }}
                    />
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}
