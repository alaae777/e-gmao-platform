import { Modal, Button, Typography } from "antd";
import { DownloadOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";
// 

/**
 * Certificat imprimable. La feuille elle-même reste sur fond clair
 * (crème/blanc) volontairement — un document officiel destiné à être
 * imprimé ne doit pas être en mode sombre, même si le reste de
 * l'application l'est. Le QR code encode une vraie URL de vérification
 * publique (voir progress/views.py: CertificateVerifyView), donc il
 * pointe réellement quelque part une fois scanné.
 */
export default function FinalCertificateModal({ open, onClose, user, training, certData }) {
  if (!training) return null;

  const number = certData?.number || `CERT-${training.id}`;
  const obtainedAt = certData?.obtained_at
    ? new Date(certData.obtained_at)
    : new Date();
  const holderName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.matricule;
  const verifyUrl = `${window.location.origin}/certificats/verifier/${number}`;

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={760} centered>
      <div
        id="printable-certificate"
        style={{
          background: "#eeebc3",
          color: "#1A1A1A",
          fontFamily: "'IBM Plex Sans', sans-serif",
          padding: "48px 56px",
          border: "2px solid #C9A24B",
          borderRadius: 4,
          position: "relative",
        }}
      >
        {/* Double liseré, effet diplôme */}
        <div
          style={{
            position: "absolute",
            inset: 10,
            border: "1px solid #b6bfe7",
            pointerEvents: "none",
          }}
        />

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <SafetyCertificateOutlined style={{ fontSize: 40, color: "#C9A24B" }} />
          <Typography.Title
            level={2}
            style={{
              margin: "12px 0 4px",
              letterSpacing: 2,
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontWeight: 700,
              color: "#1A1A1A",
            }}
          >
            CERTIFICAT DE FORMATION
          </Typography.Title>
          <Typography.Text style={{ color: "#6d6b6b", letterSpacing: 1, fontSize: 12 }}>
            PLATEFORME E-GMAO
          </Typography.Text>
        </div>

        <div style={{ textAlign: "center", margin: "32px 0" }}>
          <Typography.Text style={{ color: "#555", fontSize: 14 }}>
            Ce certificat atteste que
          </Typography.Text>
          <Typography.Title
            level={3}
            style={{ margin: "8px 0", color: "#2B8CB0", fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            {holderName}
          </Typography.Title>
          <Typography.Text className="data-mono" style={{ color: "#8A8A8A", fontSize: 12 }}>
            Matricule {user?.matricule}
          </Typography.Text>
        </div>

        <Typography.Paragraph
          style={{ textAlign: "center", color: "#333", fontSize: 14.5, maxWidth: 480, margin: "0 auto 28px" }}
        >
          a validé avec succès l'ensemble des modules et évaluations de la
          formation :
        </Typography.Paragraph>

        <div
          style={{
            textAlign: "center",
            background: "#ebdebc",
            border: "1px solid #E4D5AC",
            borderRadius: 6,
            padding: "16px 24px",
            margin: "0 auto 32px",
            maxWidth: 480,
          }}
        >
          <Typography.Text strong style={{ fontSize: 16, color: "#1A1A1A" }}>
            {training.title}
          </Typography.Text>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginTop: 44,
            paddingTop: 16,
            borderTop: "1px solid #E4D5AC",
          }}
        >
          <div>
            <Typography.Text style={{ display: "block", fontSize: 11, color: "#605d8f" }}>
              Délivré le
            </Typography.Text>
            <Typography.Text strong style={{ fontSize: 13 }}>
              {obtainedAt.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
            </Typography.Text>
            <Typography.Text
              className="data-mono"
              style={{ display: "block", fontSize: 11, color: "#150430", marginTop: 6 }}
            >
              N° {number}
            </Typography.Text>
          </div>

          <div style={{ textAlign: "center" }}>
            <QRCodeSVG value={verifyUrl} size={78} fgColor="#1A1A1A" />
            <Typography.Text style={{ display: "block", fontSize: 9.5, color: "#8A8A8A", marginTop: 4 }}>
              Scanner pour vérifier
            </Typography.Text>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <Button type="primary" icon={<DownloadOutlined />} size="large" onClick={() => window.print()}>
          Télécharger / Imprimer le certificat
        </Button>
      </div>
    </Modal>
  );
}