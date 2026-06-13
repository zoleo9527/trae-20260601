import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Input, Button, Space, Tag, Modal, Form, message } from 'antd';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { useStore } from '../../../contexts/AppContext';
import type { Position } from '../../../types';

const PositionList: React.FC = () => {
  const navigate = useNavigate();
  const { positions, user } = useStore();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [editingPosition, setEditingPosition] = React.useState<Position | null>(null);
  const [form] = Form.useForm();

  const myPositions = positions.filter((p) => p.recruiterId === user?.id);
  const filteredPositions = myPositions.filter((p) =>
    p.title.includes(searchTerm) || p.company.includes(searchTerm)
  );

  const columns = [
    {
      title: '岗位ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <span className="font-medium text-blue-600">{id}</span>,
    },
    {
      title: '岗位名称',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '企业',
      dataIndex: 'company',
      key: 'company',
    },
    {
      title: '薪资',
      dataIndex: 'salary',
      key: 'salary',
      render: (salary: string) => <span className="text-green-600 font-medium">{salary}</span>,
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'open' ? 'green' : 'gray'}>
          {status === 'open' ? '招聘中' : '已关闭'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Position) => (
        <Space>
          <Button
            type="link"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button type="link" danger icon={<Trash2 className="w-4 h-4" />}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleEdit = (position: Position) => {
    setEditingPosition(position);
    form.setFieldsValue(position);
    setIsModalVisible(true);
  };

  const handleAdd = () => {
    setEditingPosition(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (editingPosition) {
        message.success('岗位信息已更新');
      } else {
        message.success('岗位已发布');
      }
      setIsModalVisible(false);
    });
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">岗位管理</h2>
        <p className="text-gray-600 mt-1">管理您发布的招聘岗位</p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <Space>
            <Input
              placeholder="搜索岗位名称、企业"
              prefix={<Search className="w-4 h-4 text-gray-400" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </Space>
          <Button type="primary" icon={<Plus className="w-4 h-4" />} onClick={handleAdd}>
            发布新岗位
          </Button>
        </div>

        <Table
          dataSource={filteredPositions}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={editingPosition ? '编辑岗位' : '发布新岗位'}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="岗位名称" rules={[{ required: true }]}>
            <Input placeholder="请输入岗位名称" />
          </Form.Item>
          <Form.Item name="salary" label="薪资范围" rules={[{ required: true }]}>
            <Input placeholder="如: 5000-7000" />
          </Form.Item>
          <Form.Item name="location" label="工作地点" rules={[{ required: true }]}>
            <Input placeholder="请输入工作地点" />
          </Form.Item>
          <Form.Item name="requirements" label="岗位要求">
            <Input.TextArea rows={4} placeholder="请输入岗位要求" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PositionList;