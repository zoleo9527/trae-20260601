import { api } from '@/api/mockApi';
import { mockUsers } from '@/data/seedData';
import type { AllocationRequest, Location, LockRequest, Order } from '@/types';
import { LOCATION_STATUS_MAP, LOCK_STATUS_MAP, ORDER_STATUS_MAP } from '@/types';
import { CheckCircleOutlined, HistoryOutlined, InboxOutlined, LockOutlined, TruckOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, Col, Descriptions, Form, Input, InputNumber, message, Modal, Row, Select, Space, Table, Tag } from 'antd';
import type { ColumnType } from 'antd/es/table';
import { useEffect, useState } from 'react';

interface OrderDetailProps {
  order: Order | null;
  onRefresh: () => void;
}

export function OrderDetail({ order, onRefresh }: OrderDetailProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<{
    orderId: string;
    orderNo: string;
    operationType: string;
    operatorName: string;
    operatorRole: string;
    description: string;
    createdAt: string;
  }[]>([]);
  const [lockForm] = Form.useForm();
  const [allocateForm] = Form.useForm();

  useEffect(() => {
    if (order) {
      loadLocations();
      loadLogs();
    }
  }, [order]);

  const loadLocations = async () => {
    const data = await api.locations.list(undefined, order?.id);
    setLocations(data);
  };

  const loadLogs = async () => {
    if (!order) return;
    const data = await api.operationLogs.list(order.id);
    setLogs(data);
  };

  const handleLock = async () => {
    if (!order) return;
    const values = lockForm.getFieldsValue();
    const items: { itemId: string; quantity: number }[] = order.items.map(item => ({
      itemId: item.id,
      quantity: (values[`lock_qty_${item.id}`] as number) || item.quantity,
    }));

    const request: LockRequest = {
      orderId: order.id,
      items,
      operatorId: 'u1',
    };
    const idempotencyKey = `lock_${order.id}_${Date.now()}`;
    const result = await api.orders.lock(request, idempotencyKey);

    if (result.success) {
      message.success(result.message);
      setShowLockModal(false);
      lockForm.resetFields();
      onRefresh();
    } else {
      message.error(result.message);
    }
  };

  const handleAllocate = async () => {
    if (!order) return;
    const values = allocateForm.getFieldsValue();
    const items: { itemId: string; locationId: string; quantity: number }[] = [];

    order.items.forEach(orderItem => {
      const locId = values[`loc_${orderItem.id}`] as string;
      const qty = values[`alloc_qty_${orderItem.id}`] as number;
      if (locId && qty) {
        items.push({ itemId: orderItem.id, locationId: locId, quantity: qty });
      }
    });

    const request: AllocationRequest = {
      orderId: order.id,
      items,
      operatorId: 'u1',
    };
    const idempotencyKey = `alloc_${order.id}_${Date.now()}`;
    const result = await api.orders.allocate(request, idempotencyKey);

    if (result.success) {
      message.success(result.message);
      setShowAllocateModal(false);
      allocateForm.resetFields();
      onRefresh();
    } else {
      message.error(result.message);
    }
  };

  const canLock = order && order.status === 'pending';
  const canAllocate = order && (order.status === 'locked' || order.status === 'allocated');

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <InboxOutlined className="text-4xl mb-2" />
          <p>请选择一个订单查看详情</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'orange',
      locked: 'blue',
      allocated: 'purple',
      picked: 'cyan',
      delivered: 'green',
      completed: 'success',
      cancelled: 'red',
    };
    return colors[status] || 'default';
  };

  const getLockStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'default',
      locked: 'success',
      partial: 'warning',
      released: 'default',
    };
    return colors[status] || 'default';
  };

  const itemColumns: ColumnType<typeof order.items[0]>[] = [
    { title: '商品名称', dataIndex: 'productName', key: 'productName' },
    { title: '规格', dataIndex: 'spec', key: 'spec' },
    { title: '单位', dataIndex: 'unit', key: 'unit' },
    { title: '订单数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '已锁货', dataIndex: 'lockedQuantity', key: 'lockedQuantity' },
    { title: '已分配', dataIndex: 'allocatedQuantity', key: 'allocatedQuantity' },
    { title: '已拣货', dataIndex: 'pickedQuantity', key: 'pickedQuantity' },
  ];

  const locationColumns: ColumnType<Location>[] = [
    { title: '库位编码', dataIndex: 'code', key: 'code' },
    { title: '区域', dataIndex: 'zone', key: 'zone' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => (
      <Tag color={s === 'occupied' ? 'blue' : s === 'reserved' ? 'orange' : 'default'}>
        {LOCATION_STATUS_MAP[s as keyof typeof LOCATION_STATUS_MAP]}
      </Tag>
    )},
    { title: '容量', dataIndex: 'capacity', key: 'capacity' },
    { title: '当前库存', dataIndex: 'currentQty', key: 'currentQty' },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt' },
  ];

  const logColumns: ColumnType<typeof logs[0]>[] = [
    { title: '操作类型', dataIndex: 'operationType', key: 'operationType', render: (type: string) => {
      const types: Record<string, string> = {
        lock: '锁货',
        unlock: '解锁',
        allocate: '分配库位',
        deallocate: '取消分配',
        pick: '拣货',
        load: '装车',
        deliver: '送达',
        sign: '签收',
      };
      return types[type] || type;
    }},
    { title: '操作人', dataIndex: 'operatorName', key: 'operatorName', render: (name: string, record: typeof logs[0]) => (
      <span className="flex items-center gap-1">
        <UserOutlined size={14} />
        {name}
        <Tag color={record.operatorRole === 'warehouse_manager' ? 'blue' : record.operatorRole === 'driver' ? 'green' : 'orange'}>
          {record.operatorRole === 'warehouse_manager' ? '仓库主管' : record.operatorRole === 'driver' ? '司机' : '客服'}
        </Tag>
      </span>
    )},
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '时间', dataIndex: 'createdAt', key: 'createdAt' },
  ];

  const getOperatorName = (id?: string) => {
    if (!id) return '-';
    return mockUsers.find(u => u.id === id)?.name || '-';
  };

  const hasRisk = order.lockStatus === 'partial' || !!order.notes;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">{order.orderNo}</h2>
          {hasRisk && (
            <Tag color="orange" icon={<WarningOutlined />}>风险项</Tag>
          )}
        </div>
        <Space>
          <Button type="primary" onClick={() => setShowLogs(true)} icon={<HistoryOutlined />}>
            操作日志
          </Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={16}>
          <Descriptions title="订单信息" bordered column={2}>
            <Descriptions.Item label="客户名称">{order.customerName}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{order.customerPhone}</Descriptions.Item>
            <Descriptions.Item label="订单状态">
              <Tag color={getStatusColor(order.status)}>
                {ORDER_STATUS_MAP[order.status]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="锁货状态">
              <Tag color={getLockStatusColor(order.lockStatus)}>
                {LOCK_STATUS_MAP[order.lockStatus]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="锁货人" span={2}>
              {order.lockedBy ? (
                <span className="flex items-center gap-2">
                  <UserOutlined size={14} />
                  {getOperatorName(order.lockedBy)}
                  <span className="text-gray-400 text-sm">{order.lockedAt}</span>
                </span>
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="库位分配人" span={2}>
              {order.allocatedBy ? (
                <span className="flex items-center gap-2">
                  <UserOutlined size={14} />
                  {getOperatorName(order.allocatedBy)}
                  <span className="text-gray-400 text-sm">{order.allocatedAt}</span>
                </span>
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="司机" span={2}>
              {order.driverId ? (
                <span className="flex items-center gap-2">
                  <TruckOutlined size={14} />
                  {getOperatorName(order.driverId)}
                </span>
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>
              {order.notes || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Col>
        <Col span={8}>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <CheckCircleOutlined className="text-green-500" />
              操作区域
            </h3>
            <Space direction="vertical" className="w-full">
              <Button type="primary" disabled={!canLock} icon={<LockOutlined />} block onClick={() => setShowLockModal(true)}>
                订单锁货
              </Button>
              <Button type="primary" disabled={!canAllocate} icon={<InboxOutlined />} block onClick={() => setShowAllocateModal(true)}>
                库位分配
              </Button>
              <Button icon={<TruckOutlined />} block>
                创建送货回单
              </Button>
            </Space>
          </div>
        </Col>
      </Row>

      <div>
        <h3 className="font-bold mb-2">商品明细</h3>
        <Table dataSource={order.items} columns={itemColumns} rowKey="id" pagination={false} />
      </div>

      <div>
        <h3 className="font-bold mb-2">库位分配记录</h3>
        {locations.length > 0 ? (
          <Table dataSource={locations} columns={locationColumns} rowKey="id" pagination={false} />
        ) : (
          <div className="text-center py-8 text-gray-400">
            暂无库位分配记录
          </div>
        )}
      </div>

      <Modal title="订单锁货" open={showLockModal} onCancel={() => setShowLockModal(false)} footer={null}>
        <Form form={lockForm} layout="vertical" onFinish={handleLock}>
          {order.items.map(item => (
            <Form.Item key={item.id} label={`${item.productName} (${item.spec}) - 订单量: ${item.quantity}${item.unit}`}>
              <InputNumber min={0} max={item.quantity} defaultValue={item.quantity} name={`lock_qty_${item.id}`} />
            </Form.Item>
          ))}
          <Form.Item>
            <Input.TextArea rows={3} placeholder="备注（可选）" />
          </Form.Item>
          <Form.Item className="flex justify-end">
            <Space>
              <Button onClick={() => setShowLockModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认锁货</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="库位分配" open={showAllocateModal} onCancel={() => setShowAllocateModal(false)} footer={null} width={800}>
        <Form form={allocateForm} layout="vertical" onFinish={handleAllocate}>
          {order.items.filter(item => item.lockedQuantity > item.allocatedQuantity).map(item => (
            <div key={item.id} className="border-b pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
              <h4 className="font-bold mb-2">{item.productName} - 待分配: {item.lockedQuantity - item.allocatedQuantity}{item.unit}</h4>
              <Form.Item label="选择库位" name={`loc_${item.id}`}>
                <Select>
                  <Select.Option value="">请选择库位</Select.Option>
                  {locations.filter(l => l.status === 'empty' || l.status === 'reserved').map(loc => (
                    <Select.Option key={loc.id} value={loc.id}>
                      {loc.code} ({loc.capacity - loc.currentQty}{item.unit}可用)
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="分配数量" name={`alloc_qty_${item.id}`}>
                <InputNumber min={0} max={item.lockedQuantity - item.allocatedQuantity} defaultValue={item.lockedQuantity - item.allocatedQuantity} />
              </Form.Item>
            </div>
          ))}
          <Form.Item className="flex justify-end">
            <Space>
              <Button onClick={() => setShowAllocateModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认分配</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="操作日志" open={showLogs} onCancel={() => setShowLogs(false)} width={800}>
        <Table dataSource={logs} columns={logColumns} rowKey="id" pagination={false} />
      </Modal>
    </div>
  );
}