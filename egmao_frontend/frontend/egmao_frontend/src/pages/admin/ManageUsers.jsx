import { Input, Select, Tag, Switch } from "antd";
import ResourceTable from "../../components/ResourceTable";
import { api } from "../../api/client";

export default function ManageUsers() {
  return (
    <ResourceTable
      title="Utilisateurs"
      crud={api.admin.users}
      searchKeys={["matricule", "username", "first_name", "last_name", "email"]}
      columns={[
        { title: "Matricule", dataIndex: "matricule" },
        { title: "Nom d'utilisateur", dataIndex: "username" },
        { title: "Nom", render: (_, r) => `${r.first_name} ${r.last_name}` },
        { title: "Email", dataIndex: "email" },
        {
          title: "Rôle",
          dataIndex: "role",
          render: (role) => (
            <Tag color={role === "ADMIN" ? "orange" : "blue"}>
              {role}
            </Tag>
          ),
        },
        {
          title: "Actif",
          dataIndex: "is_active",
          render: (v) => (
            <Tag color={v ? "success" : "default"}>
              {v ? "Oui" : "Non"}
            </Tag>
          ),
        },
      ]}
      fields={[
        {
          name: "matricule",
          label: "Matricule",
          rules: [{ required: true }],
          component: <Input />,
        },
        {
          name: "username",
          label: "Nom d'utilisateur",
          rules: [{ required: true }],
          component: <Input />,
        },
        {
          name: "first_name",
          label: "Prénom",
          rules: [{ required: true }],
          component: <Input />,
        },
        {
          name: "last_name",
          label: "Nom",
          rules: [{ required: true }],
          component: <Input />,
        },
        {
          name: "email",
          label: "Email",
          rules: [{ required: true, type: "email" }],
          component: <Input />,
        },
        {
          name: "password",
          label: "Mot de passe",
          rules: [{ required: true }],
          component: <Input.Password />,
        },
        {
          name: "role",
          label: "Rôle",
          rules: [{ required: true }],
          component: (
            <Select
              options={[
                { label: "Employé", value: "Employé" },
                { label: "Administrateur", value: "ADMIN" },
              ]}
            />
          ),
        },
        {
          name: "is_active",
          label: "Compte actif",
          valuePropName: "checked",
          component: <Switch />,
        },
      ]}
    />
  );
}