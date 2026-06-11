import { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Form,
  Select,
  Input,
  DatePicker,
  Alert,
  Tag,
  Space,
  App as AntdApp,
  Row,
  Col,
} from 'antd';
import {
  ArrowRightOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  ROLE_LABELS,
  FOLLOWUP_STATUS_LABELS,
  LeadStatus,
  FollowupStatus,
  Role,
} from '../types';
import {
  getAllowedTransitions,
  validateTransition,
  getTransitionRule,
  RESPONSIBILITY_HANDOFF_MAP,
} from '../utils/stateMachine';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface Props {
  open: boolean;
  leadId: string | null;
  onClose: () => void;
}

export default function StatusTransitionModal({ open, leadId, onClose }: Props) {
  const { currentUser, currentLead, executeTransition, loadLeadDetail, users } =
    useAppStore();
  const { message } = AntdApp.useApp();

  const [form] = Form.useForm();
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | null>(null);
  const [validation, setValidation] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    autoAssignRole?: Role;
    autoSetFollowupStatus?: FollowupStatus;
  } | null>(null);

  useEffect(() => {
    if (open && leadId) {
      loadLeadDetail(leadId);
      form.resetFields();
      setSelectedStatus(null);
      setValidation(null);
    }
  }, [open, leadId]);

  const allowedTransitions = useMemo(() => {
    if (!currentLead || !currentUser) return [];
    return getAllowedTransitions(currentLead.status, currentUser.role);
  }, [currentLead, currentUser]);

  useEffect(() => {
    if (currentLead && selectedStatus && currentUser) {
      const nextResponsible = form.getFieldValue('nextResponsible');
      const nextResponsibleRole = form.getFieldValue('nextResponsibleRole');
      const followupContent = form.getFieldValue('content');

      const result = validateTransition(
        currentLead,
        selectedStatus,
        currentUser.role,
        followupContent
          ? {
              id: '',
              leadId: currentLead.id,
              type: form.getFieldValue('type') || 'other',
              content: followupContent,
              location: form.getFieldValue('location'),
              scheduledAt: form.getFieldValue('scheduledAt')
                ? form.getFieldValue('scheduledAt').toISOString()
                : null,
              startedAt: new Date().toISOString(),
              completedAt: null,
              status: form.getFieldValue('followupStatus') || 'in_progress',
              handledBy: currentUser.id,
              handledRole: currentUser.role,
              nextAction: form.getFieldValue('nextAction') || '',
              nextActionAt: form.getFieldValue('nextActionAt')
                ? form.getFieldValue('nextActionAt').toISOString()
                : null,
              nextResponsible: nextResponsible,
              nextResponsibleRole: nextResponsibleRole,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              attachments: [],
            }
          : null,
        nextResponsible,
        nextResponsibleRole
      );
      setValidation(result);
    }
  }, [selectedStatus, currentLead, currentUser, form]);

  const handleStatusChange = (value: LeadStatus) => {
    setSelectedStatus(value);

    const rule = getTransitionRule(currentLead?.status || null, value);
    if (rule?.autoSetFollowupStatus) {
      form.setFieldsValue({
        followupStatus: rule.autoSetFollowupStatus,
      });
    }
    if (rule?.autoAssignTo) {
      form.setFieldsValue({
        nextResponsibleRole: rule.autoAssignTo,
      });
    }
  };

  const handleSubmit = async () => {
    if (!leadId || !selectedStatus || !currentLead || !currentUser) return;

    try {
      const values = await form.validateFields();

      const handoffRoles = RESPONSIBILITY_HANDOFF_MAP[selectedStatus];
      let nextResponsible = values.nextResponsible;
      let nextResponsibleRole = values.nextResponsibleRole;

      const rule = getTransitionRule(currentLead.status, selectedStatus);
      if (rule?.autoAssignTo && !nextResponsible) {
        const roleUsers = users.filter((u) => u.role === rule.autoAssignTo);
        if (roleUsers.length > 0) {
          nextResponsible = roleUsers[0].id;
          nextResponsibleRole = roleUsers[0].role;
        }
      }

      const result = await executeTransition({
        leadId,
        toStatus: selectedStatus,
        followup: values.content
          ? {
              type: values.type,
              content: values.content,
              location: values.location,
              scheduledAt: values.scheduledAt
                ? values.scheduledAt.toISOString()
                : null,
              nextAction: values.nextAction,
              nextActionAt: values.nextActionAt
                ? values.nextActionAt.toISOString()
                : null,
              status: values.followupStatus,
            }
          : null,
        nextResponsible,
        nextResponsibleRole,
        remark: values.remark || '',
      });

      if (result.success) {
        message.success('状态流转成功');
        if (result.exception) {
          message.warning(
            `异常检测: ${result.exception.message}`,
            5
          );
        }
        if (result.warnings.length > 0) {
          result.warnings.forEach((w) => message.warning(w, 3));
        }
        onClose();
      } else {
        message.error(result.errors.join(', '));
      }
    } catch (error: any) {
      message.error('操作失败: ' + error.message);
    }
  };

  if (!currentLead || !currentUser) return null;

  const handoffRoles = selectedStatus
    ? RESPONSIBILITY_HANDOFF_MAP[selectedStatus]
    : null;
  const rule = selectedStatus
    ? getTransitionRule(currentLead.status, selectedStatus)
    : null;
  const needFollowup = rule?.requireFollowup;
  const needResponsible = handoffRoles && handoffRoles.length > 0;

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>状态流转</span>
          <Tag color={LEAD_STATUS_COLORS[currentLead.status]}>
            {LEAD_STATUS_LABELS[currentLead.status]}
          </Tag>
          <ArrowRightOutlined style={{ color: '#8c8c8c' }} />
          {selectedStatus && (
            <Tag color={LEAD_STATUS_COLORS[selectedStatus]}>
              {LEAD_STATUS_LABELS[selectedStatus]}
            </Tag>
          )}
        </div>
      }
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      width={700}
      okText="确认流转"
      cancelText="取消"
      okButtonProps={{
        disabled: !selectedStatus || !validation?.valid,
      }}
    >
      {currentLead.hasException && (
        <Alert
          message="当前线索存在异常"
          description={currentLead.exceptionMessage}
          type="warning"
          showIcon
          icon={<WarningOutlined className="exception-badge" />}
          style={{ marginBottom: 16 }}
          closable
        />
      )}

      <Form form={form} layout="vertical" className="high-frequency-input">
        <Form.Item
          label="目标状态"
          required
          help={`${ROLE_LABELS[currentUser.role]} 可执行的流转操作`}
        >
          <Select
            placeholder="请选择目标状态"
            value={selectedStatus}
            onChange={handleStatusChange}
            style={{ width: '100%' }}
          >
            {allowedTransitions.map((status) => (
              <Option key={status} value={status}>
                <Tag color={LEAD_STATUS_COLORS[status]}>
                  {LEAD_STATUS_LABELS[status]}
                </Tag>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedStatus && validation && (
          <>
            {validation.errors.length > 0 && (
              <Alert
                message="无法执行流转"
                description={
                  <ul>
                    {validation.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                }
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {validation.warnings.length > 0 && (
              <Alert
                message="建议完善信息"
                description={
                  <ul>
                    {validation.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                }
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                closable
              />
            )}

            {validation.autoAssignRole && (
              <Alert
                message="自动分配"
                description={`系统将自动分配给 ${ROLE_LABELS[validation.autoAssignRole]} 角色的人员`}
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                style={{ marginBottom: 16 }}
                closable
              />
            )}
          </>
        )}

        {needFollowup && selectedStatus && (
          <>
            <div className="detail-section-title" style={{ marginTop: 8 }}>
              <InfoCircleOutlined style={{ color: '#1677ff' }} />
              跟进记录（必填）
            </div>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="type"
                  label="跟进类型"
                  rules={[{ required: true, message: '请选择跟进类型' }]}
                  initialValue="meeting"
                >
                  <Select>
                    <Option value="call">电话</Option>
                    <Option value="visit">拜访</Option>
                    <Option value="meeting">会议</Option>
                    <Option value="email">邮件</Option>
                    <Option value="chat">即时通讯</Option>
                    <Option value="site">现场</Option>
                    <Option value="other">其他</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="followupStatus"
                  label="跟进状态"
                  rules={[{ required: true, message: '请选择跟进状态' }]}
                  initialValue="in_progress"
                >
                  <Select>
                    {(
                      [
                        'in_progress',
                        'scheduled',
                        'completed',
                        'needs_approval',
                        'approved',
                        'rejected',
                      ] as FollowupStatus[]
                    ).map((s) => (
                      <Option key={s} value={s}>
                        {FOLLOWUP_STATUS_LABELS[s]}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="content"
              label="跟进内容"
              rules={[{ required: true, message: '请输入跟进内容' }]}
            >
              <TextArea rows={4} placeholder="请详细记录本次跟进情况..." />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="location" label="跟进地点">
                  <Input placeholder="如：会议室A、客户公司等" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="scheduledAt"
                  label="跟进时间"
                  rules={[{ required: true, message: '请选择跟进时间' }]}
                  initialValue={dayjs()}
                >
                  <DatePicker showTime style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            {selectedStatus === 'needs_followup' && (
              <>
                <div className="detail-section-title">
                  <ArrowRightOutlined style={{ color: '#faad14' }} />
                  下次跟进计划
                </div>
                <Row gutter={16}>
                  <Col span={16}>
                    <Form.Item
                      name="nextAction"
                      label="下次跟进内容"
                      rules={[
                        { required: true, message: '请输入下次跟进内容' },
                      ]}
                    >
                      <Input placeholder="请描述下次跟进计划" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="nextActionAt"
                      label="下次跟进时间"
                      rules={[
                        { required: true, message: '请选择下次跟进时间' },
                      ]}
                    >
                      <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}
          </>
        )}

        {needResponsible && selectedStatus && (
          <>
            <div className="detail-section-title" style={{ marginTop: 8 }}>
              <InfoCircleOutlined style={{ color: '#1677ff' }} />
              下一责任人
              {rule?.autoAssignTo && (
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  自动分配给: {ROLE_LABELS[rule.autoAssignTo]}
                </Tag>
              )}
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="nextResponsibleRole"
                  label="责任角色"
                  rules={[{ required: true, message: '请选择责任角色' }]}
                >
                  <Select>
                    {handoffRoles.map((role) => (
                      <Option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, curr) =>
                    prev.nextResponsibleRole !== curr.nextResponsibleRole
                  }
                >
                  {() => {
                    const role = form.getFieldValue('nextResponsibleRole');
                    const roleUsers = role
                      ? users.filter((u) => u.role === role)
                      : users;
                    return (
                      <Form.Item
                        name="nextResponsible"
                        label="具体人员"
                        rules={[
                          { required: true, message: '请选择具体人员' },
                        ]}
                      >
                        <Select placeholder="请选择责任人">
                          {roleUsers.map((user) => (
                            <Option key={user.id} value={user.id}>
                              {user.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    );
                  }}
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        {!needFollowup && !needResponsible && selectedStatus && (
          <Form.Item name="remark" label="流转备注">
            <TextArea rows={2} placeholder="可选，填写流转说明" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
