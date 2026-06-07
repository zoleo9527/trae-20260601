import { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  Modal,
  Tag,
  Space,
  Row,
  Col,
  InputNumber,
  List,
  Empty,
  message,
  Divider,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useStore } from '@/store';
import { OrderItem, AbnormalType, Room, Member } from '@/store/types';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface ReceptionPageProps {
  activeTab: string;
  onTabChange: (key: string) => void;
}

const abnormalTypeOptions: { value: AbnormalType; label: string }[] = [
  { value: 'room_conflict', label: '包厢撞档' },
  { value: 'drink_dispute', label: '酒水赠送纠纷' },
  { value: 'member_mismatch', label: '会员账目不清' },
  { value: 'overcharge', label: '多收费用' },
  { value: 'other', label: '其他异常' },
];

const statusColors: Record<string, string> = {
  pending: 'default',
  consuming: 'processing',
  completed: 'success',
  abnormal: 'error',
  refunding: 'warning',
  refunded: 'success',
  rejected: 'default',
};

const statusLabels: Record<string, string> = {
  pending: '待开单',
  consuming: '消费中',
  completed: '已完成',
  abnormal: '异常',
  refunding: '待退款审核',
  refunded: '已退款',
  rejected: '已拒绝',
};

export default function ReceptionPage({ activeTab, onTabChange }: ReceptionPageProps) {
  const { 
    rooms, 
    members, 
    drinks, 
    orders, 
    currentUser,
    createOrder, 
    completeConsume, 
    reportAbnormal 
  } = useStore();

  const [checkinModalVisible, setCheckinModalVisible] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [abnormalModalVisible, setAbnormalModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [useBalance, setUseBalance] = useState(0);
  const [checkinForm] = Form.useForm();
  const [abnormalForm] = Form.useForm();

  const consumingOrders = orders.filter(o => o.status === 'consuming');
  const abnormalOrders = orders.filter(o => o.status === 'abnormal' || o.status === 'refunding');
  const availableRooms = rooms.filter(r => r.status === 'available');

  const handleCheckin = (values: any) => {
    const room = rooms.find(r => r.id === values.roomId);
    if (!room) return;

    let memberData = {};
    if (values.memberId) {
      const member = members.find(m => m.id === values.memberId);
      if (member) {
        memberData = {
          memberId: member.id,
          memberName: member.name,
          memberPhone: member.phone,
        };
      }
    }

    createOrder({
      roomId: room.id,
      roomName: room.name,
      roomType: room.type,
      checkInTime: values.checkInTime?.format('YYYY-MM-DD HH:mm:ss') || dayjs().format('YYYY-MM-DD HH:mm:ss'),
      durationHours: 0,
      roomFee: 0,
      createdBy: currentUser,
      items: [],
      drinksFee: 0,
      complimentaryFee: 0,
      totalAmount: 0,
      useBalance: 0,
      payAmount: 0,
      ...memberData,
    });

    message.success('开单成功');
    setCheckinModalVisible(false);
    checkinForm.resetFields();
  };

  const openCheckout = (order: any) => {
    setSelectedOrder(order);
    setSelectedItems([]);
    setUseBalance(0);
    setCheckoutModalVisible(true);
  };

  const addItem = (drink: any) => {
    const existing = selectedItems.find(i => i.drinkId === drink.id);
    if (existing) {
      setSelectedItems(selectedItems.map(i =>
        i.drinkId === drink.id
          ? { ...i, quantity: i.quantity + 1, price: (i.quantity + 1) * drink.price }
          : i
      ));
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          drinkId: drink.id,
          drinkName: drink.name,
          quantity: 1,
          price: drink.price,
          isComplimentary: false,
        },
      ]);
    }
  };

  const removeItem = (drinkId: string) => {
    setSelectedItems(selectedItems.filter(i => i.drinkId !== drinkId));
  };

  const toggleComplimentary = (drinkId: string) => {
    setSelectedItems(selectedItems.map(i =>
      i.drinkId === drinkId ? { ...i, isComplimentary: !i.isComplimentary } : i
    ));
  };

  const checkoutSummary = useMemo(() => {
    if (!selectedOrder) return { roomFee: 0, drinksFee: 0, complimentaryFee: 0, total: 0 };

    const checkIn = dayjs(selectedOrder.checkInTime);
    const now = dayjs();
    const durationHours = Math.ceil(now.diff(checkIn, 'minute') / 60);
    const room = rooms.find(r => r.id === selectedOrder.roomId);
    const roomFee = durationHours * (room?.pricePerHour || 0);

    const drinksFee = selectedItems.filter(i => !i.isComplimentary).reduce((sum, i) => sum + i.price, 0);
    const complimentaryFee = selectedItems.filter(i => i.isComplimentary).reduce((sum, i) => sum + i.price, 0);
    const total = roomFee + drinksFee;
    const actualPay = Math.max(0, total - useBalance);

    return {
      durationHours,
      roomFee,
      drinksFee,
      complimentaryFee,
      total,
      actualPay,
    };
  }, [selectedOrder, selectedItems, useBalance, rooms]);

  const handleCheckout = () => {
    if (!selectedOrder) return;

    completeConsume(selectedOrder.id, {
      checkOutTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      items: selectedItems,
      drinksFee: checkoutSummary.drinksFee,
      complimentaryFee: checkoutSummary.complimentaryFee,
      totalAmount: checkoutSummary.total,
      useBalance,
      payAmount: checkoutSummary.actualPay ?? 0,
    });

    message.success('结账成功');
    setCheckoutModalVisible(false);
    setSelectedOrder(null);
    setSelectedItems([]);
  };

  const handleReportAbnormal = (values: any) => {
    if (!selectedOrder) return;

    reportAbnormal(selectedOrder.id, {
      type: values.type,
      description: values.description,
    });

    message.success('异常已上报，处理人员会尽快处理');
    setAbnormalModalVisible(false);
    setSelectedOrder(null);
    abnormalForm.resetFields();
    onTabChange('abnormal');
  };

  const orderColumns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
    { title: '包厢', dataIndex: 'roomName', key: 'roomName' },
    { title: '客人', dataIndex: 'memberName', key: 'memberName', render: (t: string) => t || '散客' },
    { title: '入场时间', dataIndex: 'checkInTime', key: 'checkInTime' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" onClick={() => openCheckout(record)}>
            结账
          </Button>
          <Button 
            type="link" 
            size="small" 
            danger
            icon={<ExclamationCircleOutlined />}
            onClick={() => {
              setSelectedOrder(record);
              setAbnormalModalVisible(true);
            }}
          >
            上报异常
          </Button>
        </Space>
      ),
    },
  ];

  const abnormalColumns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
    { title: '包厢', dataIndex: 'roomName', key: 'roomName' },
    { title: '异常类型', dataIndex: ['abnormalRecord', 'type'], key: 'type',
      render: (t: AbnormalType) => abnormalTypeOptions.find(o => o.value === t)?.label || t
    },
    { title: '上报时间', dataIndex: ['abnormalRecord', 'reportedAt'], key: 'reportedAt' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      )
    },
    {
      title: '处理进度',
      key: 'progress',
      render: (_: any, record: any) => {
        if (record.handledBy) {
          return <span>已由 {record.handledBy} 处理</span>;
        }
        return <Tag color="warning">待处理人员处理</Tag>;
      },
    },
  ];

  const renderCheckin = () => (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>开单入场</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCheckinModalVisible(true)}>
          新开单
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {availableRooms.length === 0 ? (
          <Col span={24}>
            <Empty description="暂无可用包厢" />
          </Col>
        ) : (
          availableRooms.map((room: Room) => (
            <Col span={6} key={room.id}>
              <Card 
                hoverable 
                onClick={() => {
                  checkinForm.setFieldsValue({ roomId: room.id });
                  setCheckinModalVisible(true);
                }}
              >
                <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{room.name}</div>
                  <Tag color="blue">{room.type}</Tag>
                  <div>¥{room.pricePerHour}/小时</div>
                </Space>
              </Card>
            </Col>
          ))
        )}
      </Row>

      <Divider />

      <h3>会员快速查找</h3>
      <Table
        dataSource={members}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 5 }}
        columns={[
          { title: '姓名', dataIndex: 'name', key: 'name' },
          { title: '手机号', dataIndex: 'phone', key: 'phone' },
          { title: '等级', dataIndex: 'level', key: 'level', render: (l: string) => <Tag color="gold">{l}</Tag> },
          { title: '余额', dataIndex: 'balance', key: 'balance', render: (v: number) => `¥${v.toFixed(2)}` },
        ]}
      />
    </div>
  );

  const renderConsumingOrders = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>消费中订单</h2>
        <p>当前共有 {consumingOrders.length} 桌正在消费</p>
      </div>
      <Table
        dataSource={consumingOrders}
        rowKey="id"
        columns={orderColumns}
        locale={{ emptyText: '暂无消费中订单' }}
      />
    </div>
  );

  const renderCheckout = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>结账离场</h2>
        <p>选择需要结账的订单</p>
      </div>
      {consumingOrders.length === 0 ? (
        <Empty description="暂无待结账订单" />
      ) : (
        <Row gutter={[16, 16]}>
          {consumingOrders.map((order) => (
            <Col span={8} key={order.id}>
              <Card 
                hoverable
                onClick={() => openCheckout(order)}
                extra={<Tag color="processing">消费中</Tag>}
              >
                <Card.Meta
                  title={`${order.roomName} (${order.roomType})`}
                  description={
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div>订单号：{order.orderNo}</div>
                      <div>客人：{order.memberName || '散客'}</div>
                      <div>入场：{order.checkInTime}</div>
                      <Button type="primary" block onClick={(e) => { e.stopPropagation(); openCheckout(order); }}>
                        立即结账
                      </Button>
                    </Space>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );

  const renderAbnormal = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>异常上报</h2>
        <p>已上报的异常会由处理人员跟进处理</p>
      </div>
      <Table
        dataSource={abnormalOrders}
        rowKey="id"
        columns={abnormalColumns}
        locale={{ emptyText: '暂无异常记录' }}
        expandable={{
          expandedRowRender: (record) => (
            <Descriptions column={1} size="small">
              <Descriptions.Item label="异常描述">
                {record.abnormalRecord?.description}
              </Descriptions.Item>
              {record.handlerNote && (
                <Descriptions.Item label="处理备注">{record.handlerNote}</Descriptions.Item>
              )}
              {record.refundRecord && (
                <>
                  <Descriptions.Item label="退款金额">¥{record.refundRecord.amount}</Descriptions.Item>
                  <Descriptions.Item label="退款原因">{record.refundRecord.reason}</Descriptions.Item>
                  <Descriptions.Item label="退款状态">
                    <Tag color={record.refundRecord.status === 'pending' ? 'warning' : record.refundRecord.status === 'approved' ? 'success' : 'default'}>
                      {record.refundRecord.status === 'pending' ? '待店长审核' : 
                       record.refundRecord.status === 'approved' ? '已通过' : '已拒绝'}
                    </Tag>
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          ),
        }}
      />
    </div>
  );

  return (
    <div>
      {activeTab === 'checkin' && renderCheckin()}
      {activeTab === 'orders' && renderConsumingOrders()}
      {activeTab === 'checkout' && renderCheckout()}
      {activeTab === 'abnormal' && renderAbnormal()}

      <Modal
        title="新开单"
        open={checkinModalVisible}
        onCancel={() => { setCheckinModalVisible(false); checkinForm.resetFields(); }}
        footer={null}
        width={500}
      >
        <Form form={checkinForm} layout="vertical" onFinish={handleCheckin}>
          <Form.Item name="roomId" label="选择包厢" rules={[{ required: true, message: '请选择包厢' }]}>
            <Select placeholder="请选择包厢">
              {availableRooms.map((r) => (
                <Option key={r.id} value={r.id}>
                  {r.name} ({r.type}) - ¥{r.pricePerHour}/小时
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="memberId" label="会员（可选）">
            <Select placeholder="输入手机号或姓名搜索" showSearch filterOption={(input, option) => {
              const member = members.find(m => m.id === option?.value);
              if (!member) return false;
              return member.name.includes(input) || member.phone.includes(input);
            }}>
              {members.map((m: Member) => (
                <Option key={m.id} value={m.id}>
                  {m.name} - {m.phone} ({m.level}，余额¥{m.balance})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="checkInTime" label="入场时间" initialValue={dayjs()}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认开单
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`结账 - ${selectedOrder?.roomName || ''}`}
        open={checkoutModalVisible}
        onCancel={() => setCheckoutModalVisible(false)}
        width={800}
        footer={[
          <Button key="back" onClick={() => setCheckoutModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleCheckout}>确认结账</Button>,
        ]}
      >
        {selectedOrder && (
          <Row gutter={24}>
            <Col span={14}>
              <h4>添加酒水小吃</h4>
              <Row gutter={[8, 8]}>
                {drinks.map((d) => (
                  <Col span={12} key={d.id}>
                    <Card size="small" hoverable onClick={() => addItem(d)} style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{d.name}</span>
                        <span style={{ color: '#f5222d' }}>¥{d.price}</span>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>

              <Divider />

              <h4>已选商品</h4>
              {selectedItems.length === 0 ? (
                <Empty description="暂未选择商品" image={null} />
              ) : (
                <List
                  size="small"
                  dataSource={selectedItems}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button 
                          type="link" 
                          size="small"
                          danger={item.isComplimentary}
                          onClick={() => toggleComplimentary(item.drinkId)}
                        >
                          {item.isComplimentary ? '取消赠送' : '设为赠送'}
                        </Button>,
                        <Button type="link" size="small" danger onClick={() => removeItem(item.drinkId)}>
                          删除
                        </Button>,
                      ]}
                    >
                      <Space>
                        <span>{item.drinkName}</span>
                        <span>x{item.quantity}</span>
                        {item.isComplimentary ? (
                          <Tag color="green">赠送</Tag>
                        ) : (
                          <span>¥{item.price}</span>
                        )}
                      </Space>
                    </List.Item>
                  )}
                />
              )}
            </Col>

            <Col span={10}>
              <Card title="账单明细" size="small">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="订单号">{selectedOrder.orderNo}</Descriptions.Item>
                  <Descriptions.Item label="包厢">{selectedOrder.roomName}</Descriptions.Item>
                  <Descriptions.Item label="时长">{checkoutSummary.durationHours} 小时</Descriptions.Item>
                  <Descriptions.Item label="包厢费">¥{checkoutSummary.roomFee}</Descriptions.Item>
                  <Descriptions.Item label="酒水费">¥{checkoutSummary.drinksFee}</Descriptions.Item>
                  <Descriptions.Item label="赠送减免">-¥{checkoutSummary.complimentaryFee}</Descriptions.Item>
                  <Divider style={{ margin: '8px 0' }} />
                  <Descriptions.Item label="消费合计">
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#f5222d' }}>
                      ¥{checkoutSummary.total}
                    </span>
                  </Descriptions.Item>
                  {selectedOrder.memberId && (
                    <Descriptions.Item label="会员储值抵扣">
                      <InputNumber
                        min={0}
                        max={checkoutSummary.total}
                        value={useBalance}
                        onChange={(v) => setUseBalance(v || 0)}
                        style={{ width: '100%' }}
                        placeholder="输入抵扣金额"
                      />
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        当前余额：¥{members.find(m => m.id === selectedOrder.memberId)?.balance || 0}
                      </div>
                    </Descriptions.Item>
                  )}
                  <Divider style={{ margin: '8px 0' }} />
                  <Descriptions.Item label="实收金额">
                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#f5222d' }}>
                      ¥{checkoutSummary.actualPay}
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        )}
      </Modal>

      <Modal
        title="上报异常"
        open={abnormalModalVisible}
        onCancel={() => { setAbnormalModalVisible(false); abnormalForm.resetFields(); }}
        footer={null}
        width={500}
      >
        <Form form={abnormalForm} layout="vertical" onFinish={handleReportAbnormal}>
          {selectedOrder && (
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <div>订单号：{selectedOrder.orderNo}</div>
              <div>包厢：{selectedOrder.roomName}</div>
              <div>客人：{selectedOrder.memberName || '散客'}</div>
            </div>
          )}

          <Form.Item name="type" label="异常类型" rules={[{ required: true, message: '请选择异常类型' }]}>
            <Select placeholder="请选择异常类型">
              {abnormalTypeOptions.map(o => (
                <Option key={o.value} value={o.value}>{o.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="description" label="异常详情描述" rules={[{ required: true, message: '请描述异常情况' }]}>
            <TextArea 
              rows={4} 
              placeholder="请详细描述异常情况，包括：发生时间、涉及人员、具体问题、现场处理情况等"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block danger icon={<WarningOutlined />}>
              确认上报
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
