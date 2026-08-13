import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Select, Typography, Input, InputNumber, Empty, Row, Col, Card, Switch,
  Form, Button, Tag, message,
} from "antd";
import { SaveOutlined, PlusOutlined } from "@ant-design/icons";
import ResourceTable from "../../components/ResourceTable";
import { api } from "../../api/client";

function scopedCrud(crud, parentKey, parentId) {
  return {
    list: () =>
      crud.list().then((rows) =>
        rows.filter(
          (r) => String(r[parentKey]) === String(parentId)
        )
      ),

    create: (payload) =>
      crud.create({ ...payload, [parentKey]: parentId }),

    update: (id, payload) =>
      crud.update(id, payload),

    remove: (id) =>
      crud.remove(id),
  };
}

function QuizSettingsForm({ quiz, moduleId, onSaved }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue(
      quiz || { title: "", score_minimal: 60, duration_minutes: 10 }
    );
  }, [quiz, form]);

  const save = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (quiz) {
        await api.admin.quizzes.update(quiz.id, values);
        message.success("Quiz mis à jour.");
      } else {
        await api.admin.quizzes.create({ ...values, module_id: moduleId });
        message.success("Quiz créé pour ce module.");
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      size="small"
      title={quiz ? "Réglages du quiz" : "Aucun quiz pour ce module — en créer un"}
      style={{ marginBottom: 24 }}
    >
      <Form form={form} layout="inline" onFinish={save}>
        <Form.Item name="title" label="Titre" rules={[{ required: true }]}>
          <Input style={{ width: 260 }} placeholder="Titre du quiz" />
        </Form.Item>
        <Form.Item name="score_minimal" label="Score minimal (%)" rules={[{ required: true }]}>
          <InputNumber min={0} max={100} />
        </Form.Item>
        <Form.Item name="duration_minutes" label="Durée (min)">
          <InputNumber min={0} />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={saving}
            icon={quiz ? <SaveOutlined /> : <PlusOutlined />}
          >
            {quiz ? "Enregistrer" : "Créer le quiz"}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default function ManageQuizzes() {
  const [trainings, setTrainings] = useState([]);
  const [modules, setModules] = useState([]);
  const [trainingId, setTrainingId] = useState(null);
  const [moduleId, setModuleId] = useState(null);
  const [quiz, setQuiz] = useState(undefined); // undefined = loading, null = none
  const [questions, setQuestions] = useState([]);
  const [questionId, setQuestionId] = useState(null);

  useEffect(() => {
    api.admin.trainings.list().then((rows) => {
      setTrainings(rows);
      if (rows.length) setTrainingId(rows[0].id);
    });
  }, []);

  useEffect(() => {
    if (trainingId == null) return;
    api.admin.modules.list().then((rows) => {
      const scoped = rows.filter((m) => m.training_id === trainingId);
      setModules(scoped);
      setModuleId(scoped[0]?.id ?? null);
    });
  }, [trainingId]);

  const loadQuiz = useCallback(async () => {
    if (moduleId == null) {
      setQuiz(null);
      return;
    }
    setQuiz(undefined);
    const all = await api.admin.quizzes.list();
    const found = all.find((q) => q.module_id === moduleId) || null;
    setQuiz(found);
  }, [moduleId]);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  const loadQuestions = useCallback(async () => {
    if (!quiz) {
      setQuestions([]);
      setQuestionId(null);
      return;
    }
    const all = await api.admin.questions.list();
    const scoped = all.filter((q) => q.quiz_id === quiz.id);
    setQuestions(scoped);
    setQuestionId(scoped[0]?.id ?? null);
  }, [quiz]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const trainingOptions = trainings.map((t) => ({ label: t.title, value: t.id }));
  const moduleOptions = modules.map((m) => ({ label: m.title, value: m.id }));

  const questionCrud = useMemo(
    () => (quiz ? scopedCrud(api.admin.questions, "quiz_id", quiz.id) : null),
    [quiz]
  );
 const choiceCrud = useMemo(
  () => {
    if (questionId == null) return null;

    return {
      ...scopedCrud(api.admin.choices, "question_id", questionId),

      list: async () => {
       const rows = await api.admin.choices.list();

console.log("QUESTION SÉLECTIONNÉE :", questionId);
console.log("TOUS LES CHOIX REÇUS :", rows);

console.table(
  rows.map((r) => ({
    id: r.id,
    text: r.text,
    question: r.question,
    question_id: r.question_id,
    is_correct: r.is_correct,
  }))
);

const filtered = rows.filter(
  (r) => String(r.question_id) === String(questionId)
);

console.log("CHOIX APRÈS FILTRE :", filtered);

return filtered;
      },
    };
  },
  [questionId]
);

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Quiz, questions &amp; choix
      </Typography.Title>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={24} md={12}>
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
        <Col xs={24} md={12}>
          <Card size="small" title="2. Module (chaque module a exactement 1 quiz)">
            <Select
              style={{ width: "100%" }}
              options={moduleOptions}
              value={moduleId}
              onChange={setModuleId}
              placeholder="Sélectionner un module"
              disabled={!moduleOptions.length}
            />
          </Card>
        </Col>
      </Row>

      {moduleId == null ? (
        <Empty description="Sélectionnez une formation puis un module." />
      ) : quiz === undefined ? null : (
        <>
          <QuizSettingsForm quiz={quiz} moduleId={moduleId} onSaved={loadQuiz} />

          {questionCrud ? (
            <div style={{ marginBottom: 32 }}>
              <ResourceTable
                key={`questions-${quiz.id}`}
                title="Questions du quiz"
                crud={questionCrud}
                searchKeys={["content"]}
                columns={[
                  { title: "Question", dataIndex: "content", ellipsis: true },
                  { title: "Ordre", dataIndex: "order", width: 90 },
                ]}
                fields={[
                  { name: "content", label: "Énoncé de la question", rules: [{ required: true }], component: <Input.TextArea rows={2} /> },
                  { name: "order", label: "Ordre", component: <InputNumber min={0} style={{ width: "100%" }} /> },
                ]}
                extraActions={(row) => (
                  <Button size="small" onClick={() => setQuestionId(row.id)}>
                    Choix →
                  </Button>
                )}
              />
            </div>
          ) : (
            <Empty description="Créez d'abord le quiz de ce module." />
          )}

          {choiceCrud ? (
            <>
              <Typography.Text type="secondary">
                Choix de réponse pour :{" "}
                <Tag color="orange">{questions.find((q) => q.id === questionId)?.content}</Tag>
              </Typography.Text>
              <div style={{ marginTop: 12 }}>
                <ResourceTable
                  key={`choices-${questionId}`}
                  title="Choix de réponse"
                  crud={choiceCrud}
                  columns={[
                    { title: "Texte", dataIndex: "text" },
                    {
                      title: "Correct",
                      dataIndex: "is_correct",
                      width: 100,
                      render: (v) => <Tag color={v ? "success" : "default"}>{v ? "Oui" : "Non"}</Tag>,
                    },
                  ]}
                  fields={[
                    { name: "text", label: "Texte du choix", rules: [{ required: true }], component: <Input /> },
                    { name: "is_correct", label: "Réponse correcte", valuePropName: "checked", component: <Switch /> },
                  ]}
                />
              </div>
            </>
          ) : (
            questions.length > 0 && <Empty description="Sélectionnez une question pour gérer ses choix." />
          )}
        </>
      )}
    </div>
  );
}
