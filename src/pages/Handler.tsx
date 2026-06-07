import { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Tag,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  Descriptions,
  message,
  Empty,
  InputNumber,
  Switch,
  Alert,
  Divider,
  Steps,
  Tabs,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  RedoOutlined,
  MessageOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  UserOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { useStore } from '@/store';
import { AbnormalType, Order } from '@/store/types';

const { TextArea } = Input;

interface HandlerPageProps {
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
  abnormal: 'error',
  refunding: 'warning',
  refunded: 'success',
  completed: 'success',
  rejected: 'default',
  refund_rejected: 'warning',
};

const statusLabels: Record<string, string> = {
  abnormal: '待处理',
  refunding: '待店长审核',
  refunded: '已退款',
  completed: '已完成',
  rejected: '已拒绝',
  refund_rejected: '店长退回待重提',
};

export default function HandlerPage({ activeTab, onTabChange }: HandlerPageProps) {
  const { orders, handleAbnormal, applyRefund, resubmitRefund } = useStore();
  const [handleModalVisible, setHandleModalVisible] = useState(false);
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [resubmitModalVisible, setResubmitModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [handleForm] = Form.useForm();
  const [refundForm] = Form.useForm();
  const [resubmitForm] = Form.useForm();

  const pendingAbnormalOrders = orders.filter(o => o.status === 'abnormal');
  const refundingOrders = orders.filter(o => o.status === 'refunding');
  const rejectedOrders = orders.filter(o => o.status === 'refund_rejected');
  const processedOrders = orders.filter(o => 
    (o.status === 'completed' || o.status === 'refunded' || o.status === 'rejected' || o.status === 'refunding') 
    && o.handledBy
  );

  const totalTodo = pendingAbnormalOrders.length + rejectedOrders.length;

  const openHandleModal = (order: Order) => {
    setSelectedOrder(order);
    handleForm.resetFields();
    handleForm.setFieldsValue({ needRefund: false });
    setHandleModalVisible(true);
  };

  const openRefundModal = (order: Order) => {
    setSelectedOrder(order);
    refundForm.resetFields();
    setRefundModalVisible(true);
  };

  const openResubmitModal = (order: Order) => {
    setSelectedOrder(order);
    resubmitForm.resetFields();
    resubmitForm.setFieldsValue({
      amount: order.refundRecord?.amount,
      reason: order.refundRecord?.reason,
    });
    setResubmitModalVisible(true);
  };

  const handleSubmit = (values: any) => {
    if (!selectedOrder) return;

    handleAbnormal(selectedOrder.id, {
      handlerNote: values.handlerNote,
      needRefund: values.needRefund,
      refundAmount: values.needRefund ? values.refundAmount : undefined,
      refundReason: values.needRefund ? values.refundReason : undefined,
    });

    message.success('处理完成，流程已流转');
    setHandleModalVisible(false);
    setSelectedOrder(null);

    if (values.needRefund) {
      onTabChange('refund-apply');
    } else {
      onTabChange('history');
    }
  };

  const handleRefundSubmit = (values: any) => {
    if (!selectedOrder) return;

    applyRefund(selectedOrder.id, {
      amount: values.amount,
      reason: values.reason,
    });

    message.success('退款申请已提交，等待店长审核');
    setRefundModalVisible(false);
    setSelectedOrder(null);
    onTabChange('refund-apply');
  };

  const handleResubmit = (values: any) => {
    if (!selectedOrder) return;

    resubmitRefund(selectedOrder.id, {
      amount: values.amount,
      reason: values.reason,
      handlerNote: values.handlerNote,
    });

    message.success('已重新提交退款申请');
    setResubmitModalVisible(false);
    setSelectedOrder(null);
    onTabChange('refund-apply');
  };

  const abnormalColumns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 140 },
    { title: '包厢', dataIndex: 'roomName', key: 'roomName', width: 80 },
    { title: '客人', dataIndex: 'memberName', key: 'memberName', render: (t: string) => t || '散客' },
    { 
      title: '异常类型', 
      dataIndex: ['abnormalRecord', 'type'], 
      key: 'type',
      render: (t: AbnormalType) => (
        <Tag color="red">{abnormalTypeOptions.find(o => o.value === t)?.label || t}</Tag>
      )
    },
    { title: '上报人', dataIndex: ['abnormalRecord', 'reportedBy'], key: 'reportedBy' },
    { title: '上报时间', dataIndex: ['abnormalRecord', 'reportedAt'], key: 'reportedAt', width: 160 },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Order) => (
        <Space>
          <Button type="primary" size="small" onClick={() => openHandleModal(record)}>
            处理
          </Button>
        </Space>
      ),
    },
  ];

  const rejectedColumns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 140 },
    { title: '包厢', dataIndex: 'roomName', key: 'roomName', width: 80 },
    { title: '客人', dataIndex: 'memberName', key: 'memberName', render: (t: string) => t || '散客' },
    { 
      title: '原申请金额', 
      dataIndex: ['refundRecord', 'amount'], 
      key: 'amount',
      render: (v: number) => <span style={{ color: '#f5222d' }}>¥{v}</span>
    },
    { 
      title: '店长意见', 
      dataIndex: ['refundRecord', 'managerNote'], 
      key: 'managerNote',
      ellipsis: true,
    },
    { title: '退回时间', dataIndex: ['refundRecord', 'reviewedAt'], key: 'reviewedAt', width: 160 },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Order) => (
        <Space>
          <Button type="primary" size="small" icon={<RedoOutlined />} onClick={() => openResubmitModal(record)}>
            重新提交
          </Button>
        </Space>
      ),
    },
  ];

  const refundingColumns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 140 },
    { title: '包厢', dataIndex: 'roomName', key: 'roomName', width: 80 },
    { title: '客人', dataIndex: 'memberName', key: 'memberName', render: (t: string) => t || '散客' },
    { 
      title: '退款金额', 
      dataIndex: ['refundRecord', 'amount'], 
      key: 'amount',
      render: (v: number) => <span style={{ color: '#f5222d', fontWeight: 'bold' }}>¥{v}</span>
    },
    { title: '申请人', dataIndex: ['refundRecord', 'applicant'], key: 'applicant' },
    { title: '申请时间', dataIndex: ['refundRecord', 'appliedAt'], key: 'appliedAt', width: 160 },
    {
      title: '状态',
      key: 'status',
      render: () => <Tag color="warning">待店长审核</Tag>,
    },
  ];

  const historyColumns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 140 },
    { title: '包厢', dataIndex: 'roomName', key: 'roomName', width: 80 },
    { title: '客人', dataIndex: 'memberName', key: 'memberName', render: (t: string) => t || '散客' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      )
    },
    { title: '处理人', dataIndex: 'handledBy', key: 'handledBy' },
    { title: '处理时间', dataIndex: 'handledAt', key: 'handledAt', width: 160 },
    { 
      title: '退款金额', 
      dataIndex: ['refundRecord', 'amount'], 
      key: 'refundAmount',
      render: (v: number) => v ? `¥${v}` : '-'
    },
  ];

  const renderDashboard = () => (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="待处理异常" 
              value={pendingAbnormalOrders.length} 
              valueStyle={{ color: '#cf1322' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="店长退回重提" 
              value={rejectedOrders.length} 
              valueStyle={{ color: '#fa8c16' }}
              prefix={<RollbackOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="待审核退款" 
              value={refundingOrders.length} 
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="今日已处理" 
              value={processedOrders.length} 
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderPending = () => (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>待处理工单</h2>
          <p>共 {totalTodo} 条待处理（含 {rejectedOrders.length} 条店长退回）</p>
        </div>
      </div>

      <Tabs
        items={[
          {
            key: 'abnormal',
            label: (
              <Space>
                新上报异常
                {pendingAbnormalOrders.length > 0 && <Tag color="red">{pendingAbnormalOrders.length}</Tag>}
              </Space>
            ),
            children: (
              pendingAbnormalOrders.length === 0 ? (
                <Empty description="暂无新上报的异常" />
              ) : (
                <Table
                  dataSource={pendingAbnormalOrders}
                  rowKey="id"
                  columns={abnormalColumns}
                  expandable={{
                    expandedRowRender: (record) => (
                      <div>
                        <Alert
                          message="异常详情"
                          description={record.abnormalRecord?.description}
                          type="error"
                          showIcon
                          style={{ marginBottom: 16 }}
                        />
                        <Descriptions column={2} size="small">
                          <Descriptions.Item label="订单号">{record.orderNo}</Descriptions.Item>
                          <Descriptions.Item label="包厢">{record.roomName} ({record.roomType})</Descriptions.Item>
                          <Descriptions.Item label="客人">{record.memberName || '散客'}</Descriptions.Item>
                          <Descriptions.Item label="会员手机号">{record.memberPhone || '-'}</Descriptions.Item>
                          <Descriptions.Item label="入场时间">{record.checkInTime}</Descriptions.Item>
                          <Descriptions.Item label="上报人">{record.abnormalRecord?.reportedBy}</Descriptions.Item>
                          <Descriptions.Item label="上报时间">{record.abnormalRecord?.reportedAt}</Descriptions.Item>
                        </Descriptions>
                      </div>
                    ),
                  }}
                />
              )
            ),
          },
          {
            key: 'rejected',
            label: (
              <Space>
                店长退回
                {rejectedOrders.length > 0 && <Tag color="orange">{rejectedOrders.length}</Tag>}
              </Space>
            ),
            children: (
              rejectedOrders.length === 0 ? (
                <Empty description="暂无店长退回的工单" />
              ) : (
                <>
                  <Alert
                    message="注意"
                    description="以下工单被店长退回，请根据店长意见补充材料后重新提交"
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <Table
                    dataSource={rejectedOrders}
                    rowKey="id"
                    columns={rejectedColumns}
                    expandable={{
                      expandedRowRender: (record) => (
                        <div>
                          <Steps
                            size="small"
                            current={3}
                            items={[
                              { title: '前台上报', description: record.abnormalRecord?.reportedAt, status: 'finish' },
                              { title: '我处理并提交', description: record.handledAt, status: 'finish' },
                              { title: '店长退回', description: record.refundRecord?.reviewedAt, status: 'error' },
                              { title: '重新提交', description: '待处理', status: 'wait' },
                            ]}
                            style={{ marginBottom: 16 }}
                          />
                          <Descriptions column={1} size="small">
                            <Descriptions.Item label="原退款原因">
                              {record.refundRecord?.reason}
                            </Descriptions.Item>
                            <Descriptions.Item label="店长退回意见">
                              <Tag color="orange">{record.refundRecord?.managerNote}</Tag>
                            </Descriptions.Item>
                          </Descriptions>
                        </div>
                      ),
                    }}
                  />
                </>
              )
            ),
          },
        ]}
      />
    </div>
  );

  const renderRefundApply = () => (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>退款申请</h2>
      </div>

      <Alert
        message="处理说明"
        description={
          <div>
            <p>1. 异常处理时如果需要退款，系统会自动生成退款申请并提交给店长审核</p>
            <p>2. 也可以对已完成的订单单独发起退款申请</p>
            <p>3. 退款申请需店长审核通过后，才能退回到会员储值账户</p>
            <p>4. 如果店长退回，请根据意见补充材料后重新提交</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <h3>已提交待审核</h3>
      {refundingOrders.length === 0 ? (
        <Empty description="暂无待审核的退款申请" />
      ) : (
        <Table
          dataSource={refundingOrders}
          rowKey="id"
          columns={refundingColumns}
          style={{ marginBottom: 24 }}
          expandable={{
            expandedRowRender: (record) => (
              <div>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="退款原因">
                    {record.refundRecord?.reason}
                  </Descriptions.Item>
                  {record.abnormalRecord && (
                    <Descriptions.Item label="关联异常">
                      {abnormalTypeOptions.find(o => o.value === record.abnormalRecord?.type)?.label}
                      ：{record.abnormalRecord?.description}
                    </Descriptions.Item>
                  )}
                  {record.handlerNote && (
                    <Descriptions.Item label="处理备注">{record.handlerNote}</Descriptions.Item>
                  )}
                </Descriptions>
              </div>
            ),
          }}
        />
      )}

      <Divider />

      <h3>对已完成订单发起退款</h3>
      <Table
        dataSource={orders.filter(o => o.status === 'completed' && !o.refundRecord)}
        rowKey="id"
        size="small"
        columns={[
          { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
          { title: '包厢', dataIndex: 'roomName', key: 'roomName' },
          { title: '客人', dataIndex: 'memberName', key: 'memberName', render: (t: string) => t || '散客' },
          { title: '消费金额', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => `¥${v}` },
          { title: '完成时间', dataIndex: 'checkOutTime', key: 'checkOutTime' },
          {
            title: '操作',
            key: 'action',
            render: (_: any, record: Order) => (
              <Button type="link" size="small" onClick={() => openRefundModal(record)}>
                申请退款
              </Button>
            ),
          },
        ]}
        pagination={{ pageSize: 5 }}
      />
    </div>
  );

  const renderHistory = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>处理记录</h2>
      </div>
      {processedOrders.length === 0 ? (
        <Empty description="暂无处理记录" />
      ) : (
        <Table
          dataSource={processedOrders}
          rowKey="id"
          columns={historyColumns}
          expandable={{
            expandedRowRender: (record) => (
              <div>
                {(record.refundHistory || []).length > 0 ? (
                  <Steps
                    direction="vertical"
                    size="small"
                    items={[
                      { 
                        title: '前台上报', 
                        description: record.abnormalRecord?.reportedAt, 
                        icon: <UserOutlined />,
                        status: 'finish'
                      },
                      { 
                        title: '我处理', 
                        description: record.handledAt, 
                        icon: <MessageOutlined />,
                        status: 'finish'
                      },
                      ...(record.refundHistory || []).map((r, idx) => ({
                        title: `第${idx + 1}轮退款`,
                        description: r.appliedAt,
                        icon: r.reviewedAt 
                          ? (r.status === 'approved' ? <CheckOutlined /> : r.returnToHandler ? <RollbackOutlined /> : <CloseOutlined />) 
                          : <ClockCircleOutlined />,
                        status: r.reviewedAt 
                          ? (r.status === 'approved' ? 'finish' : r.returnToHandler ? 'error' : 'finish') 
                          : 'process' as 'process' | 'finish' | 'error',
                      })),
                    ]}
                  />
                ) : (
                  <Steps
                    size="small"
                    current={2}
                    items={[
                      { title: '前台上报', description: record.abnormalRecord?.reportedAt, icon: <UserOutlined /> },
                      { title: '我处理', description: record.handledAt, icon: <MessageOutlined /> },
                      { 
                        title: record.refundRecord ? '店长审核' : '处理完成', 
                        description: record.refundRecord?.reviewedAt || record.handledAt,
                        icon: record.refundRecord ? 
                          (record.refundRecord.status === 'approved' ? <CheckOutlined /> : 
                           record.refundRecord.status === 'rejected' ? <CloseOutlined /> : <ClockCircleOutlined />) 
                          : <CheckOutlined />
                      },
                    ]}
                  />
                )}
                <Divider />
                <Descriptions column={1} size="small">
                  {record.abnormalRecord && (
                    <Descriptions.Item label="异常描述">{record.abnormalRecord.description}</Descriptions.Item>
                  )}
                  {record.handlerNote && (
                    <Descriptions.Item label="处理意见">{record.handlerNote}</Descriptions.Item>
                  )}
                  {(record.refundHistory || []).map((r, idx) => (
                    <Descriptions.Item key={r.id} label={`第${idx + 1}轮退款`}>
                      申请 ¥{r.amount}：{r.reason}（{r.applicant}）
                      {r.reviewedAt ? (
                        <>
                          <br />
                          <Tag color={r.status === 'approved' ? 'green' : r.returnToHandler ? 'orange' : 'default'}>
                            {r.status === 'approved' ? '通过' : r.returnToHandler ? '退回重提' : '拒绝'}
                          </Tag>
                          {r.managerNote && <span style={{ color: '#666', marginLeft: 4 }}>{r.managerNote}</span>}
                        </>
                      ) : (
                        <Tag color="warning" style={{ marginLeft: 8 }}>待审核</Tag>
                      )}
                    </Descriptions.Item>
                  ))}
                  {(!record.refundHistory || record.refundHistory.length === 0) && record.refundRecord && (
                    <>
                      <Descriptions.Item label="退款申请">
                        金额 ¥{record.refundRecord.amount}，原因：{record.refundRecord.reason}
                      </Descriptions.Item>
                      {record.refundRecord.managerNote && (
                        <Descriptions.Item label="店长意见">
                          <Tag color={record.refundRecord.status === 'approved' ? 'green' : record.refundRecord.returnToHandler ? 'orange' : 'default'}>
                            {record.refundRecord.status === 'approved' ? '通过' : record.refundRecord.returnToHandler ? '退回重提' : '拒绝'}
                          </Tag>
                          ：{record.refundRecord.managerNote}
                        </Descriptions.Item>
                      )}
                    </>
                  )}
                </Descriptions>
              </div>
            ),
          }}
        />
      )}
    </div>
  );

  return (
    <div>
      {activeTab === 'pending' && renderPending()}
      {activeTab === 'processing' && (
        <div>
          <div style={{ marginBottom: 16 }}><h2>处理中</h2></div>
          {renderDashboard()}
          <Empty description="当前没有正在处理的工单" />
        </div>
      )}
      {activeTab === 'refund-apply' && renderRefundApply()}
      {activeTab === 'history' && renderHistory()}

      <Modal
        title="处理异常"
        open={handleModalVisible}
        onCancel={() => setHandleModalVisible(false)}
        width={600}
        footer={null}
      >
        {selectedOrder && (
          <div>
            <Alert
              message={abnormalTypeOptions.find(o => o.value === selectedOrder.abnormalRecord?.type)?.label}
              description={selectedOrder.abnormalRecord?.description}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="订单号">{selectedOrder.orderNo}</Descriptions.Item>
              <Descriptions.Item label="包厢">{selectedOrder.roomName}</Descriptions.Item>
              <Descriptions.Item label="客人">{selectedOrder.memberName || '散客'}</Descriptions.Item>
              <Descriptions.Item label="上报人">{selectedOrder.abnormalRecord?.reportedBy}</Descriptions.Item>
            </Descriptions>

            <Form form={handleForm} layout="vertical" onFinish={handleSubmit}>
              <Form.Item name="handlerNote" label="处理意见" rules={[{ required: true, message: '请输入处理意见' }]}>
                <TextArea 
                  rows={3} 
                  placeholder="请描述调查结果和处理方案"
                />
              </Form.Item>

              <Form.Item name="needRefund" label="是否需要退款" valuePropName="checked">
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>

              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.needRefund !== curr.needRefund}>
                {({ getFieldValue }) => getFieldValue('needRefund') ? (
                  <>
                    <Form.Item 
                      name="refundAmount" 
                      label="退款金额（元）" 
                      rules={[{ required: true, message: '请输入退款金额' }]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入退款金额" />
                    </Form.Item>
                    <Form.Item 
                      name="refundReason" 
                      label="退款原因" 
                      rules={[{ required: true, message: '请输入退款原因' }]}
                    >
                      <TextArea rows={2} placeholder="请详细说明退款原因" />
                    </Form.Item>
                  </>
                ) : null}
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button onClick={() => setHandleModalVisible(false)}>取消</Button>
                  <Button type="primary" htmlType="submit">
                    确认处理
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="申请退款"
        open={refundModalVisible}
        onCancel={() => setRefundModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedOrder && (
          <div>
            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="订单号">{selectedOrder.orderNo}</Descriptions.Item>
              <Descriptions.Item label="消费金额">¥{selectedOrder.totalAmount}</Descriptions.Item>
              <Descriptions.Item label="会员储值抵扣">¥{selectedOrder.useBalance}</Descriptions.Item>
              <Descriptions.Item label="实付金额">¥{selectedOrder.payAmount}</Descriptions.Item>
            </Descriptions>

            <Form form={refundForm} layout="vertical" onFinish={handleRefundSubmit}>
              <Form.Item name="amount" label="退款金额（元）" rules={[{ required: true, message: '请输入退款金额' }]}>
                <InputNumber min={0} max={selectedOrder.totalAmount} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="reason" label="退款原因" rules={[{ required: true, message: '请输入退款原因' }]}>
                <TextArea rows={3} placeholder="请详细说明退款原因" />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button onClick={() => setRefundModalVisible(false)}>取消</Button>
                  <Button type="primary" htmlType="submit">提交申请</Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="重新提交退款申请"
        open={resubmitModalVisible}
        onCancel={() => setResubmitModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedOrder && (
          <div>
            <Alert
              message="店长退回意见"
              description={selectedOrder.refundRecord?.managerNote}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="订单号">{selectedOrder.orderNo}</Descriptions.Item>
              <Descriptions.Item label="原申请金额">¥{selectedOrder.refundRecord?.amount}</Descriptions.Item>
              <Descriptions.Item label="原退款原因">{selectedOrder.refundRecord?.reason}</Descriptions.Item>
            </Descriptions>

            <Form form={resubmitForm} layout="vertical" onFinish={handleResubmit}>
              <Form.Item name="amount" label="退款金额（元）" rules={[{ required: true, message: '请输入退款金额' }]}>
                <InputNumber min={0} max={selectedOrder.totalAmount} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="reason" label="退款原因" rules={[{ required: true, message: '请输入退款原因' }]}>
                <TextArea rows={2} placeholder="请重新说明退款原因" />
              </Form.Item>
              <Form.Item name="handlerNote" label="补充说明（针对店长意见）" rules={[{ required: true, message: '请输入补充说明' }]}>
                <TextArea rows={2} placeholder="请针对店长的退回意见进行补充说明" />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button onClick={() => setResubmitModalVisible(false)}>取消</Button>
                  <Button type="primary" htmlType="submit">重新提交</Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}
