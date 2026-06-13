import React from 'react';
import { Table, Tag } from 'antd';
import type { SettlementCandidate } from '../../types';

interface CandidateTableProps {
  candidates: SettlementCandidate[];
}

const CandidateTable: React.FC<CandidateTableProps> = ({ candidates }) => {
  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span className="font-medium">{name}</span>,
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
  ];

  return (
    <Table
      dataSource={candidates}
      columns={columns}
      pagination={false}
      rowKey={(record) => `${record.name}-${record.phone}`}
      className="bg-white rounded-lg shadow-sm"
    />
  );
};

export default CandidateTable;