import {
    BellOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    LinkOutlined,
    PlusOutlined,
    UnorderedListOutlined
} from '@ant-design/icons';
import {
    Badge,
    Button,
    Card,
    Col,
    DatePicker,
    Descriptions,
    Form, Input,
    InputNumber,
    message,
    Modal,
    Row,
    Select,
    Space,
    Spin,
    Table, Tag,
    Timeline,
    Typography
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';

const { Text } = Typography;

const NODE_TYPE_LABELS = {
  film: '拍片', consultation: '方案沟通', surgery1: '一期手术',
  suture_removal: '拆线', surgery2: '二期手术', crown: '戴牙冠',
};

const NODE_TYPE_ORDER = ['film', 'consultation', 'surgery1', 'suture_removal', 'surgery2', 'crown'];

const STATUS_COLORS = { planned: 'blue', completed: 'green', cancelled: 'default', rescheduled: 'orange' };

const CONSUMABLE_STATUS_LABELS = { available: '可用', locked: '已锁定', used: '已使用', expired: '已过期' };
const CONSUMABLE_STATUS_COLORS = { available: 'green', locked: 'orange', used: 'blue', expired: 'red' };
const CATEGORY_LABELS = { implant: '种植体', abutment: '基台', crown: '牙冠', tool: '工具' };

const ALERT_TYPE_LABELS = { reschedule: '改期提醒', consumable_change: '耗材变更', missed_followup: '遗漏随访' };
const ALERT_TYPE_COLORS = { reschedule: 'orange', consumable_change: 'blue', missed_followup: 'red' };

export default function PatientDetail() {
  const { id } = useParams();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || '';

  const [patient, setPatient] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [consumables, setConsumables] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedNode, setExpandedNode] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [addNodeModalOpen, setAddNodeModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [rescheduleForm] = Form.useForm();
  const [completeForm] = Form.useForm();
  const [addNodeForm] = Form.useForm();
  const [selectedNode, setSelectedNode] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [availableConsumables, setAvailableConsumables] = useState([]);

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    setLoading(true);
    try {
      const [patientRes, alertsRes] = await Promise.all([
        api.get(`/patients/${id}`),
        api.get(`/alerts`, { params: { patient_id: id } }).catch(() => ({ data: [] })),
      ]);
      const patientData = patientRes.data;
      setPatient(patientData);
      setNodes(patientData.treatment_nodes || []);
      setConsumables(patientData.consumables || []);
      setAlerts(Array.isArray(alertsRes.data) ? alertsRes.data : []);
    } catch {
      message.error('获取患者信息失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', paddingTop: 100 }}><Spin size="large" /></div>;
  }

  if (!patient) {
    return <div>患者不存在</div>;
  }

  const getNodeTimelineColor = (node) => {
    if (node.status === 'cancelled') return 'grey';
    if (node.status === 'completed') return 'green';
    if (node.status === 'rescheduled') return 'orange';
    if (node.planned_date && dayjs(node.planned_date).isBefore(dayjs(), 'day')) return 'red';
    return 'blue';
  };

  const getNodeStatusLabel = (node) => {
    if (node.status === 'cancelled') return '已取消';
    if (node.status === 'completed') return '已完成';
    if (node.status === 'rescheduled') return '已改期';
    if (node.planned_date && dayjs(node.planned_date).isBefore(dayjs(), 'day')) return '已逾期';
    return '已计划';
  };

  const handleEditPatient = async (values) => {
    setSubmitting(true);
    try {
      await api.put(`/patients/${id}`, values);
      message.success('患者信息已更新');
      setEditModalOpen(false);
      fetchPatient();
    } catch (err) {
      message.error(err.response?.data?.error || '更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = () => {
    editForm.setFieldsValue({
      name: patient.name,
      phone: patient.phone,
      gender: patient.gender,
      age: patient.age,
      notes: patient.notes,
    });
    setEditModalOpen(true);
  };

  const openReschedule = (node) => {
    setSelectedNode(node);
    rescheduleForm.resetFields();
    setRescheduleModalOpen(true);
  };

  const handleReschedule = async (values) => {
    setSubmitting(true);
    try {
      await api.post(`/schedules/${selectedNode.id}/reschedule`, {
        new_date: values.new_date?.format('YYYY-MM-DD'),
        reason: values.reason,
      });
      message.success('改期成功');
      setRescheduleModalOpen(false);
      fetchPatient();
    } catch (err) {
      message.error(err.response?.data?.error || '改期失败');
    } finally {
      setSubmitting(false);
    }
  };

  const openComplete = (node) => {
    setSelectedNode(node);
    completeForm.resetFields();
    setCompleteModalOpen(true);
  };

  const handleComplete = async (values) => {
    setSubmitting(true);
    try {
      await api.post(`/schedules/${selectedNode.id}/complete`, {
        notes: values.notes,
      });
      message.success('已完成');
      setCompleteModalOpen(false);
      fetchPatient();
    } catch (err) {
      message.error(err.response?.data?.error || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = (node) => {
    Modal.confirm({
      title: '确认取消',
      icon: <ExclamationCircleOutlined />,
      content: `确定要取消「${NODE_TYPE_LABELS[node.node_type]}」吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.put(`/schedules/${node.id}`, { status: 'cancelled' });
          message.success('已取消');
          fetchPatient();
        } catch (err) {
          message.error(err.response?.data?.error || '操作失败');
        }
      },
    });
  };

  const openAddNodeModal = async () => {
    addNodeForm.resetFields();
    let defaultDoctorId = undefined;
    try {
      const [doctorsRes, consumablesRes] = await Promise.all([
        api.get('/auth/doctors').catch(() => ({ data: [] })),
        api.get('/consumables', { params: { status: 'available' } }).catch(() => ({ data: [] })),
      ]);
      const doctorList = Array.isArray(doctorsRes.data) ? doctorsRes.data : [];
      setDoctors(doctorList);
      setAvailableConsumables(
        Array.isArray(consumablesRes.data) ? consumablesRes.data : []
      );
      if (user.role === 'doctor') {
        const currentUserIsValidDoctor = doctorList.some((d) => d.id === user.id);
        if (currentUserIsValidDoctor) {
          defaultDoctorId = user.id;
        }
      }
    } catch {}
    addNodeForm.setFieldsValue({ patient_id: id, doctor_id: defaultDoctorId });
    setAddNodeModalOpen(true);
  };

  const handleAddNode = async (values) => {
    setSubmitting(true);
    try {
      await api.post('/schedules', {
        patient_id: parseInt(id),
        node_type: values.node_type,
        planned_date: values.planned_date?.format('YYYY-MM-DD'),
        doctor_id: values.doctor_id || null,
        consumable_id: values.consumable_id || null,
        notes: values.notes || null,
      });
      message.success('治疗节点已添加');
      setAddNodeModalOpen(false);
      fetchPatient();
    } catch (err) {
      message.error(err.response?.data?.error || '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  const sortedNodes = [...nodes].sort(
    (a, b) => NODE_TYPE_ORDER.indexOf(a.node_type) - NODE_TYPE_ORDER.indexOf(b.node_type)
  );

  const consumableColumns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '型号', dataIndex: 'model', key: 'model' },
    { title: '批次号', dataIndex: 'batch_no', key: 'batch_no' },
    { title: '分类', dataIndex: 'category', key: 'category', render: (v) => CATEGORY_LABELS[v] || v },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) => <Tag color={CONSUMABLE_STATUS_COLORS[v]}>{CONSUMABLE_STATUS_LABELS[v] || v}</Tag>,
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={17}>
          <Card
            title={
              <span>
                <UnorderedListOutlined style={{ marginRight: 8 }} />
                患者信息
              </span>
            }
            extra={
              <Button icon={<EditOutlined />} onClick={openEditModal}>编辑</Button>
            }
          >
            <Descriptions column={{ xs: 1, sm: 2, md: 4 }}>
              <Descriptions.Item label="姓名">{patient.name}</Descriptions.Item>
              <Descriptions.Item label="电话">{patient.phone}</Descriptions.Item>
              <Descriptions.Item label="性别">{patient.gender === 'male' ? '男' : patient.gender === 'female' ? '女' : patient.gender}</Descriptions.Item>
              <Descriptions.Item label="年龄">{patient.age}</Descriptions.Item>
              <Descriptions.Item label="备注" span={4}>{patient.notes || '无'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{patient.created_at ? dayjs(patient.created_at).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            title={
              <span>
                <CalendarOutlined style={{ marginRight: 8 }} />
                治疗时间线
              </span>
            }
            extra={
              (role === 'frontdesk' || role === 'doctor') && (
                <Button type="primary" icon={<PlusOutlined />} size="small" onClick={openAddNodeModal}>
                  新增节点
                </Button>
              )
            }
            style={{ marginTop: 16 }}
          >
            <Timeline
              mode="left"
              items={sortedNodes.map((node) => {
                const color = getNodeTimelineColor(node);
                const isExpanded = expandedNode === node.id;
                const canComplete = node.status === 'planned' && (role === 'doctor');
                const canReschedule = node.status === 'planned' && (role === 'frontdesk' || role === 'doctor');
                const canCancel = node.status === 'planned' && (role === 'frontdesk');

                return {
                  color,
                  dot: node.status === 'completed' ? (
                    <CheckCircleOutlined style={{ fontSize: 18, color: '#52c41a' }} />
                  ) : null,
                  children: (
                    <div
                      key={node.id}
                      className={`timeline-step ${isExpanded ? 'expanded' : ''}`}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 8,
                        border: `1px solid ${isExpanded ? '#1890ff' : '#f0f0f0'}`,
                        background: isExpanded ? '#fafafa' : '#fff',
                        marginBottom: 4,
                      }}
                    >
                      <div
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => setExpandedNode(isExpanded ? null : node.id)}
                      >
                        <div>
                          <Text strong style={{ fontSize: 16 }}>{NODE_TYPE_LABELS[node.node_type] || node.node_type}</Text>
                          <Tag color={STATUS_COLORS[node.status]} style={{ marginLeft: 8 }}>
                            {getNodeStatusLabel(node)}
                          </Tag>
                          {node.planned_date && dayjs(node.planned_date).isBefore(dayjs(), 'day') && node.status === 'planned' && (
                            <Tag color="red">逾期</Tag>
                          )}
                        </div>
                        <div>
                          {node.planned_date && <Text type="secondary">{dayjs(node.planned_date).format('YYYY-MM-DD')}</Text>}
                          {isExpanded ? <span style={{ marginLeft: 8 }}>▲</span> : <span style={{ marginLeft: 8 }}>▼</span>}
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ marginTop: 12, borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                          <Row gutter={[16, 8]}>
                            <Col span={12}>
                              <Text type="secondary">计划日期：</Text>
                              <Text>{node.planned_date ? dayjs(node.planned_date).format('YYYY-MM-DD') : '待定'}</Text>
                            </Col>
                            <Col span={12}>
                              <Text type="secondary">实际日期：</Text>
                              <Text>{node.actual_date ? dayjs(node.actual_date).format('YYYY-MM-DD') : '-'}</Text>
                            </Col>
                          </Row>
                          {node.notes && (
                            <div style={{ marginTop: 8 }}>
                              <Text type="secondary">备注：</Text>
                              <Text>{node.notes}</Text>
                            </div>
                          )}
                          {node.consumable_name && (
                            <div style={{ marginTop: 8 }}>
                              <LinkOutlined style={{ marginRight: 4 }} />
                              <Text type="secondary">关联耗材：</Text>
                              <Tag color="blue">{node.consumable_name}</Tag>
                            </div>
                          )}
                          {node.doctor_name && (
                            <div style={{ marginTop: 8 }}>
                              <Text type="secondary">负责医生：</Text>
                              <Text>{node.doctor_name}</Text>
                            </div>
                          )}

                          {node.status === 'planned' && (
                            <div style={{ marginTop: 12 }}>
                              <Space>
                                {canComplete && (
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={<CheckCircleOutlined />}
                                    onClick={(e) => { e.stopPropagation(); openComplete(node); }}
                                  >
                                    完成
                                  </Button>
                                )}
                                {canReschedule && (
                                  <Button
                                    size="small"
                                    icon={<CalendarOutlined />}
                                    onClick={(e) => { e.stopPropagation(); openReschedule(node); }}
                                  >
                                    改期
                                  </Button>
                                )}
                                {canCancel && (
                                  <Button
                                    danger
                                    size="small"
                                    icon={<CloseCircleOutlined />}
                                    onClick={(e) => { e.stopPropagation(); handleCancel(node); }}
                                  >
                                    取消
                                  </Button>
                                )}
                              </Space>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ),
                };
              })}
            />
          </Card>

          {consumables.length > 0 && (
            <Card
              title={<span><LinkOutlined style={{ marginRight: 8 }} />关联耗材</span>}
              style={{ marginTop: 16 }}
            >
              <Table
                rowKey="id"
                columns={consumableColumns}
                dataSource={consumables}
                pagination={false}
                size="small"
              />
            </Card>
          )}
        </Col>

        <Col xs={24} lg={7}>
          <Card
            title={<span><BellOutlined style={{ marginRight: 8 }} />患者提醒</span>}
            bodyStyle={{ maxHeight: 500, overflow: 'auto' }}
          >
            {alerts.length === 0 ? (
              <Text type="secondary">暂无提醒</Text>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #f0f0f0',
                      background: alert.is_read ? '#fff' : '#fffbe6',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Tag color={ALERT_TYPE_COLORS[alert.type]} size="small">
                        {ALERT_TYPE_LABELS[alert.type]}
                      </Tag>
                      {!alert.is_read && <Badge status="processing" />}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 13 }}>{alert.message}</div>
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {dayjs(alert.created_at).format('MM-DD HH:mm')}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="编辑患者信息"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => editForm.submit()}
        confirmLoading={submitting}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditPatient}>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="电话" rules={[{ required: true, message: '请输入电话' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="gender" label="性别" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="age" label="年龄">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`改期 - ${selectedNode ? NODE_TYPE_LABELS[selectedNode.node_type] : ''}`}
        open={rescheduleModalOpen}
        onCancel={() => setRescheduleModalOpen(false)}
        onOk={() => rescheduleForm.submit()}
        confirmLoading={submitting}
        okText="确认改期"
        cancelText="取消"
      >
        <Form form={rescheduleForm} layout="vertical" onFinish={handleReschedule}>
          <Form.Item name="new_date" label="新计划日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="改期原因" rules={[{ required: true, message: '请输入原因' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`完成 - ${selectedNode ? NODE_TYPE_LABELS[selectedNode.node_type] : ''}`}
        open={completeModalOpen}
        onCancel={() => setCompleteModalOpen(false)}
        onOk={() => completeForm.submit()}
        confirmLoading={submitting}
        okText="确认完成"
        cancelText="取消"
      >
        <Form form={completeForm} layout="vertical" onFinish={handleComplete}>
          <Form.Item name="notes" label="手术/治疗记录">
            <Input.TextArea rows={4} placeholder="请输入治疗记录" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增治疗节点"
        open={addNodeModalOpen}
        onCancel={() => setAddNodeModalOpen(false)}
        onOk={() => addNodeForm.submit()}
        confirmLoading={submitting}
        okText="添加"
        cancelText="取消"
      >
        <Form form={addNodeForm} layout="vertical" onFinish={handleAddNode}>
          <Form.Item name="node_type" label="节点类型" rules={[{ required: true, message: '请选择节点类型' }]}>
            <Select placeholder="请选择节点类型">
              {NODE_TYPE_ORDER.map((t) => (
                <Select.Option key={t} value={t}>{NODE_TYPE_LABELS[t]}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="planned_date" label="计划日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="doctor_id" label="负责医生">
            <Select placeholder="请选择医生" allowClear>
              {doctors.map((d) => (
                <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="consumable_id" label="关联耗材">
            <Select placeholder="请选择耗材" allowClear>
              {availableConsumables.map((c) => (
                <Select.Option key={c.id} value={c.id}>{c.name} ({c.model})</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
