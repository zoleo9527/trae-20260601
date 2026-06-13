import React from 'react';
import { Table, Card, Input, Button, Space, Tag, Upload, message } from 'antd';
import { Search, CheckCircle, Upload as UploadIcon } from 'lucide-react';
import { useStore } from '../../../contexts/AppContext';
import type { Candidate } from '../../../types';

const HrOnboardingList: React.FC = () => {
  const { candidates, positions, user } = useStore();
  const [searchTerm, setSearchTerm] = React.useState('');

  const passedCandidates = candidates.filter((c) => c.interviewStatus === 'passed');
  const filteredCandidates = passedCandidates.filter((c) =>
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
      title: '入职日期',
      dataIndex: 'onboardDate',
      key: 'onboardDate',
      render: (date: string) => date || <span className="text-gray-400">待入职</span>,
    },
    {
      title: '入职状态',
      dataIndex: 'onboardStatus',
      key: 'onboardStatus',
      render: (status: string) => {
        if (!status) return <Tag color="orange">待入职</Tag>;
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
          {!record.onboardStatus || record.onboardStatus === 'pending' ? (
            <>
              <Button
                type="link"
                icon={<CheckCircle className="w-4 h-4" />}
                onClick={() => message.info('确认入职功能')}
              >
                确认入职
              </Button>
              <Button
                type="link"
                icon={<UploadIcon className="w-4 h-4" />}
                onClick={() => message.info('上传入职证明功能')}
              >
                上传证明
              </Button>
            </>
          ) : (
            <span className="text-gray-400">已处理</span>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">入职确认</h2>
        <p className="text-gray-600 mt-1">确认候选人入职状态并上传入职证明</p>
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
            <Tag color="orange">待入职: {passedCandidates.filter((c) => !c.onboardStatus || c.onboardStatus === 'pending').length}</Tag>
            <Tag color="green">已入职: {passedCandidates.filter((c) => c.onboardStatus === 'onboarded').length}</Tag>
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
    </div>
  );
};

export default HrOnboardingList;