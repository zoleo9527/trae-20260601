import React, { useState, useEffect } from 'react';
import { Drawer, Descriptions, Tag, Typography, Space, Button, Select, Input, Divider, Steps, Card, Avatar, Timeline, message, Spin, Progress } from 'antd';
import { UserOutlined, WarningOutlined, CheckCircleOutlined, SendOutlined, ClockCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useAuth, ROLE_LABELS, ROLE_COLORS } from '../contexts/AuthContext';
import { api, EXCEPTION_STATUS, SEVERITY_LABELS, SHIFT_LABELS, ACTION_LABELS, ACTION_COLORS } from '../api';

const { Title, Text, Paragraph } = Typography;

const SEVERITY_COLORS = {
  critical: '#e63946',
  urgent: '#ff6b35',
  warning: '#f4a261',
  info: '#00b4d8',
};

const STATUS_STEP_MAP = {
  open: 0,
  assigned: 1,
  handling: 2,
  resolved: 3,
  closed: 4,
};

const TIMELINE_ICON_MAP = {
  created: { color: '#00b4d8', icon: <ClockCircleOutlined /> },
  assigned: { color: '#f4a261', icon: <UserOutlined /> },
  handling: { color: '#00b4d8', icon: <SendOutlined /> },
  resolved: { color: '#2ec4b6', icon: <CheckCircleOutlined /> },
  closed: { color: '#666', icon: <CheckCircleOutlined /> },
  escalated: { color: '#e63946', icon: <WarningOutlined /> },
};

