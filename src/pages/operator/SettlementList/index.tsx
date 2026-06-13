import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Input, Select, Button, Space } from 'antd';
import { Search, Filter } from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';
import { useStore } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/helpers';
import type { Settlement } from '../../../types';

const OperatorSettlementList: React.FC = () => {
  const navigate = useNavigate();
  const { settlements } = useStore();

  const pendingSettlements = settlements.filter(
    (s) => s.status === 'pending_operator_review'
  );

  const columns = [
    {
      title: '结算单ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <span className="font-medium text-blue-600">{id}</span>
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
      title: '招聘顾问',
      dataIndex: 'recruiterName',
      key: 'recruiterName',
    },
    {
      title: '候选人数量',
      dataIndex: 'candidates',
      key: 'candidates',
      render: (candidates: any[]) => (
        <span className="font-medium">{candidates.length}人</span>
      ),
    },
    {
      title: '结算金额',
      dataIndex: 'settlementAmount',
      key: 'settlementAmount',
      render: (amount: number) => (
        <span className="font-bold text-blue-600">{formatCurrency(amount)}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge status={status} type="settlement" />,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Settlement) => (
        <Button
          type="link"
          onClick={() => navigate(`/operator/settlements/${record.id}`)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">返费结算审核</h2>
        <p className="text-gray-600 mt-1">审核招聘顾问发起的返费结算申请</p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <Space>
            <Input
              placeholder="搜索结算单ID、岗位、企业"
              prefix={<Search className="w-4 h-4 text-gray-400" />}
              className="w-64"
            />
            <Select
              placeholder="状态筛选"
              options={[
                { label: '全部', value: 'all' },
                { label: '待审核', value: 'pending_operator_review' },
                { label: '已完成', value: 'completed' },
                { label: '已驳回', value: 'rejected' },
                { label: '异常申诉中', value: 'appealing' },
              ]}
              className="w-32"
            />
            <Button icon={<Filter className="w-4 h-4" />}>筛选</Button>
          </Space>
          <div className="text-sm text-gray-600">
            共 <span className="font-medium text-gray-800">{pendingSettlements.length}</span> 条待审核
          </div>
        </div>

        <Table
          dataSource={settlements}
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

export default OperatorSettlementList;