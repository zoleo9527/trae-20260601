import React from 'react';
import { Table, Card, Input, Button, Space, Tag, Modal, Form, Select } from 'antd';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { useStore } from '../../../contexts/AppContext';
import type { Candidate } from '../../../types';

const HrInterviewList: React.FC = () => {
  const { candidates, positions, user } = useStore();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [selectedCandidate, setSelectedCandidate] = React.useState<Candidate | null>(null);
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
  const myCandidates = candidates.filter((c) => {
    const candidatePosition = positions.find((p) => p.id === c.positionId);
    return candidatePosition && userCompanies.includes(candidatePosition.company);
  });
  const pendingCandidates = myCandidates.filter((c) => c.interviewStatus === 'pending');
  const filteredCandidates = pendingCandidates.filter((c) =>
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
      title: '招聘顾问',
      dataIndex: 'recruiterName',
      key: 'recruiterName',
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
      title: '操作',
      key: 'action',
      render: (_: any, record: Candidate) => (
        <Space>
          <Button
            type="link"
            icon={<CheckCircle className="w-4 h-4" />}
            onClick={() => handleConfirm(record, 'passed')}
          >
            确认通过
          </Button>
          <Button
            type="link"
            danger
            icon={<XCircle className="w-4 h-4" />}
            onClick={() => handleConfirm(record, 'failed')}
          >
            确认未通过
          </Button>
        </Space>
      ),
    },
  ];

  const handleConfirm = (candidate: Candidate, status: 'passed' | 'failed') => {
    setSelectedCandidate(candidate);
    form.setFieldsValue({ interviewStatus: status });
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
        <h2 className="text-2xl font-bold text-gray-800">面试确认</h2>
        <p className="text-gray-600 mt-1">确认面试候选人状态</p>
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
            <Tag color="orange">待确认: {pendingCandidates.length}</Tag>
          </Space>
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
        title="确认面试结果"
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="interviewStatus" label="面试结果">
            <Select
              options={[
                { label: '已通过', value: 'passed' },
                { label: '未通过', value: 'failed' },
              ]}
            />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={4} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HrInterviewList;
