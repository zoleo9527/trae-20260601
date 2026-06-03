import React, { useState } from 'react'
import { Table, Card, Tag, Button, Space, Modal, Form, Input, Descriptions, message, Alert, Statistic, Row, Col } from 'antd'
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAppContext } from '../context/AppContext'
import type { TableChangeRequest } from '../types'
import {
  roleNames,
  tableTypeNames,
  tableConfigs,
  notificationStatusNames,
  staffList,
} from '../data/mockData'
import LinkageStatus from '../components/LinkageStatus'

const { TextArea } = Input

const getStatusTag = (status: string) => {
  switch (status) {
    case 'pending_kitchen':
      return <Tag color="orange">待厨房确认</Tag>
    case 'pending_fee':
      return <Tag color="orange" icon={<ExclamationCircleOutlined />}>待费用确认</Tag>
    case 'approved':
      return <Tag color="green" icon={<CheckOutlined />}>已通过</Tag>
    case 'rejected_by_kitchen':
      return <Tag color="red">厨房拒绝</Tag>
    case 'rejected_by_fee':
      return <Tag color="red" icon={<CloseOutlined />}>费用拒绝</Tag>
    default:
      return <Tag>{status}</Tag>
  }
}

const FeeConfirm: React.FC = () => {
  const { changeRequests, updateChangeRequest, updateBanquet } = useAppContext()
  const [selectedRequest, setSelectedRequest] = useState<TableChangeRequest | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [confirmType, setConfirmType] = useState<'approve' | 'reject'>('approve')
  const [form] = Form.useForm()

  const pendingFeeRequests = changeRequests.filter(r => r.status === 'pending_fee')
  const approvedRequests = changeRequests.filter(r => r.status === 'approved')

  const totalPendingAmount = pendingFeeRequests.reduce((sum, r) => sum + r.impact.amountChange, 0)
  const totalApprovedAmount = approvedRequests.reduce((sum, r) => sum + r.impact.amountChange, 0)

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
      const cashier = staffList.find(s => s.role === 'cashier' || s.role === 'sales')!

      const updates: Partial<TableChangeRequest> = {
        feeConfirmer: cashier,
        feeConfirmTime: new Date().toLocaleString('zh-CN'),
        feeRemark: values.remark,
      }

      if (confirmType === 'approve') {
        updates.status = 'approved'
        updates.statusLabel = '已通过'

        const banquetUpdates: Record<string, unknown> = {
          currentTables: selectedRequest.newTables,
          totalAmount: selectedRequest.impact.totalAmount,
          waitersAssigned: selectedRequest.impact.waitersRequired,
        }
        if (selectedRequest.changeType === 'change_table_type' && selectedRequest.newTableType) {
          banquetUpdates.tableType = selectedRequest.newTableType
          banquetUpdates.tableConfig = tableConfigs[selectedRequest.newTableType]
        }
        updateBanquet(selectedRequest.banquetId, banquetUpdates)

        message.success('费用已确认，申请完成！请通知客户补款')
      } else {
        updates.status = 'rejected_by_fee'
        updates.statusLabel = '费用拒绝'
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
      title: '费用变化',
      key: 'amount',
      width: 140,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontSize: 16, fontWeight: 600, color: record.impact.amountChange > 0 ? '#f5222d' : '#52c41a' }}>
            {record.impact.amountChange > 0 ? '+' : ''}¥{record.impact.amountChange.toLocaleString()}
          </span>
          <span style={{ fontSize: 12, color: '#888' }}>
            总额 ¥{record.impact.totalAmount.toLocaleString()}
          </span>
        </Space>
      ),
    },
    {
      title: '申请人',
      key: 'applicant',
      width: 120,
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
      title: '厨房确认',
      key: 'kitchen',
      width: 140,
      render: (_, record) => {
        if (!record.kitchenConfirmer) {
          return <Tag color="orange">未确认</Tag>
        }
        return (
          <Space direction="vertical" size={0}>
            <span>{record.kitchenConfirmer.name}</span>
            <span style={{ fontSize: 12, color: '#888' }}>
              {record.kitchenConfirmTime}
            </span>
          </Space>
        )
      },
    },
    {
      title: '申请时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
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
          {record.status === 'pending_fee' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record)}
              >
                确认
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
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="待确认申请"
              value={pendingFeeRequests.length}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="待确认金额"
              value={totalPendingAmount}
              precision={2}
              valueStyle={{ color: '#f5222d' }}
              prefix="¥"
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="已确认增收"
              value={totalApprovedAmount}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
              prefix={<WalletOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <DollarOutlined style={{ color: '#1890ff' }} />
            <span>费用变更确认</span>
            {pendingFeeRequests.length > 0 && (
              <Tag color="red" style={{ marginLeft: 8 }}>
                {pendingFeeRequests.length} 条待处理
              </Tag>
            )}
          </Space>
        }
      >
        {pendingFeeRequests.length > 0 && (
          <Alert
            message={`有 ${pendingFeeRequests.length} 条费用变更等待确认，请及时通知客户`}
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
                  <Descriptions.Item label="变更原因">{record.reason}</Descriptions.Item>
                  <Descriptions.Item label="厨房意见">
                    {record.kitchenRemark || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="尾款变化">
                    <span style={{ color: record.impact.amountChange > 0 ? '#f5222d' : '#52c41a', fontWeight: 500 }}>
                      {record.impact.amountChange > 0 ? '+' : ''}¥{record.impact.amountChange.toLocaleString()}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="菜品变化">
                    {record.impact.dishQuantityChange > 0 ? '+' : ''}{record.impact.dishQuantityChange} 份
                  </Descriptions.Item>
                  <Descriptions.Item label="服务员变化">
                    {record.impact.waitersChange > 0 ? '+' : ''}{record.impact.waitersChange} 人
                  </Descriptions.Item>
                  <Descriptions.Item label="上菜节奏">
                    {record.impact.servingSpeed} 分钟/道
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
              <Descriptions.Item label="厨房通知">
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
                    {selectedRequest.kitchenConfirmer.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="确认时间">
                    {selectedRequest.kitchenConfirmTime}
                  </Descriptions.Item>
                  <Descriptions.Item label="厨房意见" span={2}>
                    {selectedRequest.kitchenRemark}
                  </Descriptions.Item>
                </>
              )}
              {selectedRequest.feeConfirmer && (
                <>
                  <Descriptions.Item label="费用确认人">
                    {selectedRequest.feeConfirmer.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="确认时间">
                    {selectedRequest.feeConfirmTime}
                  </Descriptions.Item>
                  <Descriptions.Item label="费用意见" span={2}>
                    {selectedRequest.feeRemark}
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
              <><CheckOutlined style={{ color: '#52c41a' }} /> 确认费用变更</>
            ) : (
              <><CloseOutlined style={{ color: '#f5222d' }} /> 拒绝费用变更</>
            )}
          </Space>
        }
        open={confirmModalOpen}
        onOk={handleConfirmSubmit}
        onCancel={() => setConfirmModalOpen(false)}
        okText={confirmType === 'approve' ? '确认收款' : '确认拒绝'}
        okButtonProps={{ danger: confirmType === 'reject' }}
      >
        {selectedRequest && (
          <>
            <Alert
              message={
                confirmType === 'approve'
                  ? `确认 ${selectedRequest.banquetName} 增加 ¥${selectedRequest.impact.amountChange.toLocaleString()}？请确认已与客户沟通并同意。`
                  : `确认拒绝 ${selectedRequest.banquetName} 的费用变更申请？`
              }
              type={confirmType === 'approve' ? 'success' : 'error'}
              showIcon
              style={{ marginBottom: 16 }}
            />
            <LinkageStatus impact={selectedRequest.impact} />
            <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
              <Form.Item
                label={confirmType === 'approve' ? '收款说明' : '拒绝原因'}
                name="remark"
                rules={[{ required: true, message: '请输入说明' }]}
              >
                <TextArea
                  rows={3}
                  placeholder={
                    confirmType === 'approve'
                      ? '请输入收款说明，如：客户已微信转账、客户同意尾款一并结算等'
                      : '请详细说明拒绝原因，如：客户不同意加价、需要重新协商等'
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

export default FeeConfirm
