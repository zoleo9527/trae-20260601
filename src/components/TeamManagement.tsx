import { useState } from 'react';
import { Table, Tag, Button, Modal, Form, Input, Space, message, Select } from 'antd';
import type { ColumnType } from 'antd/es/table';
import { PlusOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import { mockUsers } from '@/data/seedData';
import { ROLE_MAP } from '@/types';
import type { Role } from '@/types';

export function TeamManagement() {
  const [users, setUsers] = useState(mockUsers);
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const handleSubmit = () => {
    const values = form.getFieldsValue();
    const newUser = {
      id: `u${Date.now()}`,
      name: values.name,
      role: values.role as Role,
      phone: values.phone,
    };
    setUsers([...users, newUser]);
    message.success('人员添加成功');
    setShowModal(false);
    form.resetFields();
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchText.toLowerCase()) ||
    user.phone.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: ColumnType<typeof mockUsers[0]>[] = [
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100, render: (name: string) => (
      <span className="flex items-center gap-2">
        <UserOutlined size={18} />
        {name}
      </span>
    )},
    { title: '角色', dataIndex: 'role', key: 'role', width: 100, render: (role: Role) => (
      <Tag color={role === 'warehouse_manager' ? 'blue' : role === 'driver' ? 'green' : 'orange'}>
        {ROLE_MAP[role]}
      </Tag>
    )},
    { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 120 },
    { title: '操作', key: 'action', width: 100, render: () => (
      <Button type="link">编辑</Button>
    )},
  ];

  const stats = {
    total: users.length,
    managers: users.filter(u => u.role === 'warehouse_manager').length,
    drivers: users.filter(u => u.role === 'driver').length,
    cs: users.filter(u => u.role === 'customer_service').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">团队管理</h2>
          <Space>
            <Tag color="default">总人数: {stats.total}</Tag>
            <Tag color="blue">仓库主管: {stats.managers}</Tag>
            <Tag color="green">司机: {stats.drivers}</Tag>
            <Tag color="orange">客服: {stats.cs}</Tag>
          </Space>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="搜索姓名或电话" 
              className="pl-10 w-64"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowModal(true)}>
            新增人员
          </Button>
        </div>
      </div>

      <Table
        dataSource={filteredUsers}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 15 }}
      />

      <Modal title="新增人员" open={showModal} onCancel={() => setShowModal(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="姓名" name="name" rules={[{ required: true }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item label="角色" name="role" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="warehouse_manager">仓库主管</Select.Option>
              <Select.Option value="driver">司机</Select.Option>
              <Select.Option value="customer_service">客服</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="联系电话" name="phone" rules={[{ required: true, pattern: /^1[3-9]\d{9}$/ }]}>
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item className="flex justify-end">
            <Space>
              <Button onClick={() => setShowModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认添加</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}