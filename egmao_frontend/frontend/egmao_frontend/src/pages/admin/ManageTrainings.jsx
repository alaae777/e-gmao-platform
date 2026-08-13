import { useEffect, useState } from "react";
import { Input, Select, InputNumber, Tag } from "antd";
import ResourceTable from "../../components/ResourceTable";
import { api } from "../../api/client";

export default function ManageTrainings() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.admin.categories.list().then(setCategories);
  }, []);

  const categoryOptions = categories.map((c) => ({ label: c.name, value: c.id }));
  const categoryName = (id) => categories.find((c) => c.id === id)?.name || "—";

  return (
    <ResourceTable
      title="Formations"
      crud={api.admin.trainings}
      searchKeys={["title"]}
      columns={[
        { title: "Titre", dataIndex: "title" },
        { title: "Catégorie", render: (_, r) => categoryName(r.category_id) },
        {
          title: "Niveau",
          dataIndex: "level",
          render: (l) => <Tag>{{ BEGINNER: "Débutant", INTERMEDIATE: "Intermédiaire", ADVANCED: "Avancé" }[l] || l}</Tag>,
        },
        { title: "Ordre", dataIndex: "order", width: 80 },
      ]}
      fields={[
        { name: "title", label: "Titre", rules: [{ required: true }], component: <Input /> },
        { name: "description", label: "Description", component: <Input.TextArea rows={3} /> },
        {
          name: "category_id",
          label: "Catégorie",
          rules: [{ required: true }],
          component: <Select options={categoryOptions} />,
        },
        {
          name: "level",
          label: "Niveau",
          rules: [{ required: true }],
          component: (
            <Select
              options={[
                { label: "Débutant", value: "BEGINNER" },
                { label: "Intermédiaire", value: "INTERMEDIATE" },
                { label: "Avancé", value: "ADVANCED" },
              ]}
            />
          ),
        },
        {
          name: "duration_estimated_minutes",
          label: "Durée estimée (minutes)",
          component: <InputNumber min={0} style={{ width: "100%" }} />,
        },
        { name: "order", label: "Ordre d'affichage", component: <InputNumber min={0} style={{ width: "100%" }} /> },
      ]}
    />
  );
}
