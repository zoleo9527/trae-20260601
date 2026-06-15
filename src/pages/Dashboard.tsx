import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Card,
  Tag,
  Space,
  Typography,
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
  CheckCircleOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Order, User, TodayTasks, UserRole } from '../types'
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

  const isSecondModification = (order: Order) =>
    order.dimensionReviewHistory.filter((r) => r.supersededAt).length >= 1

  const renderOrderCard = (order: Order) => {
    const secondMod = isSecondModification(order)
    const isInstallCompleted = order.status === 'install_completed'
    return (
      <Card
        key={order.id}
        size="small"
        style={{
          marginBottom: 12,
          borderLeft: secondMod
            ? '4px solid #ff4d4f'
            : order.dimensionModified
            ? '4px solid #faad14'
            : isInstallCompleted
            ? '4px solid #52c41a'
            : undefined,
        }}
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
              {secondMod && (
                <Badge count="二次改稿" style={{ backgroundColor: '#ff4d4f' }} />
              )}
              {order.dimensionModified && !secondMod && (
                <Badge count="尺寸已改" color="red" />
              )}
              {order.installTimeModified && !order.dimensionModified && !secondMod && (
                <Badge count="安装时间变更" color="orange" />
              )}
              {order.manuscriptVersion > 1 && !order.dimensionModified && !secondMod && (
                <Badge count={`v${order.manuscriptVersion}`} color="purple" />
              )}
              {isInstallCompleted && (
                <Badge count="待完单" style={{ backgroundColor: '#52c41a' }} />
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
                {order.reviewedDimension && !order.dimensionModified && (
                  <Text type="success">
                    ✓ 已复核 {order.reviewedDimension.width} × {order.reviewedDimension.height}
                  </Text>
                )}
                {order.dimensionModified && (
                  <Text type="danger">⚠ 需重新复核</Text>
                )}
              </Space>
              {order.dimensionReviewHistory.length > 0 && (
                <Space>
                  <SwapOutlined style={{ color: '#888' }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    复核历史 {order.dimensionReviewHistory.length} 版
                    {secondMod && (
                      <Text type="danger" style={{ fontSize: 12 }}>
                        {' '}(含二次改稿)
                      </Text>
                    )}
                  </Text>
                </Space>
              )}
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
  }

  if (!tasks) return null

  const secondModOrders = tasks.pending.filter(isSecondModification)
  const installCompletedOrders = tasks.pending.filter(
    (o) => o.status === 'install_completed'
  )
  const hasModified = tasks.modified.length > 0
  const hasUrgent = tasks.urgent.length > 0
  const hasPending = tasks.pending.length > 0

  const roleActionHint: Record<UserRole, string> = {
    receiver: '红色标记是二次改稿或待复核，绿色标记是待完单归档',
    designer: '红色标记是二次改稿需重新复核，优先处理！',
    installer: '橙色标记是安装时间变更的订单',
  }

  return (
    <div className="page-container">
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        <div>
          <Title level={3} style={{ marginBottom: 8 }}>
            👋 {currentUser.name}，今天先处理这些
          </Title>
          <Text type="secondary">
            按优先级排序 · {roleActionHint[currentUser.role]}
          </Text>
        </div>

        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="待处理"
                value={tasks.pending.length}
                prefix={<AlertOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="被改动需复核"
                value={tasks.modified.length}
                prefix={<EditOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="二次改稿"
                value={secondModOrders.length}
                prefix={<SwapOutlined />}
                valueStyle={{ color: secondModOrders.length > 0 ? '#ff4d4f' : '#999' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="待完单归档"
                value={installCompletedOrders.length}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: installCompletedOrders.length > 0 ? '#52c41a' : '#999' }}
              />
            </Card>
          </Col>
        </Row>

        {secondModOrders.length > 0 && currentUser.role === 'designer' && (
          <div>
            <Alert
              message={`🔴 ${secondModOrders.length} 个订单二次改稿，之前复核已过期，必须重新复核！`}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
            {secondModOrders.map((order) => renderOrderCard(order))}
          </div>
        )}

        {installCompletedOrders.length > 0 && currentUser.role === 'receiver' && (
          <div>
            <Alert
              message={`✅ ${installCompletedOrders.length} 个订单已安装完成，请确认并归档！`}
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
            {installCompletedOrders.map((order) => renderOrderCard(order))}
          </div>
        )}

        {hasModified && !(secondModOrders.length > 0 && currentUser.role === 'designer') && (
          <div>
            <Alert
              message="⚠️ 以下订单的稿件/尺寸/安装时间被修改，需要优先处理！"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            {tasks.modified
              .filter((o) => !isSecondModification(o))
              .map((order) => renderOrderCard(order))}
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
