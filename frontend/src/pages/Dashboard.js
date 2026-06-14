import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Space,
  Button,
  Select,
  DatePicker,
  Input,
  Progress,
  Timeline,
  Divider,
  Modal,
  message,
  Alert
} from 'antd';
import {
  BookOutlined,
  TrophyOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
  UserSwitchOutlined,
  EditOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { trainingApi, certificateApi, evaluationApi, exceptionApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

function Dashboard() {
  const { currentRole, permissions, user, switchRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    training: { total: 0, inProgress: 0, completed: 0 },
    certificate: { total: 0, pending: 0, issued: 0, abnormal: 0 },
    evaluation: { total: 0, published: 0, draft: 0, frozen: 0 },
    exception: { total: 0, pending: 0, processing: 0 }
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [roleSwitchVisible, setRoleSwitchVisible] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [currentRole]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [trainingRes, certRes, evalRes, excRes] = await Promise.all([
        trainingApi.getProjects({ limit: 5 }),
        certificateApi.getList({ limit: 10 }),
        evaluationApi.getList({ limit: 10 }),
        exceptionApi.getList({ limit: 10 })
      ]);

      const trainingProjects = trainingRes.data.projects || [];
      const certificates = certRes.data.certificates || [];
      const certStats = certRes.data.stats || {};
      const evaluations = evalRes.data.evaluations || [];
      const evalStats = evalRes.data.stats || {};
      const exceptions = excRes.data.exceptions || [];
      const excStats = excRes.data.stats || {};

      setStats({
        training: {
          total: trainingProjects.length,
          inProgress: trainingProjects.filter(p => p.status === 'in_progress' || p.status === 'registration').length,
          completed: trainingProjects.filter(p => p.status === 'completed').length
        },
        certificate: {
          total: certStats.total || 0,
          pending: certStats.pending || 0,
          issued: certStats.issued || 0,
          abnormal: certStats.abnormal || 0
        },
        evaluation: {
          total: evalStats.total || 0,
          published: evalStats.published || 0,
          draft: evalStats.draft || 0,
          frozen: evalStats.frozen || 0
        },
        exception: {
          total: excStats.total || 0,
          pending: (excStats.discovered || 0) + (excStats.assigned || 0),
          processing: excStats.processing || 0
        }
      });

      const activities = [];
      certificates.slice(0, 3).forEach(cert => {
        activities.push({
          id: cert.id,
          type: 'certificate',
          title: `证书 ${cert.certificate_number}`,
          description: cert.user_name,
          status: cert.status,
          time: cert.updated_at || cert.created_at
        });
      });

      exceptions.slice(0, 3).forEach(exc => {
        activities.push({
          id: exc.id,
          type: 'exception',
          title: exc.exception_number,
          description: exc.description,
          status: exc.status,
          time: exc.created_at
        });
      });

      setRecentActivities(activities.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5));

      const tasks = [];
      if (permissions.certificates?.includes('approve') || permissions.certificates?.includes('review')) {
        const pendingCerts = certificates.filter(c =>
          ['pending', 'creating', 'pending_review', 'needs_correction'].includes(c.status)
        );
        if (pendingCerts.length > 0) {
          tasks.push({
            type: 'certificate',
            title: '待处理证书',
            count: pendingCerts.length,
            icon: <TrophyOutlined />,
            color: '#1890ff',
            action: () => navigate('/certificates')
          });
        }
      }

      const pendingExceptions = exceptions.filter(e =>
        ['discovered', 'assigned', 'processing'].includes(e.status)
      );
      if (pendingExceptions.length > 0) {
        tasks.push({
          type: 'exception',
          title: '待处理异常',
          count: pendingExceptions.length,
          icon: <WarningOutlined />,
          color: '#ff4d4f',
          action: () => navigate('/exceptions')
        });
      }

      const frozenEvals = evaluations.filter(e => e.report_status === 'frozen');
      if (frozenEvals.length > 0) {
        tasks.push({
          type: 'evaluation',
          title: '评估报告冻结',
          count: frozenEvals.length,
          icon: <ExclamationCircleOutlined />,
          color: '#faad14',
          action: () => navigate('/evaluations')
        });
      }

      setPendingTasks(tasks);
    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSwitch = async (newRole) => {
    try {
      await switchRole(newRole);
      message.success('角色切换成功');
      setRoleSwitchVisible(false);
    } catch (error) {
      message.error('角色切换失败');
    }
  };

  const getRoleTitle = () => {
    const titles = {
      training_manager: '培训经理工作台',
      department_head: '部门负责人工作台',
      instructor: '讲师工作台'
    };
    return titles[currentRole] || '工作台';
  };

  const getRoleDescription = () => {
    const descriptions = {
      training_manager: {
        main: '负责统筹管理公司所有培训项目，审核证书发放，处理培训异常',
        tasks: [
          '审核待发放证书（pending_review状态）',
          '处理证书信息错误（needs_correction状态）',
          '处理效果评估冻结问题',
          '统筹异常处理进度'
        ]
      },
      department_head: {
        main: '负责本部门员工的培训报名和培训效果跟进',
        tasks: [
          '跟进本部门员工培训情况',
          '协调员工处理培训异常',
          '确认缺席员工原因',
          '跟进课后作业完成情况'
        ]
      },
      instructor: {
        main: '负责培训课程实施和证书制作发放',
        tasks: [
          '制作培训证书（creating状态）',
          '提交证书审核（pending_review状态）',
          '处理证书修正（needs_correction状态）',
          '跟进学员作业完成情况'
        ]
      }
    };

    return descriptions[currentRole] || descriptions.training_manager;
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>{getRoleTitle()}</h1>
          <Button
            icon={<UserSwitchOutlined />}
            onClick={() => setRoleSwitchVisible(true)}
          >
            切换角色
          </Button>
        </div>
        <Alert
          message="角色职责"
          description={
            <div>
              <div>{getRoleDescription().main}</div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ fontSize: 12 }}>
                <strong>当前角色待办：</strong>
                <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                  {getRoleDescription().tasks.map((task, index) => (
                    <li key={index}>{task}</li>
                  ))}
                </ul>
              </div>
            </div>
          }
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="培训项目"
              value={stats.training.total}
              prefix={<BookOutlined />}
              suffix={
                <span style={{ fontSize: 14 }}>
                  (进行中: {stats.training.inProgress})
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="证书"
              value={stats.certificate.total}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: stats.certificate.pending > 0 ? '#faad14' : '#3f8600' }}
              suffix={
                <span style={{ fontSize: 14 }}>
                  (待处理: {stats.certificate.pending})
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="效果评估"
              value={stats.evaluation.total}
              prefix={<CheckCircleOutlined />}
              suffix={
                <span style={{ fontSize: 14 }}>
                  (已发布: {stats.evaluation.published})
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="异常处理"
              value={stats.exception.total}
              prefix={<WarningOutlined />}
              valueStyle={{ color: stats.exception.pending > 0 ? '#ff4d4f' : '#3f8600' }}
              suffix={
                <span style={{ fontSize: 14 }}>
                  (待处理: {stats.exception.pending})
                </span>
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title="待办事项"
            extra={
              <Button type="link" onClick={() => navigate('/certificates')}>
                查看全部 <ArrowRightOutlined />
              </Button>
            }
            loading={loading}
          >
            <Row gutter={[16, 16]}>
              {pendingTasks.length === 0 ? (
                <Col span={24}>
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                    暂无待处理事项
                  </div>
                </Col>
              ) : (
                pendingTasks.map((task, index) => (
                  <Col xs={24} sm={12} key={index}>
                    <Card
                      hoverable
                      onClick={task.action}
                      style={{
                        borderLeft: `3px solid ${task.color}`,
                        cursor: 'pointer'
                      }}
                    >
                      <Space>
                        <span style={{ fontSize: 24 }}>{task.icon}</span>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                            {task.title}
                          </div>
                          <div style={{ fontSize: 24, fontWeight: 'bold', color: task.color }}>
                            {task.count}
                          </div>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                ))
              )}
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title="最近动态"
            loading={loading}
          >
            <Timeline
              items={recentActivities.map(activity => ({
                color: activity.status === 'completed' || activity.status === 'resolved' || activity.status === 'issued' ? 'green' :
                       activity.status === 'processing' || activity.status === 'pending_review' ? 'blue' : 'gray',
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold' }}>
                      {activity.title}
                    </div>
                    <div style={{ color: '#999', fontSize: 12 }}>
                      {activity.description}
                    </div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      {dayjs(activity.time).format('YYYY-MM-DD HH:mm')}
                    </div>
                  </div>
                )
              }))}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="证书发放进度" loading={loading}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="总证书数"
                  value={stats.certificate.total}
                  prefix={<TrophyOutlined />}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="已发放"
                  value={stats.certificate.issued}
                  valueStyle={{ color: '#3f8600' }}
                />
                <Progress
                  percent={stats.certificate.total > 0 ?
                    Math.round((stats.certificate.issued / stats.certificate.total) * 100) : 0}
                  strokeColor="#52c41a"
                  showInfo={false}
                  style={{ marginTop: 8 }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="异常证书"
                  value={stats.certificate.abnormal}
                  valueStyle={{ color: stats.certificate.abnormal > 0 ? '#ff4d4f' : '#999' }}
                />
              </Col>
            </Row>)}
          </Card>
        </Col>
      </Row>

      <Modal
        title="切换角色"
        open={roleSwitchVisible}
        onCancel={() => setRoleSwitchVisible(false)}
        footer={null}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: '#666' }}>选择一个角色进行切换，不同角色会看到不同的待办事项和操作入口：</p>
        </div>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            block
            type={currentRole === 'training_manager' ? 'primary' : 'default'}
            icon={<FileTextOutlined />}
            onClick={() => handleRoleSwitch('training_manager')}
            style={{ textAlign: 'left', height: 'auto', padding: '12px 16px' }}
          >
            <div>
              <div style={{ fontWeight: 'bold' }}>培训经理</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                统筹管理培训项目，审核证书发放
              </div>
            </div>
          </Button>
          <Button
            block
            type={currentRole === 'department_head' ? 'primary' : 'default'}
            icon={<TeamOutlined />}
            onClick={() => handleRoleSwitch('department_head')}
            style={{ textAlign: 'left', height: 'auto', padding: '12px 16px' }}
          >
            <div>
              <div style={{ fontWeight: 'bold' }}>部门负责人</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                跟进本部门员工培训情况
              </div>
            </div>
          </Button>
          <Button
            block
            type={currentRole === 'instructor' ? 'primary' : 'default'}
            icon={<EditOutlined />}
            onClick={() => handleRoleSwitch('instructor')}
            style={{ textAlign: 'left', height: 'auto', padding: '12px 16px' }}
          >
            <div>
              <div style={{ fontWeight: 'bold' }}>讲师</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                负责培训实施和证书制作
              </div>
            </div>
          </Button>
        </Space>
      </Modal>
    </div>
  );
}

export default Dashboard;
