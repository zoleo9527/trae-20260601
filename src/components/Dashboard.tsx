import {
    AlertOutlined,
    ArrowRightOutlined,
    CarOutlined,
    ClockCircleOutlined,
    DollarOutlined,
    InfoCircleOutlined,
    TeamOutlined,
    ThunderboltOutlined,
    UserOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import {
    Alert,
    Avatar,
    Button,
    Card,
    Col,
    Divider,
    List,
    Row,
    Space,
    Statistic,
    Tag,
    Tooltip,
    Typography,
} from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import {
    ABNORMAL_TYPE_LABEL,
    ORDER_STATUS_LABEL,
    REPAIR_STATUS_LABEL,
    ROLE_LABEL,
} from '../mock/data';
import type { AbnormalRepair, DashboardStats, ParkingOrder, RoleType } from '../types';

const { Title, Text } = Typography;

interface DashboardProps {
  stats: DashboardStats;
  orders: ParkingOrder[];
  repairs: AbnormalRepair[];
  currentRole: RoleType;
  onJumpOrders: () => void;
  onJumpRepairs: () => void;
}

const roleColor: Record<RoleType, string> = {
  operator: 'blue',
  customer_service: 'green',
  maintenance: 'orange',
};

const roleTodoMap: Record<RoleType, { label: string; icon: React.ReactNode; key: keyof DashboardStats }> = {
  operator: { label: '运营专员待办', icon: <CarOutlined />, key: 'operatorTodo' },
  customer_service: { label: '客服待办', icon: <UserOutlined />, key: 'customerServiceTodo' },
  maintenance: { label: '设备维护员待办', icon: <ThunderboltOutlined />, key: 'maintenanceTodo' },
};

const Dashboard: React.FC<DashboardProps> = ({
  stats,
  orders,
  repairs,
  currentRole,
  onJumpOrders,
  onJumpRepairs,
}) => {
  const urgentRepairs = repairs
    .filter((r) => r.repairStatus === 'pending' || r.repairStatus === 'processing')
    .sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime())
    .slice(0, 5);

  const stuckOrAbnormal = orders
    .filter((o) => o.status === 'stuck' || o.status === 'abnormal')
    .sort((a, b) => new Date(a.updateTime).getTime() - new Date(b.updateTime).getTime())
    .slice(0, 6);

  const myTodoCount = stats[roleTodoMap[currentRole].key];

  return (
    <div>
      <Alert
        message={
          <Space>
            <AlertOutlined />
            <Text strong>主链路三问</Text>
            <Text type="secondary">
              ①谁在处理？②卡在哪里？③补缴为什么还没完成？
            </Text>
          </Space>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        action={
          <Button type="primary" size="small" icon={<ArrowRightOutlined />} onClick={onJumpOrders}>
            立即处理临停订单
          </Button>
        }
      />

      {myTodoCount > 0 && (
        <Alert
          message={
            <Space>
              <WarningOutlined />
              <Text strong>您有 {myTodoCount} 条待办需要处理</Text>
              <Tag color={roleColor[currentRole]}>
                角色：{ROLE_LABEL[currentRole]}
              </Tag>
            </Space>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Space>
              <Button size="small" onClick={onJumpOrders}>查看订单</Button>
              <Button size="small" type="primary" onClick={onJumpRepairs}>查看补缴</Button>
            </Space>
          }
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable>
            <Statistic
              title={
                <Space>
                  <CarOutlined /> 临停订单总量
                </Space>
              }
              value={stats.totalOrders}
              suffix="单"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable style={{ borderTop: '3px solid #ff4d4f' }}>
            <Statistic
              title={
                <Space>
                  <WarningOutlined style={{ color: '#ff4d4f' }} /> 卡单数量
                </Space>
              }
              value={stats.stuckOrders}
              suffix="单"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable style={{ borderTop: '3px solid #fa8c16' }}>
            <Statistic
              title={
                <Space>
                  <AlertOutlined style={{ color: '#fa8c16' }} /> 异常订单
                </Space>
              }
              value={stats.abnormalOrders}
              suffix="单"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable style={{ borderTop: '3px solid #13c2c2' }}>
            <Statistic
              title={
                <Space>
                  <DollarOutlined style={{ color: '#13c2c2' }} /> 异常待补缴金额
                </Space>
              }
              value={stats.totalUnpaidAmount}
              prefix="¥"
              precision={2}
              valueStyle={{ color: '#13c2c2' }}
            />
            <div style={{ marginTop: 8 }}>
              <Tag color="default">待处理 {stats.pendingRepairs}</Tag>
              <Tag color="processing">处理中 {stats.processingRepairs}</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {(['operator', 'customer_service', 'maintenance'] as RoleType[]).map((role) => {
          const cfg = roleTodoMap[role];
          const isMe = role === currentRole;
          return (
            <Col xs={24} md={8} key={role}>
              <Card
                bordered={false}
                style={{
                  borderTop: `3px solid ${isMe ? '#1677ff' : '#e8e8e8'}`,
                  background: isMe ? '#f0f7ff' : undefined,
                }}
              >
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space>
                    <Avatar
                      size="small"
                      style={{ backgroundColor: roleColor[role] }}
                      icon={cfg.icon}
                    />
                    <Text strong>{cfg.label}</Text>
                    {isMe && <Tag color="blue">当前登录角色</Tag>}
                  </Space>
                  <Statistic
                    value={stats[cfg.key]}
                    suffix="件"
                    valueStyle={{ fontSize: 28 }}
                  />
                  <Button
                    type={isMe ? 'primary' : 'default'}
                    size="small"
                    icon={<ArrowRightOutlined />}
                    onClick={onJumpOrders}
                    block
                  >
                    查看并处理
                  </Button>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            bordered={false}
            title={
              <Space>
                <AlertOutlined style={{ color: '#ff4d4f' }} />
                <span>异常提醒 · 待处理 / 处理中</span>
                <Tag color="red">{urgentRepairs.length}</Tag>
              </Space>
            }
            extra={
              <Button type="link" size="small" onClick={onJumpRepairs}>
                全部回看 <ArrowRightOutlined />
              </Button>
            }
          >
            <List
              dataSource={urgentRepairs}
              locale={{ emptyText: '暂无紧急异常，干得漂亮！' }}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  actions={[
                    <Tooltip title={item.blockerReason || '查看卡点原因'}>
                      <Tag color="warning" icon={<InfoCircleOutlined />}>
                        {item.currentStep}
                      </Tag>
                    </Tooltip>,
                    <Button
                      type="primary"
                      size="small"
                      onClick={onJumpRepairs}
                    >
                      处理
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{ backgroundColor: '#ff4d4f' }}
                        icon={<AlertOutlined />}
                      />
                    }
                    title={
                      <Space wrap>
                        <Text strong>{item.plateNo}</Text>
                        <Tag color="magenta">{ABNORMAL_TYPE_LABEL[item.abnormalType]}</Tag>
                        <Tag
                          color={
                            item.repairStatus === 'pending'
                              ? 'error'
                              : item.repairStatus === 'processing'
                              ? 'processing'
                              : 'gold'
                          }
                        >
                          {REPAIR_STATUS_LABEL[item.repairStatus]}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          #{item.repairNo}
                        </Text>
                      </Space>
                    }
                    description={
                      <div>
                        <div>
                          <Text type="secondary">{item.abnormalDesc}</Text>
                        </div>
                        <Space style={{ marginTop: 4 }}>
                          <Space size={4}>
                            <TeamOutlined />
                            <Tag color={item.assigneeRole ? roleColor[item.assigneeRole] : 'default'}>
                              {item.assigneeName || '未分配'} · {item.assigneeRole ? ROLE_LABEL[item.assigneeRole] : '待指派'}
                            </Tag>
                          </Space>
                          <Space size={4}>
                            <DollarOutlined />
                            <Text type="danger">
                              待缴 ¥{item.unpaidAmount.toFixed(2)}
                            </Text>
                          </Space>
                          <Space size={4}>
                            <ClockCircleOutlined />
                            <Text type="secondary">
                              {dayjs(item.createTime).fromNow()}
                            </Text>
                          </Space>
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            bordered={false}
            title={
              <Space>
                <WarningOutlined style={{ color: '#fa8c16' }} />
                <span>临停订单卡点速览</span>
              </Space>
            }
            extra={
              <Button type="link" size="small" onClick={onJumpOrders}>
                全部订单 <ArrowRightOutlined />
              </Button>
            }
          >
            <List
              dataSource={stuckOrAbnormal}
              locale={{ emptyText: '暂无卡点订单' }}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    title={
                      <Space wrap>
                        <Text strong>{item.plateNo}</Text>
                        <Tag
                          color={
                            item.status === 'stuck'
                              ? 'red'
                              : item.status === 'abnormal'
                              ? 'orange'
                              : 'blue'
                          }
                        >
                          {ORDER_STATUS_LABEL[item.status]}
                        </Tag>
                        {item.abnormalType && (
                          <Tag color="purple">
                            {ABNORMAL_TYPE_LABEL[item.abnormalType]}
                          </Tag>
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        <Space direction="vertical" size={2} style={{ width: '100%' }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.orderNo} · {item.parkingLotName}
                          </Text>
                          {item.stuckPoint ? (
                            <Tooltip title={item.stuckPoint}>
                              <Tag color="warning" icon={<InfoCircleOutlined />}>
                                卡点：{item.stuckPoint.length > 20 ? item.stuckPoint.slice(0, 20) + '...' : item.stuckPoint}
                              </Tag>
                            </Tooltip>
                          ) : null}
                          <Space size={[0, 4]} wrap>
                            {item.currentHandlerName && (
                              <Tag color={item.currentHandlerRole ? roleColor[item.currentHandlerRole] : 'default'}>
                                <UserOutlined /> {item.currentHandlerName} ·{' '}
                                {item.currentHandlerRole ? ROLE_LABEL[item.currentHandlerRole] : '待处理'}
                              </Tag>
                            )}
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              更新于 {dayjs(item.updateTime).fromNow()}
                            </Text>
                          </Space>
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
            <Divider style={{ margin: '8px 0 12px' }} />
            <Title level={5} style={{ marginBottom: 8 }}>
              <TeamOutlined /> 责任归属一目了然
            </Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Alert
                type="info"
                showIcon
                icon={<CarOutlined />}
                message={
                  <Space>
                    <Tag color="blue">运营专员</Tag>
                    负责道闸卡单、放行操作、补缴派单
                  </Space>
                }
              />
              <Alert
                type="success"
                showIcon
                icon={<UserOutlined />}
                message={
                  <Space>
                    <Tag color="green">客服</Tag>
                    负责车主沟通、费用争议、催缴跟进
                  </Space>
                }
              />
              <Alert
                type="warning"
                showIcon
                icon={<ThunderboltOutlined />}
                message={
                  <Space>
                    <Tag color="orange">设备维护员</Tag>
                    负责道闸硬件、识别摄像头、系统崩溃排查
                  </Space>
                }
              />
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
