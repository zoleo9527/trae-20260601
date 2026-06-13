import React from 'react';
import { Card, Table, Tag } from 'antd';
import type { Settlement } from '../../types';
import StatusBadge from '../common/StatusBadge';
import { formatCurrency } from '../../utils/helpers';

interface SettlementCardProps {
  settlement: Settlement;
  onClick?: () => void;
}

const SettlementCard: React.FC<SettlementCardProps> = ({ settlement, onClick }) => {
  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{settlement.position}</h3>
            <p className="text-sm text-gray-600">{settlement.company}</p>
          </div>
          <StatusBadge status={settlement.status} type="settlement" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">招聘顾问</p>
            <p className="text-sm font-medium text-gray-800">{settlement.recruiterName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">企业HR</p>
            <p className="text-sm font-medium text-gray-800">{settlement.hrName || '待确认'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500">候选人数量</p>
            <p className="text-sm font-medium text-gray-800">{settlement.candidates.length}人</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">结算金额</p>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(settlement.settlementAmount)}</p>
          </div>
        </div>

        <Table
          dataSource={settlement.candidates}
          columns={[
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
              title: '面试日期',
              dataIndex: 'interviewDate',
              key: 'interviewDate',
            },
            {
              title: '入职日期',
              dataIndex: 'onboardDate',
              key: 'onboardDate',
            },
            {
              title: '状态',
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => {
                const colorMap: Record<string, string> = {
                  '已入职': 'green',
                  '已离职': 'red',
                  '待入职': 'orange',
                };
                return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
              },
            },
          ]}
          pagination={false}
          size="small"
        />
      </div>
    </Card>
  );
};

export default SettlementCard;