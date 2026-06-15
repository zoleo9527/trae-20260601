import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Typography,
  Timeline,
  Divider,
  Row,
  Col,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  DatePicker,
  message,
  List,
  Alert,
  Badge,
  Tooltip,
  Steps,
  Table,
  Checkbox
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckOutlined,
  UploadOutlined,
  SendOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  FileTextOutlined,
  CameraOutlined,
  ClockCircleOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import { orderApi } from '../services/api';
import { useAppContext } from '../App';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  ROLE_LABELS,
  REVISION_TYPE_LABELS,
  ISSUE_TYPE_LABELS,
  STATUS_LABELS as ORDER_STATUS_LABELS
} from '../types';
import type { Order, Revision, OrderStatus, IssueType } from '../types';
import dayjs from '../utils/dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

const STATUS_FLOW: OrderStatus[] = [
  'pending_review',
  'designing',
  'pending_approval',
  'approved',
  'printing',
  'quality_check',
  'ready_for_install',
  'installing',
  'completed'
];

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, refreshStats } = useAppContext();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('detail');

  const [revisionModalVisible, setRevisionModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [installModalVisible, setInstallModalVisible] = useState(false);
  const [revisionForm] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [installForm] = Form.useForm();

  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [installPhotos, setInstallPhotos] = useState<File[]>([]);
  const [revisionType, setRevisionType] = useState<string>('');

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await orderApi.getOrder(id);
      setOrder(data);
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = useMemo(() => {
    if (!order) return 0;
    if (order.status === 'revision_needed') return 2;
    const idx = STATUS_FLOW.indexOf(order.status);
    return idx >= 0 ? idx : 0;
  }, [order]);

  const handleStatusChange = async (values: any) => {
    if (!order) return;
    try {
      await orderApi.updateStatus(
        order.id,
        values.status,
        currentUser?.name || '系统',
        values.remark
      );
      message.success('状态更新成功');
      setStatusModalVisible(false);
      statusForm.resetFields();
      loadOrder();
      refreshStats();
    } catch (e) {
      message.error('更新失败');
    }
  };

  const handleAddRevision = async (values: any) => {
    if (!order) return;
    try {
      const type = values.type;
      let beforeData: Record<string, any> = {};
      let afterData: Record<string, any> = {};

      if (type === 'dimension') {
        beforeData = { width: values.beforeWidth ?? order.width, height: values.beforeHeight ?? order.height };
        afterData = { width: values.afterWidth, height: values.afterHeight };
        if (values.afterUnit) afterData.unit = values.afterUnit;
      } else if (type === 'color') {
        beforeData = { color: values.beforeColor || '', pantone: values.beforePantone || '' };
        afterData = { color: values.afterColor || '', pantone: values.afterPantone || '' };
      } else if (type === 'typography') {
        beforeData = { font: values.beforeFont || '', content: values.beforeContent || '' };
        afterData = { font: values.afterFont || '', content: values.afterContent || '' };
      } else {
        beforeData = { detail: values.beforeDetail || '' };
        afterData = { detail: values.afterDetail || '' };
      }

      await orderApi.addRevision(order.id, {
        type,
        description: values.description,
        operator: currentUser?.name || '系统',
        file: revisionFile || undefined,
        beforeData,
        afterData,
      });
      message.success('改稿记录已添加');
      setRevisionModalVisible(false);
      revisionForm.resetFields();
      setRevisionFile(null);
      setRevisionType('');
      loadOrder();
      refreshStats();
    } catch (e) {
      message.error('添加失败');
    }
  };

  const handleAddInstallation = async (values: any) => {
    if (!order) return;
    try {
      await orderApi.addInstallation(order.id, {
        installTime: values.installTime?.toISOString(),
        operator: currentUser?.name || '系统',
        remark: values.remark,
        photos: installPhotos,
        issueReported: values.issueReported || false
      });
      message.success('安装记录已添加');
      setInstallModalVisible(false);
      installForm.resetFields();
      setInstallPhotos([]);
      loadOrder();
      refreshStats();
    } catch (e) {
      message.error('添加失败');
    }
  };

  const getAvailableStatuses = (): { value: string; label: string }[] => {
    if (!order) return [];
    const currentIdx = STATUS_FLOW.indexOf(order.status);
    const options: { value: string; label: string }[] = [];

    if (currentUser?.role === 'receptionist' || currentUser?.role === 'admin') {
      if (order.status === 'pending_review') {
        options.push({ value: 'designing', label: '转设计师处理' });
      }
    }

    if (currentUser?.role === 'designer' || currentUser?.role === 'admin') {
      if (order.status === 'designing' || order.status === 'revision_needed') {
        options.push({ value: 'pending_approval', label: '提交客户确认' });
      }
    }

    if (currentUser?.role === 'production' || currentUser?.role === 'admin') {
      if (order.status === 'approved') {
        options.push({ value: 'printing', label: '开始喷绘' });
      }
      if (order.status === 'printing') {
        options.push({ value: 'quality_check', label: '喷绘完成，转质检' });
      }
    }

    if (currentUser?.role === 'quality' || currentUser?.role === 'admin') {
      if (order.status === 'quality_check') {
        options.push({ value: 'ready_for_install', label: '质检通过，待安装' });
      }
    }

    if (currentUser?.role === 'installer' || currentUser?.role === 'admin') {
      if (order.status === 'ready_for_install') {
        options.push({ value: 'installing', label: '开始安装' });
      }
      if (order.status === 'installing') {
        options.push({ value: 'completed', label: '安装完成' });
      }
    }

    if (currentUser?.role === 'admin') {
      STATUS_FLOW.forEach(s => {
        if (!options.find(o => o.value === s)) {
          options.push({ value: s, label: `【管理员】${STATUS_LABELS[s]}` });
        }
      });
    }

    return options;
  };

  const pendingIssues = order?.issues?.filter(i => i.status === 'pending') || [];
  const resolvedIssues = order?.issues?.filter(i => i.status === 'resolved') || [];

  const canAddRevision = currentUser?.role === 'designer' || currentUser?.role === 'admin';
  const canAddInstallation = currentUser?.role === 'installer' || currentUser?.role === 'admin';
  const canChangeStatus = getAvailableStatuses().length > 0;
  const canShareToCustomer = order?.status === 'designing' || order?.status === 'pending_approval' || order?.status === 'revision_needed';

  if (loading || !order) {
    return <div style={{ padding: 24 }}>加载中...</div>;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {order.title}
              {order.urgent && (
                <Tag color="red" style={{ marginLeft: 8 }}>⚠️ 急单</Tag>
              )}
            </Title>
            <Text type="secondary">订单号: {order.id}</Text>
          </div>
        </Space>
        <Space>
          {pendingIssues.length > 0 && (
            <Alert
              message={`存在 ${pendingIssues.length} 个待处理问题`}
              type="error"
              showIcon
              style={{ margin: 0 }}
            />
          )}
          {canShareToCustomer && (
            <Tooltip title="发送客户确认链接">
              <Button
                icon={<ShareAltOutlined />}
                onClick={() => {
                  const url = `${window.location.origin}/confirm/${order.id}`;
                  navigator.clipboard.writeText(url);
                  message.success('客户确认链接已复制到剪贴板');
                }}
              >
                发送客户确认
              </Button>
            </Tooltip>
          )}
          {canChangeStatus && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setStatusModalVisible(true)}
            >
              流转状态
            </Button>
          )}
          {canAddRevision && (
            <Button
              type="primary"
              ghost
              icon={<EditOutlined />}
              onClick={() => setRevisionModalVisible(true)}
            >
              记录改稿
            </Button>
          )}
          {canAddInstallation && order.status === 'installing' && (
            <Button
              type="primary"
              icon={<CameraOutlined />}
              onClick={() => setInstallModalVisible(true)}
            >
              上传安装记录
            </Button>
          )}
          <Button onClick={loadOrder}>刷新</Button>
        </Space>
      </div>

      {pendingIssues.length > 0 && (
        <Card
          style={{ border: '1px solid #ffccc7', background: '#fff1f0' }}
          title={
            <Space>
              <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
              <span style={{ color: '#ff4d4f' }}>待处理问题 ({pendingIssues.length})</span>
            </Space>
          }
        >
          <List
            dataSource={pendingIssues}
            renderItem={(issue) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Badge status="error" />}
                  title={
                    <Space>
                      <Tag color="orange">{ISSUE_TYPE_LABELS[issue.type as IssueType]}</Tag>
                      <span>{issue.description}</span>
                    </Space>
                  }
                  description={
                    <Text type="secondary">
                      上报时间: {dayjs(issue.reportedAt).format('YYYY-MM-DD HH:mm')}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      <Card>
        <Title level={5}>状态流转</Title>
        <Steps current={currentStepIndex} size="small">
          {STATUS_FLOW.map((status, idx) => (
            <Step
              key={status}
              title={STATUS_LABELS[status]}
              status={
                order.status === 'revision_needed' && idx === 2
                  ? 'error'
                  : idx < currentStepIndex
                  ? 'finish'
                  : idx === currentStepIndex
                  ? 'process'
                  : 'wait'
              }
              description={
                order.status === status ||
                (order.status === 'revision_needed' && status === 'pending_approval')
                  ? '当前'
                  : ''
              }
            />
          ))}
        </Steps>
        {order.status === 'revision_needed' && (
          <Alert
            message="🔄 客户要求改稿，设计师需重新处理后再次提交确认"
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            tabList={[
              { key: 'detail', tab: '订单详情' },
              { key: 'revisions', tab: `改稿记录 (${order.revisions.length})` },
              { key: 'history', tab: '状态历史' }
            ]}
            activeTabKey={activeTab}
            onTabChange={setActiveTab}
          >
            {activeTab === 'detail' && (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="客户名称">{order.customerName}</Descriptions.Item>
                  <Descriptions.Item label="联系电话">{order.customerPhone}</Descriptions.Item>
                  <Descriptions.Item label="业务类型">{order.businessType}</Descriptions.Item>
                  <Descriptions.Item label="当前状态">
                    <Tag color={STATUS_COLORS[order.status]}>{STATUS_LABELS[order.status]}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="尺寸">
                    {order.width && order.height
                      ? `${order.width} × ${order.height} ${order.unit}`
                      : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="数量">{order.quantity}</Descriptions.Item>
                  <Descriptions.Item label="材质">{order.material}</Descriptions.Item>
                  <Descriptions.Item label="色彩模式">{order.colorMode}</Descriptions.Item>
                  <Descriptions.Item label="当前处理人">
                    {order.currentHandler ? ROLE_LABELS[order.currentHandler] : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="紧急程度">
                    {order.urgent ? <Tag color="red">急单</Tag> : '普通'}
                  </Descriptions.Item>
                  <Descriptions.Item label="预计交付">
                    <Text
                      type={order.expectedDelivery && dayjs(order.expectedDelivery).isBefore(dayjs()) ? 'danger' : undefined}
                    >
                      {order.expectedDelivery
                        ? dayjs(order.expectedDelivery).format('YYYY-MM-DD HH:mm')
                        : '-'}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="安装时间">
                    {order.installTime
                      ? dayjs(order.installTime).format('YYYY-MM-DD HH:mm')
                      : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="安装地址" span={2}>
                    {order.installAddress || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="详细要求" span={2}>
                    <Paragraph style={{ margin: 0 }}>{order.description}</Paragraph>
                  </Descriptions.Item>
                </Descriptions>

                {order.customerConfirmation && (
                  <>
                    <Divider orientation="left">客户确认记录</Divider>
                    <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                      <Descriptions column={2} size="small">
                        <Descriptions.Item label="确认人">
                          {order.customerConfirmation.customerName}
                        </Descriptions.Item>
                        <Descriptions.Item label="确认结果">
                          <Tag color={order.customerConfirmation.confirmType === 'approve' ? 'green' : 'orange'}>
                            {order.customerConfirmation.confirmType === 'approve' ? '确认通过' : '要求改稿'}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="客户反馈" span={2}>
                          {order.customerConfirmation.feedback || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="确认时间" span={2}>
                          {dayjs(order.customerConfirmation.confirmedAt).format('YYYY-MM-DD HH:mm:ss')}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </>
                )}

                {order.installation && (
                  <>
                    <Divider orientation="left">安装记录</Divider>
                    <Card size="small">
                      <Descriptions column={2} size="small">
                        <Descriptions.Item label="安装人员">
                          {order.installation.operator}
                        </Descriptions.Item>
                        <Descriptions.Item label="安装时间">
                          {dayjs(order.installation.installTime).format('YYYY-MM-DD HH:mm')}
                        </Descriptions.Item>
                        <Descriptions.Item label="是否有问题">
                          {order.installation.issueReported ? (
                            <Tag color="red">存在问题</Tag>
                          ) : (
                            <Tag color="green">正常完成</Tag>
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="完成时间">
                          {dayjs(order.installation.completedAt).format('YYYY-MM-DD HH:mm')}
                        </Descriptions.Item>
                        <Descriptions.Item label="备注" span={2}>
                          {order.installation.remark}
                        </Descriptions.Item>
                      </Descriptions>
                      {order.installation.photos.length > 0 && (
                        <>
                          <Divider orientation="left">现场照片</Divider>
                          <Row gutter={[8, 8]}>
                            {order.installation.photos.map((photo, idx) => (
                              <Col key={idx} xs={8} sm={6} md={4}>
                                <img
                                  src={photo}
                                  alt={`安装照片${idx + 1}`}
                                  className="preview-image"
                                />
                              </Col>
                            ))}
                          </Row>
                        </>
                      )}
                    </Card>
                  </>
                )}

                {resolvedIssues.length > 0 && (
                  <>
                    <Divider orientation="left">已解决问题</Divider>
                    <List
                      size="small"
                      dataSource={resolvedIssues}
                      renderItem={(issue) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            title={
                              <Space>
                                <Tag color="default">{ISSUE_TYPE_LABELS[issue.type as IssueType]}</Tag>
                                <span style={{ textDecoration: 'line-through', color: '#999' }}>
                                  {issue.description}
                                </span>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </>
                )}
              </Space>
            )}

            {activeTab === 'revisions' && (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {order.revisions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                    <HistoryOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                    <div>暂无改稿记录</div>
                  </div>
                ) : (
                  order.revisions.map((revision, idx) => (
                    <Card
                      key={revision.id}
                      size="small"
                      title={
                        <Space>
                          <Tag color="purple">
                            第 {order.revisions.length - idx} 次改稿
                          </Tag>
                          <Tag>{REVISION_TYPE_LABELS[revision.type as keyof typeof REVISION_TYPE_LABELS]}</Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {revision.operator} · {dayjs(revision.timestamp).format('MM-DD HH:mm')}
                          </Text>
                        </Space>
                      }
                    >
                      <Paragraph style={{ marginBottom: 12 }}>{revision.description}</Paragraph>
                      <div className="revision-diff">
                        <div style={{ marginBottom: 8 }}>
                          <Text strong>修改前：</Text>
                          {Object.entries(revision.beforeData).map(([key, value]) => (
                            <div key={key} className="before">
                              {key}: {String(value)}
                            </div>
                          ))}
                        </div>
                        <div>
                          <Text strong>修改后：</Text>
                          {Object.entries(revision.afterData).map(([key, value]) => (
                            <div key={key} className="after">
                              {key}: {String(value)}
                            </div>
                          ))}
                        </div>
                      </div>
                      {revision.fileUrl && (
                        <div style={{ marginTop: 12 }}>
                          <img src={revision.fileUrl} alt="改稿文件" className="preview-image" />
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </Space>
            )}

            {activeTab === 'history' && (
              <Timeline
                items={order.history.map((h, idx) => ({
                  color:
                    h.status === 'revision' || h.status === 'revision_needed'
                      ? 'red'
                      : h.status === 'completed'
                      ? 'green'
                      : h.status === 'customer_confirm'
                      ? 'blue'
                      : 'blue',
                  children: (
                    <div>
                      <Space>
                        <Text strong>{ORDER_STATUS_LABELS[h.status as OrderStatus] || h.status}</Text>
                        <Text type="secondary">- {h.operator}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(h.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                        </Text>
                      </Space>
                      <div style={{ marginTop: 4, color: '#666' }}>{h.remark}</div>
                    </div>
                  )
                }))}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="快捷操作" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              {canChangeStatus &&
                getAvailableStatuses().map((opt) => (
                  <Button
                    key={opt.value}
                    type="primary"
                    block
                    onClick={() => {
                      statusForm.setFieldsValue({ status: opt.value });
                      setStatusModalVisible(true);
                    }}
                  >
                    {opt.label}
                  </Button>
                ))}
              {canAddRevision && (
                <Button block onClick={() => setRevisionModalVisible(true)}>
                  <EditOutlined /> 记录改稿
                </Button>
              )}
              {order.status === 'pending_approval' && (
                <Button block type="primary" ghost>
                  <SendOutlined /> 发送微信提醒客户
                </Button>
              )}
              {order.status === 'ready_for_install' && (
                <Button block type="primary" onClick={() => {
                  statusForm.setFieldsValue({ status: 'installing' });
                  setStatusModalVisible(true);
                }}>
                  <CheckOutlined /> 确认开始安装
                </Button>
              )}
              {order.status === 'installing' && canAddInstallation && (
                <Button block type="primary" onClick={() => setInstallModalVisible(true)}>
                  <CameraOutlined /> 上传安装照片
                </Button>
              )}
            </Space>
          </Card>

          <Card
            title={<Space><ClockCircleOutlined /> 时间线</Space>}
            size="small"
            style={{ marginTop: 16 }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="创建时间">
                {dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="最后更新">
                {dayjs(order.updatedAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              {order.expectedDelivery && (
                <Descriptions.Item label="预计交付">
                  <Text
                    type={dayjs(order.expectedDelivery).isBefore(dayjs()) ? 'danger' : undefined}
                  >
                    {dayjs(order.expectedDelivery).format('YYYY-MM-DD HH:mm')}
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      {dayjs(order.expectedDelivery).fromNow()}
                    </div>
                  </Text>
                </Descriptions.Item>
              )}
              {order.installTime && (
                <Descriptions.Item label="预计安装">
                  {dayjs(order.installTime).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card
            title={<Space><FileTextOutlined /> 改稿统计</Space>}
            size="small"
            style={{ marginTop: 16 }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">改稿次数</Text>
                <Text strong>{order.revisions.length} 次</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">客户确认</Text>
                <Text strong>{order.customerConfirmation ? '已确认' : '待确认'}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">待处理问题</Text>
                <Text strong type={pendingIssues.length > 0 ? 'danger' : undefined}>
                  {pendingIssues.length} 个
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal
        title="状态流转"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={statusForm} layout="vertical" onFinish={handleStatusChange}>
          <Form.Item
            name="status"
            label="目标状态"
            rules={[{ required: true, message: '请选择目标状态' }]}
          >
            <Select placeholder="请选择要流转到的状态">
              {getAvailableStatuses().map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="处理备注">
            <TextArea rows={3} placeholder="请输入处理备注（可选）" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                确认流转
              </Button>
              <Button onClick={() => setStatusModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="记录改稿"
        open={revisionModalVisible}
        onCancel={() => {
          setRevisionModalVisible(false);
          revisionForm.resetFields();
          setRevisionFile(null);
          setRevisionType('');
        }}
        footer={null}
        width={650}
      >
        <Form form={revisionForm} layout="vertical" onFinish={handleAddRevision}>
          <Form.Item
            name="type"
            label="改稿类型"
            rules={[{ required: true, message: '请选择改稿类型' }]}
          >
            <Select
              placeholder="请选择"
              onChange={(v) => {
                setRevisionType(v);
                if (v === 'dimension' && order) {
                  revisionForm.setFieldsValue({
                    beforeWidth: order.width,
                    beforeHeight: order.height,
                  });
                }
              }}
            >
              {Object.entries(REVISION_TYPE_LABELS).map(([value, label]) => (
                <Option key={value} value={value}>{label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="description"
            label="改稿说明"
            rules={[{ required: true, message: '请输入改稿说明' }]}
          >
            <TextArea rows={2} placeholder="详细描述改稿内容..." />
          </Form.Item>

          <Divider orientation="left">修改前后对比</Divider>

          {revisionType === 'dimension' && (
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Title level={5} style={{ margin: '0 0 8px' }}>修改前</Title>
                <Form.Item name="beforeWidth" label="宽度(cm)">
                  <Input type="number" disabled />
                </Form.Item>
                <Form.Item name="beforeHeight" label="高度(cm)">
                  <Input type="number" disabled />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Title level={5} style={{ margin: '0 0 8px' }}>修改后</Title>
                <Form.Item name="afterWidth" label="宽度(cm)" rules={[{ required: true, message: '请输入新宽度' }]}>
                  <Input type="number" placeholder="新宽度" />
                </Form.Item>
                <Form.Item name="afterHeight" label="高度(cm)" rules={[{ required: true, message: '请输入新高度' }]}>
                  <Input type="number" placeholder="新高度" />
                </Form.Item>
              </Col>
            </Row>
          )}

          {revisionType === 'color' && (
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Title level={5} style={{ margin: '0 0 8px' }}>修改前</Title>
                <Form.Item name="beforeColor" label="颜色值">
                  <Input placeholder="如：#1E40AF" />
                </Form.Item>
                <Form.Item name="beforePantone" label="PANTONE号">
                  <Input placeholder="如：PANTONE 287C" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Title level={5} style={{ margin: '0 0 8px' }}>修改后</Title>
                <Form.Item name="afterColor" label="颜色值" rules={[{ required: true, message: '请输入新颜色' }]}>
                  <Input placeholder="如：#1D3557" />
                </Form.Item>
                <Form.Item name="afterPantone" label="PANTONE号">
                  <Input placeholder="如：PANTONE 286C" />
                </Form.Item>
              </Col>
            </Row>
          )}

          {revisionType === 'typography' && (
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Title level={5} style={{ margin: '0 0 8px' }}>修改前</Title>
                <Form.Item name="beforeFont" label="字体">
                  <Input placeholder="原字体" />
                </Form.Item>
                <Form.Item name="beforeContent" label="文案内容">
                  <Input placeholder="原文案" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Title level={5} style={{ margin: '0 0 8px' }}>修改后</Title>
                <Form.Item name="afterFont" label="字体">
                  <Input placeholder="新字体" />
                </Form.Item>
                <Form.Item name="afterContent" label="文案内容">
                  <Input placeholder="新文案" />
                </Form.Item>
              </Col>
            </Row>
          )}

          {(revisionType === 'content' || revisionType === 'layout' || revisionType === 'other') && (
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Title level={5} style={{ margin: '0 0 8px' }}>修改前</Title>
                <Form.Item name="beforeDetail" label="原内容">
                  <TextArea rows={3} placeholder="描述修改前的内容..." />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Title level={5} style={{ margin: '0 0 8px' }}>修改后</Title>
                <Form.Item name="afterDetail" label="新内容" rules={[{ required: true, message: '请输入修改后内容' }]}>
                  <TextArea rows={3} placeholder="描述修改后的内容..." />
                </Form.Item>
              </Col>
            </Row>
          )}

          {!revisionType && (
            <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>
              请先选择改稿类型
            </div>
          )}

          <Divider orientation="left">上传文件（可选）</Divider>
          <Upload
            beforeUpload={(file) => {
              setRevisionFile(file);
              return false;
            }}
            maxCount={1}
            onRemove={() => setRevisionFile(null)}
            fileList={revisionFile ? [{ uid: '1', name: revisionFile.name, status: 'done' }] : []}
          >
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>
          <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                保存改稿记录
              </Button>
              <Button onClick={() => {
                setRevisionModalVisible(false);
                revisionForm.resetFields();
                setRevisionFile(null);
                setRevisionType('');
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="上传安装记录"
        open={installModalVisible}
        onCancel={() => {
          setInstallModalVisible(false);
          installForm.resetFields();
          setInstallPhotos([]);
        }}
        footer={null}
        width={600}
      >
        <Form form={installForm} layout="vertical" onFinish={handleAddInstallation}>
          <Form.Item
            name="installTime"
            label="实际安装时间"
            rules={[{ required: true, message: '请选择安装时间' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="安装备注">
            <TextArea rows={3} placeholder="请输入安装情况说明，如有问题请详细描述..." />
          </Form.Item>
          <Form.Item name="issueReported" label="是否存在问题" valuePropName="checked">
            <Checkbox>
              <span style={{ color: '#ff4d4f' }}>存在问题需要后续处理</span>
            </Checkbox>
          </Form.Item>
          <Divider orientation="left">现场照片</Divider>
          <Upload
            multiple
            beforeUpload={(file) => {
              setInstallPhotos(prev => [...prev, file]);
              return false;
            }}
            onRemove={(file) => {
              setInstallPhotos(prev => prev.filter(f => f.name !== file.name));
            }}
            fileList={installPhotos.map((f, idx) => ({
              uid: String(idx),
              name: f.name,
              status: 'done'
            }))}
          >
            <Button icon={<CameraOutlined />}>上传现场照片</Button>
          </Upload>
          <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                保存安装记录
              </Button>
              <Button onClick={() => {
                setInstallModalVisible(false);
                installForm.resetFields();
                setInstallPhotos([]);
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
