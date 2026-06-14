import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Button, Empty, List, Avatar, Space, Timeline } from 'antd';
import { Link } from 'react-router-dom';
import {
  CarOutlined,
  BellOutlined,
  RollbackOutlined,
  PaperClipOutlined,
  BankOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { Role, DashboardStats, TransferOrder, StatusChangeLog } from 'shared';
import { getStats, getOrders, getStatusLogs } from '../api';
import { useUserStore } from '../store/user';
import {
  stageMap,
  urgencyMap,
  roleMap,
  formatDateTime,
  formatMoney,
  actionLogMap,
  carSourceStatusMap,
} from '../utils/constants';

const { Title } = Typography;

interface Props {
  role: Role;
}

export default function Dashboard({ role }: Props) {
  const currentUser = useUserStore((s) => s.currentUser);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [myOrders, setMyOrders] = useState<TransferOrder[]>([]);
  const [recentLogs, setRecentLogs] = useState<StatusChangeLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [role]);

  const load = async () => {
    setLoading(true);
    try {
      const [s, orders, logs] = await Promise.all([
        getStats(role),
        getOrders({ role }),
        getStatusLogs(),
      ]);
      setStats(s);
      setMyOrders(orders.filter(o => o.currentHandlerRole === role && o.stage !== 'completed').slice(0, 6));
      setRecentLogs(logs.slice(0, 8));
    } finally {
      setLoading(false);
    }
  };

  if (!stats) {
    return <Card loading={loading}><Empty /></Card>;
  }

  const hello = `${roleMap[role].icon} 你好，${currentUser}（${roleMap[role].label}）`;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Card style={{ marginBottom: 16, borderRadius: 8 }} styles={{ body: { padding: 24 } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0, color: roleMap[role].color }}>
              {hello}
            </Title>
            <div style={{ marginTop: 6, color: '#8c8c8c', fontSize: 14 }}>
              今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              ，今日已完成 <strong style={{ color: '#1f1f1f' }}>{stats.todayCompleted}</strong> 单交易
              {stats.totalLoanAmount > 0 && (
                <>，累计放款 <strong style={{ color: '#52c41a' }}>{formatMoney(stats.totalLoanAmount)}</strong></>
              )}
            </div>
          </div>
          <Link to={`/${role}/transfer`}>
            <Button type="primary" icon={<ArrowRightOutlined />} size="large" style={{ background: roleMap[role].color, borderColor: roleMap[role].color }}>
              进入成交过户与贷款放款处理
            </Button>
          </Link>
        </div>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title={<div className="label">我的待办</div>}
              value={stats.myPending}
              prefix={<CarOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ fontSize: 28, color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title={<div className="label">有人催</div>}
              value={stats.urgentOrders}
              prefix={<BellOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ fontSize: 28, color: stats.urgentOrders > 0 ? '#ff4d4f' : '#8c8c8c' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title={<div className="label">已退回</div>}
              value={stats.returnedOrders}
              prefix={<RollbackOutlined style={{ color: '#fa541c' }} />}
              valueStyle={{ fontSize: 28, color: stats.returnedOrders > 0 ? '#fa541c' : '#8c8c8c' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title={<div className="label">补材料</div>}
              value={stats.supplementOrders}
              prefix={<PaperClipOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ fontSize: 28, color: stats.supplementOrders > 0 ? '#faad14' : '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card
            title={<span><CarOutlined /> 成交过户与贷款放款 — 阶段分布</span>}
            size="small"
            style={{ borderRadius: 8 }}
          >
            <Row gutter={[8, 8]}>
              {Object.entries(stageMap).map(([k, v]) => (
                <Col xs={8} sm={8} key={k}>
                  <div style={{
                    padding: 12,
                    background: '#fafafa',
                    borderRadius: 6,
                    textAlign: 'center',
                    border: '1px solid #f0f0f0',
                  }}>
                    <Tag color={v.color} style={{ margin: 0 }}>{v.icon} {v.label}</Tag>
                    <div style={{ marginTop: 8, fontSize: 22, fontWeight: 600 }}>
                      {stats.ordersByStage[k as keyof typeof stats.ordersByStage] || 0}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={<span><BankOutlined /> 车源档案状态</span>}
            size="small"
            style={{ borderRadius: 8 }}
          >
            <Row gutter={[8, 8]}>
              {Object.entries(carSourceStatusMap).map(([k, v]) => (
                <Col xs={12} key={k}>
                  <div style={{
                    padding: 12,
                    background: '#fafafa',
                    borderRadius: 6,
                    textAlign: 'center',
                    border: '1px solid #f0f0f0',
                  }}>
                    <Tag color={v.color} style={{ margin: 0 }}>{v.label}</Tag>
                    <div style={{ marginTop: 8, fontSize: 20, fontWeight: 600 }}>
                      {stats.carSourcesByStatus[k as keyof typeof stats.carSourcesByStatus] || 0}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
            <div style={{ marginTop: 12, fontSize: 12, color: '#8c8c8c', lineHeight: 1.8 }}>
              💡 车源档案、检测报告和贷款资料只记录结果状态，
              不记录为什么变成"事故信息漏标"或"整备成本超预算"等原因。
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><CarOutlined /> 需要我处理的单子</span>
                <Link to={`/${role}/transfer`}>
                  <Button type="link" size="small">全部处理 →</Button>
                </Link>
              </div>
            }
            size="small"
            style={{ borderRadius: 8 }}
            styles={{ body: { padding: myOrders.length ? 0 : 24 } }}
          >
            {myOrders.length === 0 ? (
              <Empty description="暂无需要处理的单子 🎉" />
            ) : (
              <List
                dataSource={myOrders}
                renderItem={(o) => (
                  <List.Item style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                    <List.Item.Meta
                      avatar={<Avatar icon={<CarOutlined />} style={{ background: roleMap[o.currentHandlerRole].color }} />}
                      title={
                        <Space size="small" wrap>
                          <strong>{o.brand} {o.model}</strong>
                          <Tag color={stageMap[o.stage].color}>{stageMap[o.stage].label}</Tag>
                          {o.urgencyAction !== 'none' && (
                            <Tag color={urgencyMap[o.urgencyAction].color}>
                              {urgencyMap[o.urgencyAction].icon} {urgencyMap[o.urgencyAction].label}
                            </Tag>
                          )}
                        </Space>
                      }
                      description={
                        <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: 1.8 }}>
                          <div>🚗 {o.plateNumber} · {o.year}款</div>
                          <div>👤 买家：{o.buyerName} · 📞 {o.buyerPhone}</div>
                          <div>💰 成交价：{formatMoney(o.dealPrice)}</div>
                          {o.urgencyNote && (
                            <div style={{ marginTop: 4, color: '#cf1322', padding: '4px 8px', background: '#fff1f0', borderRadius: 4 }}>
                              ⚠️ {o.urgencyNote}
                            </div>
                          )}
                          <div style={{ marginTop: 4 }}>
                            <UserOutlined /> 当前处理：<Tag color={roleMap[o.currentHandlerRole].color}>{roleMap[o.currentHandlerRole].label} · {o.currentHandler}</Tag>
                          </div>
                        </div>
                      }
                    />
                    <Link to={`/${role}/transfer`}>
                      <Button type="primary" size="small">处理</Button>
                    </Link>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={<span><CheckCircleOutlined /> 最近状态变化时间线</span>}
            size="small"
            style={{ borderRadius: 8 }}
            styles={{ body: { padding: recentLogs.length ? 0 : 24 } }}
          >
            {recentLogs.length === 0 ? (
              <Empty description="暂无状态变化记录" />
            ) : (
              <Timeline
                style={{ padding: '16px 24px' }}
                items={recentLogs.map((l) => ({
                  color: l.action === 'urge' ? 'red' : l.action === 'return' ? 'orange' : l.action === 'supplement' ? 'gold' : 'blue',
                  label: <div style={{ fontSize: 12, color: '#8c8c8c' }}>{formatDateTime(l.operatedAt)}</div>,
                  children: (
                    <div>
                      <Space size="small" wrap style={{ marginBottom: 4 }}>
                        <Tag color={actionLogMap[l.action]?.color || 'default'}>
                          {actionLogMap[l.action]?.label || l.action}
                        </Tag>
                        <Tag color={stageMap[l.stage].color}>{stageMap[l.stage].label}</Tag>
                        <span style={{ color: '#8c8c8c', fontSize: 12 }}>{l.orderId}</span>
                      </Space>
                      <div style={{ fontSize: 13 }}>
                        <strong>{l.operator}</strong>
                        <Tag color="default" style={{ margin: '0 6px' }}>{roleMap[l.operatorRole].label}</Tag>
                        {l.remark}
                      </div>
                    </div>
                  ),
                }))}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
