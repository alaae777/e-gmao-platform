import { useEffect, useState } from "react";
import { Typography, Card, Row, Col, Skeleton, Empty, Button, Tag } from "antd";
import { DownloadOutlined, SafetyCertificateOutlined, CheckCircleFilled } from "@ant-design/icons";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme";
import FinalCertificateModal from "../../components/FinalCertificateModal";

export default function Certificates() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [progress, setProgress] = useState([]);

  const [selectedFinalCert, setSelectedFinalCert] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [c, t, p] = await Promise.all([
          api.progress.listCertificates(user.id),
          api.catalog.listTrainings(),
          api.progress.list(user.id),
        ]);
        setCertificates(c);
        setTrainings(t);
        setProgress(p);
      } catch (e) {
        console.error("Error loading certificates:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id]);

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;

  // Un seul type de certificat : une formation entièrement complétée (100%).
  const completedTrainings = trainings.filter((t) => {
    const p = progress.find((row) => row.training_id === t.id);
    return p && (p.completed || Number(p.percentage) >= 100);
  });

  const openFinalModal = (training, certData) => {
    setSelectedFinalCert({ training, certData });
    setModalOpen(true);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={2} style={{ marginTop: 0, marginBottom: 4, color: colors.ink }}>
          Mes certificats
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ margin: 0, fontSize: 15 }}>
          Un certificat est délivré automatiquement lorsque vous complétez
          l'ensemble des modules d'une formation.
        </Typography.Paragraph>
      </div>

      {completedTrainings.length === 0 ? (
        <Card className="enterprise-card" style={{ textAlign: "center", padding: 40 }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Vous n'avez pas encore terminé de formation complète à 100%. Complétez tous les modules d'une formation pour débloquer votre certificat."
          />
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          {completedTrainings.map((training) => {
            const certData = certificates.find((c) => c.training_id === training.id);
            return (
              <Col xs={24} md={12} key={training.id}>
                <Card
                  className="enterprise-card"
                  style={{ borderTop: `4px solid ${colors.primary}` }}
                  styles={{ body: { padding: 24 } }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Tag
                      icon={<CheckCircleFilled />}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        color: colors.primary,
                        background: colors.primaryActiveBg,
                        border: `1px solid ${colors.primary}`,
                      }}
                    >
                      Certificat obtenu
                    </Tag>
                    <Tag className="data-mono" style={{ background: colors.surfaceRaised, color: colors.inkSoft, border: `1px solid ${colors.border}` }}>
                      {certData?.number || `CERT-${training.id}`}
                    </Tag>
                  </div>

                  <div style={{ textAlign: "center", margin: "20px 0 16px 0" }}>
                    <SafetyCertificateOutlined style={{ fontSize: 48, color: colors.primary }} />
                    <Typography.Title level={4} style={{ marginTop: 12, marginBottom: 4, color: colors.ink }}>
                      {training.title}
                    </Typography.Title>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                      Parcours e-GMAO complété à 100%
                    </Typography.Text>
                  </div>

                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    block
                    size="large"
                    onClick={() => openFinalModal(training, certData)}
                    style={{ height: 44 }}
                  >
                    Télécharger le certificat
                  </Button>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {selectedFinalCert && (
        <FinalCertificateModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          user={user}
          training={selectedFinalCert.training}
          certData={selectedFinalCert.certData}
        />
      )}
    </div>
  );
}