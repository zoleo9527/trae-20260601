import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Button, Empty } from 'antd';
import { Link } from 'react-router-dom';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import type { Role, DashboardStats, Registration, PhysicalCheck, ExceptionRecord } from 'shared';
import { getStats, getRegistrations, getPhysicals, getExceptions } from '../api';
import { useUserStore } from '../store/user';
import {
  registrationStatusMap,
  physicalStatusMap,
  exceptionLevelMap,
  formatDateTime,
  roleMap,
} from '../utils/constants';

const { Title } = Typography;

interface Props {
  role: Role;
}

export default function Dashboard({ role }: Props) {
  const currentUser = useUserStore((s) => s.currentUser);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRegs, setRecentRegs] = useState<Registration[]>([]);
  const [recentPhysicals, setRecentPhysicals] = useState<PhysicalCheck[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [role]);

  const load = async () => {
    setLoading(true);
    try {
      const [s, regs, phys, exs] = await Promise.all([
        getStats(),
        getRegistrations(),
        getPhysicals(),
        getExceptions({ resolved: false }),
      ]);
      setStats(s);
      setRecentRegs(regs.slice(0, 5));
      setRecentPhysicals(phys.slice(0, 5));
      setExceptions(exs.slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  if (!stats) {
    return <Card loading={loading}><Empty /></Card>;
  }

  const hello = `${roleMap[role].icon} 你好，${currentUser}（${roleMap[role].label}）`;

  const quickActionsByRole: Record<Role, { label: string; icon: React.ReactNode; to: string; color: string }[]> = {
    registrar: [
      { label: '处理报名资料', icon: <FileTextOutlined />, to: '/registrar/registrations', color: '#1677ff' },
      { label: '交班记录', icon: <ArrowRightOutlined />, to: '/registrar/handover', color: '#722ed1' },
    ],
    fieldCoach: [
      { label: '体检核验', icon: <MedicineBoxOutlined />, to: '/fieldCoach/physicals', color: '#52c41a' },
      { label: '异常处理', icon: <ExclamationCircleOutlined />, to: '/fieldCoach/exceptions', color: '#fa8c16' },
    ],
    safetyOfficer: [
      { label: '体检复核', icon: <MedicineBoxOutlined />, to: '/safetyOfficer/physicals', color: '#fa8c16' },
      { label: '异常仲裁', icon: <ExclamationCircleOutlined />, to: '/safetyOfficer/exceptions', color: '#eb2f96' },
    ],
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Card style={{ marginBottom: 16, borderRadius: 8 }} bodyStyle={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0, color: roleMap[role].color }}>
              {hello}
            </Title>
            <div style={{ marginTop: 6, color: '#8c8c8c', fontSize: 14 }}>
              今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              ，今日共完成 <strong style={{ color: '#1f1f1f' }}>{stats.todayCompleted}</strong> 项业务
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {quickActionsByRole[role].map((a, i) => (
              <Link key={i} to={a.to}>
                <Button type="primary" icon={a.icon} size="large" style={{ background: a.color, borderColor: a.color }}>
                  {a.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title={<div className="label">总报名数</div>}
              value={stats.totalRegistrations}
              prefix={<FileTextOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title={<div className="label">资料完成</div>}
              value={stats.registrationByStatus.completed}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ fontSize: 28, color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title={<div className="label">体检通过</div>}
              value={stats.physicalByStatus.passed}
              prefix={<MedicineBoxOutlined style={{ color: '#13c2c2' }} />}
              valueStyle={{ fontSize: 28, color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title={<div className="label">待处理异常</div>}
              value={stats.exceptions}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ fontSize: 28, color: stats.exceptions > 0 ? '#eb2f96' : '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card
            title={<span><FileTextOutlined /> 报名资料状态分布</span>}
            size="small"
            style={{ borderRadius: 8 }}
          >
            <Row gutter={[8, 8]}>
              {Object.entries(registrationStatusMap).map(([k, v]) => (
                <Col xs={12} sm={8} key={k}>
                  <div style={{
                    padding: 12,
                    background: '#fafafa',
                    borderRadius: 6,
                    textAlign: 'center',
                    border: '1px solid #f0f0f0',
                  }}>
                    <Tag color={v.color} style={{ margin: 0 }}>{v.label}</Tag>
                    <div style={{ marginTop: 8, fontSize: 22, fontWeight: 600 }}>
                      {stats.registrationByStatus[k as keyof typeof stats.registrationByStatus] || 0}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={<span><MedicineBoxOutlined /> 体检核验状态分布</span>}
            size="small"
            style={{ borderRadius: 8 }}
          >
            <Row gutter={[8, 8]}>
              {Object.entries(physicalStatusMap).map(([k, v]) => (
                <Col xs={12} sm={8} key={k}>
                  <div style={{
                    padding: 12,
                    background: '#fafafa',
                    borderRadius: 6,
                    textAlign: 'center',
                    border: '1px solid #f0f0f0',
                  }}>
                    <Tag color={v.color} style={{ margin: 0 }}>{v.label}</Tag>
                    <div style={{ marginTop: 8, fontSize: 22, fontWeight: 600 }}>
                      {stats.physicalByStatus[k as keyof typeof stats.physicalByStatus] || 0}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><ClockCircleOutlined /> 最近报名资料</span>
                {role === 'registrar' && <Link to="/registrar/registrations"><Button type="link" size="small">全部 →</Button></Link>}
              </div>
            }
            size="small"
            style={{ borderRadius: 8 }}
          >
            <Table<Registration>
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={recentRegs}
              columns={[
                { title: '学员', dataIndex: 'studentName', width: 80 },
                { title: '资料编号', dataIndex: 'id', width: 130, render: (v) => <span style={{ color: '#8c8c8c', fontSize: 12 }}>{v}</span> },
                {
                  title: '状态', dataIndex: 'status', width: 90,
                  render: (v) => {
                    const info = registrationStatusMap[v];
                    return <Tag color={info.color}>{info.label}</Tag>;
                  },
                },
                { title: '报名员', dataIndex: 'registrarName', width: 80 },
                {
                  title: '更新时间', dataIndex: 'updatedAt', width: 140,
                  render: (v) => <span style={{ fontSize: 12, color: '#8c8c8c' }}>{formatDateTime(v)}</span>,
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><MedicineBoxOutlined /> 最近体检记录</span>
                {role !== 'registrar' && (
                  <Link to={`/${role}/physicals`}>
                    <Button type="link" size="small">全部 →</Button>
                  </Link>
                )}
              </div>
            }
            size="small"
            style={{ borderRadius: 8 }}
          >
            <Table<PhysicalCheck>
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={recentPhysicals}
              columns={[
                { title: '学员', dataIndex: 'studentName', width: 80 },
                {
                  title: '状态', dataIndex: 'status', width: 90,
                  render: (v) => {
                    const info = physicalStatusMap[v];
                    return <Tag color={info.color}>{info.label}</Tag>;
                  },
                },
                { title: '体检员', dataIndex: 'examiner', width: 80, render: (v) => v || '—' },
                {
                  title: '体检时间', dataIndex: 'checkedAt', width: 140,
                  render: (v) => <span style={{ fontSize: 12, color: '#8c8c8c' }}>{formatDateTime(v)}</span>,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {exceptions.length > 0 && (
        <Card
          style={{ marginTop: 16, borderRadius: 8, borderColor: '#ffd591' }}
          title={<span style={{ color: '#fa8c16' }}><WarningOutlined /> 需要关注的异常（共 {exceptions.length} 条）</span>}
          size="small"
        >
          {exceptions.map((e) => (
            <div
              key={e.id}
              style={{
                padding: 12,
                marginBottom: 8,
                background: e.level === 'error' ? '#fff2f0' : '#fffbe6',
                borderRadius: 6,
                borderLeft: `3px solid ${e.level === 'error' ? '#ff4d4f' : '#faad14'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <strong>
                  {e.studentName}
                  <Tag color={exceptionLevelMap[e.level].color} style={{ marginLeft: 8 }}>
                    {exceptionLevelMap[e.level].label}
                  </Tag>
                </strong>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>{formatDateTime(e.createdAt)}</span>
              </div>
              <div style={{ fontSize: 13, color: '#595959' }}>{e.content}</div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
