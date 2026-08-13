import { Input } from "antd";
import ResourceTable from "../../components/ResourceTable";
import { api } from "../../api/client";

export default function ManageCategories() {
  return (
    <ResourceTable
      title="Catégories"
      crud={api.admin.categories}
      searchKeys={["name"]}
      columns={[
        { title: "Nom", dataIndex: "name" },
        { title: "Description", dataIndex: "description", ellipsis: true },
      ]}
      fields={[
        { name: "name", label: "Nom", rules: [{ required: true }], component: <Input /> },
        { name: "description", label: "Description", component: <Input.TextArea rows={3} /> },
      ]}
    />
  );
}
