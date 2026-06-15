import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Card,
  List,
  Tag,
  Space,
  Typography,
  Button,
  Badge,
  Row,
  Col,
  Statistic,
  Alert,
  Empty,
} from 'antd'
import {
  AlertOutlined,
  EditOutlined,
  ClockCircleOutlined,
  RightOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Order, User, TodayTasks } from '../types'
import { orderApi } from '../api'
import { statusMap, roleMap } from '../types'

const { Title, Text } = Typography

interface Props {
  currentUser: User
}

export default function Dashboard({ currentUser }: Props) {
  const [tasks, setTasks] = useState<TodayTasks | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTasks()
  }, [currentUser])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const res = await orderApi.getTodayTasks(currentUser.role)
      if (res.data.success) {
        setTasks(res.data.data!)
      }
    } finally {
      setLoading(false)
    }
  }

  const renderOrderCard = (order: Order, showModifiedBadge = false) => (
    <Card
      key={order.id}
      size="small"
      style={{ marginBottom: 12 }}
      hoverable
      actions={[
        <Link to={`/orders/${order.id}`}>
          查看详情 <RightOutlined />
        </Link>,
      ]}
    >
      <Card.Meta
        title={
          <Space>
            <span style={{ fontWeight: 500 }}>{order.projectName}</span>
            {order.dimensionModified && (
              <Badge count="尺寸已改" color="red" />
            )}
            {order.installTimeModified && !order.dimensionModified && (
              <Badge count="安装时间变更" color="orange" />
            )}
            {order.manuscriptVersion > 1 && !order.dimensionModified && (
              <Badge count={`v${order.manuscriptVersion}`} color="purple" />
            )}
            <Tag color={statusMap[order.status].color}>
              {statusMap[order.status].text}
            </Tag>
          </Space>
        }
        description={
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Space size={16}>
              <Text type="secondary">{order.orderNo}</Text>
              <Text>{order.customerName}</Text>
            </Space>
            <Space>
              <Text strong>尺寸：</Text>
              <Text>
                {order.originalDimension.width} × {order.originalDimension.height} {order.originalDimension.unit}
              </Text>
              {order.reviewedDimension && (
                <Text type="success">
                  ✓ 已复核 {order.reviewedDimension.width} × {order.reviewedDimension.height}
                </Text>
              )}
            </Space>
            {order.installTime && (
              <Space>
                <ClockCircleOutlined style={{ color: '#888' }} />
                <Text type={order.installTimeModified ? 'warning' : 'secondary'}>
                  安装：{dayjs(order.installTime).format('MM-DD HH:mm')}
                </Text>
              </Space>
            )}
            <Text type="secondary" style={{ fontSize: '12px' }}>
              创建于 {dayjs(order.createdAt).format('MM-DD HH:mm')}
              {' · '}当前处理：{roleMap[order.currentHandler]}
            </Text>
          </Space>
        }
      />
    </Card>
  )

  if (!tasks) return null

  const hasModified = tasks.modified.length > 0
  const hasUrgent = tasks.urgent.length > 0
  const hasPending = tasks.pending.length > 0

  return (
    <div className="page-container">
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        <div>
          <Title level={3} style={{ marginBottom: 8 }}>
            👋 {currentUser.name}，今天先处理这些
          </Title>
          <Text type="secondary">
            按优先级排序，红色标记的是被改动过的订单，需要优先复核
          </Text>
        </div>

        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic
                title="待处理"
                value={tasks.pending.length}
                prefix={<AlertOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="被改动需复核"
                value={tasks.modified.length}
                prefix={<EditOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="今日紧急"
                value={tasks.urgent.length}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        {hasModified && (
          <div>
            <Alert
              message="⚠️ 以下订单的稿件/尺寸/安装时间被修改，需要优先处理！"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            {tasks.modified.map((order) => renderOrderCard(order, true))}
          </div>
        )}

        {hasUrgent && (
          <div>
            <Title level={4} style={{ marginBottom: 16 }}>
              <ExclamationCircleOutlined style={{ color: '#f5222d' }} /> 今日待安装
            </Title>
            {tasks.urgent.map((order) => renderOrderCard(order))}
          </div>
        )}

        <div>
          <Title level={4} style={{ marginBottom: 16 }}>
            <ClockCircleOutlined /> 待处理列表
          </Title>
          {hasPending ? (
            tasks.pending.map((order) => renderOrderCard(order))
          ) : (
            <Card>
              <Empty description="今日暂无待处理任务" />
            </Card>
          )}
        </div>
      </Space>
    </div>
  )
}
