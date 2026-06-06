import React, { useState, useEffect } from 'react';
import {
  Button,
  Table,
  Space,
  Tag,
  message,
  Statistic,
  Row,
  Col,
  Card,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker
} from 'antd';
import {
  PlusOutlined,
  LockOutlined,
  EyeOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  ShoppingOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import {
  InventoryLockOrder,
  StatusNames,
  StatusColors,
  PriorityNames,
  PriorityColors,
  OrderFilterParams,
  RoleNames
} from '../types';
import { orderApi } from '../api';
import { useAppStore } from '../store';
import OrderFilter from '../components/OrderFilter';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const AssistantPage: React.FC = () => {
  const { currentUser } = useAppStore();
  const [orders, setOrders] = useState<InventoryLockOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<OrderFilterParams>({});
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();

  const quickFilters = [
    {
      label: '待锁定',
      value: { status: 'PENDING_LOCK' } as OrderFilterParams,
      type: 'processing' as const
    },
    {
      label: '被驳回',
      value: { status: 'REVIEW_REJECTED' } as OrderFilterParams,
      type: 'danger' as const
    },
    {
      label: '已退回',
      value: { status: 'RETURNED' } as OrderFilterParams,
      type: 'warning' as const
    },
    {
      label: '24小时内开播',
      value: {
        liveTimeFrom: new Date().toISOString(),
        liveTimeTo: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      } as OrderFilterParams,
      type: 'primary' as const
    }
  ];

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderApi.getAll('ASSISTANT', filters);
      setOrders(data);
    } catch (error) {
      message.error('加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const handleCreateOrder = async (values: any) => {
    try {
      await orderApi.create({
        ...values,
        createdBy: currentUser,
        liveSessionId: 'LS-' + Date.now(),
        expectedLiveTime: values.expectedLiveTime ? values.expectedLiveTime.toISOString() : undefined,
        skuList: [
          {
            skuId: 'SKU-' + Date.now(),
            skuName: values.skuName,
            originalPrice: values.originalPrice,
            livePrice: values.livePrice,
            stockAvailable: values.stockAvailable,
            unit: '件'
          }
        ]
      });
      message.success('创建成功');
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchOrders();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
      render: (text: string) => <b>{text}</b>
    },
    {
      title: '直播场次',
      dataIndex: 'liveSessionName',
      key: 'liveSessionName',
      render: (text: string, record: InventoryLockOrder) => (
        <Space direction="vertical" size={0}>
          <span>{text}</span>
          {record.expectedLiveTime && (
            <span style={{ fontSize: 12, color: '#999' }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {dayjs(record.expectedLiveTime).format('MM-DD HH:mm')}
            </span>
          )}
        </Space>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (p: string) => <Tag color={PriorityColors[p as any]}>{PriorityNames[p as any]}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: string) => <Tag color={StatusColors[s as any]}>{StatusNames[s as any]}</Tag>
    },
    {
      title: '当前处理人',
      dataIndex: 'currentHandler',
      key: 'currentHandler',
      width: 120,
      render: (text: string, record: InventoryLockOrder) => (
        <Space>
          <span>{text}</span>
          <span style={{ fontSize: 12, color: '#999' }}>
            ({RoleNames[record.currentHandlerRole]})
          </span>
        </Space>
      )
    },
    {
      title: '锁定金额',
      dataIndex: 'totalLockedAmount',
      key: 'totalLockedAmount',
      width: 120,
      render: (v: number) => `¥${v.toLocaleString()}`
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: InventoryLockOrder) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />}>查看</Button>
          {['PENDING_LOCK', 'REVIEW_REJECTED', 'RETURNED'].includes(record.status) && (
            <Button size="small" type="primary" icon={<LockOutlined />}>
              {record.status === 'PENDING_LOCK' ? '锁定库存' : '重新编辑'}
            </Button>
          )}
        </Space>
      )
    }
  ];

  const pendingCount = orders.filter(o => o.status === 'PENDING_LOCK').length;
  const rejectedCount = orders.filter(o => o.status === 'REVIEW_REJECTED').length;
  const urgentCount = orders.filter(o => ['URGENT', 'EXTREME'].includes(o.priority)).length;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="待锁定"
              value={pendingCount}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="被驳回"
              value={rejectedCount}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="紧急订单"
              value={urgentCount}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <OrderFilter
        filters={filters}
        onChange={setFilters}
        onSearch={fetchOrders}
        onReset={() => setFilters({})}
        quickFilters={quickFilters}
      />

      <Card
        title="库存锁定单列表"
        size="small"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            新建锁定单
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={orders}
          loading={loading}
          size="small"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="新建库存锁定单"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateOrder}
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item label="直播场次名称" name="liveSessionName" rules={[{ required: true }]}>
                <Input placeholder="如：618大促美妆专场" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="预计开播时间" name="expectedLiveTime">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="SKU名称" name="skuName" rules={[{ required: true }]}>
                <Input placeholder="如：精华液50ml" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="日常原价" name="originalPrice" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="直播价" name="livePrice" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} prefix="¥" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="可用库存" name="stockAvailable" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="优先级" name="priority" rules={[{ required: true }]}>
                <Select placeholder="选择优先级">
                  <Option value="NORMAL">普通</Option>
                  <Option value="URGENT">紧急</Option>
                  <Option value="EXTREME">特急</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="价格口径说明" name="priceRemark">
            <TextArea rows={3} placeholder="请填写价格口径说明，避免审核时出现价格争议。如：直播间专属价，比日常低50%，活动仅限直播期间..." />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AssistantPage;
