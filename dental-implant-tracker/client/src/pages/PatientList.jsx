import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Select, Space, Steps, Table, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const PHASE_ORDER = ['film', 'consultation', 'surgery1', 'suture_removal', 'surgery2', 'crown'];
const PHASE_LABELS = { film: '拍片', consultation: '方案沟通', surgery1: '一期手术', suture_removal: '拆线', surgery2: '二期手术', crown: '戴牙冠' };

export default function PatientList() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async (keyword) => {
    setLoading(true);
    try {
      const params = {};
      if (keyword) params.search = keyword;
      const { data } = await api.get('/patients', { params });
      setPatients(Array.isArray(data) ? data : data.items || []);
    } catch {
      message.error('获取患者列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    fetchPatients(value);
  };

  const handleCreate = async (values) => {
    setSubmitting(true);
    try {
      await api.post('/patients', values);
      message.success('患者创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchPatients(search);
    } catch (err) {
      message.error(err.response?.data?.error || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const getProgressPhase = (nodes) => {
    if (!nodes || nodes.length === 0) return 0;
    let current = -1;
    for (let i = 0; i < PHASE_ORDER.length; i++) {
      const node = nodes.find((n) => n.node_type === PHASE_ORDER[i]);
      if (node && (node.status === 'completed')) {
        current = i;
      } else {
        break;
      }
    }
    return current + 1;
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <a onClick={() => navigate(`/patient/${record.id}`)}>{text}</a>
      ),
    },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      render: (v) => (v === 'male' ? '男' : v === 'female' ? '女' : v),
    },
    { title: '年龄', dataIndex: 'age', key: 'age' },
    {
      title: '治疗进度',
      key: 'progress',
      width: 320,
      render: (_, record) => {
        const nodes = record.treatment_nodes || [];
        const current = getProgressPhase(nodes);
        return (
          <Steps
            size="small"
            current={current}
            items={PHASE_ORDER.map((phase) => ({
              title: PHASE_LABELS[phase],
            }))}
          />
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/patient/${record.id}`)}>
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Input.Search
          placeholder="搜索姓名/电话"
          allowClear
          onSearch={handleSearch}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          新建患者
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={patients}
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
      />

      <Modal
        title="新建患者"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="phone" label="电话" rules={[{ required: true, message: '请输入电话' }]}>
            <Input placeholder="请输入电话" />
          </Form.Item>
          <Form.Item name="gender" label="性别" rules={[{ required: true, message: '请选择性别' }]}>
            <Select placeholder="请选择性别">
              <Select.Option value="male">男</Select.Option>
              <Select.Option value="female">女</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="age" label="年龄" rules={[{ required: true, message: '请输入年龄' }]}>
            <Input type="number" placeholder="请输入年龄" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
