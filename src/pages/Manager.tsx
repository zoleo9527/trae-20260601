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
  Alert,
  Divider,
  Steps,
  Tabs,
  InputNumber,
  DatePicker,
  Select,
  Radio,
} from 'antd';
import {
  CheckOutlined,
  EyeOutlined,
  FileTextOutlined,
  WarningOutlined,
  DollarOutlined,
  TeamOutlined,
  UserOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { useStore } from '@/store';
import { Order, AbnormalType, Member, RefundRecord } from '@/store/types';
import { refundHistory } from '@/store/mockData';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface ManagerPageProps {
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

const getRefundStatusDisplay = (record: RefundRecord) => {
  if (record.status === 'approved') return { color: 'success', label: '已通过' };
  if (record.status === 'rejected' && record.returnToHandler) return { color: 'warning', label: '退回重提' };
  if (record.status === 'rejected') return { color: 'default', label: '已拒绝' };
  return { color: 'warning', label: '待审核' };
};

const orderStatusLabels: Record<string, string> = {
  abnormal: '异常待处理',
  refunding: '待退款审核',
  refunded: '已退款',
  completed: '已完成',
  rejected: '已拒绝',
  refund_rejected: '退款被拒待重提',
  consuming: '消费中',
};

export default function ManagerPage({ activeTab, onTabChange: _onTabChange }: ManagerPageProps) {
  const { orders, members, reviewRefund, addMemberBalance } = useStore();
  const [auditModalVisible, setAuditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [auditForm] = Form.useForm();
  const [rechargeForm] = Form.useForm();

  const pendingRefunds = orders.filter(o => o.status === 'refunding' && o.refundRecord);

  const allRefundRecords: (RefundRecord & { orderNo: string; memberName: string })[] = [
    ...orders.flatMap(o => {
      const historyIds = new Set((o.refundHistory || []).map(r => r.id));
      const records = (o.refundHistory || []).map(r => ({
        ...r,
        orderNo: r.orderNo || o.orderNo,
        memberName: r.memberName || o.memberName || '散客',
      }));
      if (o.refundRecord && !historyIds.has(o.refundRecord.id)) {
        records.push({
          ...o.refundRecord,
          orderNo: o.refundRecord.orderNo || o.orderNo,
          memberName: o.refundRecord.memberName || o.memberName || '散客',
        });
      }
      return records;
    }),
    ...refundHistory.map(r => ({
      ...r,
      orderNo: r.orderNo || r.orderId,
      memberName: r.memberName || '-',
    })),
  ];

  const openAuditModal = (order: Order) => {
    setSelectedOrder(order);
    auditForm.resetFields();
    setAuditModalVisible(true);
  };

  const openViewModal = (order: Order) => {
    setSelectedOrder(order);
    setViewModalVisible(true);
  };

  const openRechargeModal = (member: Member) => {
    setSelectedMember(member);
    rechargeForm.resetFields();
    setRechargeModalVisible(true);
  };

  const handleAudit = () => {
    if (!selectedOrder?.refundRecord) return;

    const values = auditForm.getFieldsValue();
    if (!values.managerNote) {
      message.error('请输入审核意见');
      return;
    }

    const approved = values.action === 'approve';

    reviewRefund(selectedOrder.refundRecord.id, {
      approved,
      managerNote: values.managerNote,
      returnToHandler: values.action === 'return',
    });

    if (approved) {
      message.success('已通过退款申请，款项已退回会员账户');
    } else if (values.action === 'return') {
      message.success('已退回处理人员重新处理');
    } else {
      message.success('已拒绝退款申请');
    }

    setAuditModalVisible(false);
    setSelectedOrder(null);
  };

  const handleRecharge = (values: any) => {
    if (!selectedMember) return;

    addMemberBalance(selectedMember.id, values.amount);
    message.success(`已为 ${selectedMember.name} 充值 ¥${values.amount}`);
    setRechargeModalVisible(false);
    setSelectedMember(null);
  };

  const todoColumns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 140 },
    { title: '包厢', dataIndex: 'roomName', key: 'roomName', width: 80 },
    { title: '客人', dataIndex: 'memberName', key: 'memberName', render: (t: string) => t || '散客' },
    { 
      title: '退款金额', 
      dataIndex: ['refundRecord', 'amount'], 
      key: 'amount',
      render: (v: number) => <span style={{ color: '#f5222d', fontWeight: 'bold' }}>¥{v}</span>
    },
    { 
      title: '异常类型', 
      dataIndex: ['abnormalRecord', 'type'], 
      key: 'abnormalType',
      render: (t: AbnormalType) => t ? (
        <Tag color="red">{abnormalTypeOptions.find(o => o.value === t)?.label || t}</Tag>
      ) : <Tag color="default">无异常</Tag>
    },
    { title: '申请人', dataIndex: ['refundRecord', 'applicant'], key: 'applicant' },
    { title: '申请时间', dataIndex: ['refundRecord', 'appliedAt'], key: 'appliedAt', width: 160 },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Order) => (
        <Space>
          <Button size="small" onClick={() => openViewModal(record)} icon={<EyeOutlined />}>
            查看链路
          </Button>
          <Button type="primary" size="small" onClick={() => openAuditModal(record)}>
            审核
          </Button>
        </Space>
      ),
    },
  ];

  const historyColumns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 140 },
    { title: '客人', dataIndex: 'memberName', key: 'memberName' },
    { 
      title: '退款金额', 
      dataIndex: 'amount', 
      key: 'amount',
      render: (v: number) => <span style={{ color: '#f5222d', fontWeight: 'bold' }}>¥{v}</span>
    },
    { title: '申请人', dataIndex: 'applicant', key: 'applicant' },
    { title: '申请时间', dataIndex: 'appliedAt', key: 'appliedAt', width: 160 },
    { 
      title: '审核结果', 
      key: 'result',
      render: (_: any, record: RefundRecord) => {
        const display = getRefundStatusDisplay(record);
        return <Tag color={display.color}>{display.label}</Tag>;
      }
    },
    { title: '审核人', dataIndex: 'reviewedBy', key: 'reviewedBy', render: (t: string) => t || '-' },
    { title: '审核时间', dataIndex: 'reviewedAt', key: 'reviewedAt', width: 160, render: (t: string) => t || '-' },
  ];

  const memberColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '等级', dataIndex: 'level', key: 'level', render: (l: string) => {
      const colors: Record<string, string> = {
        '普通': 'default',
        '银卡': 'blue',
        '金卡': 'gold',
        '钻石': 'purple',
      };
      return <Tag color={colors[l] || 'default'}>{l}</Tag>;
    }},
    { title: '账户余额', dataIndex: 'balance', key: 'balance', 
      render: (v: number) => <span style={{ fontWeight: 'bold' }}>¥{v.toFixed(2)}</span> 
    },
    { title: '累计充值', dataIndex: 'totalRecharge', key: 'totalRecharge', render: (v: number) => `¥${v.toFixed(2)}` },
    { title: '注册时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Member) => (
        <Button type="link" size="small" onClick={() => openRechargeModal(record)} icon={<PlusOutlined />}>
          充值
        </Button>
      ),
    },
  ];

  const renderTodo = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>待办事项</h2>
        <p>沿异常处理链路跟进的退款审核待办</p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="待审核退款" 
              value={pendingRefunds.length} 
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="今日已处理" 
              value={allRefundRecords.filter(r => r.reviewedAt && dayjs(r.reviewedAt).isSame(dayjs(), 'day')).length} 
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="待审核总金额" 
              value={pendingRefunds.reduce((sum, o) => sum + (o.refundRecord?.amount || 0), 0)} 
              valueStyle={{ color: '#f5222d' }}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="平均处理时长" 
              value={18} 
              suffix="分钟"
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {pendingRefunds.length === 0 ? (
        <Empty description="暂无待办事项，干得漂亮！" />
      ) : (
        <>
          <Alert
            message="审核提示"
            description={
              <div>
                <p>1. 点击「查看链路」可以看到从异常上报到处理人员跟进的完整时间线</p>
                <p>2. 「退回处理人员」可让处理人员补充材料后重新提交，不会直接结案</p>
                <p>3. 审核通过后款项自动退回会员储值账户</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Table
            dataSource={pendingRefunds}
            rowKey="id"
            columns={todoColumns}
            expandable={{
              expandedRowRender: (record) => (
                <div>
                  <Steps
                    size="small"
                    current={2}
                    items={[
                      { 
                        title: '前台上报', 
                        description: record.abnormalRecord?.reportedAt || record.createdAt, 
                        icon: <UserOutlined />,
                        status: record.abnormalRecord ? 'finish' : 'wait'
                      },
                      { 
                        title: '处理人员跟进', 
                        description: record.handledAt, 
                        icon: <MessageOutlined />,
                        status: record.handledAt ? 'finish' : 'wait'
                      },
                      { title: '店长审核', description: '待处理', icon: <FileTextOutlined /> },
                    ]}
                    style={{ marginBottom: 16 }}
                  />
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="退款原因">{record.refundRecord?.reason}</Descriptions.Item>
                    <Descriptions.Item label="处理备注">{record.handlerNote || '-'}</Descriptions.Item>
                    {record.abnormalRecord && (
                      <Descriptions.Item label="异常描述" span={2}>
                        {record.abnormalRecord.description}
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="订单金额">¥{record.totalAmount}</Descriptions.Item>
                    <Descriptions.Item label="储值抵扣">¥{record.useBalance}</Descriptions.Item>
                    <Descriptions.Item label="申请退款">
                      <span style={{ color: '#f5222d', fontWeight: 'bold' }}>¥{record.refundRecord?.amount}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="占订单比例">
                      {record.totalAmount > 0 
                        ? ((record.refundRecord?.amount || 0) / record.totalAmount * 100).toFixed(1) + '%'
                        : '-'}
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              ),
            }}
          />
        </>
      )}
    </div>
  );

  const renderReview = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>数据回看</h2>
        <p>查看所有退款记录和异常处理历史</p>
      </div>

      <Tabs
        items={[
          {
            key: 'refunds',
            label: '退款记录',
            children: (
              <div>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic 
                        title="总退款笔数" 
                        value={allRefundRecords.length} 
                        valueStyle={{ color: '#1890ff' }}
                        prefix={<FileTextOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic 
                        title="总退款金额" 
                        value={allRefundRecords.reduce((sum, r) => sum + r.amount, 0)} 
                        valueStyle={{ color: '#f5222d' }}
                        prefix={<DollarOutlined />}
                        suffix="元"
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic 
                        title="通过笔数" 
                        value={allRefundRecords.filter(r => r.status === 'approved').length} 
                        valueStyle={{ color: '#3f8600' }}
                        suffix={`/ ${allRefundRecords.length}`}
                        prefix={<CheckOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic 
                        title="退回重提" 
                        value={allRefundRecords.filter(r => r.status === 'rejected' && r.returnToHandler).length} 
                        valueStyle={{ color: '#fa8c16' }}
                        prefix={<RollbackOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>

                <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
                  <Select placeholder="筛选审核结果" style={{ width: 150 }} allowClear>
                    <Option value="pending">待审核</Option>
                    <Option value="approved">已通过</Option>
                    <Option value="returned">退回重提</Option>
                    <Option value="rejected">已拒绝</Option>
                  </Select>
                  <RangePicker />
                </div>

                <Table
                  dataSource={allRefundRecords}
                  rowKey="id"
                  columns={historyColumns}
                  expandable={{
                    expandedRowRender: (record: RefundRecord) => (
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="退款原因">{record.reason}</Descriptions.Item>
                        <Descriptions.Item label="申请人">{record.applicant}</Descriptions.Item>
                        {record.status === 'pending' && (
                          <Descriptions.Item label="审核状态">
                            <Tag color="warning">待审核</Tag>
                          </Descriptions.Item>
                        )}
                        {record.managerNote && (
                          <Descriptions.Item label="审核意见">{record.managerNote}</Descriptions.Item>
                        )}
                        {record.returnToHandler && (
                          <Descriptions.Item label="审核类型">
                            <Tag color="orange">退回处理人员补充材料</Tag>
                          </Descriptions.Item>
                        )}
                        {record.status === 'rejected' && !record.returnToHandler && record.reviewedAt && (
                          <Descriptions.Item label="审核类型">
                            <Tag>直接拒绝，不再处理</Tag>
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                    ),
                  }}
                />
              </div>
            ),
          },
          {
            key: 'abnormal',
            label: '异常处理历史',
            children: (
              <Table
                dataSource={orders.filter(o => o.abnormalRecord || o.refundRecord)}
                rowKey="id"
                columns={[
                  { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
                  { title: '包厢', dataIndex: 'roomName', key: 'roomName' },
                  { 
                    title: '异常类型', 
                    dataIndex: ['abnormalRecord', 'type'], 
                    key: 'abnormalType',
                    render: (t: AbnormalType) => t ? (
                      <Tag color="red">{abnormalTypeOptions.find(o => o.value === t)?.label || t}</Tag>
                    ) : '-'
                  },
                  { 
                    title: '订单状态', 
                    dataIndex: 'status', 
                    key: 'status',
                    render: (s: string) => <Tag>{orderStatusLabels[s] || s}</Tag>
                  },
                  { title: '上报人', dataIndex: ['abnormalRecord', 'reportedBy'], key: 'reportedBy', render: (t: string) => t || '-' },
                  { title: '处理人', dataIndex: 'handledBy', key: 'handledBy', render: (t: string) => t || '-' },
                  { 
                    title: '退款金额', 
                    dataIndex: ['refundRecord', 'amount'], 
                    key: 'refundAmount',
                    render: (v: number) => v ? `¥${v}` : '-'
                  },
                ]}
              />
            ),
          },
          {
            key: 'orders',
            label: '所有订单',
            children: (
              <Table
                dataSource={orders}
                rowKey="id"
                columns={[
                  { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
                  { title: '包厢', dataIndex: 'roomName', key: 'roomName' },
                  { title: '客人', dataIndex: 'memberName', key: 'memberName', render: (t: string) => t || '散客' },
                  { title: '消费金额', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => `¥${v}` },
                  { title: '储值抵扣', dataIndex: 'useBalance', key: 'useBalance', render: (v: number) => v > 0 ? `¥${v}` : '-' },
                  { 
                    title: '状态', 
                    dataIndex: 'status', 
                    key: 'status',
                    render: (s: string) => <Tag>{orderStatusLabels[s] || s}</Tag>
                  },
                  { title: '创建人', dataIndex: 'createdBy', key: 'createdBy' },
                  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
                ]}
              />
            ),
          },
        ]}
      />
    </div>
  );

  const renderMembers = () => (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>会员管理</h2>
          <p>管理会员储值账户</p>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small">
            <Statistic 
              title="会员总数" 
              value={members.length} 
              valueStyle={{ color: '#1890ff' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic 
              title="储值总余额" 
              value={members.reduce((sum, m) => sum + m.balance, 0)} 
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic 
              title="累计充值" 
              value={members.reduce((sum, m) => sum + m.totalRecharge, 0)} 
              valueStyle={{ color: '#722ed1' }}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>

      <Table
        dataSource={members}
        rowKey="id"
        columns={memberColumns}
      />
    </div>
  );

  const renderStatistics = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>经营统计</h2>
        <p>查看门店经营数据和异常分析</p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="今日订单数" 
              value={orders.filter(o => dayjs(o.createdAt).isSame(dayjs(), 'day')).length} 
              valueStyle={{ color: '#1890ff' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="今日营业额" 
              value={orders
                .filter(o => dayjs(o.createdAt).isSame(dayjs(), 'day') && o.totalAmount > 0)
                .reduce((sum, o) => sum + o.totalAmount, 0)} 
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="今日异常数" 
              value={orders.filter(o => o.abnormalRecord && dayjs(o.abnormalRecord.reportedAt).isSame(dayjs(), 'day')).length} 
              valueStyle={{ color: '#cf1322' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="今日退款金额" 
              value={orders
                .filter(o => o.refundRecord?.status === 'approved' && dayjs(o.refundRecord?.reviewedAt).isSame(dayjs(), 'day'))
                .reduce((sum, o) => sum + (o.refundRecord?.amount || 0), 0)} 
              valueStyle={{ color: '#fa8c16' }}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>

      <Card title="异常类型分布" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          {abnormalTypeOptions.map(type => {
            const count = orders.filter(o => o.abnormalRecord?.type === type.value).length;
            const total = orders.filter(o => o.abnormalRecord).length;
            return (
              <Col span={8} key={type.value}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f5222d' }}>{count}</div>
                  <div style={{ color: '#888' }}>{type.label}</div>
                  <div style={{ fontSize: '12px', color: '#aaa' }}>
                    占比 {total > 0 ? (count / total * 100).toFixed(1) : 0}%
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      <Alert
        message="改进建议"
        description={
          <div>
            <p>1. 包厢撞档问题：建议优化预订系统，增加重复预订提醒</p>
            <p>2. 酒水赠送纠纷：建议统一赠送口径并要求服务员在订单上备注</p>
            <p>3. 会员账目不清：建议定期给会员发送消费明细短信</p>
          </div>
        }
        type="info"
        showIcon
      />
    </div>
  );

  return (
    <div>
      {activeTab === 'todo' && renderTodo()}
      {activeTab === 'review' && renderReview()}
      {activeTab === 'members' && renderMembers()}
      {activeTab === 'statistics' && renderStatistics()}

      <Modal
        title="退款审核"
        open={auditModalVisible}
        onCancel={() => setAuditModalVisible(false)}
        width={650}
        footer={[
          <Button key="back" onClick={() => setAuditModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleAudit}>
            提交审核
          </Button>,
        ]}
      >
        {selectedOrder?.refundRecord && (
          <div>
            <Steps
              size="small"
              current={2}
              items={[
                { 
                  title: '前台上报', 
                  description: selectedOrder.abnormalRecord?.reportedAt || selectedOrder.createdAt,
                  status: 'finish' 
                },
                { 
                  title: '处理人员跟进', 
                  description: selectedOrder.handledAt,
                  status: 'finish' 
                },
                { title: '店长审核', description: '进行中' },
              ]}
              style={{ marginBottom: 20 }}
            />

            <Alert
              message={`退款申请：¥${selectedOrder.refundRecord.amount}`}
              description={selectedOrder.refundRecord.reason}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="订单号">{selectedOrder.orderNo}</Descriptions.Item>
              <Descriptions.Item label="客人">{selectedOrder.memberName || '散客'}</Descriptions.Item>
              <Descriptions.Item label="订单金额">¥{selectedOrder.totalAmount}</Descriptions.Item>
              <Descriptions.Item label="申请退款">
                <span style={{ color: '#f5222d', fontWeight: 'bold' }}>¥{selectedOrder.refundRecord.amount}</span>
              </Descriptions.Item>
              <Descriptions.Item label="申请人">{selectedOrder.refundRecord.applicant}</Descriptions.Item>
              <Descriptions.Item label="申请时间">{selectedOrder.refundRecord.appliedAt}</Descriptions.Item>
            </Descriptions>

            {selectedOrder.abnormalRecord && (
              <div style={{ marginBottom: 16 }}>
                <h4>关联异常</h4>
                <Alert
                  message={abnormalTypeOptions.find(o => o.value === selectedOrder.abnormalRecord?.type)?.label}
                  description={selectedOrder.abnormalRecord.description}
                  type="error"
                  showIcon
                />
              </div>
            )}

            {selectedOrder.handlerNote && (
              <div style={{ marginBottom: 16 }}>
                <h4>处理人员意见</h4>
                <Card size="small">{selectedOrder.handlerNote}</Card>
              </div>
            )}

            <Form form={auditForm} layout="vertical">
              <Form.Item 
                name="action" 
                label="审核结果" 
                rules={[{ required: true, message: '请选择审核结果' }]}
                initialValue="approve"
              >
                <Radio.Group>
                  <Space direction="vertical">
                    <Radio value="approve">
                      <span style={{ color: '#3f8600', fontWeight: 'bold' }}>通过</span> - 同意退款，款项退回会员储值账户
                    </Radio>
                    <Radio value="return">
                      <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>退回处理人员</span> - 需要补充材料或重新核实
                    </Radio>
                    <Radio value="reject">
                      <span style={{ color: '#cf1322', fontWeight: 'bold' }}>拒绝</span> - 直接结案，不再处理
                    </Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>
              <Form.Item 
                name="managerNote" 
                label="审核意见" 
                rules={[{ required: true, message: '请输入审核意见' }]}
              >
                <TextArea 
                  rows={3} 
                  placeholder="请输入审核意见。通过：请说明同意的原因；退回：请说明需要补充什么；拒绝：请说明拒绝原因，处理人员会转告客人。"
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="完整链路查看"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        width={750}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>关闭</Button>,
          <Button key="audit" type="primary" onClick={() => {
            setViewModalVisible(false);
            if (selectedOrder) openAuditModal(selectedOrder);
          }}>
            去审核
          </Button>,
        ]}
      >
        {selectedOrder && (
          <div>
            <Steps
              direction="vertical"
              size="small"
              current={
                selectedOrder.status === 'refunded' ? 4 :
                selectedOrder.status === 'refunding' ? 2 :
                selectedOrder.status === 'abnormal' ? 1 : 0
              }
              items={[
                { 
                  title: '开单入场', 
                  description: selectedOrder.createdAt,
                  content: `${selectedOrder.createdBy} 为客人开单，包厢 ${selectedOrder.roomName}`,
                  status: 'finish'
                },
                selectedOrder.abnormalRecord ? {
                  title: '前台上报异常',
                  description: selectedOrder.abnormalRecord.reportedAt,
                  content: (
                    <div>
                      <p><b>{selectedOrder.abnormalRecord.reportedBy}</b> 上报 {abnormalTypeOptions.find(o => o.value === selectedOrder.abnormalRecord?.type)?.label}</p>
                      <p style={{ color: '#666' }}>{selectedOrder.abnormalRecord.description}</p>
                    </div>
                  ),
                  status: 'finish'
                } : {
                  title: '消费完成结账',
                  description: selectedOrder.checkOutTime,
                  content: `消费金额 ¥${selectedOrder.totalAmount}，储值抵扣 ¥${selectedOrder.useBalance}`,
                  status: selectedOrder.checkOutTime ? 'finish' : 'wait'
                },
                selectedOrder.handledAt ? {
                  title: '处理人员跟进',
                  description: selectedOrder.handledAt,
                  content: (
                    <div>
                      <p><b>{selectedOrder.handledBy}</b> 处理</p>
                      {selectedOrder.handlerNote && <p style={{ color: '#666' }}>{selectedOrder.handlerNote}</p>}
                      {selectedOrder.refundRecord && (
                        <p style={{ color: '#f5222d' }}>
                          发起退款申请 ¥{selectedOrder.refundRecord.amount}：{selectedOrder.refundRecord.reason}
                        </p>
                      )}
                    </div>
                  ),
                  status: 'finish'
                } : {
                  title: '处理人员跟进',
                  description: '待处理',
                  status: 'wait'
                },
                ...(selectedOrder.refundHistory || []).length > 0 ? (selectedOrder.refundHistory || []).map((r, idx) => ({
                  title: `第${idx + 1}轮退款`,
                  description: r.appliedAt,
                  content: (
                    <div>
                      <p>申请 ¥{r.amount}：{r.reason}（{r.applicant}）</p>
                      {r.reviewedAt ? (
                        <p>
                          <b>{r.reviewedBy}</b> 审核：
                          {r.status === 'approved' ? 
                            <Tag color="success">通过</Tag> : 
                            r.returnToHandler ?
                            <Tag color="warning">退回处理人员</Tag> :
                            <Tag color="default">拒绝</Tag>
                          }
                          {r.managerNote && <span style={{ marginLeft: 8, color: '#666' }}>{r.managerNote}</span>}
                        </p>
                      ) : <Tag color="warning">待审核</Tag>}
                    </div>
                  ),
                  status: r.reviewedAt 
                    ? (r.status === 'approved' ? 'finish' : r.returnToHandler ? 'error' : 'finish') 
                    : 'process' as const,
                })) : selectedOrder.refundRecord ? [{
                  title: '第1轮退款',
                  description: selectedOrder.refundRecord.appliedAt,
                  content: (
                    <div>
                      <p>申请 ¥{selectedOrder.refundRecord.amount}：{selectedOrder.refundRecord.reason}</p>
                      {selectedOrder.refundRecord.reviewedAt ? (
                        <p>
                          <b>{selectedOrder.refundRecord.reviewedBy}</b> 审核：
                          {selectedOrder.refundRecord.status === 'approved' ? 
                            <Tag color="success">通过</Tag> : 
                            selectedOrder.refundRecord.returnToHandler ?
                            <Tag color="warning">退回处理人员</Tag> :
                            <Tag color="default">拒绝</Tag>
                          }
                          {selectedOrder.refundRecord.managerNote && <span style={{ marginLeft: 8, color: '#666' }}>{selectedOrder.refundRecord.managerNote}</span>}
                        </p>
                      ) : <Tag color="warning">待审核</Tag>}
                    </div>
                  ),
                  status: selectedOrder.refundRecord.reviewedAt ? 'finish' : 'process',
                }] : [{
                  title: '店长审核',
                  description: '-',
                  status: 'wait' as const,
                }],
              ].flat() as any}
              style={{ marginBottom: 24 }}
            />

            <Descriptions title="订单信息" bordered column={2} size="small">
              <Descriptions.Item label="订单号">{selectedOrder.orderNo}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag>{orderStatusLabels[selectedOrder.status] || selectedOrder.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="包厢">{selectedOrder.roomName} ({selectedOrder.roomType})</Descriptions.Item>
              <Descriptions.Item label="客人">{selectedOrder.memberName || '散客'}</Descriptions.Item>
              <Descriptions.Item label="入场时间">{selectedOrder.checkInTime}</Descriptions.Item>
              <Descriptions.Item label="离场时间">{selectedOrder.checkOutTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="消费合计">¥{selectedOrder.totalAmount}</Descriptions.Item>
              <Descriptions.Item label="储值抵扣">¥{selectedOrder.useBalance}</Descriptions.Item>
            </Descriptions>

            {selectedOrder.items.length > 0 && (
              <>
                <Divider />
                <h4>酒水小吃明细</h4>
                <Table
                  dataSource={selectedOrder.items}
                  rowKey="drinkId"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '商品', dataIndex: 'drinkName', key: 'drinkName' },
                    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
                    { title: '金额', dataIndex: 'price', key: 'price', render: (v: number) => `¥${v}` },
                    { title: '备注', key: 'note', render: (_: any, record: any) => 
                      record.isComplimentary ? <Tag color="green">赠送</Tag> : null
                    },
                  ]}
                />
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="会员充值"
        open={rechargeModalVisible}
        onCancel={() => setRechargeModalVisible(false)}
        footer={null}
        width={400}
      >
        {selectedMember && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="姓名">{selectedMember.name}</Descriptions.Item>
                <Descriptions.Item label="手机号">{selectedMember.phone}</Descriptions.Item>
                <Descriptions.Item label="等级">{selectedMember.level}</Descriptions.Item>
                <Descriptions.Item label="当前余额">¥{selectedMember.balance.toFixed(2)}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Form form={rechargeForm} layout="vertical" onFinish={handleRecharge}>
              <Form.Item 
                name="amount" 
                label="充值金额（元）" 
                rules={[{ required: true, message: '请输入充值金额' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入充值金额" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  确认充值
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}