function ElapsedSince({ startedAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!startedAt) return null;
  const ms = now - new Date(startedAt.replace(' ', 'T')).getTime();
  if (ms < 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cls = h >= 4 ? 'overdue' : h >= 2 ? 'warning' : 'normal';
  return <span className={`timer-elapsed ${cls}`} style={{ fontSize: 14 }}>{h}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</span>;
}

export default function ExceptionDrawer({ open, exceptionId, onClose, onRefresh }) {
  const { user } = useAuth();
  const [exception, setException] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolution, setResolution] = useState('');

  const fetchData = async () => {
    if (!exceptionId) return;
    setLoading(true);
    try {
      const d = await api.exceptions.get(exceptionId);
      setException(d.exception);
      setTimeline(d.timeline || []);
    } catch (e) {
      message.error(e.message);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const d = await api.auth.getUsers();
      setUsers(d.users || []);
    } catch {}
  };

  useEffect(() => {
    if (open && exceptionId) {
      fetchData();
      fetchUsers();
      setResolution('');
    }
  }, [open, exceptionId]);

  const handleAssign = async (handlerId, handlerRole) => {
    setAssignLoading(true);
    try {
      await api.exceptions.assign(exceptionId, {
        handler_id: handlerId,
        handler_role: handlerRole,
        operator_id: user?.id,
        operator_name: user?.name,
      });
      message.success('已指派');
      fetchData();
      onRefresh?.();
    } catch (e) {
      message.error(e.message);
    }
    setAssignLoading(false);
  };

  const handleStartHandle = async () => {
    try {
      await api.exceptions.handle(exceptionId, {
        operator_id: user?.id,
        operator_name: user?.name,
      });
      message.success('已开始处理');
      fetchData();
      onRefresh?.();
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleResolve = async () => {
    if (!resolution.trim()) {
      message.warning('请填写处理结果');
      return;
    }
    setResolveLoading(true);
    try {
      await api.exceptions.resolve(exceptionId, {
        resolution,
        operator_id: user?.id,
        operator_name: user?.name,
      });
      message.success('已解决');
      fetchData();
      onRefresh?.();
    } catch (e) {
      message.error(e.message);
    }
    setResolveLoading(false);
  };

  const handleClose = async () => {
    try {
      await api.exceptions.close(exceptionId, {
        operator_id: user?.id,
        operator_name: user?.name,
      });
      message.success('已关闭');
      fetchData();
      onRefresh?.();
    } catch (e) {
      message.error(e.message);
    }
  };

  const renderTimeline = () => {
    if (timeline.length === 0) return <Text type="secondary">暂无处理记录</Text>;

    return (
      <Timeline
        items={timeline.map((item, idx) => {
          const actionStyle = TIMELINE_ICON_MAP[item.action] || TIMELINE_ICON_MAP.created;
          const operatorName = item.operator_name || item.operator_name_fallback || '系统';
          return {
            color: actionStyle.color,
            dot: idx === timeline.length - 1 && exception?.status !== 'closed' && exception?.status !== 'resolved'
              ? <Spin size="small" />
              : actionStyle.icon,
            children: (
              <div>
                <Space>
                  <Tag color={actionStyle.color === '#00b4d8' ? 'blue' : actionStyle.color === '#2ec4b6' ? 'green' : actionStyle.color === '#e63946' ? 'red' : actionStyle.color === '#f4a261' ? 'orange' : 'default'} style={{ fontSize: 11 }}>
                    {ACTION_LABELS[item.action] || item.action}
                  </Tag>
                  <Text strong style={{ fontSize: 13 }}>{operatorName}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>{item.created_at}</Text>
                </Space>
                <div style={{ marginTop: 4, fontSize: 13, color: '#b0b0b0' }}>{item.content}</div>
              </div>
            ),
          };
        })}
      />
    );
  };

  if (!exception && !loading) return null;

  const currentStep = STATUS_STEP_MAP[exception?.status] || 0;
  const severityColor = exception ? SEVERITY_COLORS[exception.severity] : '#f4a261';

  const getElapsedMs = () => {
    if (!exception?.created_at) return 0;
    return Date.now() - new Date(exception.created_at.replace(' ', 'T')).getTime();
  };
  const elapsedMs = getElapsedMs();
  const elapsedHours = Math.floor(elapsedMs / 3600000);

  return (
    <Drawer
      title={
        <Space>
          <WarningOutlined style={{ color: severityColor }} />
          <span style={{ color: '#e0e0e0' }}>异常处理 — {exception?.house_name || '加载中'}</span>
          {exception && <span className={`pressure-badge ${exception.severity}`}>{SEVERITY_LABELS[exception.severity]}</span>}
        </Space>
      }
      open={open}
      onClose={onClose}
      width={600}
      styles={{ body: { background: '#1a1a2e' } }}
    >
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div> : exception && (
        <>
          {exception.status !== 'resolved' && exception.status !== 'closed' && (
            <div style={{
              background: elapsedHours >= 4 ? 'rgba(230,57,70,0.12)' : elapsedHours >= 2 ? 'rgba(244,162,97,0.1)' : 'rgba(0,180,216,0.06)',
              border: `1px solid ${elapsedHours >= 4 ? 'rgba(230,57,70,0.3)' : elapsedHours >= 2 ? 'rgba(244,162,97,0.25)' : 'rgba(0,180,216,0.15)'}`,
              borderRadius: 6, padding: '10px 14px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <ClockCircleOutlined style={{ color: elapsedHours >= 4 ? '#e63946' : elapsedHours >= 2 ? '#f4a261' : '#00b4d8', fontSize: 18 }} />
              <div>
                <div style={{ color: '#e0e0e0', fontSize: 13 }}>异常已持续</div>
                <ElapsedSince startedAt={exception.created_at} />
              </div>
              {elapsedHours >= 4 && (
                <span className="escalation-badge" style={{ marginLeft: 'auto' }}>
                  <ThunderboltOutlined /> 超4h·场长介入
                </span>
              )}
              {elapsedHours >= 2 && elapsedHours < 4 && (
                <span className="escalation-badge" style={{ marginLeft: 'auto', background: 'linear-gradient(135deg, #f4a261, #ff6b35)' }}>
                  <WarningOutlined /> 超2h·自动升级
                </span>
              )}
            </div>
          )}

          <Steps
            current={currentStep}
            size="small"
            style={{ marginBottom: 24 }}
            items={[
              { title: '待处理' },
              { title: '已指派' },
              { title: '处理中' },
              { title: '已解决' },
              { title: '已关闭' },
            ]}
          />

          <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="异常类别"><Tag>{exception.category}</Tag></Descriptions.Item>
            <Descriptions.Item label="鸡舍" style={{ color: '#e0e0e0' }}>{exception.house_name}</Descriptions.Item>
            <Descriptions.Item label="来源">
              {exception.source_type === 'inspection' ? '巡检卡' : exception.source_type === 'egg_record' ? '产蛋记录' : '系统'}
            </Descriptions.Item>
            <Descriptions.Item label="需要角色">{ROLE_LABELS[exception.handler_role]}</Descriptions.Item>
            <Descriptions.Item label="当前处理人">
              {exception.handler_name ? (
                <Space>
                  <Avatar size="small" style={{ background: ROLE_COLORS[exception.handler_role] }}>{exception.handler_name[0]}</Avatar>
                  <Text strong style={{ color: '#e0e0e0' }}>{exception.handler_name}</Text>
                  <Tag color={ROLE_COLORS[exception.handler_role]}>{ROLE_LABELS[exception.handler_role]}</Tag>
                </Space>
              ) : <Text type="danger">未指派</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Space><span className={`status-dot ${exception.status}`} />{EXCEPTION_STATUS[exception.status]}</Space>
            </Descriptions.Item>
            <Descriptions.Item label="异常描述" span={2}>
              <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#e0e0e0' }}>{exception.description}</Paragraph>
            </Descriptions.Item>
            {exception.resolution && (
              <Descriptions.Item label="处理结果" span={2}>
                <Text type="success" style={{ color: '#2ec4b6' }}>{exception.resolution}</Text>
              </Descriptions.Item>
            )}
            {exception.resolved_at && (
              <Descriptions.Item label="解决时间" span={2}>{exception.resolved_at}</Descriptions.Item>
            )}
          </Descriptions>

          <Divider style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#8c8c8c' }}>操作</Divider>

          {exception.status === 'open' && user?.role === 'manager' && (
            <Card size="small" title={<span style={{ color: '#e0e0e0' }}>指派处理人</span>} style={{ marginBottom: 12, background: 'rgba(22,33,62,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Space wrap>
                {users.filter(u => u.role === exception.handler_role).map(u => (
                  <Button
                    key={u.id}
                    loading={assignLoading}
                    onClick={() => handleAssign(u.id, u.role)}
                    icon={<UserOutlined />}
                    style={{ background: 'rgba(22,33,62,0.8)', borderColor: 'rgba(255,255,255,0.1)', color: '#e0e0e0' }}
                  >
                    {u.name}（{ROLE_LABELS[u.role]}）
                  </Button>
                ))}
                {user.role === exception.handler_role && (
                  <Button type="primary" loading={assignLoading} onClick={() => handleAssign(user.id, user.role)} style={{ background: '#e63946', borderColor: '#e63946' }}>
                    自己处理
                  </Button>
                )}
              </Space>
            </Card>
          )}

          {exception.status === 'assigned' && exception.handler_id === user?.id && (
            <Button type="primary" icon={<SendOutlined />} onClick={handleStartHandle} style={{ marginBottom: 12, background: '#ff6b35', borderColor: '#ff6b35' }} block>
              开始处理
            </Button>
          )}

          {exception.status === 'handling' && exception.handler_id === user?.id && (
            <Card size="small" title={<span style={{ color: '#e0e0e0' }}>填写处理结果</span>} style={{ marginBottom: 12, background: 'rgba(22,33,62,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Input.TextArea
                rows={3}
                value={resolution}
                onChange={e => setResolution(e.target.value)}
                placeholder="描述处理措施和结果..."
                style={{ marginBottom: 8, background: 'rgba(22,33,62,0.6)', borderColor: 'rgba(255,255,255,0.1)', color: '#e0e0e0' }}
              />
              <Button type="primary" loading={resolveLoading} onClick={handleResolve} block style={{ background: '#2ec4b6', borderColor: '#2ec4b6' }}>
                标记为已解决
              </Button>
            </Card>
          )}

          {exception.status === 'resolved' && user?.role === 'manager' && (
            <Button type="primary" onClick={handleClose} block style={{ background: '#2ec4b6', borderColor: '#2ec4b6' }}>
              确认关闭
            </Button>
          )}

          <Divider style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#8c8c8c' }}>处理时间线</Divider>
          {renderTimeline()}
        </>
      )}
    </Drawer>
  );
}
