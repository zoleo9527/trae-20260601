import React, { useState } from 'react'
import { Table, Card, Tag, Button, Space, Modal, Form, Input, Descriptions, message, Alert } from 'antd'
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAppContext } from '../context/AppContext'
import type { TableChangeRequest } from '../types'
import {
  roleNames,
  tableTypeNames,
  notificationStatusNames,
  staffList,
} from '../data/mockData'
import LinkageStatus from '../components/LinkageStatus'

const { TextArea } = Input
const { confirm } = Modal

const getStatusTag = (status: string) => {
  switch (status) {
    case 'pending_kitchen':
      return <Tag color="orange" icon={<ExclamationCircleOutlined />}>待厨房确认</Tag>
    case 'pending_fee':
      return <Tag color="blue">待费用确认</Tag>
    case 'approved':
      return <Tag color="green" icon={<CheckOutlined />}>已通过</Tag>
    case 'rejected_by_kitchen':
      return <Tag color="red" icon={<CloseOutlined />}>厨房拒绝</Tag>
    case 'rejected_by_fee':
      return <Tag color="red" icon={<CloseOutlined />}>费用拒绝</Tag>
    default:
      return <Tag>{status}</Tag>
  }
}

const KitchenConfirm: React.FC = () => {
  const { changeRequests, updateChangeRequest, updateBanquet, banquets } = useAppContext()
  const [selectedRequest, setSelectedRequest] = useState<TableChangeRequest | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [confirmType, setConfirmType] = useState<'approve' | 'reject'>('approve')
  const [form] = Form.useForm()

  const pendingKitchenRequests = changeRequests.filter(r => r.status === 'pending_kitchen')

  const handleViewDetail = (request: TableChangeRequest) => {
    setSelectedRequest(request)
    setDetailModalOpen(true)
  }

  const handleApprove = (request: TableChangeRequest) => {
    setSelectedRequest(request)
    setConfirmType('approve')
    form.resetFields()
    setConfirmModalOpen(true)
  }

  const handleReject = (request: TableChangeRequest) => {
    setSelectedRequest(request)
    setConfirmType('reject')
    form.resetFields()
    setConfirmModalOpen(true)
  }

  const handleConfirmSubmit = async () => {
    if (!selectedRequest) return

    try {
      const values = await form.validateFields()
      const chef = staffList.find(s => s.role === 'chef')!

      const updates: Partial<TableChangeRequest> = {
        kitchenConfirmer: chef,
        kitchenConfirmTime: new Date().toLocaleString('zh-CN'),
        kitchenRemark: values.remark,
      }

      if (confirmType === 'approve') {
        updates.status = 'pending_fee'
        updates.statusLabel = '待费用确认'
        updates.impact = {
          ...selectedRequest.impact,
          kitchenNotified: 'acknowledged',
        }
        updates.kitchenNotified = 'acknowledged'

        message.success('厨房已确认通过，已转至费用确认')
      } else {
        updates.status = 'rejected_by_kitchen'
        updates.statusLabel = '厨房拒绝'
        message.success('已拒绝申请')
      }

      updateChangeRequest(selectedRequest.id, updates)
      setConfirmModalOpen(false)
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const columns: ColumnsType<TableChangeRequest> = [
    {
      title: '申请编号',
      dataIndex: 'id',
      key: 'id',
      width: 160,
    },
    {
      title: '宴会名称',
      dataIndex: 'banquetName',
      key: 'banquetName',
      width: 200,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{text}</span>
          <span style={{ fontSize: 12, color: '#888' }}>{record.banquetId}</span>
        </Space>
      ),
    },
    {
      title: '变更类型',
      key: 'change',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Tag color="blue">{record.changeTypeLabel}</Tag>
          <span style={{ fontSize: 12 }}>
            {record.changeType === 'change_table_type' && record.originalTableType && record.newTableType ? (
              `${tableTypeNames[record.originalTableType]} → ${tableTypeNames[record.newTableType]}`
            ) : (
              `${record.originalTables} 桌 → ${record.newTables} 桌`
            )}
          </span>
        </Space>
      ),
    },
    {
      title: '变更原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      width: 200,
    },
    {
      title: '申请人',
      key: 'applicant',
      width: 140,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>{record.applicant.name}</span>
          <span style={{ fontSize: 12, color: '#888' }}>
            {roleNames[record.applicant.role]}
          </span>
        </Space>
      ),
    },
    {
      title: '申请时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
    },
    {
      title: '厨房通知',
      dataIndex: 'kitchenNotified',
      key: 'kitchenNotified',
      width: 120,
      render: (status) => (
        <Tag color={status === 'acknowledged' ? 'green' : status === 'notified' ? 'orange' : 'red'}>
          {notificationStatusNames[status]}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'pending_kitchen' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record)}
              >
                通过
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() => handleReject(record)}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <FireOutlined style={{ color: '#fa8c16' }} />
            <span>厨房备餐确认</span>
            {pendingKitchenRequests.length > 0 && (
              <Tag color="red" style={{ marginLeft: 8 }}>
                {pendingKitchenRequests.length} 条待处理
              </Tag>
            )}
          </Space>
        }
      >
        {pendingKitchenRequests.length > 0 && (
          <Alert
            message={`有 ${pendingKitchenRequests.length} 条加桌申请等待厨房确认，请及时处理`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Table
          columns={columns}
          dataSource={changeRequests}
          rowKey="id"
          scroll={{ x: 1400 }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: '0 24px' }}>
                <Descriptions size="small" column={3}>
                  <Descriptions.Item label="通知时间">
                    {record.kitchenNotifiedTime || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="通知人">
                    {record.kitchenNotifiedBy
                      ? `${record.kitchenNotifiedBy.name} (${roleNames[record.kitchenNotifiedBy.role]})`
                      : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="金额变化">
                    <span style={{ color: record.impact.amountChange > 0 ? '#f5222d' : '#52c41a' }}>
                      {record.impact.amountChange > 0 ? '+' : ''}¥{record.impact.amountChange.toLocaleString()}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="菜品变化">
                    <span style={{ color: record.impact.dishQuantityChange > 0 ? '#f5222d' : '#52c41a' }}>
                      {record.impact.dishQuantityChange > 0 ? '+' : ''}{record.impact.dishQuantityChange} 份
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="上菜节奏">
                    {record.impact.servingSpeed} 分钟/道
                  </Descriptions.Item>
                  <Descriptions.Item label="需要服务员">
                    {record.impact.waitersRequired} 人
                  </Descriptions.Item>
                </Descriptions>
              </div>
            ),
          }}
        />
      </Card>

      <Modal
        title="申请详情"
        open={detailModalOpen}
        width={800}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
      >
        {selectedRequest && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="申请编号">{selectedRequest.id}</Descriptions.Item>
              <Descriptions.Item label="宴会名称">{selectedRequest.banquetName}</Descriptions.Item>
              <Descriptions.Item label="变更类型">
                <Tag color="blue">{selectedRequest.changeTypeLabel}</Tag>
              </Descriptions.Item>
              {selectedRequest.changeType === 'change_table_type' && selectedRequest.originalTableType && selectedRequest.newTableType ? (
                <Descriptions.Item label="桌型变化">
                  {tableTypeNames[selectedRequest.originalTableType]} → {tableTypeNames[selectedRequest.newTableType]}
                </Descriptions.Item>
              ) : (
                <Descriptions.Item label="桌数变化">
                  {selectedRequest.originalTables} → {selectedRequest.newTables} 桌
                  {selectedRequest.tableCountChange !== 0 && (
                    <Tag color={selectedRequest.tableCountChange > 0 ? 'red' : 'green'} style={{ marginLeft: 4 }}>
                      {selectedRequest.tableCountChange > 0 ? '+' : ''}{selectedRequest.tableCountChange}
                    </Tag>
                  )}
                </Descriptions.Item>
              )}
              {selectedRequest.changeType === 'change_table_type' && selectedRequest.originalTableType && selectedRequest.newTableType && (
                <>
                  <Descriptions.Item label="原桌型">
                    {tableTypeNames[selectedRequest.originalTableType]}
                  </Descriptions.Item>
                  <Descriptions.Item label="新桌型">
                    {tableTypeNames[selectedRequest.newTableType]}
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="变更原因" span={2}>
                {selectedRequest.reason}
              </Descriptions.Item>
              <Descriptions.Item label="申请人">
                {selectedRequest.applicant.name} ({roleNames[selectedRequest.applicant.role]})
              </Descriptions.Item>
              <Descriptions.Item label="申请时间">
                {selectedRequest.createTime}
              </Descriptions.Item>
              <Descriptions.Item label="厨房通知状态">
                <Tag color={
                  selectedRequest.kitchenNotified === 'acknowledged' ? 'green' :
                  selectedRequest.kitchenNotified === 'notified' ? 'orange' : 'red'
                }>
                  {notificationStatusNames[selectedRequest.kitchenNotified]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="通知时间">
                {selectedRequest.kitchenNotifiedTime || '-'}
              </Descriptions.Item>
              {selectedRequest.kitchenConfirmer && (
                <>
                  <Descriptions.Item label="厨房确认人">
                    {selectedRequest.kitchenConfirmer.name} ({roleNames[selectedRequest.kitchenConfirmer.role]})
                  </Descriptions.Item>
                  <Descriptions.Item label="确认时间">
                    {selectedRequest.kitchenConfirmTime}
                  </Descriptions.Item>
                  <Descriptions.Item label="厨房意见" span={2}>
                    {selectedRequest.kitchenRemark}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
            <LinkageStatus impact={selectedRequest.impact} />
          </>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            {confirmType === 'approve' ? (
              <><CheckOutlined style={{ color: '#52c41a' }} /> 确认通过申请</>
            ) : (
              <><CloseOutlined style={{ color: '#f5222d' }} /> 拒绝申请</>
            )}
          </Space>
        }
        open={confirmModalOpen}
        onOk={handleConfirmSubmit}
        onCancel={() => setConfirmModalOpen(false)}
        okText={confirmType === 'approve' ? '确认通过' : '确认拒绝'}
        okButtonProps={{ danger: confirmType === 'reject' }}
      >
        {selectedRequest && (
          <>
            <Alert
              message={
                confirmType === 'approve'
                  ? `确认同意 ${selectedRequest.banquetName} 的 ${selectedRequest.changeTypeLabel} 申请？`
                  : `确认拒绝 ${selectedRequest.banquetName} 的 ${selectedRequest.changeTypeLabel} 申请？`
              }
              type={confirmType === 'approve' ? 'success' : 'error'}
              showIcon
              style={{ marginBottom: 16 }}
            />
            <LinkageStatus impact={selectedRequest.impact} />
            <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
              <Form.Item
                label={confirmType === 'approve' ? '备餐说明' : '拒绝原因'}
                name="remark"
                rules={[{ required: true, message: '请输入说明' }]}
              >
                <TextArea
                  rows={3}
                  placeholder={
                    confirmType === 'approve'
                      ? '请输入备餐说明，如：食材充足可以备餐、上菜时间预计延迟15分钟等'
                      : '请详细说明拒绝原因，如：食材不足、时间紧张无法备餐等'
                  }
                  maxLength={200}
                  showCount
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  )
}

export default KitchenConfirm
