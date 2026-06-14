import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Row,
  Col,
  Statistic,
  Progress,
  Button,
  Space,
  Timeline,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Alert,
  Table,
  Tag
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { evaluationApi, certificateApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

function EvaluationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    evaluation: null,
    project: null,
    certificates: {},
    registrations: {},
    exceptions: []
  });
  const [recentCertificateChanges, setRecentCertificateChanges] = useState([]);
  const [recalculateModalVisible, setRecalculateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();

  useEffect(() => {
    fetchEvaluationDetail();
  }, [id]);

  const fetchEvaluationDetail = async () => {
    setLoading(true);
    try {
      const response = await evaluationApi.getDetail(id);
      setData(response.data);

      if (response.data.project) {
        const certResponse = await certificateApi.getList({
          project_id: response.data.project.id,
          page: 1,
          limit: 10
        });

        const changes = [];
        const certificates = certResponse.data.certificates || [];

        for (const cert of certificates.slice(0, 5)) {
          const historyResponse = await certificateApi.getHistory(cert.id);
          const history = historyResponse.data.history || [];

          const relevantHistory = history.filter(h =>
            ['issued', 'cancelled', 'revoked', 'needs_correction'].includes(h.action)
          ).slice(-2);

          relevantHistory.forEach(h => {
            changes.push({
              certificate_number: cert.certificate_number,
              user_name: cert.user_name,
              ...h
            });
          });
        }

        changes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRecentCertificateChanges(changes.slice(0, 5));
      }
    } catch (error) {
      console.error('获取评估详情失败:', error);
      message.error('获取评估详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      const response = await evaluationApi.recalculate(data.project.id, '手动重新计算');
      message.success('重新计算完成');
      setRecalculateModalVisible(false);
      fetchEvaluationDetail();
    } catch (error) {
      console.error('重新计算失败:', error);
      message.error('重新计算失败');
    }
  };

  const handleUpdate = async () => {
    const values = await editForm.validateFields();

    try {
      await evaluationApi.update(id, values);
      message.success('更新成功');
      setEditModalVisible(false);
      fetchEvaluationDetail();
    } catch (error) {
      console.error('更新失败:', error);
      message.error('更新失败');
    }
  };

  const openEditModal = () => {
    const { evaluation } = data;
    editForm.setFieldsValue({
      satisfaction_score: evaluation?.satisfaction_score,
      behavior_change_score: evaluation?.behavior_change_score,
      performance_improvement: evaluation?.performance_improvement,
      report_status: evaluation?.report_status,
      frozen_reason: evaluation?.frozen_reason
    });
    setEditModalVisible(true);
  };

  if (!data.evaluation) {
    return <Card loading={loading}>加载中...</Card>;
  }

  const { evaluation, project, certificates, registrations, exceptions } = data;

  const totalCerts = Object.values(certificates).reduce((sum, count) => sum + count, 0) || 1;
  const totalRegs = Object.values(registrations).reduce((sum, count) => sum + count, 0) || 1;

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/evaluations')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Card
        title="效果评估详情"
        extra={
          <Space>
            {permissions.evaluations?.includes('recalculate') && (
              <Button
                icon={<ThunderboltOutlined />}
                onClick={() => setRecalculateModalVisible(true)}
              >
                重新计算
              </Button>
            )}
            <Button onClick={openEditModal}>编辑</Button>
          </Space>
        }
      >
        <Descriptions column={3} bordered>
          <Descriptions.Item label="培训项目" span={2}>
            {project?.name}
          </Descriptions.Item>
          <Descriptions.Item label="报告状态">
            <StatusBadge type="evaluation" status={evaluation.report_status} />
          </Descriptions.Item>
          <Descriptions.Item label="满意度评分">
            {evaluation.satisfaction_score ? `${evaluation.satisfaction_score}/5` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="行为变化评分">
            {evaluation.behavior_change_score ? `${evaluation.behavior_change_score}/5` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="绩效提升">
            {evaluation.performance_improvement ? `${evaluation.performance_improvement}%` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="完成率">
            {evaluation.completion_rate ? `${evaluation.completion_rate}%` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="通过率">
            {evaluation.pass_rate ? `${evaluation.pass_rate}%` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="发放率">
            {evaluation.issuance_rate ? `${evaluation.issuance_rate}%` : '-'}
          </Descriptions.Item>
          {evaluation.frozen_reason && (
            <Descriptions.Item label="冻结原因" span={3}>
              <span style={{ color: '#ff4d4f' }}>{evaluation.frozen_reason}</span>
            </Descriptions.Item>
          )}
          {evaluation.last_recalculated_at && (
            <Descriptions.Item label="最后重新计算时间" span={3}>
              {dayjs(evaluation.last_recalculated_at).format('YYYY-MM-DD HH:mm:ss')}
              {evaluation.recalculate_trigger && (
                <span style={{ color: '#999', marginLeft: 8 }}>
                  触发原因: {JSON.parse(evaluation.recalculate_trigger).type || '未知'}
                </span>
              )}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="创建时间">
            {dayjs(evaluation.created_at).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {dayjs(evaluation.updated_at).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="发布时间">
            {evaluation.published_at ? dayjs(evaluation.published_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}>
          <Card title="证书状态分布">
            <div style={{ marginBottom: 16 }}>
              <div>待处理</div>
              <Progress
                percent={Math.round(((certificates.pending || 0) / totalCerts) * 100)}
                strokeColor="#faad14"
              />
              <span>{(certificates.pending || 0)} 张</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div>已发放</div>
              <Progress
                percent={Math.round(((certificates.issued || 0) / totalCerts) * 100)}
                strokeColor="#52c41a"
              />
              <span>{(certificates.issued || 0)} 张</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div>异常</div>
              <Progress
                percent={Math.round(((certificates.cancelled || 0 + certificates.revoked || 0) / totalCerts) * 100)}
                strokeColor="#ff4d4f"
              />
              <span>{(certificates.cancelled || 0 + certificates.revoked || 0)} 张</span>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="报名状态分布">
            <div style={{ marginBottom: 16 }}>
              <div>已报名</div>
              <Progress
                percent={Math.round(((registrations.registered || 0) / totalRegs) * 100)}
                strokeColor="#1890ff"
              />
              <span>{(registrations.registered || 0)} 人</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div>已参训</div>
              <Progress
                percent={Math.round(((registrations.attended || 0) / totalRegs) * 100)}
                strokeColor="#52c41a"
              />
              <span>{(registrations.attended || 0)} 人</span>
            </div>
            <div>
              <div>缺席/取消</div>
              <Progress
                percent={Math.round(((registrations.absent || 0 + registrations.cancelled || 0) / totalRegs) * 100)}
                strokeColor="#ff4d4f"
              />
              <span>{(registrations.absent || 0 + registrations.cancelled || 0)} 人</span>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="相关异常">
            {exceptions.length > 0 ? (
              <Timeline
                items={exceptions.slice(0, 5).map(exc => ({
                  color: exc.status === 'resolved' ? 'green' : exc.status === 'processing' ? 'blue' : 'red',
                  children: (
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{exc.exception_number}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>{exc.description}</div>
                      <div style={{ fontSize: 12 }}>
                        <StatusBadge type="exception" status={exc.status} />
                      </div>
                    </div>
                  )
                }))}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                暂无异常记录
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {recentCertificateChanges.length > 0 && (
        <Card
          title="证书变动感知"
          style={{ marginTop: 16 }}
          extra={
            <Tag color="blue">
              <HistoryOutlined /> 以下操作已触发评估数据更新
            </Tag>
          }
        >
          <Alert
            message="数据联动提示"
            description="当证书状态发生变更（发放、取消、撤回）时，系统会自动重新计算此效果评估的相关指标。"
            type="info"
            showIcon
            icon={<ThunderboltOutlined />}
            style={{ marginBottom: 16 }}
          />
          <Table
            dataSource={recentCertificateChanges}
            rowKey={(record, index) => `${record.certificate_number}-${index}`}
            pagination={false}
            size="small"
            columns={[
              {
                title: '证书编号',
                dataIndex: 'certificate_number',
                key: 'certificate_number',
                render: (text) => <Tag color="blue">{text}</Tag>
              },
              {
                title: '员工姓名',
                dataIndex: 'user_name',
                key: 'user_name'
              },
              {
                title: '操作',
                dataIndex: 'action',
                key: 'action',
                render: (action) => {
                  const actionLabels = {
                    issued: '已发放',
                    cancelled: '已取消',
                    revoked: '已撤回',
                    needs_correction: '需修正'
                  };
                  const actionColors = {
                    issued: 'green',
                    cancelled: 'red',
                    revoked: 'orange',
                    needs_correction: 'warning'
                  };
                  return <Tag color={actionColors[action]}>{actionLabels[action] || action}</Tag>;
                }
              },
              {
                title: '操作人',
                dataIndex: 'operator_name',
                key: 'operator_name'
              },
              {
                title: '时间',
                dataIndex: 'created_at',
                key: 'created_at',
                render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
              },
              {
                title: '备注',
                dataIndex: 'remark',
                key: 'remark',
                ellipsis: true,
                render: (text) => text || '-'
              }
            ]}
          />
        </Card>
      )}

      <Modal
        title="重新计算效果评估"
        open={recalculateModalVisible}
        onCancel={() => setRecalculateModalVisible(false)}
        onOk={handleRecalculate}
        okText="确认重新计算"
        cancelText="取消"
      >
        <p>确定要重新计算此项目的效果评估吗？</p>
        <p style={{ color: '#999' }}>
          此操作将根据当前证书和培训数据重新计算：完成率、通过率、发放率。
        </p>
      </Modal>

      <Modal
        title="编辑效果评估"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleUpdate}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="satisfaction_score" label="满意度评分">
            <InputNumber min={0} max={5} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="behavior_change_score" label="行为变化评分">
            <InputNumber min={0} max={5} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="performance_improvement" label="绩效提升">
            <InputNumber min={0} max={100} suffix="%" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="report_status" label="报告状态">
            <Select
              options={[
                { value: 'draft', label: '草稿' },
                { value: 'published', label: '已发布' },
                { value: 'frozen', label: '已冻结' }
              ]}
            />
          </Form.Item>
          <Form.Item name="frozen_reason" label="冻结原因">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default EvaluationDetail;
