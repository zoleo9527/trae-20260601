import { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, Form, Space, message, Input, Select } from 'antd';
import type { ColumnType } from 'antd/es/table';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { DeliveryNote, Order } from '@/types';
import { DELIVERY_STATUS_MAP } from '@/types';
import { api } from '@/api/mockApi';
import { mockUsers } from '@/data/seedData';

export function DeliveryNotes() {
  const [notes, setNotes] = useState<DeliveryNote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [notesData, ordersData] = await Promise.all([
        api.deliveryNotes.list(),
        api.orders.list(),
      ]);
      setNotes(notesData);
      setOrders(ordersData.filter(o => o.status === 'picked'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const values = form.getFieldsValue();
    const order = orders.find(o => o.id === values.orderId);
    const driver = mockUsers.find(u => u.id === values.driverId);
    
    if (!order || !driver) {
      message.error('订单或司机信息无效');
      return;
    }

    const result = await api.deliveryNotes.create({
      orderId: order.id,
      orderNo: order.orderNo,
      driverId: driver.id,
      driverName: driver.name,
      licensePlate: values.licensePlate,
    });
    
    if (result) {
      message.success('送货回单创建成功');
      setShowModal(false);
      form.resetFields();
      loadData();
    }
  };

  const handleLoad = async (id: string) => {
    try {
      const result = await api.deliveryNotes.load(id);
      if (result.success) {
        message.success('装车完成');
        loadData();
      }
    } catch (error) {
      message.error('装车失败');
    }
  };

  const handleDeliver = async (id: string) => {
    try {
      const result = await api.deliveryNotes.deliver(id);
      if (result.success) {
        message.success('送达成功');
        loadData();
      }
    } catch (error) {
      message.error('送达失败');
    }
  };

  const handleSign = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const signForm = Form.useForm()[0];
    
    Modal.info({
      title: '确认签收',
      content: (
        <Form form={signForm} layout="vertical">
          <Form.Item name="signerName" label="签收人姓名" rules={[{ required: true, message: '请输入签收人姓名' }]}>
            <Input placeholder="请输入签收人姓名" />
          </Form.Item>
          <Form.Item name="signerPhone" label="签收人电话">
            <Input placeholder="请输入签收人电话" />
          </Form.Item>
        </Form>
      ),
      okText: '确认签收',
      cancelText: '取消',
      onOk: async () => {
        try {
          const values = await signForm.validateFields();
          const result = await api.deliveryNotes.sign(id, values.signerName, values.signerPhone);
          if (result.success) {
            message.success('签收成功');
            loadData();
          }
        } catch (error) {
          message.error('签收失败');
        }
      },
    });
  };

  const filteredNotes = notes.filter(note => 
    note.orderNo.toLowerCase().includes(searchText.toLowerCase()) ||
    (note.driverName || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (note.licensePlate || '').toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: ColumnType<DeliveryNote>[] = [
    { title: '回单号', dataIndex: 'noteNo', key: 'noteNo', width: 150 },
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 150 },
    { title: '司机', dataIndex: 'driverName', key: 'driverName', width: 100 },
    { title: '车牌号', dataIndex: 'licensePlate', key: 'licensePlate', width: 100 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => (
      <Tag color={s === 'pending' ? 'orange' : s === 'loaded' ? 'blue' : s === 'in_transit' ? 'purple' : s === 'delivered' ? 'green' : 'success'}>
        {DELIVERY_STATUS_MAP[s as keyof typeof DELIVERY_STATUS_MAP]}
      </Tag>
    )},
    { title: '装车时间', dataIndex: 'loadedAt', key: 'loadedAt', width: 150, render: (t?: string) => t || '-' },
    { title: '送达时间', dataIndex: 'deliveredAt', key: 'deliveredAt', width: 150, render: (t?: string) => t || '-' },
    { title: '签收时间', dataIndex: 'signedAt', key: 'signedAt', width: 150, render: (t?: string) => t || '-' },
    { title: '签收人', key: 'signer', width: 150, render: (_, record: DeliveryNote) => {
      if (record.signerName) {
        return `${record.signerName} ${record.signerPhone || ''}`;
      }
      return '-';
    }},
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 150 },
    { title: '操作', key: 'action', width: 200, render: (_: unknown, record: DeliveryNote) => {
      const actions = [];
      if (record.status === 'pending') {
        actions.push(<Button key="load" type="primary" size="small" onClick={() => handleLoad(record.id)}>装车完成</Button>);
      }
      if (record.status === 'loaded') {
        actions.push(<Button key="deliver" type="primary" size="small" onClick={() => handleDeliver(record.id)}>确认送达</Button>);
      }
      if (record.status === 'delivered') {
        actions.push(<Button key="sign" type="primary" size="small" onClick={() => handleSign(record.id)}>确认签收</Button>);
      }
      return <Space>{actions}</Space>;
    }},
  ];

  const drivers = mockUsers.filter(u => u.role === 'driver');

  const stats = {
    pending: notes.filter(n => n.status === 'pending').length,
    loaded: notes.filter(n => n.status === 'loaded').length,
    inTransit: notes.filter(n => n.status === 'in_transit').length,
    delivered: notes.filter(n => n.status === 'delivered').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">送货回单</h2>
          <Space>
            <Tag color="orange">待装车: {stats.pending}</Tag>
            <Tag color="blue">已装车: {stats.loaded}</Tag>
            <Tag color="purple">运输中: {stats.inTransit}</Tag>
            <Tag color="green">已送达: {stats.delivered}</Tag>
          </Space>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="搜索订单号/司机/车牌号" 
              className="pl-10 w-64"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowModal(true)}>
            新增回单
          </Button>
        </div>
      </div>

      <Table
        loading={loading}
        dataSource={filteredNotes}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 15 }}
        scroll={{ x: 1400 }}
      />

      <Modal title="新增送货回单" open={showModal} onCancel={() => setShowModal(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="选择订单" name="orderId" rules={[{ required: true, message: '请选择订单' }]}>
            <Select>
              <Select.Option value="">请选择订单</Select.Option>
              {orders.map(order => (
                <Select.Option key={order.id} value={order.id}>
                  {order.orderNo} - {order.customerName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="选择司机" name="driverId" rules={[{ required: true, message: '请选择司机' }]}>
            <Select>
              <Select.Option value="">请选择司机</Select.Option>
              {drivers.map(driver => (
                <Select.Option key={driver.id} value={driver.id}>
                  {driver.name} ({driver.phone})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="车牌号" name="licensePlate">
            <Input placeholder="请输入车牌号" />
          </Form.Item>
          <Form.Item className="flex justify-end">
            <Space>
              <Button onClick={() => setShowModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
