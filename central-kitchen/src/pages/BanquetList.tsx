import React, { useState } from 'react'
import { Table, Card, Tag, Button, Space, Row, Col, Statistic, Modal, Descriptions, Badge } from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  HistoryOutlined,
  UserOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAppContext } from '../context/AppContext'
import type { Banquet, TableChangeRequest } from '../types'
import {
  statusNames,
  tableTypeNames,
  roleNames,
} from '../data/mockData'
import AddTableModal from '../components/AddTableModal'
import LinkageStatus from '../components/LinkageStatus'

const { confirm } = Modal

const getStatusColor = (status: string) => {
  switch (status) {
    case 'preparing': return 'blue'
    case 'in_progress': return 'green'
    case 'completed': return 'default'
    case 'cancelled': return 'red'
    default: return 'default'
  }
}

const BanquetList: React.FC = () => {
  const { banquets, changeRequests, updateBanquet, updateChangeRequest } = useAppContext()
  const [selectedBanquet, setSelectedBanquet] = useState<Banquet | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailBanquet, setDetailBanquet] = useState<Banquet | null>(null)
  const [detailRequests, setDetailRequests] = useState<TableChangeRequest[]>([])

  const pendingCount = changeRequests.filter(
    r => r.status === 'pending_kitchen' || r.status === 'pending_fee'
  ).length

  const totalBanquets = banquets.length
  const inProgressCount = banquets.filter(b => b.status === 'in_progress').length
  const preparingCount = banquets.filter(b => b.status === 'preparing').length

  const handleAddTable = (banquet: Banquet) => {
    setSelectedBanquet(banquet)
    setAddModalOpen(true)
  }

  const handleViewDetail = (banquet: Banquet) => {
    const requests = changeRequests.filter(r => r.banquetId === banquet.id)
    setDetailBanquet(banquet)
    setDetailRequests(requests)
    setDetailModalOpen(true)
  }

  const handleAddSuccess = () => {
    // Refresh logic handled by context
  }

  const columns: ColumnsType<Banquet> = [
    {
      title: '宴会名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{text}</span>
          <span style={{ fontSize: 12, color: '#888' }}>{record.id}</span>
        </Space>
      ),
    },
    {
      title: '客户信息',
      key: 'customer',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span><UserOutlined style={{ marginRight: 4 }} />{record.customerName}</span>
          <span style={{ fontSize: 12, color: '#888' }}>
            <PhoneOutlined style={{ marginRight: 4 }} />{record.customerPhone}
          </span>
        </Space>
      ),
    },
    {
      title: '日期时间',
      key: 'datetime',
      width: 160,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span><ClockCircleOutlined style={{ marginRight: 4 }} />{record.date}</span>
          <span style={{ fontSize: 12, color: '#888' }}>{record.startTime} - {record.endTime}</span>
        </Space>
      ),
    },
    {
      title: '宴会厅',
      dataIndex: 'hall',
      key: 'hall',
      width: 100,
      render: (text) => (
        <span><EnvironmentOutlined style={{ marginRight: 4 }} />{text}</span>
      ),
    },
    {
      title: '桌数状态',
      key: 'tables',
      width: 140,
      render: (_, record) => {
        const hasChange = record.currentTables !== record.originalTables
        return (
          <Space direction="vertical" size={0}>
            <Space>
              <Tag color={hasChange ? 'orange' : 'default'}>
                原 {record.originalTables} 桌
              </Tag>
              <Tag color="blue">
                {tableTypeNames[record.tableType]}
              </Tag>
            </Space>
            <Space>
              <span style={{ fontWeight: 500, color: hasChange ? '#fa8c16' : '#333' }}>
                现 {record.currentTables} 桌
              </span>
              {hasChange && (
                <Badge count={`+${record.currentTables - record.originalTables}`} size="small" />
              )}
            </Space>
          </Space>
        )
      },
    },
    {
      title: '金额',
      key: 'amount',
      width: 140,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>¥{record.totalAmount.toLocaleString()}</span>
          <span style={{ fontSize: 12, color: '#888' }}>
            已付 ¥{record.paidAmount.toLocaleString()}
            {record.totalAmount > record.paidAmount && (
              <span style={{ color: '#f5222d', marginLeft: 4 }}>
                (尾款 ¥{(record.totalAmount - record.paidAmount).toLocaleString()})
              </span>
            )}
          </span>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {statusNames[status]}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
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
          {record.status !== 'completed' && record.status !== 'cancelled' && (
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => handleAddTable(record)}
            >
              加桌/变更
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="今日宴会总数"
              value={totalBanquets}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="进行中"
              value={inProgressCount}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="准备中"
              value={preparingCount}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="待处理申请"
              value={pendingCount}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="宴会列表" extra={
        <Button type="primary" icon={<PlusOutlined />}>
          新建宴会
        </Button>
      }>
        <Table
          columns={columns}
          dataSource={banquets}
          rowKey="id"
          scroll={{ x: 1200 }}
        />
      </Card>

      <AddTableModal
        open={addModalOpen}
        banquet={selectedBanquet}
        onCancel={() => setAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      <Modal
        title={
          <Space>
            <span>宴会详情</span>
            <Tag color="blue">{detailBanquet?.name}</Tag>
          </Space>
        }
        open={detailModalOpen}
        width={900}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
      >
        {detailBanquet && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="宴会编号">{detailBanquet.id}</Descriptions.Item>
              <Descriptions.Item label="宴会名称">{detailBanquet.name}</Descriptions.Item>
              <Descriptions.Item label="客户姓名">{detailBanquet.customerName}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{detailBanquet.customerPhone}</Descriptions.Item>
              <Descriptions.Item label="宴会日期">{detailBanquet.date}</Descriptions.Item>
              <Descriptions.Item label="时间">{detailBanquet.startTime} - {detailBanquet.endTime}</Descriptions.Item>
              <Descriptions.Item label="宴会厅">{detailBanquet.hall}</Descriptions.Item>
              <Descriptions.Item label="菜单">{detailBanquet.menuName}</Descriptions.Item>
              <Descriptions.Item label="桌型">{tableTypeNames[detailBanquet.tableType]}</Descriptions.Item>
              <Descriptions.Item label="每桌价格">¥{detailBanquet.tableConfig.pricePerTable.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="原定桌数">{detailBanquet.originalTables} 桌</Descriptions.Item>
              <Descriptions.Item label="当前桌数">{detailBanquet.currentTables} 桌</Descriptions.Item>
              <Descriptions.Item label="定金">¥{detailBanquet.deposit.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="总金额">¥{detailBanquet.totalAmount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="已付金额">¥{detailBanquet.paidAmount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="待付尾款">
                <span style={{ color: '#f5222d', fontWeight: 500 }}>
                  ¥{(detailBanquet.totalAmount - detailBanquet.paidAmount).toLocaleString()}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="分配服务员">{detailBanquet.waitersAssigned} 人</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(detailBanquet.status)}>
                  {statusNames[detailBanquet.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{detailBanquet.remarks || '-'}</Descriptions.Item>
            </Descriptions>

            {detailRequests.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h4 style={{ marginBottom: 12 }}>桌数变更记录</h4>
                {detailRequests.map((request, index) => (
                  <Card
                    key={request.id}
                    size="small"
                    style={{ marginBottom: 12 }}
                    title={
                      <Space>
                        <Tag color={
                          request.status === 'approved' ? 'green' :
                          request.status === 'rejected_by_kitchen' || request.status === 'rejected_by_fee' ? 'red' :
                          request.status === 'pending_kitchen' || request.status === 'pending_fee' ? 'orange' : 'default'
                        }>
                          {request.statusLabel}
                        </Tag>
                        <span>{request.changeTypeLabel}</span>
                      </Space>
                    }
                    extra={
                      <span style={{ fontSize: 12, color: '#888' }}>
                        {request.createTime}
                      </span>
                    }
                  >
                    <Descriptions size="small" column={2}>
                      <Descriptions.Item label="变更原因">{request.reason}</Descriptions.Item>
                      {request.changeType === 'change_table_type' && request.originalTableType && request.newTableType ? (
                        <Descriptions.Item label="桌型变化">
                          {tableTypeNames[request.originalTableType]} → {tableTypeNames[request.newTableType]}
                        </Descriptions.Item>
                      ) : (
                        <Descriptions.Item label="桌数变化">
                          {request.originalTables} → {request.newTables} 桌
                          {request.tableCountChange !== 0 && (
                            <span style={{ color: request.tableCountChange > 0 ? '#f5222d' : '#52c41a', marginLeft: 8 }}>
                              ({request.tableCountChange > 0 ? '+' : ''}{request.tableCountChange} 桌)
                            </span>
                          )}
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label="申请人">
                        {request.applicant.name}（{roleNames[request.applicant.role]}）
                      </Descriptions.Item>
                      <Descriptions.Item label="厨房通知">
                        {request.kitchenNotifiedTime && (
                          <>已通知 · {request.kitchenNotifiedTime}</>
                        )}
                      </Descriptions.Item>
                      {request.kitchenConfirmer && (
                        <>
                          <Descriptions.Item label="厨房确认">
                            {request.kitchenConfirmer.name}（{roleNames[request.kitchenConfirmer.role]}）
                          </Descriptions.Item>
                          <Descriptions.Item label="确认时间">
                            {request.kitchenConfirmTime}
                          </Descriptions.Item>
                          <Descriptions.Item label="厨房意见" span={2}>
                            {request.kitchenRemark}
                          </Descriptions.Item>
                        </>
                      )}
                      {request.feeConfirmer && (
                        <>
                          <Descriptions.Item label="费用确认">
                            {request.feeConfirmer.name}（{roleNames[request.feeConfirmer.role]}）
                          </Descriptions.Item>
                          <Descriptions.Item label="确认时间">
                            {request.feeConfirmTime}
                          </Descriptions.Item>
                          <Descriptions.Item label="费用意见" span={2}>
                            {request.feeRemark}
                          </Descriptions.Item>
                        </>
                      )}
                    </Descriptions>
                    <LinkageStatus impact={request.impact} showTitle={true} />
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}

export default BanquetList
