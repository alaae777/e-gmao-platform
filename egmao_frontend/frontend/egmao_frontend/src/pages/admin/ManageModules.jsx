import { useEffect, useMemo, useState } from "react";
import {
  Select,
  Typography,
  Input,
  InputNumber,
  Empty,
  Row,
  Col,
  Card,
  Tag,
  Upload,
  Button,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import ResourceTable from "../../components/ResourceTable";
import { api } from "../../api/client";

/** Wraps a CRUD object so list() is pre-filtered and create() auto-fills the parent id. */
function scopedCrud(crud, parentKey, parentId) {
  return {
    list: () =>
      crud.list().then((rows) =>
        rows.filter((r) => String(r[parentKey]) === String(parentId))
      ),
    create: (payload) => crud.create({ ...payload, [parentKey]: parentId }),
    update: (id, payload) => crud.update(id, payload),
    remove: (id) => crud.remove(id),
  };
}

/** Transforme le fileList d'Ant Design Upload en vrai File pour le backend. */
function extractFile(values) {
  const out = { ...values };
  if (Array.isArray(out.file) && out.file[0]?.originFileObj) {
    out.file = out.file[0].originFileObj;
  }
  return out;
}

export default function ManageModules() {
  const [trainings, setTrainings] = useState([]);
  const [modules, setModules] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [trainingId, setTrainingId] = useState(null);
  const [moduleId, setModuleId] = useState(null);
  const [chapterId, setChapterId] = useState(null);

  // 1. Charger les formations au montage
  useEffect(() => {
    api.admin.trainings
      .list()
      .then((rows) => {
        setTrainings(rows);
        if (rows.length) setTrainingId(rows[0].id);
      })
      .catch((err) => {
        console.error(err);
        message.error("Impossible de charger les formations. Backend démarré ?");
      });
  }, []);

  // 2. Charger les modules de la formation sélectionnée
  useEffect(() => {
    if (trainingId == null) {
      setModules([]);
      setModuleId(null);
      return;
    }
    api.admin.modules
      .list()
      .then((rows) => {
        const scoped = rows.filter(
          (m) => Number(m.training_id) === Number(trainingId)
        );
        setModules(scoped);
        setModuleId(scoped.length ? scoped[0].id : null);
      })
      .catch((err) => {
        console.error(err);
        message.error("Impossible de charger les modules.");
      });
  }, [trainingId]);

  // 3. Charger les chapitres du module sélectionné
  useEffect(() => {
    if (moduleId == null) {
      setChapters([]);
      setChapterId(null);
      return;
    }
    api.admin.chapters
      .list()
      .then((rows) => {
        const scoped = rows.filter(
          (c) => Number(c.module_id) === Number(moduleId)
        );
        setChapters(scoped);
        setChapterId(scoped.length ? scoped[0].id : null);
      })
      .catch((err) => {
        console.error(err);
        message.error("Impossible de charger les chapitres.");
      });
  }, [moduleId]);

  const trainingOptions = trainings.map((t) => ({ label: t.title, value: t.id }));
  const moduleOptions = modules.map((m) => ({ label: m.title, value: m.id }));
  const chapterOptions = chapters.map((c) => ({ label: c.title, value: c.id }));

  const moduleCrud = useMemo(() => {
    if (!trainingId) return null;
    return scopedCrud(api.admin.modules, "training_id", trainingId);
  }, [trainingId]);

  const chapterCrud = useMemo(() => {
    if (!moduleId) return null;
    return scopedCrud(api.admin.chapters, "module_id", moduleId);
  }, [moduleId]);

  const videoCrud = useMemo(() => {
    if (!chapterId) return null;
    return scopedCrud(api.admin.videos, "chapter_id", chapterId);
  }, [chapterId]);

  const documentCrud = useMemo(() => {
    if (!chapterId) return null;
    return scopedCrud(api.admin.documents, "chapter_id", chapterId);
  }, [chapterId]);

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Modules, chapitres, vidéos &amp; documents
      </Typography.Title>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={24} md={8}>
          <Card size="small" title="1. Formation">
            <Select
              style={{ width: "100%" }}
              options={trainingOptions}
              value={trainingId}
              onChange={(v) => {
                setTrainingId(v);
                setModuleId(null);
              }}
              placeholder="Sélectionner une formation"
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" title="2. Module (pour ses chapitres)">
            <Select
              style={{ width: "100%" }}
              options={moduleOptions}
              value={moduleId}
              onChange={(v) => {
                setModuleId(v);
                setChapterId(null);
              }}
              placeholder="Sélectionner un module"
              disabled={!moduleOptions.length}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" title="3. Chapitre (pour ses vidéos/documents)">
            <Select
              style={{ width: "100%" }}
              options={chapterOptions}
              value={chapterId}
              onChange={setChapterId}
              placeholder="Sélectionner un chapitre"
              disabled={!chapterOptions.length}
            />
          </Card>
        </Col>
      </Row>

      {/* ========== MODULES ========== */}
      {moduleCrud ? (
        <div style={{ marginBottom: 32 }}>
          <ResourceTable
            key={`modules-${trainingId}`}
            title="Modules de la formation"
            crud={moduleCrud}
            columns={[
              { title: "Titre", dataIndex: "title" },
              { title: "Ordre", dataIndex: "order", width: 100 },
            ]}
            fields={[
              { name: "title", label: "Titre du module", rules: [{ required: true }], component: <Input /> },
              { name: "description", label: "Description", component: <Input.TextArea rows={2} /> },
              { name: "order", label: "Ordre", component: <InputNumber min={0} style={{ width: "100%" }} /> },
            ]}
          />
        </div>
      ) : (
        <Empty description="Sélectionnez une formation." />
      )}

      {/* ========== CHAPITRES ========== */}
      {chapterCrud ? (
        <div style={{ marginBottom: 32 }}>
          <ResourceTable
            key={`chapters-${moduleId}`}
            title="Chapitres du module"
            crud={chapterCrud}
            columns={[
              { title: "Titre", dataIndex: "title" },
              { title: "Ordre", dataIndex: "order", width: 100 },
            ]}
            fields={[
              { name: "title", label: "Titre du chapitre", rules: [{ required: true }], component: <Input /> },
              { name: "description", label: "Description", component: <Input.TextArea rows={2} /> },
              { name: "order", label: "Ordre", component: <InputNumber min={0} style={{ width: "100%" }} /> },
            ]}
          />
        </div>
      ) : (
        <Empty description="Sélectionnez un module pour gérer ses chapitres." />
      )}

      {/* ========== VIDÉOS + DOCUMENTS ========== */}
      {videoCrud && documentCrud ? (
        <Row gutter={16}>
          {/* Vidéos */}
          <Col xs={24} lg={12}>
            <ResourceTable
              key={`videos-${chapterId}`}
              title="Vidéos du chapitre"
              crud={videoCrud}
              transformOut={extractFile}
              columns={[
                { title: "Titre", dataIndex: "title" },
                {
                  title: "Durée",
                  dataIndex: "duration_seconds",
                  width: 90,
                  render: (s) => `${Math.round((s || 0) / 60)} min`,
                },
              ]}
              fields={[
                {
                  name: "title",
                  label: "Titre de la vidéo",
                  rules: [{ required: true }],
                  component: <Input />,
                },
                {
                  name: "file",
                  label: "Fichier vidéo",
                  rules: [{ required: true, message: "Choisissez un fichier vidéo" }],
                  valuePropName: "fileList",
                  getValueFromEvent: (e) => (Array.isArray(e) ? e : e?.fileList),
                  component: (
                    <Upload
                      beforeUpload={() => false}
                      maxCount={1}
                      accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v"
                    >
                      <Button icon={<UploadOutlined />}>Choisir une vidéo</Button>
                    </Upload>
                  ),
                },
                {
                  name: "duration_seconds",
                  label: "Durée (secondes)",
                  component: <InputNumber min={0} style={{ width: "100%" }} />,
                },
              ]}
            />
          </Col>

          {/* Documents PDF */}
          <Col xs={24} lg={12}>
            <ResourceTable
              key={`documents-${chapterId}`}
              title="Documents du chapitre"
              crud={documentCrud}
              transformOut={extractFile}
              columns={[
                { title: "Titre", dataIndex: "title" },
                {
                  title: "Type",
                  dataIndex: "doc_type",
                  width: 100,
                  render: (t) => <Tag>{t}</Tag>,
                },
              ]}
              fields={[
                {
                  name: "title",
                  label: "Titre du document",
                  rules: [{ required: true }],
                  component: <Input />,
                },
                {
                  name: "file",
                  label: "Fichier PDF / document",
                  rules: [{ required: true, message: "Choisissez un fichier" }],
                  valuePropName: "fileList",
                  getValueFromEvent: (e) => (Array.isArray(e) ? e : e?.fileList),
                  component: (
                    <Upload
                      beforeUpload={() => false}
                      maxCount={1}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf"
                    >
                      <Button icon={<UploadOutlined />}>Choisir un PDF</Button>
                    </Upload>
                  ),
                },
                {
                  name: "doc_type",
                  label: "Type",
                  component: (
                    <Select
                      options={[
                        { label: "PDF", value: "PDF" },
                        { label: "Guide", value: "GUIDE" },
                        { label: "Support", value: "SUPPORT" },
                      ]}
                    />
                  ),
                },
              ]}
            />
          </Col>
        </Row>
      ) : (
        <Empty description="Sélectionnez un chapitre pour gérer ses vidéos et documents." />
      )}
    </div>
  );
}