import { useEffect, useMemo } from 'react';
import {
  Tag,
  Button,
  Space,
  Timeline,
  Empty,
  Alert,
  Tooltip,
  Badge,
  Divider,
  Card,
  List,
  Typography,
  App as AntdApp,
  Modal,
  Form,
  Input,
} from 'antd';
import {
  WarningOutlined,
  UserOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  RollbackOutlined,
  ArrowRightOutlined,
  ExclamationCircleOutlined,
  FlagOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  ROLE_LABELS,
  FOLLOWUP_STATUS_LABELS,
  EXCEPTION_TYPE_LABELS,
  Lead,
  FollowupRecord,
  StatusTransition,
  ExceptionLog,
  Role,
} from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Props {
  leadId: string;
}

export default function LeadDetail({ leadId }: Props) {
  const {
    currentUser,
    users,
    currentLead,
    followups,
    transitions,
    exceptions,
    loadLeadDetail,
    handleException,
    createFollowup,
  } = useAppStore();

  const { message, modal } = AntdApp.useApp();
  const [form] = Form.useForm();

  useEffect(() => {
    loadLeadDetail(leadId);
  }, [leadId]);

  const roleViewConfig = useMemo(() => {
    if (!currentUser) return null;

    const configs: Record<
      Role,
      {
        showBudget: boolean;
        showAllFollowups: boolean;
        showTransitionHistory: boolean;
        showExceptionDetails: boolean;
        canEditSensitive: boolean;
      }
    > = {
      manager: {
        showBudget: true,
        showAllFollowups: true,
        showTransitionHistory: true,
        showExceptionDetails: true,
        canEditSensitive: true,
      },
      supervisor: {
        showBudget: true,
        showAllFollowups: true,
        showTransitionHistory: true,
        showExceptionDetails: true,
        canEditSensitive: true,
      },
      property: {
        showBudget: false,
        showAllFollowups: false,
        showTransitionHistory: false,
        showExceptionDetails: false,
        canEditSensitive: false,
      },
      engineering: {
        showBudget: false,
        showAllFollowups: false,
        showTransitionHistory: false,
        showExceptionDetails: false,
        canEditSensitive: false,
      },
    };

    return configs[currentUser.role];
  }, [currentUser]);

  const latestUnhandledException = useMemo(() => {
    const unhandled = exceptions.filter((e) => !e.handled);
    if (unhandled.length === 0) return null;
    return unhandled.sort((a, b) => b.detectedAt.localeCompare(a.detectedAt))[0];
  }, [exceptions]);

  const displayExceptions = latestUnhandledException ? [latestUnhandledException] : [];

  if (!currentLead || !roleViewConfig) {
    return <Empty description="加载中..." />;
  }

  const getUserName = (id: string | null) => {
    if (!id) return '-';
    const user = users.find((u) => u.id === id);
    return user?.name || id;
  };

  const handleResolveException = (exception: ExceptionLog) => {
    modal.confirm({
      title: '处理异常',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>
            <strong>异常类型:</strong>{' '}
            {EXCEPTION_TYPE_LABELS[exception.type]}
          </p>
          <p>
            <strong>异常信息:</strong> {exception.message}
          </p>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              name="remark"
              label="处理说明"
              rules={[{ required: true, message: '请输入处理说明' }]}
            >
              <TextArea rows={3} placeholder="请说明如何处理此异常..." />
            </Form.Item>
          </Form>
        </div>
      ),
      onOk: async () => {
        try {
          const values = await form.validateFields();
          await handleException(exception.id, values.remark);
          message.success('异常已处理');
          form.resetFields();
        } catch (error: any) {
          message.error('处理失败: ' + error.message);
        }
      },
    });
  };

  const handleQuickFollowup = () => {
    Modal.confirm({
      title: '快速记录跟进',
      icon: <PlusOutlined />,
      content: (
        <Form form={form} layout="vertical">
          <Form.Item
            name="content"
            label="跟进内容"
            rules={[{ required: true, message: '请输入跟进内容' }]}
          >
            <TextArea rows={4} placeholder="请记录本次跟进情况..." />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        try {
          const values = await form.validateFields();
          await createFollowup({
            leadId,
            type: 'other',
            content: values.content,
            status: 'completed',
          });
          message.success('跟进记录已添加');
          form.resetFields();
        } catch (error: any) {
          message.error('添加失败: ' + error.message);
        }
      },
    });
  };

  const sourceLabels: Record<string, string> = {
    old_ledger: '旧台账',
    site_record: '现场记录',
    chat_screenshot: '沟通截图',
    other: '其他',
  };

  return (
    <div>
      {currentLead.hasException && (
        <Alert
          message={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                <WarningOutlined className="exception-badge" />{' '}
                当前线索存在异常: {currentLead.exceptionMessage}
              </span>
              {latestUnhandledException && (
                <Button
                  size="small"
                  type="primary"
                  onClick={() => handleResolveException(latestUnhandledException)}
                >
                  处理异常
                </Button>
              )}
            </div>
          }
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <div className="detail-section">
        <div className="detail-section-title">
          基本信息
          <Tag color={LEAD_STATUS_COLORS[currentLead.status]}>
            {LEAD_STATUS_LABELS[currentLead.status]}
          </Tag>
          {currentLead.priority === 'high' && (
            <Tag color="red">高优先级</Tag>
          )}
        </div>

        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">企业名称:</span>
            <span className="info-value">{currentLead.companyName}</span>
          </div>
          <div className="info-item">
            <span className="info-label">联系人:</span>
            <span className="info-value">{currentLead.contactPerson}</span>
          </div>
          <div className="info-item">
            <span className="info-label">联系电话:</span>
            <span className="info-value" style={{ fontFamily: 'monospace' }}>
              {currentLead.contactPhone}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">所属行业:</span>
            <span className="info-value">{currentLead.industry || '-'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">需求面积:</span>
            <span className="info-value">
              {currentLead.requiredArea > 0
                ? `${currentLead.requiredArea} ㎡`
                : '-'}
            </span>
          </div>
          {roleViewConfig.showBudget && (
            <div className="info-item">
              <span className="info-label">预算:</span>
              <span className="info-value">
                {currentLead.budget > 0 ? `¥${currentLead.budget}万` : '-'}
              </span>
            </div>
          )}
          <div className="info-item">
            <span className="info-label">信息来源:</span>
            <span className="info-value">
              <Tag>{sourceLabels[currentLead.source.type]}</Tag>
              <Tooltip title={currentLead.source.reference}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {currentLead.source.reference?.substring(0, 20)}...
                </Text>
              </Tooltip>
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">创建时间:</span>
            <span className="info-value">
              {dayjs(currentLead.createdAt).format('YYYY-MM-DD HH:mm')}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">创建人:</span>
            <span className="info-value">
              {getUserName(currentLead.createdBy)}
            </span>
          </div>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">分配给:</span>
            <span className="info-value">
              {currentLead.assignedTo ? (
                <>
                  {getUserName(currentLead.assignedTo)}
                  <Tag style={{ marginLeft: 8 }}>
                    {currentLead.assignedRole
                      ? ROLE_LABELS[currentLead.assignedRole]
                      : ''}
                  </Tag>
                </>
              ) : (
                <Badge status="warning" text="未分配" />
              )}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">当前责任人:</span>
            <span className="info-value">
              {currentLead.currentResponsible ? (
                <>
                  <UserOutlined style={{ marginRight: 4 }} />
                  {getUserName(currentLead.currentResponsible)}
                  <Tag style={{ marginLeft: 8 }}>
                    {currentLead.currentResponsibleRole
                      ? ROLE_LABELS[currentLead.currentResponsibleRole]
                      : ''}
                  </Tag>
                </>
              ) : (
                <Badge status="warning" text="无责任人" />
              )}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">更新时间:</span>
            <span className="info-value">
              {dayjs(currentLead.updatedAt).format('YYYY-MM-DD HH:mm')}
            </span>
          </div>
        </div>

        {currentLead.remark && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <div>
              <Text type="secondary">备注: </Text>
              <Text>{currentLead.remark}</Text>
            </div>
          </>
        )}
      </div>

      {latestUnhandledException && roleViewConfig.showExceptionDetails && (
        <div className="detail-section">
          <div className="detail-section-title">
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            最新未处理异常
          </div>
          <List
            dataSource={displayExceptions}
            renderItem={(item) => (
              <List.Item
                style={{
                  background: item.handled ? '#f6ffed' : '#fff1f0',
                  borderRadius: 4,
                  padding: 12,
                  marginBottom: 8,
                  border: '1px solid ' + (item.handled ? '#b7eb8f' : '#ffa39e'),
                }}
              >
                <List.Item.Meta
                  avatar={
                    item.handled ? (
                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                    ) : (
                      <WarningOutlined
                        className="exception-badge"
                        style={{ color: '#ff4d4f', fontSize: 20 }}
                      />
                    )
                  }
                  title={
                    <Space>
                      <Tag color={item.handled ? 'green' : 'red'}>
                        {EXCEPTION_TYPE_LABELS[item.type]}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <ClockCircleOutlined />{' '}
                        {dayjs(item.detectedAt).format('YYYY-MM-DD HH:mm')}
                      </Text>
                    </Space>
                  }
                  description={
                    <div>
                      <p style={{ margin: '4px 0' }}>{item.message}</p>
                      {item.handled && (
                        <p style={{ margin: '4px 0', color: '#52c41a' }}>
                          <CheckCircleOutlined /> {item.handledRemark} (by{' '}
                          {getUserName(item.handledBy)})
                        </p>
                      )}
                    </div>
                  }
                />
                {!item.handled && currentUser?.role === 'manager' && (
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => handleResolveException(item)}
                  >
                    处理
                  </Button>
                )}
              </List.Item>
            )}
          />
        </div>
      )}

      {roleViewConfig.showTransitionHistory && (
        <div className="detail-section">
          <div className="detail-section-title">
            <RollbackOutlined style={{ color: '#1677ff' }} />
            状态流转历史
          </div>
          <Timeline
            className="status-timeline"
            items={transitions.map((t) => ({
              color: t.isGapDetected ? 'red' : 'blue',
              dot: t.isGapDetected ? (
                <WarningOutlined className="exception-badge" />
              ) : (
                <ArrowRightOutlined />
              ),
              children: (
                <div className="transition-item">
                  <div className="transition-status">
                    {t.fromStatus && (
                      <Tag color={LEAD_STATUS_COLORS[t.fromStatus]}>
                        {LEAD_STATUS_LABELS[t.fromStatus]}
                      </Tag>
                    )}
                    <span className="transition-arrow">
                      <ArrowRightOutlined />
                    </span>
                    <Tag color={LEAD_STATUS_COLORS[t.toStatus]}>
                      {LEAD_STATUS_LABELS[t.toStatus]}
                    </Tag>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div>
                      <Text strong>
                        {getUserName(t.transitionedBy)}{' '}
                        <Tag>{ROLE_LABELS[t.transitionedByRole]}</Tag>
                      </Text>
                      <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                        {dayjs(t.transitionedAt).format('YYYY-MM-DD HH:mm')}
                      </Text>
                    </div>
                    {t.remark && (
                      <div style={{ marginTop: 4, color: '#595959' }}>
                        {t.remark}
                      </div>
                    )}
                    {(t.fromResponsible || t.toResponsible) && (
                      <div style={{ marginTop: 4, fontSize: 12 }}>
                        <Text type="secondary">
                          责任交接: {getUserName(t.fromResponsible)} →{' '}
                          {getUserName(t.toResponsible)}
                          {t.toResponsibleRole && (
                            <Tag style={{ marginLeft: 4 }}>
                              {ROLE_LABELS[t.toResponsibleRole]}
                            </Tag>
                          )}
                        </Text>
                      </div>
                    )}
                    {t.isGapDetected && (
                      <div className="gap-warning">
                        <WarningOutlined /> 检测到责任空档，时长{' '}
                        {t.gapDurationMinutes.toFixed(2)} 分钟
                      </div>
                    )}
                  </div>
                </div>
              ),
            }))}
          />
        </div>
      )}

      <div className="detail-section">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <div className="detail-section-title" style={{ marginBottom: 0 }}>
            <FlagOutlined style={{ color: '#52c41a' }} />
            跟进记录
            {roleViewConfig.showAllFollowups ? (
              <Tag color="green">{followups.length} 条</Tag>
            ) : (
              <Tag color="blue">仅显示与您相关的</Tag>
            )}
          </div>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleQuickFollowup}
          >
            快速跟进
          </Button>
        </div>

        {followups.length === 0 ? (
          <Empty description="暂无跟进记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div>
            {(roleViewConfig.showAllFollowups
              ? followups
              : followups.filter((f) => f.handledBy === currentUser?.id)
            ).map((f) => (
              <FollowupCard
                key={f.id}
                followup={f}
                getUserName={getUserName}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FollowupCard({
  followup,
  getUserName,
}: {
  followup: FollowupRecord;
  getUserName: (id: string | null) => string;
}) {
  const typeLabels: Record<string, string> = {
    call: '电话',
    visit: '拜访',
    meeting: '会议',
    email: '邮件',
    chat: '即时通讯',
    site: '现场',
    other: '其他',
  };

  const typeIcons: Record<string, React.ReactNode> = {
    call: '📞',
    visit: '🚶',
    meeting: '👥',
    email: '📧',
    chat: '💬',
    site: '🏢',
    other: '📝',
  };

  const statusColors: Record<string, string> = {
    pending: 'default',
    in_progress: 'processing',
    scheduled: 'blue',
    completed: 'success',
    needs_approval: 'warning',
    approved: 'success',
    rejected: 'error',
    exception: 'error',
  };

  return (
    <div
      className="followup-card"
      style={{
        borderLeftColor:
          followup.status === 'completed' || followup.status === 'approved'
            ? '#52c41a'
            : followup.status === 'exception' || followup.status === 'rejected'
            ? '#ff4d4f'
            : '#1677ff',
      }}
    >
      <div className="followup-card-header">
        <Space>
          <span style={{ fontSize: 18 }}>{typeIcons[followup.type]}</span>
          <span className="followup-card-type">
            {typeLabels[followup.type] || followup.type}
          </span>
          <Tag color={statusColors[followup.status]}>
            {FOLLOWUP_STATUS_LABELS[followup.status]}
          </Tag>
        </Space>
        <span className="followup-card-time">
          <ClockCircleOutlined />{' '}
          {followup.startedAt
            ? dayjs(followup.startedAt).format('YYYY-MM-DD HH:mm')
            : followup.scheduledAt
            ? '计划: ' + dayjs(followup.scheduledAt).format('YYYY-MM-DD HH:mm')
            : '-'}
        </span>
      </div>

      <div style={{ marginBottom: 8, whiteSpace: 'pre-wrap' }}>
        {followup.content}
      </div>

      {followup.location && (
        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
          <EnvironmentOutlined /> {followup.location}
        </div>
      )}

      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
        <Space split={<span>|</span>}>
          <span>
            <UserOutlined /> {getUserName(followup.handledBy)}
            <Tag style={{ marginLeft: 4 }}>
              {ROLE_LABELS[followup.handledRole]}
            </Tag>
          </span>
          {followup.completedAt && (
            <span>
              完成于 {dayjs(followup.completedAt).format('YYYY-MM-DD HH:mm')}
            </span>
          )}
        </Space>
      </div>

      {followup.nextAction && (
        <div
          style={{
            marginTop: 8,
            padding: 8,
            background: '#e6f4ff',
            borderRadius: 4,
            fontSize: 12,
          }}
        >
          <Text strong style={{ color: '#1677ff' }}>
            → 下次跟进:
          </Text>{' '}
          {followup.nextAction}
          {followup.nextActionAt && (
            <span style={{ color: '#8c8c8c', marginLeft: 8 }}>
              ({dayjs(followup.nextActionAt).format('YYYY-MM-DD HH:mm')})
            </span>
          )}
          {followup.nextResponsible && (
            <span style={{ marginLeft: 8 }}>
              → {getUserName(followup.nextResponsible)}
            </span>
          )}
        </div>
      )}

      {followup.attachments.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 12 }}>
          <Text type="secondary">
            附件: {followup.attachments.length} 个
          </Text>
        </div>
      )}
    </div>
  );
}
