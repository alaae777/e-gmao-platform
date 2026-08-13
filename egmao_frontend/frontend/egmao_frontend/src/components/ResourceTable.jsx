import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Space, Popconfirm, Typography, message, Input } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";

/**
 * Generic admin CRUD table: list + create/edit modal (form built from
 * `fields`) + delete confirmation. Used by every "Manage X" admin page
 * so behaviour and UX stay identical across resources.
 *
 * @param title      
 * @param crud          
 * @param columns       
 * @param fields        
 * @param searchKeys   
 * @param transformIn   
 * @param transformOut  
 * @param extraActions  
 */
export default function ResourceTable({
  title,
  crud,
  columns,
  fields,
  searchKeys = [],
  transformIn = (r) => r,
  transformOut = (v) => v,
  extraActions,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    const data = await crud.list();
    setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load intentionally runs once on mount
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

 const openEdit = (row) => {
  setEditing(row);

  const values = transformIn(row);

  // Corriger les champs Upload
  fields.forEach((f) => {
    if (f.valuePropName === "fileList") {
      values[f.name] = [];
    }
  });

  form.setFieldsValue(values);
  setModalOpen(true);
};

  const save = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = transformOut(values);
      if (editing) {
        await crud.update(editing.id, payload);
        message.success("Modifié avec succès.");
      } else {
        await crud.create(payload);
        message.success("Créé avec succès.");
      }
      setModalOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    await crud.remove(row.id);
    message.success("Supprimé.");
    load();
  };

  const filteredRows = search
    ? rows.filter((r) =>
        searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(search.toLowerCase()))
      )
    : rows;

  const actionColumn = {
    title: "Actions",
    key: "actions",
    width: 140,
    render: (_, row) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
        <Popconfirm title="Confirmer la suppression ?" onConfirm={() => remove(row)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
        {extraActions?.(row)}
      </Space>
    ),
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Ajouter
        </Button>
      </div>

      {searchKeys.length > 0 && (
        <Input
          allowClear
          placeholder="Rechercher..."
          prefix={<SearchOutlined />}
          style={{ maxWidth: 300, marginBottom: 16 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      <Table
        rowKey="id"
        loading={loading}
        columns={[...columns, actionColumn]}
        dataSource={filteredRows}
        pagination={{ pageSize: 8 }}
      />

      <Modal
        title={editing ? "Modifier" : "Ajouter"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={save}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form layout="vertical" form={form}>
          {fields.map((f) => (
           <Form.Item
  key={f.name}
  name={f.name}
  label={f.label}
  rules={f.rules}
  valuePropName={f.valuePropName}
  getValueFromEvent={f.getValueFromEvent}
>
  {f.component}
</Form.Item>
          ))}
        </Form>
      </Modal>
    </div>
  );
}
