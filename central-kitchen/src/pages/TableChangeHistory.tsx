import React, { useState } from 'react'
import { Table, Card, Tag, Button, Space, Input, Select, DatePicker, Descriptions, Modal, Timeline, Row, Col } from 'antd'
import {
  SearchOutlined,
  HistoryOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  BellOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAppContext } from '../context/AppContext'
import type { TableChangeRequest } from '../types'
import {
  roleNames,
  tableTypeNames,
  notificationStatusNames,
  changeTypeNames,
} from '../data/mockData'
import LinkageStatus from '../components/LinkageStatus'

const { RangePicker } = DatePicker
const { Option } = Select

const getStatusTag = (status: string) => {
  switch (status) {
    case 'pending_kitchen':
      return <Tag color="orange" icon={<ClockCircleOutlined />}>待厨房确认</Tag>
    case 'pending_fee':
      return <Tag color="blue" icon={<ClockCircleOutlined />}>待费用确认</Tag>
    case 'approved':
      return <Tag color="green" icon={<CheckCircleOutlined />}>已通过</Tag>
    case 'rejected_by_kitchen':
      return <Tag color="red" icon={<CloseCircleOutlined />}>厨房拒绝</Tag>
    case 'rejected_by_fee':
      return <Tag color="red" icon={<CloseCircleOutlined />}>费用拒绝</Tag>
    case 'cancelled':
      return <Tag color="default">已取消</Tag>
    default:
      return <Tag>{status}</Tag>
  }
}

