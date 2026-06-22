import React, { useEffect, useState } from 'react';
import {
  Table, Card, Space, Button, Tag, Input, Modal, Form, App,
  Tooltip, Avatar
} from 'antd';
import {
  SearchOutlined, EyeOutlined, TeamOutlined, PlusOutlined,
  UserOutlined, PhoneOutlined, HomeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';

const Customers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const fetchData = () => {
    setLoading(true);
    api.get('/customers', { params: { keyword } }).then(setData).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = () => {
    form.validateFields().then(values => {
      api.post('/customers', values).then(() => {
        message.success('客户添加成功');
        setCreateModal(false);
        form.resetFields();
        fetchData();
      });
    });
  };

  const columns = [
    {
      title: '客户',
      render: (_, r) => (
        <Space>
          <Avatar style={{ background: '#1677ff' }} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>
              {r.name}
              <Tag color="blue" style={{ marginLeft: 8 }}>{r.gas_account}</Tag>
            </div>
            <div style={{ color: '#999', fontSize: 12 }}>
              <PhoneOutlined /> {r.phone}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: '详细地址',
      render: (_, r) => (
        <div style={{ color: 'rgba(0,0,0,0.7)' }}>
          <HomeOutlined style={{ color: '#999', marginRight: 4 }} />
          {r.community || ''} {r.building_no || ''} {r.room_no || ''}
          <div style={{ color: '#999', fontSize: 12, marginTop: 2 }}>{r.address}</div>
        </div>
      )
    },
    {
      title: '所属小区', dataIndex: 'community', width: 140,
      render: t => t || <span style={{ color: '#999' }}>—</span>
    },
    {
      title: '操作', width: 150, fixed: 'right',
      render: (_, r) => (
        <Space>
          <Tooltip title="查看完整档案">
            <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/customers/${r.id}`)}>
              档案详情
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <TeamOutlined style={{ color: '#1677ff', marginRight: 8 }} />
          客户档案管理
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
          新增客户
        </Button>
      </div>

      <div className="filter-bar">
        <Space>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索姓名/电话/地址/燃气账户"
            style={{ width: 360 }}
            allowClear
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={fetchData}>查询</Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          scroll={{ x: 900 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `共 ${t} 位客户` }}
        />
      </Card>

      <Modal
        title="新增客户档案"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        onOk={handleCreate}
        width={560}
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="name" label="客户姓名" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="姓名" />
            </Form.Item>
            <Form.Item name="phone" label="联系电话" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="手机号" />
            </Form.Item>
          </div>
          <Form.Item name="gas_account" label="燃气账户号">
            <Input placeholder="如：GAS0010001" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="community" label="小区名称" style={{ flex: 1 }}>
              <Input placeholder="如：望京新城A区" />
            </Form.Item>
            <Form.Item name="building_no" label="楼栋" style={{ flex: 1 }}>
              <Input placeholder="如：1号楼" />
            </Form.Item>
            <Form.Item name="room_no" label="室号" style={{ flex: 1 }}>
              <Input placeholder="如：501" />
            </Form.Item>
          </div>
          <Form.Item name="address" label="完整地址" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="完整通信地址" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Customers;
