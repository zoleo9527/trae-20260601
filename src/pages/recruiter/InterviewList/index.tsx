import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Input, Button, Space, Tag, Modal, Form, DatePicker, Select } from 'antd';
import { Search, Plus, Edit } from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';
import { useStore } from '../../../contexts/AppContext';
import type { Candidate } from '../../../types';

const RecruiterInterviewList: React.FC = () => {
  const navigate = useNavigate();
  const { candidates, positions, user } = useStore();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [form] = Form.useForm();

  const myCandidates = candidates.filter((c) => c.recruiterId === user?.id);
  const filteredCandidates = myCandidates.filter((c) =>
    c.name.includes(searchTerm) || c.phone.includes(searchTerm)
  );

  const columns = [
    {
      title: '候选人ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <span className="font-medium text-blue-600">{id}</span>,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '岗位',
      dataIndex: 'positionId',
      key: 'positionId',
      render: (positionId: string) => {
        const position = positions.find((p) => p.id === positionId);
        return position ? position.title : positionId;
      },
    },
    {
      title: '面试日期',
      dataIndex: 'interviewDate',
      key: 'interviewDate',
    },
    {
      title: '面试状态',
      dataIndex: 'interviewStatus',
      key: 'interviewStatus',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          'pending': 'orange',
          'passed': 'green',
          'failed': 'red',
        };
        const textMap: Record<string, string> = {
          'pending': '待面试',
          'passed': '已通过',
          'failed': '未通过',
        };
        return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status}</Tag>;
      },
    },
    {
      title: '入职状态',
      dataIndex: 'onboardStatus',
      key: 'onboardStatus',
      render: (status: string) => {
        if (!status) return <span className="text-gray-400">-</span>;
        const colorMap: Record<string, string> = {
          'pending': 'orange',
          'onboarded': 'green',
          'left': 'red',
        };
        const textMap: Record<string, string> = {
          'pending': '待入职',
          'onboarded': '已入职',
          'left': '已离职',
        };
        return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Candidate) => (
        <Space>
          <Button
            type="link"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => handleEdit(record)}
          >
            更新状态
          </Button>
        </Space>
      ),
    },
  ];

  const handleEdit = (candidate: Candidate) => {
    form.setFieldsValue({
      interviewStatus: candidate.interviewStatus,
      onboardStatus: candidate.onboardStatus,
    });
    setIsModalVisible(true);
  };

  const handleAdd = () => {
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
        <h2 className="text-2xl font-bold text-gray-800">面试名单</h2>
        <p className="text-gray-600 mt-1">管理面试候选人信息</p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <Space>
            <Input
              placeholder="搜索候选人姓名、电话"
              prefix={<Search className="w-4 h-4 text-gray-400" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Select
              placeholder="面试状态"
              options={[
                { label: '全部', value: 'all' },
                { label: '待面试', value: 'pending' },
                { label: '已通过', value: 'passed' },
                { label: '未通过', value: 'failed' },
              ]}
              className="w-32"
            />
          </Space>
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleAdd}
          >
            添加候选人
          </Button>
        </div>

        <Table
          dataSource={filteredCandidates}
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
        title="更新候选人状态"
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="interviewStatus" label="面试状态">
            <Select
              options={[
                { label: '待面试', value: 'pending' },
                { label: '已通过', value: 'passed' },
                { label: '未通过', value: 'failed' },
              ]}
            />
          </Form.Item>
          <Form.Item name="onboardStatus" label="入职状态">
            <Select
              options={[
                { label: '待入职', value: 'pending' },
                { label: '已入职', value: 'onboarded' },
                { label: '已离职', value: 'left' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RecruiterInterviewList;