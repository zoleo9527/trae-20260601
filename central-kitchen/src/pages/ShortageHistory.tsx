import { useState } from 'react'
import { Table, Card, Tag, Button, Space, Modal, Descriptions, Form, Input, Select, message, Alert, Row, Col, Statistic } from 'antd'
import {
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  PlusOutlined,
  AlertOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAppContext } from '../context/AppContext'
import type { ShortageRecord } from '../types'
import { roleNames, staffList } from '../data/mockData'

const { TextArea } = Input
const { Option } = Select

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'pending':
      return { color: 'red', text: '待处理', icon: <WarningOutlined /> }
    case 'partially_resolved':
      return { color: 'orange', text: '部分解决', icon: <ExclamationCircleOutlined /> }
    case 'resolved':
      return { color: 'green', text: '已解决', icon: <CheckCircleOutlined /> }
    default:
      return { color: 'default', text: status, icon: null }
  }
}

const ShortageHistory = () => {
  const { shortages, updateShortage, banquets } = useAppContext()
  const [selectedRecord, setSelectedRecord] = useState<ShortageRecord | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [form] = Form.useForm()

  const pendingCount = shortages.filter(s => s.status === 'pending').length
  const partialCount = shortages.filter(s => s.status === 'partially_resolved').length
  const totalShortage = shortages.reduce((sum, s) => sum + s.shortageQuantity, 0)

  const handleViewDetail = (record: ShortageRecord) => {
    setSelectedRecord(record)
    setDetailModalOpen(true)
  }

  const handleResolve = (record: ShortageRecord) => {
    setSelectedRecord(record)
    form.resetFields()
    setResolveModalOpen(true)
  }

  const handleResolveSubmit = async () => {
    if (!selectedRecord) return

    try {
      const values = await form.validateFields()
      const chef = staffList.find(s => s.role === 'chef')!

      updateShortage(selectedRecord.id, {
        status: values.status,
        resolvedTime: new Date().toLocaleString('zh-CN'),
        resolvedBy: chef,
        resolution: values.resolution,
      })

      message.success('已更新缺货记录')
      setResolveModalOpen(false)
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const columns: ColumnsType<ShortageRecord> = [
    {
      title: '记录编号',
      dataIndex: 'id',
      key: 'id',
      width: 140,
    },
    {
      title: '关联宴会',
      key: 'banquet',
      width: 200,
      render: (_, record) => {
        if (!record.banquetName) {
          return <Tag color="default">全局库存</Tag>
        }
        return (
          <Space direction="vertical" size={0}>
            <span style={{ fontWeight: 500 }}>{record.banquetName}</span>
            <span style={{ fontSize: 12, color: '#888' }}>{record.banquetId}</span>
          </Space>
        )
      },
    },
    {
      title: '菜品名称',
      dataIndex: 'dishName',
      key: 'dishName',
      width: 160,
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '需求数量',
      key: 'required',
      width: 120,
      render: (_, record) => (
        <span>{record.requiredQuantity} {record.unit}</span>
      ),
    },
    {
      title: '可用数量',
      key: 'available',
      width: 120,
      render: (_, record) => (
        <span style={{
          color: record.availableQuantity < record.requiredQuantity ? '#f5222d' : '#52c41a'
        }}>
          {record.availableQuantity} {record.unit}
        </span>
      ),
    },
    {
      title: '缺货数量',
      key: 'shortage',
      width: 120,
      render: (_, record) => {
        const status = getStatusInfo(record.status)
        return (
          <Space>
            <span style={{
              fontWeight: 600,
              color: record.shortageQuantity > 0 ? '#f5222d' : '#52c41a'
            }}>
              {record.shortageQuantity} {record.unit}
            </span>
            {record.shortageQuantity > 0 && (
              <Tag icon={status.icon} color={status.color}>
                {status.text}
              </Tag>
            )}
          </Space>
        )
      },
      sorter: (a, b) => a.shortageQuantity - b.shortageQuantity,
    },
    {
      title: '上报人',
      key: 'reporter',
      width: 140,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>{record.reportedBy.name}</span>
          <span style={{ fontSize: 12, color: '#888' }}>
            {roleNames[record.reportedBy.role]}
          </span>
        </Space>
      ),
    },
    {
      title: '上报时间',
      dataIndex: 'reportedTime',
      key: 'reportedTime',
      width: 160,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const info = getStatusInfo(status)
        return <Tag icon={info.icon} color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
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
          {record.status !== 'resolved' && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleResolve(record)}
            >
              处理
            </Button>
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
              title="待处理缺货"
              value={pendingCount}
              valueStyle={{ color: '#f5222d' }}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="部分解决"
              value={partialCount}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="总缺货数量"
              value={totalShortage}
              valueStyle={{ color: '#722ed1' }}
              suffix="份"
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <WarningOutlined style={{ color: '#fa8c16' }} />
            <span>食材缺货记录</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            上报缺货
          </Button>
        }
      >
        {pendingCount > 0 && (
          <Alert
            message={`有 ${pendingCount} 条缺货记录待处理，请及时协调解决`}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Table
          columns={columns}
          dataSource={shortages}
          rowKey="id"
          scroll={{ x: 1400 }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: '0 24px' }}>
                <Descriptions size="small" column={3}>
                  <Descriptions.Item label="缺货原因">
                    {record.remarks || '临时加桌导致备货不足'}
                  </Descriptions.Item>
                  <Descriptions.Item label="解决方案">
                    {record.resolution || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="处理人">
                    {record.resolvedBy
                      ? `${record.resolvedBy.name} (${roleNames[record.resolvedBy.role]})`
                      : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="处理时间">
                    {record.resolvedTime || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            ),
          }}
        />
      </Card>

      <Modal
        title="缺货详情"
        open={detailModalOpen}
        width={700}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
      >
        {selectedRecord && (
          <>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="记录编号">{selectedRecord.id}</Descriptions.Item>
              <Descriptions.Item label="关联宴会">
                {selectedRecord.banquetName || '全局库存'}
              </Descriptions.Item>
              <Descriptions.Item label="菜品名称">{selectedRecord.dishName}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {(() => {
                  const info = getStatusInfo(selectedRecord.status)
                  return <Tag icon={info.icon} color={info.color}>{info.text}</Tag>
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="需求数量">
                {selectedRecord.requiredQuantity} {selectedRecord.unit}
              </Descriptions.Item>
              <Descriptions.Item label="可用数量">
                <span style={{
                  color: selectedRecord.availableQuantity < selectedRecord.requiredQuantity ? '#f5222d' : '#52c41a'
                }}>
                  {selectedRecord.availableQuantity} {selectedRecord.unit}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="缺货数量">
                <span style={{
                  fontWeight: 600,
                  color: selectedRecord.shortageQuantity > 0 ? '#f5222d' : '#52c41a'
                }}>
                  {selectedRecord.shortageQuantity} {selectedRecord.unit}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="上报人">
                {selectedRecord.reportedBy.name} ({roleNames[selectedRecord.reportedBy.role]})
              </Descriptions.Item>
              <Descriptions.Item label="上报时间">{selectedRecord.reportedTime}</Descriptions.Item>
              <Descriptions.Item label="影响宴会">
                {selectedRecord.banquetName || '多个宴会'}
              </Descriptions.Item>
              <Descriptions.Item label="备注说明" span={2}>
                {selectedRecord.remarks || '-'}
              </Descriptions.Item>
              {selectedRecord.resolvedBy && (
                <>
                  <Descriptions.Item label="处理人">
                    {selectedRecord.resolvedBy.name} ({roleNames[selectedRecord.resolvedBy.role]})
                  </Descriptions.Item>
                  <Descriptions.Item label="处理时间">
                    {selectedRecord.resolvedTime}
                  </Descriptions.Item>
                  <Descriptions.Item label="解决方案" span={2}>
                    <div style={{ background: '#f6ffed', padding: 8, borderRadius: 4 }}>
                      {selectedRecord.resolution}
                    </div>
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          </>
        )}
      </Modal>

      <Modal
        title="处理缺货"
        open={resolveModalOpen}
        onOk={handleResolveSubmit}
        onCancel={() => setResolveModalOpen(false)}
        okText="确认处理"
      >
        {selectedRecord && (
          <>
            <Alert
              message={
                <>
                  <strong>{selectedRecord.dishName}</strong> 缺货 <strong style={{ color: '#f5222d' }}>{selectedRecord.shortageQuantity} {selectedRecord.unit}</strong>
                </>
              }
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form form={form} layout="vertical">
              <Form.Item
                label="处理状态"
                name="status"
                rules={[{ required: true, message: '请选择处理状态' }]}
                initialValue={selectedRecord.status === 'pending' ? 'partially_resolved' : 'resolved'}
              >
                <Select>
                  <Option value="partially_resolved">部分解决</Option>
                  <Option value="resolved">完全解决</Option>
                </Select>
              </Form.Item>
              <Form.Item
                label="解决方案"
                name="resolution"
                rules={[{ required: true, message: '请输入解决方案' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="请详细说明解决方案，如：紧急采购、菜品替换、与客户沟通等"
                  maxLength={300}
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

export default ShortageHistory
