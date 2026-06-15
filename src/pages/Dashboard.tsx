import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Statistic, List, Alert, Tag, Button, Space, Typography, Badge } from 'antd';
import {
  WarningOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
  FireOutlined
} from '@ant-design/icons';
import { orderApi } from '../services/api';
import { useAppContext } from '../App';
import { STATUS_LABELS, STATUS_COLORS } from '../types';
import type { Statistics, Order } from '../types';
import dayjs from '../utils/dayjs';

const { Title, Text } = Typography;

export default function Dashboard() {
  const navigate = useNavigate();
  const { stats: contextStats, refreshStats, currentUser } = useAppContext();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contextStats) {
      setStats(contextStats);
    }
    loadData();
  }, [contextStats]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (currentUser?.role === 'receptionist') params.role = 'receptionist';
      else if (currentUser?.role === 'designer') params.role = 'designer';
      else if (currentUser?.role === 'installer') params.role = 'installer';
      else if (currentUser?.role === 'production') params.role = 'production';
      else if (currentUser?.role === 'quality') params.role = 'quality';

      const [statsData, ordersData] = await Promise.all([
        orderApi.getStatistics(),
        orderApi.getOrders(params)
      ]);
      setStats(statsData);
      setRecentOrders(ordersData.slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  if (!stats) return null;

  const statCards = [
    { 
      title: '待处理订单', 
      value: stats.pendingReview + stats.designing + stats.revisionNeeded,
      icon: <FileTextOutlined style={{ color: '#1890ff' }} />,
      color: '#1890ff',
      link: '/orders?role=receptionist'
    },
    { 
      title: '待改稿', 
      value: stats.revisionNeeded,
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      color: '#ff4d4f',
      link: '/orders?role=designer'
    },
    { 
      title: '待客户确认', 
      value: stats.pendingApproval,
      icon: <ClockCircleOutlined style={{ color: '#faad14' }} />,
      color: '#faad14',
      link: '/orders?status=pending_approval'
    },
    { 
      title: '待安装', 
      value: stats.readyForInstall + stats.installing,
      icon: <FireOutlined style={{ color: '#13c2c2' }} />,
      color: '#13c2c2',
      link: '/orders?role=installer'
    },
    { 
      title: '待处理问题', 
      value: stats.openIssues,
      icon: <WarningOutlined style={{ color: '#eb2f96' }} />,
      color: '#eb2f96',
      link: '/orders?hasIssues=true'
    },
    { 
      title: '已完成', 
      value: stats.completed,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a',
      link: '/orders?status=completed'
    },
  ];

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>
            工作台 - {currentUser?.name}
          </Title>
          <Button onClick={() => { loadData(); refreshStats(); }}>
            刷新数据
          </Button>
        </div>

        {stats.alerts && stats.alerts.length > 0 && (
          <Card 
            className="pulse-danger"
            style={{ 
              background: 'linear-gradient(135deg, #fff1f0 0%, #fff 100%)',
              border: '1px solid #ffccc7'
            }}
            title={
              <Space>
                <WarningOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                  ⚠️ 实时告警 ({stats.alerts.length})
                </span>
              </Space>
            }
            extra={
              <Button type="primary" danger size="small" onClick={() => loadData()}>
                立即处理
              </Button>
            }
          >
            <List
              size="small"
              dataSource={stats.alerts.slice(0, 5)}
              renderItem={(alert) => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/orders/${alert.orderId}`)}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge status={alert.type === 'danger' ? 'error' : 'warning'} />
                    }
                    title={
                      <span style={{ color: alert.type === 'danger' ? '#ff4d4f' : '#faad14' }}>
                        {alert.message}
                      </span>
                    }
                    description={
                      alert.waitTime && (
                        <Text type="secondary">
                          已等待 {alert.waitTime} 分钟
                        </Text>
                      )
                    }
                  />
                  <ArrowRightOutlined />
                </List.Item>
              )}
            />
            {stats.overdue > 0 && (
              <Alert
                message={`有 ${stats.overdue} 个订单已超期！`}
                type="error"
                showIcon
                style={{ marginTop: 12 }}
              />
            )}
            {stats.approachingDeadline > 0 && (
              <Alert
                message={`有 ${stats.approachingDeadline} 个订单即将在4小时内到期`}
                type="warning"
                showIcon
                style={{ marginTop: 8 }}
              />
            )}
          </Card>
        )}

        <Row gutter={[16, 16]}>
          {statCards.map((card, index) => (
            <Col xs={12} md={8} lg={4} key={index}>
              <Card 
                hoverable 
                onClick={() => navigate(card.link)}
                style={{ cursor: 'pointer' }}
                styles={{ body: { padding: '20px 16px' } }}
              >
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div style={{ fontSize: 24 }}>{card.icon}</div>
                  <Statistic 
                    title={<Text type="secondary" style={{ fontSize: 13 }}>{card.title}</Text>}
                    value={card.value}
                    valueStyle={{ color: card.color, fontSize: 28 }}
                  />
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card 
              title="最近订单"
              extra={<Button type="link" onClick={() => navigate('/orders')}>查看全部</Button>}
            >
              <List
                dataSource={recentOrders}
                renderItem={(order) => (
                  <List.Item
                    style={{ 
                      cursor: 'pointer',
                      borderLeft: order.urgent ? '4px solid #ff4d4f' : '4px solid transparent',
                      paddingLeft: order.urgent ? 8 : 12
                    }}
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <span style={{ fontWeight: 500 }}>{order.title}</span>
                          <span style={{ color: '#999', fontSize: 12 }}>{order.id}</span>
                          {order.urgent && <Tag color="red">急单</Tag>}
                          {order.issues?.filter(i => i.status === 'pending').length > 0 && (
                            <Tag color="orange">
                              {order.issues.filter(i => i.status === 'pending').length}个问题
                            </Tag>
                          )}
                        </Space>
                      }
                      description={
                        <Space size="large" split={<Text type="secondary">|</Text>}>
                          <Text type="secondary">{order.customerName}</Text>
                          <Text type="secondary">{order.businessType}</Text>
                          {order.width && order.height && (
                            <Text type="secondary">
                              尺寸: {order.width}×{order.height}{order.unit}
                            </Text>
                          )}
                          <Text type="secondary">
                            {dayjs(order.createdAt).fromNow()}
                          </Text>
                        </Space>
                      }
                    />
                    <Space direction="vertical" align="end" size="small">
                      <Tag color={STATUS_COLORS[order.status]}>
                        {STATUS_LABELS[order.status]}
                      </Tag>
                      {order.expectedDelivery && (
                        <Text 
                          type={dayjs(order.expectedDelivery).isBefore(dayjs()) ? 'danger' : 'secondary'}
                          style={{ fontSize: 12 }}
                        >
                          交期: {dayjs(order.expectedDelivery).format('MM-DD HH:mm')}
                        </Text>
                      )}
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="今日待办">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {stats.urgent > 0 && (
                  <Alert
                    message={`${stats.urgent} 个急单待处理`}
                    type="error"
                    showIcon
                    action={
                      <Button size="small" danger onClick={() => navigate('/orders?urgent=true')}>
                        去处理
                      </Button>
                    }
                  />
                )}
                {stats.revisionNeeded > 0 && (
                  <Alert
                    message={`${stats.revisionNeeded} 个订单待改稿`}
                    type="warning"
                    showIcon
                    action={
                      <Button size="small" type="primary" onClick={() => navigate('/orders?role=designer')}>
                        去改稿
                      </Button>
                    }
                  />
                )}
                {stats.pendingApproval > 0 && (
                  <Alert
                    message={`${stats.pendingApproval} 个订单待客户确认`}
                    type="info"
                    showIcon
                    action={
                      <Button size="small" type="primary" onClick={() => navigate('/orders?status=pending_approval')}>
                        催确认
                      </Button>
                    }
                  />
                )}
                {stats.readyForInstall > 0 && (
                  <Alert
                    message={`${stats.readyForInstall} 个订单待安装`}
                    type="info"
                    showIcon
                    action={
                      <Button size="small" type="primary" onClick={() => navigate('/orders?role=installer')}>
                        安排安装
                      </Button>
                    }
                  />
                )}
                {stats.urgent === 0 && stats.revisionNeeded === 0 && stats.pendingApproval === 0 && stats.readyForInstall === 0 && (
                  <Alert
                    message="🎉 太棒了！当前没有紧急待办事项"
                    type="success"
                    showIcon
                  />
                )}
              </Space>
            </Card>

            <Card 
              title="快速操作" 
              style={{ marginTop: 16 }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button 
                  type="primary" 
                  block 
                  onClick={() => navigate('/orders/create')}
                >
                  + 新增订单
                </Button>
                <Button 
                  block 
                  onClick={() => navigate('/orders?view=batch')}
                >
                  批量处理
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>
    </div>
  );
}
