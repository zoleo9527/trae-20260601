import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Table,
  Button,
  Space,
  Timeline,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Row,
  Col,
  Tag,
  Alert
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { certificateApi, evaluationApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

function CertificateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, permissions } = useAuth();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState(null);
  const [history, setHistory] = useState([]);
  const [relatedExceptions, setRelatedExceptions] = useState([]);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [actionForm] = Form.useForm();

  useEffect(() => {
    fetchCertificateDetail();
  }, [id]);

  const fetchCertificateDetail = async () => {
    setLoading(true);
    try {
      const response = await certificateApi.getDetail(id);
      setCertificate({
        ...response.data.certificate,
        project: response.data.project,
        user: response.data.user
      });
      setHistory(response.data.history || []);
      setRelatedExceptions(response.data.relatedExceptions || []);
    } catch (error) {
      console.error('获取证书详情失败:', error);
      message.error('获取证书详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    const values = await actionForm.validateFields();

    try {
      await certificateApi.update(id, {
        status: selectedAction,
        operator_id: user?.id,
        operator_name: user?.name,
        remark: values.remark,
        correction_reason: values.correction_reason,
        revoke_reason: values.revoke_reason
      });

      message.success('操作成功');
      setActionModalVisible(false);
      actionForm.resetFields();
      fetchCertificateDetail();

      if (['issued', 'cancelled', 'revoked'].includes(selectedAction)) {
        message.info('效果评估数据已自动重新计算');
      }
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败');
    }
  };

  const openActionModal = (action) => {
    setSelectedAction(action);
    setActionModalVisible(true);
  };

  const getActionOptions = () => {
    if (!certificate) return [];

    const options = [];

    switch (certificate.status) {
      case 'pending':
        options.push({ value: 'creating', label: '开始制作' });
        break;
      case 'creating':
        options.push({ value: 'pending_review', label: '提交审核' });
        break;
      case 'pending_review':
        if (permissions.certificates?.includes('approve')) {
          options.push({ value: 'approved', label: '审核通过' });
          options.push({ value: 'needs_correction', label: '退回修正' });
        }
        break;
      case 'needs_correction':
        options.push({ value: 'pending_review', label: '重新提交' });
        break;
      case 'approved':
        options.push({ value: 'issued', label: '发放证书' });
        break;
      case 'issued':
        if (permissions.certificates?.includes('revoke')) {
          options.push({ value: 'revoked', label: '撤回证书' });
        }
        break;
    }

    return options;
  };

  const getActionFormItems = () => {
    switch (selectedAction) {
      case 'needs_correction':
        return (
          <>
            <Form.Item
              name="correction_reason"
              label="修正原因"
              rules={[{ required: true, message: '请输入修正原因' }]}
            >
              <Input.TextArea rows={3} placeholder="请详细说明需要修正的内容" />
            </Form.Item>
            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={2} placeholder="可选备注" />
            </Form.Item>
          </>
        );
      case 'revoked':
        return (
          <>
            <Form.Item
              name="revoke_reason"
              label="撤回原因"
              rules={[{ required: true, message: '请输入撤回原因' }]}
            >
              <Input.TextArea rows={3} placeholder="请详细说明撤回原因" />
            </Form.Item>
            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={2} placeholder="可选备注" />
            </Form.Item>
            <div style={{ color: '#ff4d4f', marginTop: 8 }}>
              <ExclamationCircleOutlined /> 注意：撤回证书将自动触发效果评估重新计算
            </div>
          </>
        );
      case 'issued':
        return (
          <>
            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={2} placeholder="可选备注" />
            </Form.Item>
            <div style={{ color: '#52c41a', marginTop: 8 }}>
              <CheckCircleOutlined /> 发放证书将自动触发效果评估重新计算
            </div>
          </>
        );
      default:
        return (
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="可选备注" />
          </Form.Item>
        );
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'created':
      case 'submitted':
      case 'approved':
      case 'issued':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'needs_correction':
      case 'cancelled':
      case 'revoked':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <HistoryOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getActionLabel = (action) => {
    const labels = {
      auto_generated: '系统自动生成',
      created: '开始制作',
      submitted: '提交审核',
      info_error_detected: '发现信息错误',
      corrected: '已修正',
      approved: '审核通过',
      issued: '已发放',
      cancelled: '已取消',
      revoked: '已撤回',
      status_changed: '状态变更'
    };
    return labels[action] || action;
  };

  const getNextActionHint = () => {
    if (!certificate) return null;

    const hints = {
      pending: { text: '等待讲师开始制作证书', icon: 'clock', color: '#faad14' },
      creating: { text: '证书制作中，等待提交审核', icon: 'clock', color: '#1890ff' },
      pending_review: { text: '等待培训经理审核', icon: 'waiting', color: '#faad14' },
      needs_correction: { text: '需要修正证书信息', icon: 'warning', color: '#ff4d4f' },
      approved: { text: '等待发放证书', icon: 'clock', color: '#52c41a' },
      issued: { text: '证书已发放完成', icon: 'success', color: '#52c41a' },
      cancelled: { text: '证书已取消', icon: 'cancel', color: '#999' },
      revoked: { text: '证书已撤回', icon: 'warning', color: '#ff4d4f' }
    };

    return hints[certificate.status];
  };

  if (!certificate) {
    return <Card loading={loading}>加载中...</Card>;
  }

  const nextAction = getNextActionHint();

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/certificates')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="证书详情"
            extra={
              getActionOptions().length > 0 && (
                <Select
                  placeholder="执行操作"
                  style={{ width: 200 }}
                  onChange={openActionModal}
                  options={getActionOptions()}
                />
              )
            }
          >
            {nextAction && (
              <Alert
                message={nextAction.text}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                icon={nextAction.icon === 'clock' ? <ClockCircleOutlined /> :
                       nextAction.icon === 'warning' ? <ExclamationCircleOutlined /> :
                       nextAction.icon === 'success' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
              />
            )}
            <Descriptions column={2} bordered>
              <Descriptions.Item label="证书编号" span={2}>
                <Tag color="blue">{certificate.certificate_number}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="培训项目">{certificate.project_name}</Descriptions.Item>
              <Descriptions.Item label="证书状态">
                <StatusBadge type="certificate" status={certificate.status} />
              </Descriptions.Item>
              <Descriptions.Item label="员工姓名">{certificate.user_name}</Descriptions.Item>
              <Descriptions.Item label="部门">{certificate.user_department}</Descriptions.Item>
              <Descriptions.Item label="发放日期">
                {certificate.issue_date || '-'}
              </Descriptions.Item>
              {certificate.correction_reason && (
                <Descriptions.Item label="修正原因" span={2}>
                  {certificate.correction_reason}
                </Descriptions.Item>
              )}
              {certificate.revoke_reason && (
                <Descriptions.Item label="撤回原因" span={2}>
                  {certificate.revoke_reason}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="创建时间">
                {dayjs(certificate.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {certificate.updated_at
                  ? dayjs(certificate.updated_at).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="处理历史" style={{ marginTop: 16 }}>
            <Timeline
              mode="left"
              items={history.map((item, index) => ({
                color: item.action === 'issued' || item.action === 'approved' ? 'green' :
                       item.action === 'needs_correction' || item.action === 'cancelled' || item.action === 'revoked' ? 'red' : 'blue',
                dot: getActionIcon(item.action),
                children: (
                  <div key={index}>
                    <div style={{ fontWeight: 'bold' }}>
                      {getActionLabel(item.action)}
                      {item.from_status && item.to_status && (
                        <span style={{ color: '#999', fontWeight: 'normal' }}>
                          {' '}
                          ({item.from_status} → {item.to_status})
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#666' }}>
                      操作人: {item.operator_name}
                    </div>
                    {item.remark && (
                      <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                        {item.remark}
                      </div>
                    )}
                    <div style={{ color: '#999', fontSize: 12 }}>
                      {dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')}
                    </div>
                  </div>
                )
              }))}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="关联信息">
            {certificate.project && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>培训项目信息</div>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="项目名称">{certificate.project.name}</Descriptions.Item>
                  <Descriptions.Item label="培训时间">
                    {dayjs(certificate.project.start_date).format('YYYY-MM-DD')} 至{' '}
                    {dayjs(certificate.project.end_date).format('YYYY-MM-DD')}
                  </Descriptions.Item>
                  <Descriptions.Item label="讲师">{certificate.project.instructor_name}</Descriptions.Item>
                </Descriptions>
                <Button
                  type="link"
                  onClick={() => navigate(`/training/${certificate.project_id}`)}
                  style={{ padding: 0 }}
                >
                  查看培训详情 →
                </Button>
              </div>
            )}

            {certificate.user && (
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>员工信息</div>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="姓名">{certificate.user.name}</Descriptions.Item>
                  <Descriptions.Item label="部门">{certificate.user.department}</Descriptions.Item>
                  <Descriptions.Item label="邮箱">{certificate.user.email}</Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </Card>

          {['issued', 'cancelled', 'revoked'].includes(certificate.status) && (
            <Card title="效果评估影响" style={{ marginTop: 16 }}>
              <div style={{ color: '#52c41a' }}>
                <CheckCircleOutlined /> 此操作已自动触发效果评估重新计算
              </div>
              <Button
                type="link"
                onClick={() => navigate(`/evaluations?project_id=${certificate.project_id}`)}
                style={{ padding: 0, marginTop: 8 }}
              >
                查看效果评估 →
              </Button>
            </Card>
          )}

          {relatedExceptions.length > 0 && (
            <Card title="关联异常" style={{ marginTop: 16 }}>
              <Timeline
                items={relatedExceptions.slice(0, 5).map(exc => ({
                  color: exc.status === 'resolved' || exc.status === 'closed' ? 'green' :
                         exc.status === 'processing' || exc.status === 'assigned' ? 'blue' : 'red',
                  children: (
                    <div>
                      <div style={{ fontWeight: 'bold' }}>
                        {exc.exception_number}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {exc.description}
                      </div>
                      <Button
                        type="link"
                        size="small"
                        onClick={() => navigate(`/exceptions/${exc.id}`)}
                        style={{ padding: 0, marginTop: 4 }}
                      >
                        查看详情 →
                      </Button>
                    </div>
                  )
                }))}
              />
            </Card>
          )}
        </Col>
      </Row>

      <Modal
        title={getActionLabel(selectedAction)}
        open={actionModalVisible}
        onCancel={() => {
          setActionModalVisible(false);
          actionForm.resetFields();
        }}
        onOk={handleAction}
        okText="确认"
        cancelText="取消"
      >
        <Form form={actionForm} layout="vertical">
          <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="证书编号">{certificate.certificate_number}</Descriptions.Item>
            <Descriptions.Item label="员工姓名">{certificate.user_name}</Descriptions.Item>
            <Descriptions.Item label="当前状态">
              <StatusBadge type="certificate" status={certificate.status} />
            </Descriptions.Item>
          </Descriptions>
          {getActionFormItems()}
        </Form>
      </Modal>
    </div>
  );
}

export default CertificateDetail;
