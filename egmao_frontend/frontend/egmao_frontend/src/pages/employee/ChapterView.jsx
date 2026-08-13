import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Typography, Card, Button, Space, Tag, Skeleton, Result, message, Breadcrumb } from "antd";
import {
  PlayCircleOutlined, FileTextOutlined, CheckCircleOutlined, ArrowLeftOutlined, DownloadOutlined,
} from "@ant-design/icons";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme";
import { toRelativeMediaUrl } from "../../utils/media";

export default function ChapterView() {
  const { trainingId, chapterId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await api.catalog.getChapter(chapterId);
        if (alive) setChapter(data);
      } catch (e) {
        console.error("Chapter view load error:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [chapterId]);

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;
  if (!chapter) return <Result status="404" title="Chapitre introuvable" />;

  const complete = async () => {
    setMarking(true);
    try {
      await api.learning.markChapterComplete(user.id, chapter.id);
      message.success("Chapitre validé avec succès !");
      navigate(`/app/formations/${trainingId}`);
    } catch {
      message.error("Une erreur est survenue lors de la validation.");
    } finally {
      setMarking(false);
    }
  };

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(`/app/formations/${trainingId}`)}
        style={{ marginBottom: 16, paddingLeft: 0, color: colors.inkSoft }}
      >
        Retour à la formation
      </Button>

      <div style={{ marginBottom: 20 }}>
        {chapter.module?.title && (
          <Tag color="orange" style={{ borderRadius: 6, fontWeight: 600, marginBottom: 8 }}>
            Module : {chapter.module.title}
          </Tag>
        )}
        <Typography.Title level={2} style={{ marginTop: 4, marginBottom: 8, color: colors.ink }}>
          {chapter.title}
        </Typography.Title>
        {chapter.description && (
          <Typography.Paragraph type="secondary" style={{ fontSize: 15 }}>
            {chapter.description}
          </Typography.Paragraph>
        )}
      </div>

      {chapter.videos.length === 0 && chapter.documents.length === 0 && (
        <Card className="enterprise-card" style={{ marginBottom: 24, textAlign: "center" }}>
          <Typography.Paragraph type="secondary" italic style={{ margin: 0 }}>
            Aucun contenu vidéo ou document n'a été rattaché à ce chapitre.
          </Typography.Paragraph>
        </Card>
      )}

      {/* Videos List */}
      {chapter.videos.map((v) => (
        <Card className="enterprise-card" key={v.id} style={{ marginBottom: 24 }} bodyStyle={{ padding: 20 }}>
          <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 12, color: colors.ink }}>
            <PlayCircleOutlined style={{ color: colors.primary, marginRight: 8 }} />
            {v.title}
          </Typography.Title>
          <video
            controls
            controlsList="nodownload"
            style={{ width: "100%", borderRadius: 12, background: "#000", marginBottom: 12, maxHeight: 460 }}
            src={toRelativeMediaUrl(v.file)}
          >
            Votre navigateur ne prend pas en charge la lecture vidéo.
          </video>
          {v.duration_seconds > 0 && (
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Durée vidéo : {Math.round(v.duration_seconds / 60)} minutes
            </Typography.Text>
          )}
        </Card>
      ))}

      {/* Documents List */}
      {chapter.documents.map((d) => (
        <Card className="enterprise-card" key={d.id} style={{ marginBottom: 24 }} bodyStyle={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Space style={{ marginBottom: 0 }}>
              <FileTextOutlined style={{ fontSize: 24, color: colors.primary }} />
              <div>
                <Typography.Text strong style={{ fontSize: 16, display: "block", color: colors.ink }}>
                  {d.title}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Document {d.doc_type || "PDF"}
                </Typography.Text>
              </div>
            </Space>
            <Button
              type="primary"
              ghost
              icon={<DownloadOutlined />}
              href={toRelativeMediaUrl(d.file)}
              target="_blank"
              rel="noreferrer"
              style={{ borderRadius: 8 }}
            >
              Télécharger le document
            </Button>
          </div>
          {d.file?.toLowerCase().endsWith(".pdf") && (
            <iframe
              title={d.title}
              src={toRelativeMediaUrl(d.file)}
              style={{ width: "100%", height: 500, border: `1px solid ${colors.border}`, borderRadius: 10 }}
            />
          )}
        </Card>
      ))}

      {/* Complete Button */}
      <Card className="enterprise-card" bodyStyle={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Typography.Text strong style={{ display: "block", color: colors.ink }}>
            Avez-vous terminé l'étude de ce chapitre ?
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Marquez le chapitre comme terminé pour débloquer la suite.
          </Typography.Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<CheckCircleOutlined />}
          loading={marking}
          onClick={complete}
          style={{ height: 44, borderRadius: 10, background: colors.primary }}
        >
          Marquer ce chapitre comme terminé
        </Button>
      </Card>
    </div>
  );
}