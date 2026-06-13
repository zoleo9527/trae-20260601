import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Input, Select, Button, Space } from 'antd';
import { Search, Filter } from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';
import { useStore } from '../../../contexts/AppContext';
import type { Appeal } from '../../../types';

const RecruiterAppealList: React.FC = () => {
  const navigate = useNavigate();
  const { appeals, user } = useStore();

  const myAppeals = appeals.filter((a) => a.recruiterId === user?.id);

  const columns = [
    {
      title: '申诉ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <span className="font-medium text-blue-600">{id}</span>
      ),
    },
    {
      title: '关联结算单',
      dataIndex: 'settlementId',
      key: 'settlementId',
      render: (id: string) => (
        <span className="font-medium text-gray-600">{id}</span>
      ),
    },
    {
      title: '岗位',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: '企业',
      dataIndex: 'company',
      key: 'company',
    },
    {
      title: '企业HR',
      dataIndex: 'hrName',
      key: 'hrName',
    },
    {
      title: '申诉原因',
      dataIndex: 'appealReason',
      key: 'appealReason',
      render: (reason: string) => (
        <span className="text-orange-600">{reason}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge status={status} type="appeal" />,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Appeal) => (
        <Button
          type="link"
          onClick={() => navigate(`/recruiter/appeals/${record.id}`)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">异常申诉</h2>
        <p className="text-gray-600 mt-1">查看企业HR发起的异常申诉并补充说明</p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <Space>
            <Input
              placeholder="搜索申诉ID、岗位、企业"
              prefix={<Search className="w-4 h-4 text-gray-400" />}
              className="w-64"
            />
            <Select
              placeholder="状态筛选"
              options={[
                { label: '全部', value: 'all' },
                { label: '待补充说明', value: 'pending_recruiter_response' },
                { label: '待运营仲裁', value: 'pending_operator_arbitration' },
                { label: '已解决', value: 'resolved' },
                { label: '已驳回', value: 'rejected' },
              ]}
              className="w-32"
            />
            <Button icon={<Filter className="w-4 h-4" />}>筛选</Button>
          </Space>
          <div className="text-sm text-gray-600">
            共 <span className="font-medium text-gray-800">{myAppeals.length}</span> 条申诉
          </div>
        </div>

        <Table
          dataSource={myAppeals}
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

export default RecruiterAppealList;