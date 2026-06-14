import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Button,
  Space,
  Tabs,
  Row,
  Col,
  Statistic,
  Timeline,
  Modal,
  Form,
  Input,
  Select,
  message
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { trainingApi, certificateApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

function TrainingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, permissions } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    project: null,
    registrations: [],
    certificates: [],
    homeworks: [],
    evaluation: null,
    exceptions: []
  });
  const [certificateModalVisible, setCertificateModalVisible] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [certificateForm] = Form.useForm();

  useEffect(() => {
    fetchProjectDetail();
  }, [id]);

  const fetchProjectDetail = async () => {
    setLoading(true);
    try {
      const response = await trainingApi.getProject(id);
      setData(response.data);
    } catch (error) {
      console.error('获取培训详情失败:', error);
      message.error('获取培训详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCertificateAction = async (certificateId, action, values = {}) => {
    try {
      await certificateApi.update(certificateId, {
        status: action,
        operator_id: user?.id,
        operator_name: user?.name,
        remark: values.remark,
        correction_reason: values.correction_reason,
        revoke_reason: values.revoke_reason
      });
      message.success('操作成功');
      setCertificateModalVisible(false);
      fetchProjectDetail();
    } catch (error) {
      console.error('证书操作失败:', error);
      message.error('操作失败');
    }
  };

  const openCertificateModal = (certificate, action) => {
    setSelectedCertificate({ ...certificate, action });
    setCertificateModalVisible(true);
  };

  const registrationColumns = [
    { title: '姓名', dataIndex: 'user_name', key: 'user_name' },
    { title: '部门', dataIndex: 'user_department', key: 'user_department' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge type="registration" status={status} />
    },
    {
      title: '签到时间',
      dataIndex: 'check_in_time',
      key: 'check_in_time',
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    { title: '备注', dataIndex: 'remarks', key: 'remarks' }
  ];

  const certificateColumns = [
    { title: '证书编号', dataIndex: 'certificate_number', key: 'certificate_number' },
    { title: '姓名', dataIndex: 'user_name', key: 'user_name' },
    { title: '部门', dataIndex: 'user_department', key: 'user_department' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge type="certificate" status={status} />
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        permissions.certificates?.includes('approve') || permissions.certificates?.includes('create') ? (
          <Space>
            {record.status === 'pending' && (
              <Button size="small" onClick={() => openCertificateModal(record, 'creating')}>
                开始制作
              </Button>
            )}
            {record.status === 'creating' && (
              <Button size="small" type="primary" onClick={() => openCertificateModal(record, 'pending_review')}>
                提交审核
              </Button>
            )}
            {record.status === 'pending_review' && permissions.certificates?.includes('approve') && (
              <>
                <Button size="small" type="primary" onClick={() => openCertificateModal(record, 'approved')}>
                  通过
                </Button>
                <Button size="small" danger onClick={() => openCertificateModal(record, 'needs_correction')}>
                  退回
                </Button>
              </>
            )}
            {record.status === 'needs_correction' && (
              <Button size="small" onClick={() => openCertificateModal(record, 'pending_review')}>
                重新提交
              </Button>
            )}
            {record.status === 'approved' && (
              <Button size="small" type="primary" onClick={() => openCertificateModal(record, 'issued')}>
                发放证书
              </Button>
            )}
          </Space>
        ) : null
      )
    }
  ];

  const homeworkColumns = [
    { title: '姓名', dataIndex: 'user_name', key: 'user_name' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge type="homework" status={status} />
    },
    {
      title: '提交时间',
      dataIndex: 'submission_date',
      key: 'submission_date',
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    { title: '成绩', dataIndex: 'grade', key: 'grade', render: (g) => g || '-' },
    { title: '备注', dataIndex: 'remarks', key: 'remarks' }
  ];

  const exceptionColumns = [
    { title: '异常编号', dataIndex: 'exception_number', key: 'exception_number' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge type="exception" status={status} />
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => <StatusBadge type="priority" status={priority} />
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/exceptions/${record.id}`)}>
          查看详情
        </Button>
      )
    }
  ];

  const getActionFields = () => {
    switch (selectedCertificate?.action) {
      case 'needs_correction':
        return (
          <>
            <Form.Item
              name="correction_reason"
              label="修正原因"
              rules={[{ required: true, message: '请输入修正原因' }]}
            >
              <Input.TextArea rows={3} placeholder="请输入需要修正的内容" />
            </Form.Item>
            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={2} placeholder="可选备注" />
            </Form.Item>
          </>
        );
      case 'issued':
        return (
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="可选备注" />
          </Form.Item>
        );
      default:
        return (
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="可选备注" />
          </Form.Item>
        );
    }
  };

  if (!data.project) {
    return <Card loading={loading}>加载中...</Card>;
  }

  const { project, registrations, certificates, homeworks, evaluation, exceptions } = data;

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/training')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Card title="培训项目详情">
        <Descriptions column={3} bordered>
          <Descriptions.Item label="项目名称">{project.name}</Descriptions.Item>
          <Descriptions.Item label="培训类型">
            <Tag color={project.type === 'required' ? 'blue' : 'green'}>
              {project.type === 'required' ? '必修' : '选修'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="培训形式">
            {project.format === 'online' ? '线上' : project.format === 'offline' ? '线下' : '混合'}
          </Descriptions.Item>
          <Descriptions.Item label="培训时间">
            {dayjs(project.start_date).format('YYYY-MM-DD')} 至 {dayjs(project.end_date).format('YYYY-MM-DD')}
          </Descriptions.Item>
          <Descriptions.Item label="讲师">{project.instructor_name}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <StatusBadge type="training" status={project.status} />
          </Descriptions.Item>
          <Descriptions.Item label="最大人数">{project.max_participants}</Descriptions.Item>
          <Descriptions.Item label="已报名">{registrations.length}</Descriptions.Item>
          <Descriptions.Item label="已参训">
            {registrations.filter(r => r.status === 'attended').length}
          </Descriptions.Item>
          <Descriptions.Item label="描述" span={3}>{project.description}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="报名率"
              value={
                project.max_participants > 0
                  ? Math.round((registrations.length / project.max_participants) * 100)
                  : 0
              }
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="参训率"
              value={
                registrations.length > 0
                  ? Math.round((registrations.filter(r => r.status === 'attended').length / registrations.length) * 100)
                  : 0
              }
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="证书发放率"
              value={
                registrations.filter(r => r.status === 'attended').length > 0
                  ? Math.round((certificates.filter(c => c.status === 'issued').length / registrations.filter(r => r.status === 'attended').length) * 100)
                  : 0
              }
              suffix="%"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        style={{ marginTop: 16 }}
        items={[
          {
            key: 'registrations',
            label: `报名人员 (${registrations.length})`,
            children: (
              <Table
                columns={registrationColumns}
                dataSource={registrations}
                rowKey="id"
                pagination={false}
              />
            )
          },
          {
            key: 'certificates',
            label: `证书 (${certificates.length})`,
            children: (
              <Table
                columns={certificateColumns}
                dataSource={certificates}
                rowKey="id"
                pagination={false}
              />
            )
          },
          {
            key: 'homeworks',
            label: `课后作业 (${homeworks.length})`,
            children: (
              <Table
                columns={homeworkColumns}
                dataSource={homeworks}
                rowKey="id"
                pagination={false}
              />
            )
          },
          {
            key: 'exceptions',
            label: `异常记录 (${exceptions.length})`,
            children: (
              <Table
                columns={exceptionColumns}
                dataSource={exceptions}
                rowKey="id"
                pagination={false}
              />
            )
          },
          {
            key: 'evaluation',
            label: '效果评估',
            children: evaluation ? (
              <Card>
                <Descriptions column={2} bordered>
                  <Descriptions.Item label="满意度评分">
                    {evaluation.satisfaction_score ? `${evaluation.satisfaction_score}/5` : '-'}
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
                  <Descriptions.Item label="报告状态">
                    <StatusBadge type="evaluation" status={evaluation.report_status} />
                  </Descriptions.Item>
                  {evaluation.frozen_reason && (
                    <Descriptions.Item label="冻结原因" span={2}>
                      {evaluation.frozen_reason}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                暂无效果评估数据
              </div>
            )
          }
        ]}
      />

      <Modal
        title="证书操作"
        open={certificateModalVisible}
        onCancel={() => setCertificateModalVisible(false)}
        onOk={() => {
          certificateForm.validateFields().then(values => {
            handleCertificateAction(selectedCertificate.id, selectedCertificate.action, values);
          });
        }}
      >
        <Form form={certificateForm} layout="vertical">
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="证书编号">{selectedCertificate?.certificate_number}</Descriptions.Item>
            <Descriptions.Item label="员工姓名">{selectedCertificate?.user_name}</Descriptions.Item>
            <Descriptions.Item label="部门">{selectedCertificate?.user_department}</Descriptions.Item>
            <Descriptions.Item label="当前状态">
              <StatusBadge type="certificate" status={selectedCertificate?.status} />
            </Descriptions.Item>
          </Descriptions>
          <div style={{ marginTop: 16 }}>
            {getActionFields()}
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default TrainingDetail;
