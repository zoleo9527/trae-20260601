import { useState } from 'react'
import { Table, Tag, Button, Space, Modal, Form, Input, Select, InputNumber, message } from 'antd'
import type { LoanApplication, Status } from '@/types'
import { statusMap } from '@/utils/statusMap'

interface ApplicationsProps {
  applications: LoanApplication[]
  onUpdateStatus: (id: string, status: Status, note: string) => void
}

export function Applications({ applications, onUpdateStatus }: ApplicationsProps) {
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [batchStatus, setBatchStatus] = useState<Status>('pending')
  const [batchNote, setBatchNote] = useState('')
  const [form] = Form.useForm()

  const columns = [
    {
      title: '申请编号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: '申请人',
      dataIndex: 'applicantName',
      key: 'applicantName',
      width: 100,
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      key: 'idCard',
      width: 180,
      render: (text: string) => text.replace(/(\d{4})\d{8}(\d{4})/, '$1********$2'),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (text: string) => text.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
    },
    {
      title: '申请金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (text: number) => `¥${text.toLocaleString()}`,
    },
    {
      title: '期限(月)',
      dataIndex: 'term',
      key: 'term',
      width: 100,
    },
    {
      title: '用途',
      dataIndex: 'purpose',
      key: 'purpose',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: Status) => (
        <Tag color={statusMap[status].color}>
          {statusMap[status].label}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      render: (_: unknown, record: LoanApplication) => (
        <Space>
          <Button size="small" onClick={() => handleStatusChange(record.id, 'urgent', '标记为有人催')}>
            催办
          </Button>
          <Button size="small" onClick={() => handleStatusChange(record.id, 'supplement', '要求补材料')}>
            补材料
          </Button>
          <Button size="small" onClick={() => handleStatusChange(record.id, 'returned', '退回')}>
            退回
          </Button>
          <Button size="small" danger onClick={() => handleStatusChange(record.id, 'rejected', '拒绝')}>
            拒绝
          </Button>
        </Space>
      ),
    },
  ]

  const handleStatusChange = (id: string, status: Status, actionName: string) => {
    Modal.confirm({
      title: actionName,
      content: (
        <Form form={form}>
          <Form.Item name="note" label="备注说明" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const values = await form.validateFields()
        onUpdateStatus(id, status, values.note)
        form.resetFields()
        message.success(`${actionName}成功`)
      },
    })
  }

  const handleBatchAction = () => {
    Modal.confirm({
      title: '批量操作',
      content: (
        <>
          <Select
            style={{ width: '100%', marginBottom: 16 }}
            value={batchStatus}
            onChange={(value) => setBatchStatus(value as Status)}
            options={[
              { value: 'urgent', label: '有人催' },
              { value: 'supplement', label: '补材料' },
              { value: 'returned', label: '退回' },
              { value: 'rejected', label: '拒绝' },
            ]}
          />
          <Input.TextArea
            rows={3}
            placeholder="请输入备注说明"
            value={batchNote}
            onChange={(e) => setBatchNote(e.target.value)}
          />
        </>
      ),
      onOk: () => {
        selectedRows.forEach(id => {
          onUpdateStatus(id, batchStatus, batchNote)
        })
        setSelectedRows([])
        setShowBatchModal(false)
        setBatchNote('')
        message.success(`已批量处理 ${selectedRows.length} 条记录`)
      },
    })
  }

  const rowSelection = {
    selectedRowKeys: selectedRows,
    onChange: (keys: string[]) => setSelectedRows(keys),
  }

  const urgentCount = applications.filter(a => a.status === 'urgent').length
  const supplementCount = applications.filter(a => a.status === 'supplement').length
  const returnedCount = applications.filter(a => a.status === 'returned').length
  const rejectedCount = applications.filter(a => a.status === 'rejected').length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, marginBottom: 12 }}>借款申请列表</h2>
          <div style={{ display: 'flex', gap: 16 }}>
            <span style={{ color: '#ff4d4f' }}>有人催: {urgentCount}</span>
            <span style={{ color: '#faad14' }}>补材料: {supplementCount}</span>
            <span style={{ color: '#faad14' }}>已退回: {returnedCount}</span>
            <span style={{ color: '#ff4d4f' }}>已拒绝: {rejectedCount}</span>
          </div>
        </div>
        {selectedRows.length > 0 && (
          <Button
            type="primary"
            onClick={handleBatchAction}
          >
            批量处理 ({selectedRows.length})
          </Button>
        )}
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={applications}
        rowSelection={rowSelection}
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}
