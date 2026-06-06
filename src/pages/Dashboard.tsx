import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, List, Tag, Button, Space, Avatar, Badge, Row, Col, Statistic } from 'antd';
import {
  CalendarOutlined,
  FileTextOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  VideoCameraOutlined,
  FileZipOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useStore } from '@/store';
import type { TodoItem, RiskItem, RecentChange } from '@/types';

const priorityColors: Record<string, string> = {
  high: 'red',
  medium: 'orange',
  low: 'green',
};

const priorityText: Record<string, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};

const riskLevelColors: Record<string, string> = {
  critical: 'red',
  warning: 'orange',
  info: 'blue',
};

const riskLevelText: Record<string, string> = {
  critical: '严重',
  warning: '警告',
  info: '提示',
};

const todoTypeIcons: Record<string, React.ReactNode> = {
  shooting: <VideoCameraOutlined />,
  delivery: <FileZipOutlined />,
  review: <FileTextOutlined />,
  meeting: <CalendarOutlined />,
};

const changeTypeTags: Record<string, { color: string; text: string }> = {
  status: { color: 'blue', text: '状态变更' },
  schedule: { color: 'purple', text: '排期更新' },
  delivery: { color: 'green', text: '素材交付' },
  script: { color: 'cyan', text: '脚本更新' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    todos,
    risks,
    recentChanges,
    shootingSchedules,
    materialDeliveries,
    fetchTodos,
    fetchRisks,
    fetchRecentChanges,
    fetchShootingSchedules,
    fetchMaterialDeliveries,
    updateTodo,
  } = useStore();

  useEffect(() => {
    fetchTodos();
    fetchRisks();
    fetchRecentChanges();
    fetchShootingSchedules();
    fetchMaterialDeliveries();
  }, [fetchTodos, fetchRisks, fetchRecentChanges, fetchShootingSchedules, fetchMaterialDeliveries]);

  const pendingTodos = todos.filter((t) => t.status === 'pending');
  const todaySchedules = shootingSchedules.filter((s) =>
    dayjs(s.shootDate).isSame(dayjs(), 'day')
  );
  const pendingDeliveries = materialDeliveries.filter(
    (m) => m.status === 'pending' || m.status === 'submitted' || m.status === 'reviewing' || m.status === 'revision_requested'
  );

  const handleTodoComplete = async (todo: TodoItem) => {
    await updateTodo(todo.id, { status: 'completed' });
  };

  const getTodoRelatedPage = (todo: TodoItem) => {
    if (todo.type === 'shooting') {
      navigate('/schedules');
    } else if (todo.type === 'delivery' || todo.type === 'review') {
      navigate('/deliveries');
    } else {
      navigate(`/projects/${todo.relatedId}`);
    }
  };

  const getRiskRelatedPage = (risk: RiskItem) => {
    if (risk.relatedType === 'schedule') {
      navigate('/schedules');
    } else if (risk.relatedType === 'delivery') {
      navigate('/deliveries');
    } else {
      navigate(`/projects/${risk.relatedId}`);
    }
  };

  const getChangeRelatedPage = (change: RecentChange) => {
    if (change.type === 'schedule') {
      navigate('/schedules');
    } else if (change.type === 'delivery') {
      navigate('/deliveries');
    } else {
      navigate(`/projects/${change.relatedId}`);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
            title="今日拍摄"
            value={todaySchedules.length}
            prefix={<VideoCameraOutlined style={{ color: '#1890ff' }} />}
            valueStyle={{ color: '#1890ff' }}
          />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
            title="待处理交付"
            value={pendingDeliveries.length}
            prefix={<FileZipOutlined style={{ color: '#52c41a' }} />}
            valueStyle={{ color: '#52c41a' }}
          />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
            title="待办任务"
            value={pendingTodos.length}
            prefix={<CheckCircleOutlined style={{ color: '#faad14' }} />}
            valueStyle={{ color: '#faad14' }}
          />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
            title="风险项"
            value={risks.length}
            prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
            valueStyle={{ color: '#ff4d4f' }}
          />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card
            title={
              <Space>
                <CheckCircleOutlined style={{ color: '#faad14' }} />
                待办任务
                <Badge count={pendingTodos.length} color="#faad14" />
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/schedules')}>
                查看全部
              </Button>
            }
          >
            <List
              dataSource={pendingTodos.slice(0, 5)}
              renderItem={(item) => (
                <List.Item
                  actions={[
                  <Button
                  type="link"
                  size="small"
                  onClick={() => handleTodoComplete(item)}
                  >
                    完成
                  </Button>,
                ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{
                          backgroundColor:
                            item.priority === 'high' ? '#ff4d4f' : item.priority === 'medium' ? '#faad14' : '#52c41a',
                        }}
                        icon={todoTypeIcons[item.type]}
                      />
                    }
                    title={
                      <Space>
                        <span>{item.title}</span>
                        <Tag color={priorityColors[item.priority]}>
                          {priorityText[item.priority]}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <span>{item.description}</span>
                        <Space size="small" style={{ fontSize: 12, color: '#999' }}>
                          <ClockCircleOutlined />
                          截止: {dayjs(item.dueDate).format('MM-DD')}
                          <span>·</span>
                          <span>负责人: {item.assignee}</span>
                        </Space>
                      </Space>
                    }
                  />
                  <Button type="link" size="small" onClick={() => getTodoRelatedPage(item)}>
                    查看
                  </Button>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: '#ff4d4f' }} />
                风险项
                <Badge count={risks.length} color="#ff4d4f" />
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/schedules')}>
                查看全部
              </Button>
            }
          >
            <List
              dataSource={risks}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{
                          backgroundColor:
                            item.level === 'critical' ? '#ff4d4f' : item.level === 'warning' ? '#faad14' : '#1890ff',
                        }}
                        icon={<WarningOutlined />}
                      />
                    }
                    title={
                      <Space>
                        <span>{item.title}</span>
                        <Tag color={riskLevelColors[item.level]}>
                          {riskLevelText[item.level]}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <span>{item.description}</span>
                        <span style={{ fontSize: 12, color: '#999' }}>
                          {dayjs(item.createdAt).format('MM-DD HH:mm')}
                        </span>
                      </Space>
                    }
                  />
                  <Button type="link" size="small" onClick={() => getRiskRelatedPage(item)}>
                    处理
                  </Button>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#1890ff' }} />
                最近变更
              </Space>
            }
          >
            <List
              dataSource={recentChanges.slice(0, 5)}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar style={{ backgroundColor: '#1890ff' }}>
                        {item.operator.charAt(0)}
                      </Avatar>
                    }
                    title={
                      <Space>
                        <Tag color={changeTypeTags[item.type].color}>
                          {changeTypeTags[item.type].text}
                        </Tag>
                        <span>{item.title}</span>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <span>{item.description}</span>
                        <Space size="small" style={{ fontSize: 12, color: '#999' }}>
                          <span>操作人: {item.operator}</span>
                          <span>·</span>
                          <span>{dayjs(item.createdAt).format('MM-DD HH:mm')}</span>
                        </Space>
                      </Space>
                    }
                  />
                  <Button type="link" size="small" onClick={() => getChangeRelatedPage(item)}>
                    查看详情
                  </Button>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