const TableChangeHistory: React.FC = () => {
  const { changeRequests } = useAppContext()
  const [selectedRecord, setSelectedRecord] = useState<TableChangeRequest | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')

  const handleViewDetail = (record: TableChangeRequest) => {
    setSelectedRecord(record)
    setDetailModalOpen(true)
  }

  const filteredData = changeRequests.filter(item => {
    const matchStatus = !statusFilter || item.status === statusFilter
    const matchType = !typeFilter || item.changeType === typeFilter
    const matchSearch = !searchText ||
      item.banquetName.includes(searchText) ||
      item.id.includes(searchText) ||
      item.reason.includes(searchText)
    return matchStatus && matchType && matchSearch
  })

  const columns: ColumnsType<TableChangeRequest> = [
    {
      title: '申请编号',
      dataIndex: 'id',
      key: 'id',
      width: 160,
      fixed: 'left',
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
      key: 'changeType',
      width: 140,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Tag color="blue">{record.changeTypeLabel}</Tag>
          <span style={{ fontSize: 12, color: '#888' }}>
            {changeTypeNames[record.changeType]}
          </span>
        </Space>
      ),
    },
    {
      title: '变更内容',
      key: 'change',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.changeType === 'change_table_type' && record.originalTableType && record.newTableType ? (
            <span>
              {tableTypeNames[record.originalTableType]} → {tableTypeNames[record.newTableType]}
              <Tag color="blue" style={{ marginLeft: 4 }}>桌型变更</Tag>
            </span>
          ) : (
            <span>
              桌数: {record.originalTables} → {record.newTables}
              {record.tableCountChange !== 0 && (
                <Tag color={record.tableCountChange > 0 ? 'red' : 'green'} style={{ marginLeft: 4 }}>
                  {record.tableCountChange > 0 ? '+' : ''}{record.tableCountChange}
                </Tag>
              )}
            </span>
          )}
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
      title: '厨房通知',
      key: 'kitchenNotified',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Tag color={
            record.kitchenNotified === 'acknowledged' ? 'green' :
            record.kitchenNotified === 'notified' ? 'orange' : 'red'
          }>
            {notificationStatusNames[record.kitchenNotified]}
          </Tag>
          {record.kitchenNotifiedTime && (
            <span style={{ fontSize: 11, color: '#888' }}>
              {record.kitchenNotifiedTime}
            </span>
          )}
        </Space>
      ),
    },
    {
      title: '厨房确认',
      key: 'kitchenConfirm',
      width: 140,
      render: (_, record) => {
        if (!record.kitchenConfirmer) {
          return <span style={{ color: '#888' }}>-</span>
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
      title: '费用确认',
      key: 'feeConfirm',
      width: 140,
      render: (_, record) => {
        if (!record.feeConfirmer) {
          return <span style={{ color: '#888' }}>-</span>
        }
        return (
          <Space direction="vertical" size={0}>
            <span>{record.feeConfirmer.name}</span>
            <span style={{ fontSize: 12, color: '#888' }}>
              {record.feeConfirmTime}
            </span>
          </Space>
        )
      },
    },
    {
      title: '金额变化',
      key: 'amount',
      width: 120,
      render: (_, record) => (
        <span style={{
          fontWeight: 600,
          color: record.impact.amountChange > 0 ? '#f5222d' : record.impact.amountChange < 0 ? '#52c41a' : '#333'
        }}>
          {record.impact.amountChange > 0 ? '+' : ''}¥{record.impact.amountChange.toLocaleString()}
        </span>
      ),
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
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ]

  const renderTimeline = (record: TableChangeRequest) => {
    const items = [
      {
        color: 'blue',
        icon: <UserOutlined />,
        children: (
          <div>
            <div style={{ fontWeight: 500 }}>申请发起</div>
            <div style={{ fontSize: 12, color: '#888' }}>
              {record.applicant.name}（{roleNames[record.applicant.role]}）· {record.createTime}
            </div>
            <div style={{ marginTop: 4 }}>原因：{record.reason}</div>
          </div>
        ),
      },
    ]

    if (record.kitchenNotifiedTime) {
      items.push({
        color: 'orange',
        icon: <BellOutlined />,
        children: (
          <div>
            <div style={{ fontWeight: 500 }}>通知厨房</div>
            <div style={{ fontSize: 12, color: '#888' }}>
              {record.kitchenNotifiedBy?.name} · {record.kitchenNotifiedTime}
            </div>
            <div style={{ fontSize: 12 }}>
              状态：{notificationStatusNames[record.kitchenNotified]}
            </div>
          </div>
        ),
      })
    }

    if (record.kitchenConfirmer && record.kitchenConfirmTime) {
      items.push({
        color: record.status === 'rejected_by_kitchen' ? 'red' : 'green',
        icon: record.status === 'rejected_by_kitchen' ? <CloseCircleOutlined /> : <CheckCircleOutlined />,
        children: (
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.status === 'rejected_by_kitchen' ? '厨房拒绝' : '厨房确认通过'}
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>
              {record.kitchenConfirmer.name}（{roleNames[record.kitchenConfirmer.role]}）· {record.kitchenConfirmTime}
            </div>
            {record.kitchenRemark && (
              <div style={{ marginTop: 4, background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                {record.kitchenRemark}
              </div>
            )}
          </div>
        ),
      })
    }

    if (record.feeConfirmer && record.feeConfirmTime) {
      items.push({
        color: record.status === 'rejected_by_fee' ? 'red' : 'green',
        icon: record.status === 'rejected_by_fee' ? <CloseCircleOutlined /> : <CheckCircleOutlined />,
        children: (
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.status === 'rejected_by_fee' ? '费用拒绝' : '费用确认通过'}
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>
              {record.feeConfirmer.name}（{roleNames[record.feeConfirmer.role]}）· {record.feeConfirmTime}
            </div>
            {record.feeRemark && (
              <div style={{ marginTop: 4, background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                {record.feeRemark}
              </div>
            )}
          </div>
        ),
      })
    }

    return <Timeline items={items} />
  }

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <HistoryOutlined style={{ color: '#722ed1' }} />
            <span>桌数变更历史记录</span>
            <Tag color="default">{changeRequests.length} 条记录</Tag>
          </Space>
        }
        extra={
          <Space wrap>
            <Input
              placeholder="搜索宴会名称/申请编号/原因"
              prefix={<SearchOutlined />}
              style={{ width: 240 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              placeholder="筛选状态"
              style={{ width: 140 }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
            >
              <Option value="pending_kitchen">待厨房确认</Option>
              <Option value="pending_fee">待费用确认</Option>
              <Option value="approved">已通过</Option>
              <Option value="rejected_by_kitchen">厨房拒绝</Option>
              <Option value="rejected_by_fee">费用拒绝</Option>
            </Select>
            <Select
              placeholder="筛选类型"
              style={{ width: 140 }}
              value={typeFilter}
              onChange={setTypeFilter}
              allowClear
            >
              <Option value="add_tables">增加桌数</Option>
              <Option value="change_table_type">桌型变更</Option>
              <Option value="remove_tables">减少桌数</Option>
            </Select>
            <RangePicker />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          scroll={{ x: 1700 }}
        />
      </Card>

      <Modal
        title="变更详情"
        open={detailModalOpen}
        width={900}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
      >
        {selectedRecord && (
          <>
            <Row gutter={24}>
              <Col span={12}>
                <Descriptions bordered size="small" column={1}>
                  <Descriptions.Item label="申请编号">{selectedRecord.id}</Descriptions.Item>
                  <Descriptions.Item label="宴会名称">{selectedRecord.banquetName}</Descriptions.Item>
                  <Descriptions.Item label="变更类型">
                    <Tag color="blue">{selectedRecord.changeTypeLabel}</Tag>
                  </Descriptions.Item>
                  {selectedRecord.changeType === 'change_table_type' && selectedRecord.originalTableType && selectedRecord.newTableType ? (
                    <Descriptions.Item label="桌型变化">
                      {tableTypeNames[selectedRecord.originalTableType]} → {tableTypeNames[selectedRecord.newTableType]}
                    </Descriptions.Item>
                  ) : (
                    <Descriptions.Item label="桌数变化">
                      {selectedRecord.originalTables} → {selectedRecord.newTables} 桌
                      {selectedRecord.tableCountChange !== 0 && (
                        <Tag color={selectedRecord.tableCountChange > 0 ? 'red' : 'green'} style={{ marginLeft: 4 }}>
                          {selectedRecord.tableCountChange > 0 ? '+' : ''}{selectedRecord.tableCountChange}
                        </Tag>
                      )}
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="变更原因">{selectedRecord.reason}</Descriptions.Item>
                  <Descriptions.Item label="当前状态">
                    {getStatusTag(selectedRecord.status)}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={12}>
                <h4 style={{ marginTop: 0, marginBottom: 12 }}>审批流程</h4>
                {renderTimeline(selectedRecord)}
              </Col>
            </Row>
            <LinkageStatus impact={selectedRecord.impact} />
          </>
        )}
      </Modal>
    </div>
  )
}

export default TableChangeHistory
