import { LinkOutlined, PlusOutlined, SearchOutlined, UnlockOutlined } from '@ant-design/icons';
import {
    Badge,
    Button,
    Card,
    Form,
    Input,
    InputNumber,
    Modal,
    Select,
    Space,
    Table, Tabs,
    message
} from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const STATUS_LABELS = { available: '可用', locked: '已锁定', used: '已使用', expired: '已过期' };
const STATUS_COLORS = { available: 'green', locked: 'orange', used: 'blue', expired: 'red' };

export default function Consumables() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || '';

  const [consumables, setConsumables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addForm] = Form.useForm();
  const [lockForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchConsumables();
  }, [category, status]);

  const fetchConsumables = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'all') params.category = category;
      if (status) params.status = status;
      if (search) params.search = search;
      const { data } = await api.get('/consumables', { params });
      setConsumables(Array.isArray(data) ? data : data.items || []);
    } catch {
      message.error('获取耗材列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    fetchConsumables();
  };

  const handleAdd = async (values) => {
    setSubmitting(true);
    try {
      await api.post('/consumables', values);
      message.success('耗材添加成功');
      setAddModalOpen(false);
      addForm.resetFields();
      fetchConsumables();
    } catch (err) {
      message.error(err.response?.data?.error || '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (values) => {
    setSubmitting(true);
    try {
      await api.put(`/consumables/${selectedItem.id}`, values);
      message.success('耗材更新成功');
      setEditModalOpen(false);
      fetchConsumables();
    } catch (err) {
      message.error(err.response?.data?.error || '更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLock = async (values) => {
    setSubmitting(true);
    try {
      await api.post(`/consumables/${selectedItem.id}/lock`, { patient_id: values.patient_id });
      message.success('耗材已锁定');
      setLockModalOpen(false);
      lockForm.resetFields();
      fetchConsumables();
    } catch (err) {
      message.error(err.response?.data?.error || '锁定失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlock = async (item) => {
    Modal.confirm({
      title: '确认解锁',
      content: `确定要解锁「${item.name}」吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.post(`/consumables/${item.id}/unlock`);
          message.success('已解锁');
          fetchConsumables();
        } catch (err) {
          message.error(err.response?.data?.error || '解锁失败');
        }
      },
    });
  };

  const handleMarkUsed = async (item) => {
    Modal.confirm({
      title: '确认标记为已使用',
      content: `确定要将「${item.name}」标记为已使用吗？此操作不可撤销。`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.post(`/consumables/${item.id}/use`);
          message.success('已标记为已使用');
          fetchConsumables();
        } catch (err) {
          message.error(err.response?.data?.error || '操作失败');
        }
      },
    });
  };

  const handleMarkExpired = async (item) => {
    Modal.confirm({
      title: '确认标记为已过期',
      content: `确定要将「${item.name}」标记为过期吗？`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api.put(`/consumables/${item.id}`, { status: 'expired' });
          message.success('已标记为过期');
          fetchConsumables();
        } catch (err) {
          message.error(err.response?.data?.error || '操作失败');
        }
      },
    });
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 120 },
    { title: '型号', dataIndex: 'model', key: 'model', width: 100 },
    { title: '批次号', dataIndex: 'batch_no', key: 'batch_no', width: 120 },
    {
      title: '库存/锁定/已用',
      key: 'stock',
      width: 120,
      render: (_, r) => (
        <span>{r.stock_qty || 0} / {r.locked_qty || 0} / {r.used_qty || 0}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v) => <Badge status={STATUS_COLORS[v] === 'green' ? 'success' : STATUS_COLORS[v] === 'orange' ? 'warning' : STATUS_COLORS[v] === 'red' ? 'error' : 'processing'} text={STATUS_LABELS[v] || v} />,
    },
    {
      title: '关联患者',
      key: 'patient',
      width: 100,
      render: (_, r) => r.patient_id ? (
        <a onClick={() => navigate(`/patient/${r.patient_id}`)}>患者ID: {r.patient_id}</a>
      ) : '-',
    },
    { title: '位置', dataIndex: 'location', key: 'location', width: 80 },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => {
        const actions = [];
        if (record.status === 'available') {
          if (role === 'doctor' || role === 'frontdesk') {
            actions.push(
              <Button key="lock" type="link" size="small" icon={<LinkOutlined />} onClick={() => { setSelectedItem(record); setLockModalOpen(true); }}>
                锁定
              </Button>
            );
          }
          if (role === 'warehouse') {
            actions.push(
              <Button key="edit" type="link" size="small" onClick={() => { setSelectedItem(record); editForm.setFieldsValue(record); setEditModalOpen(true); }}>
                编辑
              </Button>
            );
          }
        }
        if (record.status === 'locked') {
          if (role === 'doctor' || role === 'frontdesk') {
            actions.push(
              <Button key="unlock" type="link" size="small" icon={<UnlockOutlined />} onClick={() => handleUnlock(record)}>
                解锁
              </Button>
            );
          }
          if (role === 'doctor') {
            actions.push(
              <Button key="use" type="link" size="small" onClick={() => handleMarkUsed(record)}>
                标记使用
              </Button>
            );
          }
        }
        if (role === 'warehouse' && record.status !== 'expired' && record.status !== 'used') {
          actions.push(
            <Button key="expire" danger type="link" size="small" onClick={() => handleMarkExpired(record)}>
              标记过期
            </Button>
          );
        }
        return <Space size={0}>{actions}</Space>;
      },
    },
  ];

  const tabItems = [
    { key: 'all', label: '全部' },
    { key: 'implant', label: '种植体' },
    { key: 'abutment', label: '基台' },
    { key: 'crown', label: '牙冠' },
    { key: 'tool', label: '工具' },
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <Space wrap>
            <Input.Search
              placeholder="搜索名称/型号/批次"
              allowClear
              onSearch={handleSearch}
              style={{ width: 240 }}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 120 }}
              value={status || undefined}
              onChange={(v) => setStatus(v || '')}
            >
              <Select.Option value="available">可用</Select.Option>
              <Select.Option value="locked">已锁定</Select.Option>
              <Select.Option value="used">已使用</Select.Option>
              <Select.Option value="expired">已过期</Select.Option>
            </Select>
          </Space>
          {role === 'warehouse' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
              添加耗材
            </Button>
          )}
        </div>

        <Tabs activeKey={category} onChange={setCategory} items={tabItems} />

        <Table
          rowKey="id"
          columns={columns}
          dataSource={consumables}
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          scroll={{ x: 930 }}
        />
      </Card>

      <Modal
        title="添加耗材"
        open={addModalOpen}
        onCancel={() => { setAddModalOpen(false); addForm.resetFields(); }}
        onOk={() => addForm.submit()}
        confirmLoading={submitting}
        okText="添加"
        cancelText="取消"
        width={560}
      >
        <Form form={addForm} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="model" label="型号" rules={[{ required: true, message: '请输入型号' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="batch_no" label="批次号" rules={[{ required: true, message: '请输入批次号' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select>
              <Select.Option value="implant">种植体</Select.Option>
              <Select.Option value="abutment">基台</Select.Option>
              <Select.Option value="crown">牙冠</Select.Option>
              <Select.Option value="tool">工具</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="stock_qty" label="数量" rules={[{ required: true, message: '请输入数量' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="unit" label="单位">
            <Input placeholder="如：个、套" />
          </Form.Item>
          <Form.Item name="location" label="存放位置">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="锁定耗材到患者"
        open={lockModalOpen}
        onCancel={() => { setLockModalOpen(false); lockForm.resetFields(); }}
        onOk={() => lockForm.submit()}
        confirmLoading={submitting}
        okText="锁定"
        cancelText="取消"
      >
        <div style={{ marginBottom: 12 }}>
          <strong>耗材：</strong>{selectedItem?.name} ({selectedItem?.model})
        </div>
        <Form form={lockForm} layout="vertical" onFinish={handleLock}>
          <Form.Item name="patient_id" label="患者ID" rules={[{ required: true, message: '请输入患者ID' }]}>
            <Input placeholder="请输入患者ID" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑耗材"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => editForm.submit()}
        confirmLoading={submitting}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="model" label="型号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="batch_no" label="批次号">
            <Input />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select>
              <Select.Option value="implant">种植体</Select.Option>
              <Select.Option value="abutment">基台</Select.Option>
              <Select.Option value="crown">牙冠</Select.Option>
              <Select.Option value="tool">工具</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="stock_qty" label="库存数量">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="unit" label="单位">
            <Input />
          </Form.Item>
          <Form.Item name="location" label="存放位置">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
