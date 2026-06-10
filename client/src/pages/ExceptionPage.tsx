import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Typography,
  Row,
  Col,
  Descriptions,
  Alert
} from 'antd';
import {
  AlertTriangleOutlined,
  PlusOutlined,
  EyeOutlined,
  ReloadOutlined,
  CheckOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import {
  ExceptionRecord,
  ExceptionTypeNames,
  ExceptionStatusNames,
  SeverityNames,
  SeverityColors,
  CustomerOrder
} from '../types';
import { exceptionApi, orderApi } from '../api';
import { useAppStore } from '../store';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ExceptionPage: React.FC = () => {
  const { currentRole, currentUser } = useAppStore();
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [resolveVisible, setResolveVisible] = useState(false);
  const [selectedException, setSelectedException] = useState<ExceptionRecord | null>(null);
  const [relatedOrders, setRelatedOrders] = useState<CustomerOrder[]>([]);
  const [form] = Form.useForm();
  const [resolveForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const exceptionsData = await exceptionApi.getAll();
      setExceptions(exceptionsData);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchRelatedOrders = async (exception: ExceptionRecord) => {
    if (exception.relatedOrders.length > 0) {
      const orders = await Promise.all(exception.relatedOrders.map(id => orderApi.getById(id)));
      setRelatedOrders(orders.filter(Boolean));
    } else {
      setRelatedOrders([]);
    }
  };

  const handleViewDetail = async (exception: ExceptionRecord) => {
    setSelectedException(exception);
    await fetchRelatedOrders(exception);
    setDetailVisible(true);
  };

  const handleCreate = async (values: any) => {
    try {
      await exceptionApi.create({
        type: values.type,
        title: values.title,
        description: values.description,
        severity: values.severity,
        reportedBy: currentUser,
        orderId: values.orderId || undefined,
        batchId: values.batchId || undefined,
        customerId: values.customerId || undefined
      });

      message.success('异常已上报');
      setCreateVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleResolve = (exception: ExceptionRecord) => {
    setSelectedException(exception);
    resolveForm.resetFields();
    setResolveVisible(true);
  };

  const handleResolveSubmit = async (values: any) => {
    if (!selectedException) return;

    try {
      await exceptionApi.handle(selectedException.exceptionId, {
        handledBy: currentUser,
        resolution: values.resolution
      });

      message.success('异常已处理');
      setResolveVisible(false);
      resolveForm.resetFields();
      
      const exceptionsData = await exceptionApi.getAll();
      setExceptions(exceptionsData);
      
      if (selectedException) {
        const updatedException = exceptionsData.find(e => e.exceptionId === selectedException.exceptionId);
        if (updatedException) {
          setSelectedException(updatedException);
        }
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const pendingExceptions = exceptions.filter(e => e.status === 'REPORTED' || e.status === 'PROCESSING');
  const resolvedExceptions = exceptions.filter(e => e.status === 'RESOLVED' || e.status === 'CLOSED');

  const columns = [
    {
      title: '异常编号',
      key: 'exceptionId',
      width: 150,
      render: (_: any, record: ExceptionRecord) => record.exceptionId.slice(-8).toUpperCase()
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={type === 'FORMULA_DEVIATION' ? 'red' : type === 'BATCH_LABEL_ERROR' ? 'orange' : type === 'WEIGHT_GAIN_COMPLAINT' ? 'yellow' : 'blue'}>
          {ExceptionTypeNames[type]}
        </Tag>
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => (
        <Tag color={SeverityColors[severity]}>
          {SeverityNames[severity]}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'REPORTED' ? 'orange' : status === 'PROCESSING' ? 'blue' : 'green'}>
          {ExceptionStatusNames[status]}
        </Tag>
      )
    },
    {
      title: '上报人',
      dataIndex: 'reportedBy',
      key: 'reportedBy',
      width: 100
    },
    {
      title: '上报时间',
      dataIndex: 'reportedAt',
      key: 'reportedAt',
      width: 150,
      render: (time: string) => dayjs(time).format('MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: ExceptionRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {(currentRole === 'MANAGER' || currentRole === 'QUALITY') && 
           (record.status === 'REPORTED' || record.status === 'PROCESSING') && (
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleResolve(record)}
            >
              处理
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>
            <AlertTriangleOutlined style={{ marginRight: 8 }} />
            异常管理
          </Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
            {(currentRole === 'MANAGER' || currentRole === 'QUALITY') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateVisible(true)}
              >
                上报异常
              </Button>
            )}
          </Space>
        </Space>
      </Card>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                {exceptions.length}
              </div>
              <div style={{ color: '#666', marginTop: 4 }}>异常总数</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                {pendingExceptions.length}
              </div>
              <div style={{ color: '#666', marginTop: 4 }}>待处理</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#10b981' }}>
                {resolvedExceptions.length}
              </div>
              <div style={{ color: '#666', marginTop: 4 }}>已解决</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ef4444' }}>
                {exceptions.filter(e => e.severity === 'HIGH' || e.severity === 'CRITICAL').length}
              </div>
              <div style={{ color: '#666', marginTop: 4 }}>严重异常</div>
            </div>
          </Card>
        </Col>
      </Row>

      {pendingExceptions.length > 0 && (
        <Card
          title={
            <Space>
              <AlertTriangleOutlined style={{ color: '#ff4d4f' }} />
              <span>待处理异常</span>
              <Tag color="red">{pendingExceptions.length}</Tag>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Table
            rowKey="exceptionId"
            columns={columns}
            dataSource={pendingExceptions}
            loading={loading}
            pagination={false}
            scroll={{ x: 1200 }}
          />
        </Card>
      )}

      <Card title="历史异常记录">
        <Table
          rowKey="exceptionId"
          columns={columns}
          dataSource={resolvedExceptions}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
          locale={{ emptyText: '暂无历史异常记录' }}
        />
      </Card>

      <Modal
        title="上报异常"
        open={createVisible}
        onCancel={() => {
          setCreateVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label="异常类型"
            name="type"
            rules={[{ required: true, message: '请选择异常类型' }]}
          >
            <Select>
              <Option value="FORMULA_DEVIATION">投料偏差</Option>
              <Option value="BATCH_LABEL_ERROR">批次标签错误</Option>
              <Option value="WEIGHT_GAIN_COMPLAINT">增重慢投诉</Option>
              <Option value="OTHER">其他异常</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="严重程度"
            name="severity"
            rules={[{ required: true, message: '请选择严重程度' }]}
          >
            <Select>
              <Option value="LOW">低</Option>
              <Option value="MEDIUM">中</Option>
              <Option value="HIGH">高</Option>
              <Option value="CRITICAL">严重</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="简要描述异常" />
          </Form.Item>

          <Form.Item
            label="详细描述"
            name="description"
            rules={[{ required: true, message: '请输入详细描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述异常情况，包括时间、地点、影响范围等" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">上报异常</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="异常详情"
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          setSelectedException(null);
        }}
        footer={null}
        width={900}
      >
        {selectedException && (
          <>
            <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="异常编号">{selectedException.exceptionId}</Descriptions.Item>
                <Descriptions.Item label="类型">
                  <Tag color={selectedException.type === 'FORMULA_DEVIATION' ? 'red' : selectedException.type === 'BATCH_LABEL_ERROR' ? 'orange' : selectedException.type === 'WEIGHT_GAIN_COMPLAINT' ? 'yellow' : 'blue'}>
                    {ExceptionTypeNames[selectedException.type]}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="严重程度">
                  <Tag color={SeverityColors[selectedException.severity]}>
                    {SeverityNames[selectedException.severity]}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={selectedException.status === 'REPORTED' ? 'orange' : selectedException.status === 'PROCESSING' ? 'blue' : 'green'}>
                    {ExceptionStatusNames[selectedException.status]}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="上报人">{selectedException.reportedBy}</Descriptions.Item>
                <Descriptions.Item label="上报时间">
                  {dayjs(selectedException.reportedAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                {selectedException.handledBy && (
                  <Descriptions.Item label="处理人">{selectedException.handledBy}</Descriptions.Item>
                )}
                {selectedException.handledAt && (
                  <Descriptions.Item label="处理时间">
                    {dayjs(selectedException.handledAt).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            <Card title="标题" size="small" style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 16 }}>{selectedException.title}</Text>
            </Card>

            <Card title="详细描述" size="small" style={{ marginBottom: 16 }}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{selectedException.description}</p>
            </Card>

            {selectedException.resolution && (
              <Card title="处理方案" size="small" style={{ marginBottom: 16 }}>
                <Alert
                  message="已处理"
                  description={selectedException.resolution}
                  type="success"
                  showIcon
                />
              </Card>
            )}

            {relatedOrders.length > 0 && (
              <Card title="关联订单" size="small">
                <Table
                  rowKey="orderId"
                  columns={[
                    { title: '订单编号', dataIndex: 'orderNo', key: 'orderNo' },
                    { title: '客户', dataIndex: 'customerName', key: 'customerName' },
                    { title: '订单金额', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => `¥${v.toLocaleString()}` }
                  ]}
                  dataSource={relatedOrders}
                  pagination={false}
                  size="small"
                />
              </Card>
            )}

            {(currentRole === 'MANAGER' || currentRole === 'QUALITY') && 
             (selectedException.status === 'REPORTED' || selectedException.status === 'PROCESSING') && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => handleResolve(selectedException)}
                >
                  处理异常
                </Button>
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal
        title="处理异常"
        open={resolveVisible}
        onCancel={() => {
          setResolveVisible(false);
          resolveForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={resolveForm} layout="vertical" onFinish={handleResolveSubmit}>
          <Form.Item
            label="处理方案"
            name="resolution"
            rules={[{ required: true, message: '请输入处理方案' }]}
          >
            <TextArea rows={5} placeholder="请详细描述处理方案，包括采取的措施、责任人、预计完成时间等" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setResolveVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认处理</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExceptionPage;