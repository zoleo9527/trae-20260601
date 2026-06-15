import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Modal,
  Form,
  Input,
  Radio,
  message,
  List,
  Divider,
  Steps,
  Alert
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  HistoryOutlined,
  FileTextOutlined,
  EditOutlined
} from '@ant-design/icons';
import { orderApi } from '../services/api';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  REVISION_TYPE_LABELS
} from '../types';
import type { Order, OrderStatus } from '../types';
import dayjs from '../utils/dayjs';

const { Title, Text, Paragraph } = Typography;
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

export default function CustomerConfirm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmForm] = Form.useForm();
  const [confirmType, setConfirmType] = useState<'approve' | 'revise'>('approve');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  useEffect(() => {
    if (confirmModalVisible && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
      }
    }
  }, [confirmModalVisible]);

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

  const currentStepIndex = order
    ? order.status === 'revision_needed'
      ? 2
      : Math.max(STATUS_FLOW.indexOf(order.status), 0)
    : 0;

  const getCanvasSignature = () => {
    if (canvasRef.current && hasSignature) {
      return canvasRef.current.toDataURL();
    }
    return '';
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setHasSignature(false);
      }
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const rect = canvasRef.current.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleConfirm = async (values: any) => {
    if (!order) return;

    const signature = getCanvasSignature();
    if (!signature && confirmType === 'approve') {
      message.warning('请先签署姓名');
      return;
    }

    try {
      await orderApi.confirmByCustomer(order.id, {
        customerName: values.customerName,
        signature: signature,
        confirmType: confirmType,
        feedback: values.feedback || ''
      });
      message.success(confirmType === 'approve' ? '确认成功！' : '已提交改稿要求');
      setConfirmModalVisible(false);
      confirmForm.resetFields();
      clearCanvas();
      loadOrder();
    } catch (e) {
      message.error('提交失败');
    }
  };

  if (loading || !order) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Title level={4}>加载中...</Title>
      </div>
    );
  }

  const isConfirmed = order.customerConfirmation?.confirmType === 'approve';
  const isRevisionRequested = order.customerConfirmation?.confirmType === 'revise';

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '24px 16px'
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Title level={3} style={{ margin: '0 0 8px' }}>
                📋 设计稿件确认
              </Title>
              <Text type="secondary">订单号: {order.id}</Text>
            </div>

            <Alert
              message={
                isConfirmed
                  ? '✅ 您已确认通过此稿件，我们将安排喷绘生产'
                  : isRevisionRequested
                  ? '🔄 您已要求改稿，设计师正在处理中'
                  : '请仔细核对设计稿件，确认无误后签署确认'
              }
              type={isConfirmed ? 'success' : isRevisionRequested ? 'warning' : 'info'}
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Steps current={currentStepIndex} size="small" style={{ marginBottom: 24 }}>
              {STATUS_FLOW.slice(0, 5).map((status, idx) => (
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
                />
              ))}
            </Steps>
          </Card>

          <Card title={<Space><FileTextOutlined /> 订单信息</Space>}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="客户名称">
                {order.customerName}
              </Descriptions.Item>
              <Descriptions.Item label="业务类型">
                {order.businessType}
              </Descriptions.Item>
              <Descriptions.Item label="项目标题" span={2}>
                {order.title}
              </Descriptions.Item>
              <Descriptions.Item label="尺寸">
                {order.width && order.height
                  ? `${order.width} × ${order.height} ${order.unit}`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="数量">
                {order.quantity}
              </Descriptions.Item>
              <Descriptions.Item label="材质">
                {order.material}
              </Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color={STATUS_COLORS[order.status]}>
                  {STATUS_LABELS[order.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="详细要求" span={2}>
                {order.description}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {order.revisions.length > 0 && (
            <Card
              title={
                <Space>
                  <HistoryOutlined />
                  改稿历史记录 ({order.revisions.length} 次)
                </Space>
              }
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {order.revisions.map((revision, idx) => (
                  <Card
                    key={revision.id}
                    size="small"
                    type="inner"
                    title={
                      <Space>
                        <Tag color="purple">第 {order.revisions.length - idx} 次改稿</Tag>
                        <Tag>
                          {REVISION_TYPE_LABELS[revision.type as keyof typeof REVISION_TYPE_LABELS]}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(revision.timestamp).format('YYYY-MM-DD HH:mm')}
                        </Text>
                      </Space>
                    }
                  >
                    <Paragraph style={{ marginBottom: 12 }}>
                      <Text strong>改稿说明：</Text>
                      {revision.description}
                    </Paragraph>
                    <div className="revision-diff">
                      <Row gutter={[16, 16]}>
                        <Col xs={12}>
                          <Text strong type="danger">修改前：</Text>
                          {Object.entries(revision.beforeData).map(([key, value]) => (
                            <div key={key} className="before">
                              {key}: {String(value)}
                            </div>
                          ))}
                        </Col>
                        <Col xs={12}>
                          <Text strong type="success">修改后：</Text>
                          {Object.entries(revision.afterData).map(([key, value]) => (
                            <div key={key} className="after">
                              {key}: {String(value)}
                            </div>
                          ))}
                        </Col>
                      </Row>
                    </div>
                  </Card>
                ))}
              </Space>
            </Card>
          )}

          {order.customerConfirmation && (
            <Card
              title={<Space><CheckOutlined /> 确认记录</Space>}
              style={{ background: isConfirmed ? '#f6ffed' : '#fff7e6' }}
            >
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="确认人">
                  {order.customerConfirmation.customerName}
                </Descriptions.Item>
                <Descriptions.Item label="确认结果">
                  <Tag color={isConfirmed ? 'green' : 'orange'}>
                    {isConfirmed ? '✓ 确认通过' : '↻ 要求改稿'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="客户反馈" span={2}>
                  {order.customerConfirmation.feedback || '无'}
                </Descriptions.Item>
                <Descriptions.Item label="确认时间" span={2}>
                  {dayjs(order.customerConfirmation.confirmedAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                {order.customerConfirmation.signature && (
                  <Descriptions.Item label="电子签名" span={2}>
                    <img
                      src={order.customerConfirmation.signature}
                      alt="签名"
                      style={{ maxHeight: 80, background: '#fafafa' }}
                    />
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          )}

          {order.history.length > 0 && (
            <Card title="处理历史">
              <List
                dataSource={order.history}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>
                            {STATUS_LABELS[item.status as OrderStatus] || item.status}
                          </Text>
                          <Text type="secondary">- {item.operator}</Text>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Text>{item.remark}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(item.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          {!isConfirmed && (
            <Card style={{ textAlign: 'center' }}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Title level={4} style={{ margin: 0 }}>
                  请选择您的确认意见
                </Title>
                <Space size="large">
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckOutlined />}
                    onClick={() => {
                      setConfirmType('approve');
                      setConfirmModalVisible(true);
                    }}
                    style={{ minWidth: 160 }}
                  >
                    确认通过
                  </Button>
                  <Button
                    danger
                    size="large"
                    icon={<CloseOutlined />}
                    onClick={() => {
                      setConfirmType('revise');
                      setConfirmModalVisible(true);
                    }}
                    style={{ minWidth: 160 }}
                  >
                    需要改稿
                  </Button>
                </Space>
              </Space>
            </Card>
          )}

          {isConfirmed && (
            <Card style={{ textAlign: 'center', background: '#f6ffed' }}>
              <Space direction="vertical" size="middle">
                <CheckOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                  感谢您的确认！
                </Title>
                <Text type="secondary">
                  我们将立即安排喷绘生产，预计交付时间：
                  {order.expectedDelivery
                    ? dayjs(order.expectedDelivery).format('YYYY-MM-DD HH:mm')
                    : '另行通知'}
                </Text>
              </Space>
            </Card>
          )}
        </Space>
      </div>

      <Modal
        title={
          <Space>
            {confirmType === 'approve' ? (
              <><CheckOutlined style={{ color: '#52c41a' }} /> 确认稿件</>
            ) : (
              <><EditOutlined style={{ color: '#ff4d4f' }} /> 要求改稿</>
            )}
          </Space>
        }
        open={confirmModalVisible}
        onCancel={() => {
          setConfirmModalVisible(false);
          confirmForm.resetFields();
          clearCanvas();
        }}
        footer={null}
        width={confirmType === 'approve' ? 600 : 500}
        maskClosable={false}
      >
        <Form form={confirmForm} layout="vertical" onFinish={handleConfirm}>
          <Form.Item
            name="customerName"
            label="您的姓名"
            rules={[{ required: true, message: '请输入您的姓名' }]}
          >
            <Input placeholder="请输入确认人姓名" />
          </Form.Item>

          {confirmType === 'revise' && (
            <Form.Item
              name="feedback"
              label="改稿要求"
              rules={[{ required: true, message: '请描述改稿要求' }]}
            >
              <TextArea
                rows={4}
                placeholder="请详细描述您的改稿要求，包括颜色、尺寸、内容、布局等方面..."
              />
            </Form.Item>
          )}

          {confirmType === 'approve' && (
            <>
              <Divider orientation="left">电子签名</Divider>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  请在下方区域签名确认
                </Text>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  className="signature-canvas"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <div style={{ marginTop: 8 }}>
                  <Button size="small" onClick={clearCanvas}>
                    清除签名
                  </Button>
                </div>
              </div>
            </>
          )}

          {confirmType === 'approve' && (
            <Alert
              message="确认即表示您已审核并同意该设计方案，我们将按此进行喷绘生产。如有颜色偏差，请在此备注说明。"
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setConfirmModalVisible(false);
                confirmForm.resetFields();
                clearCanvas();
              }}>
                取消
              </Button>
              <Button
                type="primary"
                danger={confirmType !== 'approve'}
                htmlType="submit"
                icon={confirmType === 'approve' ? <CheckOutlined /> : <EditOutlined />}
              >
                {confirmType === 'approve' ? '确认提交' : '提交改稿要求'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
