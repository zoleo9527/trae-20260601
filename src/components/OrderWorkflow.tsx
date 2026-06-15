import { useState, useEffect } from 'react';
import { Card, Row, Col, Steps, Tag, Button, Modal, Form, Input, InputNumber, Select, message, Table, Timeline, Badge, Space } from 'antd';
import type { ColumnType } from 'antd/es/table';
import { LockOutlined, InboxOutlined, TruckOutlined, CheckCircleOutlined, WarningOutlined, UserOutlined, ClockCircleOutlined, ArrowRightOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { api } from '@/api/mockApi';
import { mockUsers } from '@/data/seedData';
import type { Order, Location, OperationLog } from '@/types';
import { ORDER_STATUS_MAP, ORDER_STATUS_COLORS, LOCK_STATUS_MAP, LOCK_STATUS_COLORS, ROLE_MAP, OPERATION_TYPE_MAP } from '@/types';

const { Step } = Steps;

const WORKFLOW_STEPS = [
  { key: 'pending', title: '待处理', icon: ClockCircleOutlined },
  { key: 'locked', title: '已锁货', icon: LockOutlined },
  { key: 'allocated', title: '已分配库位', icon: InboxOutlined },
  { key: 'picked', title: '已拣货', icon: InboxOutlined },
  { key: 'loaded', title: '已装车', icon: TruckOutlined },
  { key: 'in_transit', title: '运输中', icon: TruckOutlined },
  { key: 'delivered', title: '已送达', icon: CheckCircleOutlined },
  { key: 'signed', title: '已签收', icon: CheckCircleOutlined },
  { key: 'completed', title: '已完成', icon: CheckCircleOutlined },
];

const ROLE_TASKS: Record<string, { task: string; statuses: string[]; color: string }> = {
  warehouse_manager: { task: '仓库主管', statuses: ['pending', 'locked', 'allocated', 'picked'], color: 'blue' },
  driver: { task: '司机', statuses: ['picked', 'loaded', 'in_transit', 'delivered'], color: 'green' },
  customer_service: { task: '客服', statuses: ['delivered', 'signed', 'completed'], color: 'orange' },
};

export function OrderWorkflow() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [currentRole, setCurrentRole] = useState('warehouse_manager');
  const [showLockModal, setShowLockModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showPickModal, setShowPickModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [lockForm] = Form.useForm();
  const [allocateForm] = Form.useForm();
  const [loadForm] = Form.useForm();
  const [signForm] = Form.useForm();

  useEffect(() => {
    loadOrders();
  }, [currentRole]);

  useEffect(() => {
    if (selectedOrder) {
      loadLogs();
      loadOrderLocations();
    }
  }, [selectedOrder]);

  useEffect(() => {
    if (showAllocateModal && selectedOrder) {
      loadAvailableLocations();
    }
  }, [showAllocateModal, selectedOrder]);

  const loadOrders = async () => {
    try {
      const data = await api.orders.list();
      setOrders(data);
    } catch (error) {
      message.error('加载订单失败');
    }
  };

  const loadAvailableLocations = async () => {
    try {
      const data = await api.locations.available();
      setAvailableLocations(data);
    } catch (error) {
      message.error('加载可用库位失败');
    }
  };

  const loadOrderLocations = async () => {
    if (!selectedOrder) return;
    try {
      const allLocations = await api.locations.list();
      const orderLocations = allLocations.filter(loc => loc.orderId === selectedOrder.id);
      setLocations(orderLocations);
    } catch (error) {
      message.error('加载库位分配记录失败');
    }
  };

  const loadLogs = async () => {
    if (!selectedOrder) return;
    try {
      const data = await api.logs.list(selectedOrder.id);
      setLogs(data);
    } catch (error) {
      message.error('加载操作日志失败');
    }
  };

  const handleLock = async () => {
    if (!selectedOrder) return;
    const values = lockForm.getFieldsValue();
    const items = selectedOrder.items.map(item => ({
      id: item.id,
      lockedQuantity: (values[`lock_qty_${item.id}`] as number) || item.quantity,
    }));

    try {
      const result = await api.orders.lock(selectedOrder.id, items);
      if (result.success) {
        message.success('锁货成功');
        setShowLockModal(false);
        lockForm.resetFields();
        loadOrders();
        const updatedOrder = await api.orders.get(selectedOrder.id);
        setSelectedOrder(updatedOrder);
      } else {
        message.error(result.message || '锁货失败');
      }
    } catch (error) {
      message.error('锁货失败');
    }
  };

  const handleAllocate = async () => {
    if (!selectedOrder) return;
    const values = allocateForm.getFieldsValue();
    const allocations: Array<{ itemId: string; locationId: string; quantity: number }> = [];

    selectedOrder.items.filter(item => item.lockedQuantity > item.allocatedQuantity).forEach(orderItem => {
      const locId = values[`loc_${orderItem.id}`] as string;
      const qty = values[`alloc_qty_${orderItem.id}`] as number;
      if (locId && qty) {
        allocations.push({ itemId: orderItem.id, locationId: locId, quantity: qty });
      }
    });

    if (allocations.length === 0) {
      message.warning('请至少选择一个库位进行分配');
      return;
    }

    try {
      const result = await api.orders.allocate(selectedOrder.id, allocations);
      if (result.success) {
        message.success('库位分配成功');
        setShowAllocateModal(false);
        allocateForm.resetFields();
        loadOrders();
        const updatedOrder = await api.orders.get(selectedOrder.id);
        setSelectedOrder(updatedOrder);
      } else {
        message.error(result.message || '库位分配失败');
      }
    } catch (error) {
      message.error('库位分配失败');
    }
  };

  const handlePick = async () => {
    if (!selectedOrder) return;
    try {
      const result = await api.orders.pick(selectedOrder.id);
      if (result.success) {
        message.success('拣货成功');
        setShowPickModal(false);
        loadOrders();
        const updatedOrder = await api.orders.get(selectedOrder.id);
        setSelectedOrder(updatedOrder);
      } else {
        message.error(result.message || '拣货失败');
      }
    } catch (error) {
      message.error('拣货失败');
    }
  };

  const handleLoad = async () => {
    if (!selectedOrder) return;
    const values = loadForm.getFieldsValue();
    const driverId = values.driverId as string;
    const licensePlate = values.vehicleNo as string;

    if (!driverId) {
      message.warning('请选择司机');
      return;
    }

    try {
      const driver = mockUsers.find(u => u.id === driverId);
      if (!driver) {
        message.error('司机不存在');
        return;
      }

      const noteResult = await api.deliveryNotes.create({
        orderId: selectedOrder.id,
        orderNo: selectedOrder.orderNo,
        driverId: driver.id,
        driverName: driver.name,
        licensePlate,
      });

      const orderResult = await api.orders.load(selectedOrder.id, licensePlate);
      if (orderResult.success && noteResult) {
        const notes = await api.deliveryNotes.list();
        const note = notes.find(n => n.orderId === selectedOrder.id);
        if (note) {
          await api.deliveryNotes.load(note.id);
        }
        message.success('装车成功，送货回单已生成');
        setShowLoadModal(false);
        loadForm.resetFields();
        loadOrders();
        const updatedOrder = await api.orders.get(selectedOrder.id);
        setSelectedOrder(updatedOrder);
      } else {
        message.error(orderResult.message || '装车失败');
      }
    } catch (error) {
      message.error('装车失败');
    }
  };

  const handleDeliver = async () => {
    if (!selectedOrder) return;
    try {
      const result = await api.orders.deliver(selectedOrder.id);
      if (result.success) {
        const notes = await api.deliveryNotes.list();
        const note = notes.find(n => n.orderId === selectedOrder.id);
        if (note) {
          await api.deliveryNotes.deliver(note.id);
        }
        message.success('送达成功');
        setShowDeliverModal(false);
        loadOrders();
        const updatedOrder = await api.orders.get(selectedOrder.id);
        setSelectedOrder(updatedOrder);
      } else {
        message.error(result.message || '送达失败');
      }
    } catch (error) {
      message.error('送达失败');
    }
  };

  const handleSign = async () => {
    if (!selectedOrder) return;
    const values = signForm.getFieldsValue();
    const signerName = values.signerName as string;
    const signerPhone = values.signerPhone as string;

    if (!signerName) {
      message.warning('请输入签收人姓名');
      return;
    }

    try {
      const result = await api.orders.sign(selectedOrder.id, signerName, signerPhone);
      if (result.success) {
        const notes = await api.deliveryNotes.list();
        const note = notes.find(n => n.orderId === selectedOrder.id);
        if (note) {
          await api.deliveryNotes.sign(note.id, signerName, signerPhone);
        }
        message.success('签收成功');
        setShowSignModal(false);
        signForm.resetFields();
        loadOrders();
        const updatedOrder = await api.orders.get(selectedOrder.id);
        setSelectedOrder(updatedOrder);
      } else {
        message.error(result.message || '签收失败');
      }
    } catch (error) {
      message.error('签收失败');
    }
  };

  const handleComplete = async () => {
    if (!selectedOrder) return;
    try {
      const result = await api.orders.complete(selectedOrder.id);
      if (result.success) {
        message.success('订单完成');
        setShowCompleteModal(false);
        loadOrders();
        const updatedOrder = await api.orders.get(selectedOrder.id);
        setSelectedOrder(updatedOrder);
      } else {
        message.error(result.message || '订单完成失败');
      }
    } catch (error) {
      message.error('订单完成失败');
    }
  };

  const getStepStatus = (order: Order) => {
    const index = WORKFLOW_STEPS.findIndex(s => s.key === order.status);
    return index;
  };

  const orderColumns: ColumnType<Order>[] = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 150 },
    { title: '客户', dataIndex: 'customerName', key: 'customerName', width: 120 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 120, render: (s: string) => (
      <Tag color={ORDER_STATUS_COLORS[s as keyof typeof ORDER_STATUS_COLORS]}>
        {ORDER_STATUS_MAP[s as keyof typeof ORDER_STATUS_MAP]}
      </Tag>
    )},
    { title: '锁货状态', dataIndex: 'lockStatus', key: 'lockStatus', width: 100, render: (s: string) => (
      <Tag color={LOCK_STATUS_COLORS[s as keyof typeof LOCK_STATUS_COLORS]}>
        {LOCK_STATUS_MAP[s as keyof typeof LOCK_STATUS_MAP]}
      </Tag>
    )},
    { title: '风险', dataIndex: 'riskLevel', key: 'riskLevel', width: 80, render: (level: string) => {
      if (!level) return null;
      const colors: Record<string, string> = { high: 'red', medium: 'orange', low: 'yellow' };
      const labels: Record<string, string> = { high: '高', medium: '中', low: '低' };
      return <Badge color={colors[level]} text={labels[level]} />;
    }},
    { title: '锁货人', dataIndex: 'lockedBy', key: 'lockedBy', width: 100, render: (id?: string) => id ? mockUsers.find(u => u.id === id)?.name : '-' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 150 },
    { title: '操作', key: 'actions', width: 120, render: (_, record) => (
      <Space>
        <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedOrder(record)}>查看</Button>
      </Space>
    )},
  ];

  const itemColumns: ColumnType<Order['items'][0]>[] = [
    { title: '商品名称', dataIndex: 'productName', key: 'productName' },
    { title: '规格', dataIndex: 'spec', key: 'spec' },
    { title: '单位', dataIndex: 'unit', key: 'unit' },
    { title: '订单量', dataIndex: 'quantity', key: 'quantity' },
    { title: '已锁货', dataIndex: 'lockedQuantity', key: 'lockedQuantity' },
    { title: '已分配', dataIndex: 'allocatedQuantity', key: 'allocatedQuantity' },
    { title: '已拣货', dataIndex: 'pickedQuantity', key: 'pickedQuantity' },
    { title: '已装车', dataIndex: 'loadedQuantity', key: 'loadedQuantity' },
  ];

  const locationColumns: ColumnType<Location>[] = [
    { title: '库位编码', dataIndex: 'code', key: 'code' },
    { title: '区域', dataIndex: 'zone', key: 'zone' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => (
      <Tag color={s === 'occupied' ? 'blue' : s === 'reserved' ? 'orange' : s === 'locked' ? 'red' : 'default'}>
        {s === 'occupied' ? '占用' : s === 'reserved' ? '预留' : s === 'locked' ? '锁定' : '空'}
      </Tag>
    )},
    { title: '容量', dataIndex: 'capacity', key: 'capacity' },
    { title: '当前库存', dataIndex: 'currentQty', key: 'currentQty' },
    { title: '分配人', dataIndex: 'allocatedBy', key: 'allocatedBy', render: (id?: string) => id ? mockUsers.find(u => u.id === id)?.name : '-' },
    { title: '分配时间', dataIndex: 'allocatedAt', key: 'allocatedAt' },
  ];

  const getCurrentRoleInfo = () => ROLE_TASKS[currentRole];

  const canLock = selectedOrder?.status === 'pending';
  const canAllocate = selectedOrder?.lockStatus === 'locked' || selectedOrder?.lockStatus === 'partial';
  const canPick = selectedOrder?.status === 'allocated';
  const canLoad = selectedOrder?.status === 'picked';
  const canDeliver = selectedOrder?.status === 'in_transit';
  const canSign = selectedOrder?.status === 'delivered';
  const canComplete = selectedOrder?.status === 'signed';

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">订单流程管理</h2>
            <Select
              value={currentRole}
              onChange={setCurrentRole}
              style={{ width: 160 }}
              options={[
                { value: 'warehouse_manager', label: '仓库主管' },
                { value: 'driver', label: '司机' },
                { value: 'customer_service', label: '客服' },
              ]}
            />
          </div>
          <div className="flex items-center gap-2">
            <Tag color={getCurrentRoleInfo().color}>
              {getCurrentRoleInfo().task}视图
            </Tag>
            <span className="text-gray-500">|</span>
            <span className="text-gray-500">待处理: {orders.length} 单</span>
          </div>
        </div>

        <Steps progressDot current={-1} className="mb-6">
          {WORKFLOW_STEPS.map((step) => {
            const Icon = step.icon;
            const isInRoleView = getCurrentRoleInfo().statuses.includes(step.key);
            return (
              <Step
                key={step.key}
                title={step.title}
                icon={isInRoleView ? <Icon /> : null}
                className={isInRoleView ? 'font-semibold' : ''}
              />
            );
          })}
        </Steps>

        <div className="flex items-center gap-4 mb-4">
          <ArrowRightOutlined className="text-gray-400" />
          <span className="text-gray-500 text-sm">
            <UserOutlined className="inline mr-1" />
            仓库主管 → <TruckOutlined className="inline mx-1" /> 司机 → <CheckCircleOutlined className="inline mx-1" /> 客服
          </span>
        </div>
      </Card>

      <Row gutter={16}>
        <Col span={14}>
          <Card title="订单列表">
            <Table
              dataSource={orders}
              columns={orderColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              onRow={(record) => ({
                onClick: () => setSelectedOrder(record),
                className: selectedOrder?.id === record.id ? 'bg-blue-50' : '',
              })}
            />
          </Card>
        </Col>

        <Col span={10}>
          {selectedOrder ? (
            <Card title={`订单详情 - ${selectedOrder.orderNo}`} className="h-[calc(100vh-200px)] overflow-y-auto">
              {selectedOrder.riskLevel && (
                <div className="mb-4 p-3 bg-orange-50 rounded-lg flex items-start gap-2">
                  <WarningOutlined className="text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-orange-800">风险提示</div>
                    <div className="text-sm text-orange-600">{selectedOrder.riskReason}</div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <Steps current={getStepStatus(selectedOrder)}>
                  {WORKFLOW_STEPS.map((step) => {
                    const Icon = step.icon;
                    return (
                      <Step
                        key={step.key}
                        title={step.title}
                        icon={<Icon />}
                      />
                    );
                  })}
                </Steps>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">订单信息</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">客户:</span> {selectedOrder.customerName}</div>
                  <div><span className="text-gray-500">电话:</span> {selectedOrder.customerPhone}</div>
                  <div><span className="text-gray-500">状态:</span> <Tag color={ORDER_STATUS_COLORS[selectedOrder.status]}>{ORDER_STATUS_MAP[selectedOrder.status]}</Tag></div>
                  <div><span className="text-gray-500">锁货:</span> <Tag color={LOCK_STATUS_COLORS[selectedOrder.lockStatus]}>{LOCK_STATUS_MAP[selectedOrder.lockStatus]}</Tag></div>
                  <div><span className="text-gray-500">锁货人:</span> {selectedOrder.lockedBy ? mockUsers.find(u => u.id === selectedOrder.lockedBy)?.name : '-'}</div>
                  <div><span className="text-gray-500">锁货时间:</span> {selectedOrder.lockedAt || '-'}</div>
                  <div><span className="text-gray-500">分配人:</span> {selectedOrder.allocatedBy ? mockUsers.find(u => u.id === selectedOrder.allocatedBy)?.name : '-'}</div>
                  <div><span className="text-gray-500">分配时间:</span> {selectedOrder.allocatedAt || '-'}</div>
                  <div><span className="text-gray-500">拣货人:</span> {selectedOrder.pickedBy ? mockUsers.find(u => u.id === selectedOrder.pickedBy)?.name : '-'}</div>
                  <div><span className="text-gray-500">拣货时间:</span> {selectedOrder.pickedAt || '-'}</div>
                  <div><span className="text-gray-500">司机:</span> {selectedOrder.driverId ? mockUsers.find(u => u.id === selectedOrder.driverId)?.name : '-'}</div>
                  <div><span className="text-gray-500">装车时间:</span> {selectedOrder.loadedAt || '-'}</div>
                </div>
                {selectedOrder.notes && (
                  <div className="mt-2"><span className="text-gray-500">备注:</span> {selectedOrder.notes}</div>
                )}
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">商品明细</h4>
                <Table
                  dataSource={selectedOrder.items}
                  columns={itemColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">库位分配记录</h4>
                {locations.length > 0 ? (
                  <Table
                    dataSource={locations}
                    columns={locationColumns}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                ) : (
                  <div className="text-center py-4 text-gray-400">暂无库位分配记录</div>
                )}
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">操作日志</h4>
                {logs.length > 0 ? (
                  <Timeline>
                    {logs.map(log => (
                      <Timeline.Item key={log.id} color={log.operatorRole === 'warehouse_manager' ? 'blue' : log.operatorRole === 'driver' ? 'green' : 'orange'}>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{OPERATION_TYPE_MAP[log.operationType]}</span>
                          <Tag color={log.operatorRole === 'warehouse_manager' ? 'blue' : log.operatorRole === 'driver' ? 'green' : 'orange'}>
                            {ROLE_MAP[log.operatorRole]}
                          </Tag>
                          <span>{log.operatorName}</span>
                        </div>
                        <div className="text-sm text-gray-500">{log.description}</div>
                        <div className="text-xs text-gray-400">{log.createdAt}</div>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                ) : (
                  <div className="text-center py-4 text-gray-400">暂无操作日志</div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">操作区域</h4>
                <div className="grid grid-cols-2 gap-2">
                  {currentRole === 'warehouse_manager' && (
                    <>
                      <Button type={canLock ? 'primary' : 'default'} disabled={!canLock} icon={<LockOutlined />} onClick={() => setShowLockModal(true)} block>
                        订单锁货
                      </Button>
                      <Button type={canAllocate ? 'primary' : 'default'} disabled={!canAllocate} icon={<EditOutlined />} onClick={() => setShowAllocateModal(true)} block>
                        库位分配
                      </Button>
                      <Button type={canPick ? 'primary' : 'default'} disabled={!canPick} icon={<InboxOutlined />} onClick={() => setShowPickModal(true)} block>
                        拣货确认
                      </Button>
                    </>
                  )}
                  {currentRole === 'driver' && (
                    <>
                      <Button type={canLoad ? 'primary' : 'default'} disabled={!canLoad} icon={<TruckOutlined />} onClick={() => setShowLoadModal(true)} block>
                        装车出发
                      </Button>
                      <Button type={canDeliver ? 'primary' : 'default'} disabled={!canDeliver} icon={<CheckCircleOutlined />} onClick={() => setShowDeliverModal(true)} block>
                        确认送达
                      </Button>
                    </>
                  )}
                  {currentRole === 'customer_service' && (
                    <>
                      <Button type={canSign ? 'primary' : 'default'} disabled={!canSign} icon={<CheckCircleOutlined />} onClick={() => setShowSignModal(true)} block>
                        确认签收
                      </Button>
                      <Button type={canComplete ? 'primary' : 'default'} disabled={!canComplete} icon={<CheckCircleOutlined />} onClick={() => setShowCompleteModal(true)} block>
                        订单完成
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="flex items-center justify-center h-64 text-gray-400">
                <div className="text-center">
                  <InboxOutlined className="text-4xl mb-2" />
                  <p>请选择一个订单查看详情</p>
                </div>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      <Modal title="订单锁货" open={showLockModal} onCancel={() => setShowLockModal(false)} footer={null}>
        <Form form={lockForm} layout="vertical" onFinish={handleLock}>
          {selectedOrder?.items.map(item => (
            <Form.Item key={item.id} label={`${item.productName} (${item.spec}) - 订单量: ${item.quantity}${item.unit}`}>
              <InputNumber min={0} max={item.quantity} defaultValue={item.quantity} name={`lock_qty_${item.id}`} />
            </Form.Item>
          ))}
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
          {selectedOrder?.items.filter(item => item.lockedQuantity > item.allocatedQuantity).map(item => (
            <div key={item.id} className="border-b pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
              <h4 className="font-bold mb-2">{item.productName} - 待分配: {item.lockedQuantity - item.allocatedQuantity}{item.unit}</h4>
              <Form.Item label="选择库位" name={`loc_${item.id}`}>
                <Select>
                  <Select.Option value="">请选择库位</Select.Option>
                  {availableLocations.map(loc => (
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

      <Modal title="拣货确认" open={showPickModal} onCancel={() => setShowPickModal(false)} footer={null}>
        <div className="p-4">
          <p className="mb-4">确认将订单 {selectedOrder?.orderNo} 的所有商品拣货完成？</p>
          <div className="flex justify-end">
            <Space>
              <Button onClick={() => setShowPickModal(false)}>取消</Button>
              <Button type="primary" onClick={handlePick}>确认拣货</Button>
            </Space>
          </div>
        </div>
      </Modal>

      <Modal title="装车出发" open={showLoadModal} onCancel={() => setShowLoadModal(false)} footer={null}>
        <Form form={loadForm} layout="vertical" onFinish={handleLoad}>
          <Form.Item label="选择司机" name="driverId" rules={[{ required: true, message: '请选择司机' }]}>
            <Select>
              <Select.Option value="">请选择司机</Select.Option>
              {mockUsers.filter(u => u.role === 'driver').map(driver => (
                <Select.Option key={driver.id} value={driver.id}>
                  {driver.name} ({driver.phone})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="车牌号" name="vehicleNo">
            <Input placeholder="请输入车牌号" />
          </Form.Item>
          <Form.Item className="flex justify-end">
            <Space>
              <Button onClick={() => setShowLoadModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认装车</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="确认送达" open={showDeliverModal} onCancel={() => setShowDeliverModal(false)} footer={null}>
        <div className="p-4">
          <p className="mb-4">确认将订单 {selectedOrder?.orderNo} 标记为已送达？</p>
          <div className="flex justify-end">
            <Space>
              <Button onClick={() => setShowDeliverModal(false)}>取消</Button>
              <Button type="primary" onClick={handleDeliver}>确认送达</Button>
            </Space>
          </div>
        </div>
      </Modal>

      <Modal title="确认签收" open={showSignModal} onCancel={() => setShowSignModal(false)} footer={null}>
        <Form form={signForm} layout="vertical" onFinish={handleSign}>
          <Form.Item label="签收人姓名" name="signerName" rules={[{ required: true, message: '请输入签收人姓名' }]}>
            <Input placeholder="请输入签收人姓名" />
          </Form.Item>
          <Form.Item label="签收人电话" name="signerPhone">
            <Input placeholder="请输入签收人电话" />
          </Form.Item>
          <Form.Item className="flex justify-end">
            <Space>
              <Button onClick={() => setShowSignModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认签收</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="订单完成" open={showCompleteModal} onCancel={() => setShowCompleteModal(false)} footer={null}>
        <div className="p-4">
          <p className="mb-4">确认订单 {selectedOrder?.orderNo} 已完成所有流程？</p>
          <div className="flex justify-end">
            <Space>
              <Button onClick={() => setShowCompleteModal(false)}>取消</Button>
              <Button type="primary" onClick={handleComplete}>确认完成</Button>
            </Space>
          </div>
        </div>
      </Modal>
    </div>
  );
}
