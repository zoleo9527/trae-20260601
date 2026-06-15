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
      setOrders(ordersData.filter(o => o.status === 'allocated'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const values = form.getFieldsValue();
    const result = await api.deliveryNotes.create(values.orderId, values.driverId);
    if (result) {
      message.success('送货回单创建成功');
      setShowModal(false);
      form.resetFields();
      loadData();
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const result = await api.deliveryNotes.updateStatus(id, status);
    if (result) {
      message.success('状态更新成功');
      loadData();
    }
  };

  const filteredNotes = notes.filter(note => 
    note.orderNo.toLowerCase().includes(searchText.toLowerCase()) ||
    note.driverName.toLowerCase().includes(searchText.toLowerCase()) ||
    note.vehicleNo.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: ColumnType<DeliveryNote>[] = [
    { title: '回单号', dataIndex: 'id', key: 'id', width: 120 },
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 150 },
    { title: '司机', dataIndex: 'driverName', key: 'driverName', width: 100 },
    { title: '车牌号', dataIndex: 'vehicleNo', key: 'vehicleNo', width: 100 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => (
      <Tag color={s === 'pending' ? 'orange' : s === 'loaded' ? 'blue' : s === 'in_transit' ? 'purple' : s === 'delivered' ? 'green' : 'success'}>
        {DELIVERY_STATUS_MAP[s as keyof typeof DELIVERY_STATUS_MAP]}
      </Tag>
    )},
    { title: '装车时间', dataIndex: 'loadedAt', key: 'loadedAt', width: 150, render: (t?: string) => t || '-' },
    { title: '出发时间', dataIndex: 'departedAt', key: 'departedAt', width: 150, render: (t?: string) => t || '-' },
    { title: '送达时间', dataIndex: 'deliveredAt', key: 'deliveredAt', width: 150, render: (t?: string) => t || '-' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 150 },
    { title: '操作', key: 'action', width: 200, render: (_: unknown, record: DeliveryNote) => {
      const actions = [];
      if (record.status === 'pending') {
        actions.push(<Button key="load" type="primary" size="small" onClick={() => handleUpdateStatus(record.id, 'loaded')}>装车完成</Button>);
      }
      if (record.status === 'loaded') {
        actions.push(<Button key="depart" type="primary" size="small" onClick={() => handleUpdateStatus(record.id, 'in_transit')}>确认出发</Button>);
      }
      if (record.status === 'in_transit') {
        actions.push(<Button key="deliver" type="primary" size="small" onClick={() => handleUpdateStatus(record.id, 'delivered')}>确认送达</Button>);
      }
      if (record.status === 'delivered') {
        actions.push(<Button key="sign" type="primary" size="small" onClick={() => handleUpdateStatus(record.id, 'signed')}>确认签收</Button>);
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
        scroll={{ x: 1200 }}
      />

      <Modal title="新增送货回单" open={showModal} onCancel={() => setShowModal(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="选择订单" name="orderId" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="">请选择订单</Select.Option>
              {orders.map(order => (
                <Select.Option key={order.id} value={order.id}>
                  {order.orderNo} - {order.customerName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="选择司机" name="driverId" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="">请选择司机</Select.Option>
              {drivers.map(driver => (
                <Select.Option key={driver.id} value={driver.id}>
                  {driver.name} ({driver.phone})
                </Select.Option>
              ))}
            </Select>
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