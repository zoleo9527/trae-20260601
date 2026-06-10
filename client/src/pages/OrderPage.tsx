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
  InputNumber,
  Select,
  message,
  Typography,
  Row,
  Col,
  Descriptions,
  Steps
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  ReloadOutlined,
  CheckOutlined,
  PackageOutlined,
  TruckOutlined
} from '@ant-design/icons';
import {
  CustomerOrder,
  OrderStatusNames,
  OrderStatusColors,
  Formula,
  Customer
} from '../types';
import { orderApi, customerApi, formulaApi, statsApi } from '../api';
import { useAppStore } from '../store';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface OrderFormItem {
  formulaId: string;
  formulaName: string;
  quantity: number;
  unit: string;
}

const OrderPage: React.FC = () => {
  const { currentRole, currentUser } = useAppStore();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, readyOrders: 0, loadedOrders: 0, deliveredOrders: 0 });
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [orderItems, setOrderItems] = useState<OrderFormItem[]>([
    { formulaId: '', formulaName: '', quantity: 0, unit: 'kg' }
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersData, statsData, customersData, formulasData] = await Promise.all([
        orderApi.getAll(),
        statsApi.getSummary(),
        customerApi.getAll(),
        formulaApi.getAll()
      ]);
      setOrders(ordersData);
      setStats(statsData);
      setCustomers(customersData);
      setFormulas(formulasData);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      const validItems = orderItems.filter(item => item.formulaId && item.quantity > 0);
      if (validItems.length === 0) {
        message.error('请至少添加一个有效商品');
        return;
      }

      const customer = customers.find(c => c.customerId === values.customerId);

      await orderApi.create({
        customerId: values.customerId,
        items: validItems.map(item => ({
          formulaId: item.formulaId,
          quantity: item.quantity,
          unit: item.unit
        })),
        deliveryAddress: values.deliveryAddress || customer?.address || '',
        createdBy: currentUser,
        remarks: values.remarks
      });

      message.success('订单创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      setOrderItems([{ formulaId: '', formulaName: '', quantity: 0, unit: 'kg' }]);
      fetchData();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleConfirm = async (order: CustomerOrder) => {
    try {
      await orderApi.confirm(order.orderId, { confirmedBy: currentUser });
      message.success('订单已确认');
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleReady = async (order: CustomerOrder) => {
    try {
      await orderApi.ready(order.orderId, { operator: currentUser });
      message.success('订单已准备就绪');
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleViewDetail = (order: CustomerOrder) => {
    setSelectedOrder(order);
    setDetailVisible(true);
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { formulaId: '', formulaName: '', quantity: 0, unit: 'kg' }]);
  };

  const removeOrderItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const updateOrderItem = (index: number, field: keyof OrderFormItem, value: any) => {
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'formulaId') {
      const formula = formulas.find(f => f.formulaId === value);
      newItems[index].formulaName = formula?.formulaName || '';
    }
    setOrderItems(newItems);
  };

  const steps = [
    { title: '创建订单', icon: <PlusOutlined /> },
    { title: '订单确认', icon: <CheckOutlined /> },
    { title: '生产备货', icon: <PackageOutlined /> },
    { title: '装车复核', icon: <TruckOutlined /> },
    { title: '发货', icon: <CheckOutlined /> }
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING': return 0;
      case 'CONFIRMED': return 1;
      case 'PRODUCING': return 2;
      case 'READY': return 2;
      case 'LOADING': return 3;
      case 'LOADED': return 4;
      case 'DELIVERED': return 4;
      default: return 0;
    }
  };

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 150,
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      ellipsis: true,
    },
    {
      title: '商品种类',
      key: 'itemCount',
      width: 100,
      render: (_: any, record: CustomerOrder) => record.items.length
    },
    {
      title: '订单金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (val: number) => `¥${val.toLocaleString()}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: any) => (
        <Tag color={OrderStatusColors[status]}>{OrderStatusNames[status]}</Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (time: string) => dayjs(time).format('MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: CustomerOrder) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'PENDING' && currentRole === 'MANAGER' && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleConfirm(record)}
            >
              确认订单
            </Button>
          )}
          {record.status === 'CONFIRMED' && currentRole === 'WAREHOUSE' && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleReady(record)}
            >
              准备就绪
            </Button>
          )}
        </Space>
      )
    }
  ];

  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const readyOrders = orders.filter(o => ['READY', 'CONFIRMED', 'PRODUCING'].includes(o.status));
  const loadedOrders = orders.filter(o => ['LOADED', 'DELIVERED'].includes(o.status));

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>客户订货管理</Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
            {(currentRole === 'WAREHOUSE' || currentRole === 'MANAGER') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
              >
                新建订单
              </Button>
            )}
          </Space>
        </Space>
      </Card>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                {stats.totalOrders}
              </div>
              <div style={{ color: '#666', marginTop: 4 }}>全部订单</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                {stats.pendingOrders}
              </div>
              <div style={{ color: '#666', marginTop: 4 }}>待确认</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#10b981' }}>
                {stats.readyOrders}
              </div>
              <div style={{ color: '#666', marginTop: 4 }}>待装车</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {stats.loadedOrders}
              </div>
              <div style={{ color: '#666', marginTop: 4 }}>已装车</div>
            </div>
          </Card>
        </Col>
      </Row>

      {pendingOrders.length > 0 && (
        <Card
          title={
            <Space>
              <span>待确认订单</span>
              <Tag color="orange">{pendingOrders.length}</Tag>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Table
            rowKey="orderId"
            columns={columns}
            dataSource={pendingOrders}
            loading={loading}
            pagination={false}
            scroll={{ x: 1200 }}
            locale={{ emptyText: '暂无待确认订单' }}
          />
        </Card>
      )}

      <Card
        title={
          <Space>
            <PackageOutlined style={{ color: '#1890ff' }} />
            <span>待处理订单</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          rowKey="orderId"
          columns={columns}
          dataSource={readyOrders}
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
          locale={{ emptyText: '暂无待处理订单' }}
        />
      </Card>

      <Card title="已完成订单">
        <Table
          rowKey="orderId"
          columns={columns}
          dataSource={loadedOrders}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
          locale={{ emptyText: '暂无已完成订单' }}
        />
      </Card>

      <Modal
        title="新建客户订单"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
          setOrderItems([{ formulaId: '', formulaName: '', quantity: 0, unit: 'kg' }]);
        }}
        footer={null}
        width={900}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="客户"
                name="customerId"
                rules={[{ required: true, message: '请选择客户' }]}
              >
                <Select placeholder="请选择客户">
                  {customers.map(customer => (
                    <Option key={customer.customerId} value={customer.customerId}>
                      {customer.customerName} ({customer.contact})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="收货地址"
                name="deliveryAddress"
              >
                <Input placeholder="默认使用客户地址" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="商品明细">
            <div style={{ border: '1px solid #f0f0f0', padding: 16, borderRadius: 8 }}>
              {orderItems.map((item, index) => (
                <Row key={index} gutter={8} style={{ marginBottom: 8 }} align="middle">
                  <Col span={6}>
                    <Select
                      value={item.formulaId}
                      onChange={(v) => updateOrderItem(index, 'formulaId', v)}
                      placeholder="选择配方"
                      style={{ width: '100%' }}
                    >
                      {formulas.map(formula => (
                        <Option key={formula.formulaId} value={formula.formulaId}>
                          {formula.formulaName}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={4}>
                    <InputNumber
                      placeholder="数量"
                      style={{ width: '100%' }}
                      min={0}
                      value={item.quantity}
                      onChange={(v) => updateOrderItem(index, 'quantity', v)}
                    />
                  </Col>
                  <Col span={3}>
                    <Select
                      value={item.unit}
                      onChange={(v) => updateOrderItem(index, 'unit', v)}
                      style={{ width: '100%' }}
                    >
                      <Option value="kg">kg</Option>
                      <Option value="吨">吨</Option>
                    </Select>
                  </Col>
                  <Col span={2}>
                    <Button
                      type="text"
                      danger
                      onClick={() => removeOrderItem(index)}
                      disabled={orderItems.length === 1}
                    >
                      删除
                    </Button>
                  </Col>
                </Row>
              ))}
              <Button type="dashed" block onClick={addOrderItem} icon={<PlusOutlined />}>
                添加商品
              </Button>
            </div>
          </Form.Item>

          <Form.Item
            label="备注"
            name="remarks"
          >
            <TextArea rows={2} placeholder="如有特殊要求请备注" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建订单</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`订单详情 - ${selectedOrder?.orderNo}`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={900}
      >
        {selectedOrder && (
          <>
            <Steps
              current={getStepIndex(selectedOrder.status)}
              items={steps}
              style={{ marginBottom: 24 }}
            />

            <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="客户">{selectedOrder.customerName}</Descriptions.Item>
                <Descriptions.Item label="订单状态">
                  <Tag color={OrderStatusColors[selectedOrder.status]}>
                    {OrderStatusNames[selectedOrder.status]}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="订单金额">¥{selectedOrder.totalAmount.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="创建人">{selectedOrder.createdBy}</Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {dayjs(selectedOrder.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="收货地址">{selectedOrder.deliveryAddress}</Descriptions.Item>
                {selectedOrder.confirmedAt && (
                  <Descriptions.Item label="确认时间">
                    {dayjs(selectedOrder.confirmedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                )}
                {selectedOrder.confirmedBy && (
                  <Descriptions.Item label="确认人">{selectedOrder.confirmedBy}</Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {selectedOrder.remarks && (
              <Card title="备注" size="small" style={{ marginBottom: 16 }}>
                <Text type="secondary">{selectedOrder.remarks}</Text>
              </Card>
            )}

            <Card title="商品明细" size="small">
              <Table
                rowKey="itemId"
                columns={[
                  { title: '配方名称', dataIndex: 'formulaName', key: 'formulaName' },
                  { title: '数量', key: 'quantity', render: (_, record: any) => `${record.quantity} ${record.unit}` },
                  { title: '单价', dataIndex: 'price', key: 'price', render: (v: number) => `¥${v}` },
                  { title: '小计', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => `¥${v.toLocaleString()}` },
                ]}
                dataSource={selectedOrder.items}
                pagination={false}
                size="small"
              />
            </Card>
          </>
        )}
      </Modal>
    </div>
  );
};

export default OrderPage;