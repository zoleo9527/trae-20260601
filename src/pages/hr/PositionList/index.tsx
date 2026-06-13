import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Input, Button, Space, Tag, Modal, Form, Input as AntInput } from 'antd';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { useStore } from '../../../contexts/AppContext';
import type { Position } from '../../../types';

const HrPositionList: React.FC = () => {
  const navigate = useNavigate();
  const { positions, user } = useStore();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [editingPosition, setEditingPosition] = React.useState<Position | null>(null);
  const [form] = Form.useForm();

  const getCompaniesForUser = (hrId: string): string[] => {
    if (hrId === 'user-003') {
      return [
        '深圳XX电子科技有限公司',
        '上海XX餐饮管理有限公司',
        '东莞XX制造有限公司',
        '成都XX清洁服务有限公司',
      ];
    }
    if (hrId === 'user-005') {
      return [
        '广州XX物流有限公司',
        '北京XX科技有限公司',
        '武汉XX餐饮有限公司',
        '天津XX运输有限公司',
        '南京XX物业管理有限公司',
      ];
    }
    return [];
  };

  const userCompanies = getCompaniesForUser(user?.id || '');
  const myPositions = positions.filter((p) => userCompanies.includes(p.company));
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
      title: '招聘顾问',
      dataIndex: 'recruiterName',
      key: 'recruiterName',
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
          <Button type="link" icon={<Edit className="w-4 h-4" />} onClick={() => handleEdit(record)}>
            编辑
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
      setIsModalVisible(false);
    });
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">岗位需求</h2>
        <p className="text-gray-600 mt-1">管理企业岗位需求信息</p>
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
            发布岗位需求
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
        title="发布岗位需求"
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        okText="发布"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="岗位名称" rules={[{ required: true }]}>
            <AntInput placeholder="请输入岗位名称" />
          </Form.Item>
          <Form.Item name="salary" label="薪资范围" rules={[{ required: true }]}>
            <AntInput placeholder="如: 5000-7000" />
          </Form.Item>
          <Form.Item name="location" label="工作地点" rules={[{ required: true }]}>
            <AntInput placeholder="请输入工作地点" />
          </Form.Item>
          <Form.Item name="requirements" label="岗位要求">
            <AntInput.TextArea rows={4} placeholder="请输入岗位要求" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HrPositionList;
