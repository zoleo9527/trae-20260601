import { useState } from 'react'
import { Table, Tag, Card, Row, Col, Empty, Select } from 'antd'
import type { WorkflowRecord, LoanApplication, Status } from '@/types'
import { statusMap } from '@/utils/statusMap'

interface WorkflowProps {
  workflowRecords: WorkflowRecord[]
  applications: LoanApplication[]
}

export function Workflow({ workflowRecords, applications }: WorkflowProps) {
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)

  const filteredRecords = selectedApplicationId
    ? workflowRecords.filter(r => r.applicationId === selectedApplicationId)
    : workflowRecords

  const columns = [
    {
      title: '流程编号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: '申请编号',
      dataIndex: 'applicationId',
      key: 'applicationId',
      width: 120,
      render: (text: string) => {
        const app = applications.find(a => a.id === text)
        return app ? `${text} (${app.applicantName})` : text
      },
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 120,
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
    },
    {
      title: '操作时间',
      dataIndex: 'operateTime',
      key: 'operateTime',
      width: 160,
    },
    {
      title: '状态变更',
      key: 'statusChange',
      width: 180,
      render: (_, record: WorkflowRecord) => (
        <span>
          <Tag color={statusMap[record.statusBefore as Status].color}>
            {statusMap[record.statusBefore as Status].label}
          </Tag>
          <span style={{ margin: '0 8px' }}>→</span>
          <Tag color={statusMap[record.statusAfter as Status].color}>
            {statusMap[record.statusAfter as Status].label}
          </Tag>
        </span>
      ),
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
    },
  ]

  const applicationOptions = applications.map(a => ({
    value: a.id,
    label: `${a.id} - ${a.applicantName}`,
  }))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>审批流程</h2>
        <Select
          placeholder="选择申请编号筛选"
          style={{ width: 250 }}
          value={selectedApplicationId}
          onChange={(value) => setSelectedApplicationId(value as string | null)}
          options={[{ value: null, label: '全部' }, ...applicationOptions]}
        />
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredRecords}
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}
