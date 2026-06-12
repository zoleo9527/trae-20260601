import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Button, message } from 'antd';
import {
  ProjectOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { projectsApi, exceptionsApi } from '@/services/api';
import {
  statusDisplay,
  exceptionTypeDisplay,
  exceptionStatusDisplay,
  exceptionSeverityDisplay,
} from '@/types';

const BLOCKED_STATUSES = [
  'arrangement_rejected',
  'arrangement_submitted',
  'arrangement_reviewing',
  'expert_signin_pending',
  'expert_signin_in_progress',
  'finance_pending',
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProjects: 0,
    blockedProjects: 0,
    pendingExceptions: 0,
    signinInProgress: 0,
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [recentExceptions, setRecentExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, exceptionsRes] = await Promise.all([
        projectsApi.list({ pageSize: 10 }),
        exceptionsApi.list({ pageSize: 5, status: 'open' }),
      ]);

      const projects = projectsRes.items;
      const blocked = projects.filter((p: any) => BLOCKED_STATUSES.includes(p.status)).length;
      const signInProgress = projects.filter(
        (p: any) => p.status === 'expert_signin_in_progress'
      ).length;

      setStats({
        totalProjects: projectsRes.total,
        blockedProjects: blocked,
        pendingExceptions: exceptionsRes.total,
        signinInProgress: signInProgress,
      });

      setRecentProjects(projects.slice(0, 5));
      setRecentExceptions(exceptionsRes.items);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getProjectStatusInfo = (status: string) => {
    const sd = statusDisplay[status as keyof typeof statusDisplay];
    return { label: sd?.label || status, color: sd?.color || 'default' };
  };

  const getSeverityInfo = (severity: string) => {
    const sd = exceptionSeverityDisplay[severity as keyof typeof exceptionSeverityDisplay];
    return { label: sd?.label || severity, color: sd?.color || 'default' };
  };

  const getTypeInfo = (type: string) => {
    const td = exceptionTypeDisplay[type as keyof typeof exceptionTypeDisplay];
    return { label: td?.label || type, color: td?.color || 'default' };
  };

  const getStatusInfo = (status: string) => {
    const sd = exceptionStatusDisplay[status as keyof typeof exceptionStatusDisplay];
    return { label: sd?.label || status, color: sd?.color || 'default' };
  };

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="项目总数"
              value={stats.totalProjects}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="阻塞项目"
              value={stats.blockedProjects}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="待处理异常"
              value={stats.pendingExceptions}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="签到进行中"
              value={stats.signinInProgress}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title="最近项目"
            extra={
              <Button type="link" onClick={() => navigate('/projects')}>
                查看全部
              </Button>
            }
            loading={loading}
          >
            <List
              dataSource={recentProjects}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  actions={[
                    <Button type="link" size="small" onClick={() => navigate(`/projects/${item.id}`)}>
                      详情
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{item.name}</span>
                        {(() => {
                          const info = getProjectStatusInfo(item.status);
                          return <Tag color={info.color}>{info.label}</Tag>;
                        })()}
                        {BLOCKED_STATUSES.includes(item.status) && (
                          <Tag color="orange">需关注</Tag>
                        )}
                      </div>
                    }
                    description={
                      <div style={{ color: '#999', fontSize: 12 }}>
                        <span>项目编号：{item.projectNo}</span>
                        <span style={{ margin: '0 12px' }}>|</span>
                        <span>项目专员：{item.projectSpecialistName}</span>
                        <span style={{ margin: '0 12px' }}>|</span>
                        <span>创建时间：{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}</span>
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
            title="待处理异常"
            extra={
              <Button type="link" onClick={() => navigate('/exceptions')}>
                查看全部
              </Button>
            }
            loading={loading}
          >
            <List
              dataSource={recentExceptions}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {(() => {
                          const info = getSeverityInfo(item.severity);
                          return <Tag color={info.color}>{info.label}</Tag>;
                        })()}
                        <span>{item.title}</span>
                      </div>
                    }
                    description={
                      <div style={{ color: '#999', fontSize: 12 }}>
                        <div>类型：{getTypeInfo(item.type).label}</div>
                        <div>状态：{getStatusInfo(item.status).label}</div>
                        <div>触发时间：{dayjs(item.triggeredAt).format('YYYY-MM-DD HH:mm')}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
            {recentExceptions.length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>
                <CheckCircleOutlined style={{ fontSize: 48, marginBottom: 8 }} />
                <div>暂无待处理异常</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
