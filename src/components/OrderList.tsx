import {
    AlertOutlined,
    ArrowRightOutlined,
    CarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    DollarOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    EyeOutlined,
    FilterOutlined,
    InfoCircleOutlined,
    SearchOutlined,
    SwapOutlined,
    UserOutlined
} from '@ant-design/icons';
import {
    Alert,
    Avatar,
    Button,
    Card,
    Col,
    Descriptions,
    Divider,
    Drawer,
    Form,
    Input,
    InputNumber,
    List,
    message,
    Modal,
    Row,
    Select,
    Space,
    Statistic,
    Steps,
    Table,
    Tag,
    Timeline,
    Tooltip,
    Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import {
    ABNORMAL_TYPE_LABEL,
    ORDER_STATUS_LABEL,
    PARKING_LOTS,
    ROLE_LABEL
} from '../mock/data';
import type {
    AbnormalRepair,
    ParkingOrder,
    ParkingOrderStatus,
    RoleType,
    User,
} from '../types';

const { Title, Text } = Typography;
const { RangePicker } = Input;

interface OrderListProps {
  orders: ParkingOrder[];
  repairs: AbnormalRepair[];
  users: User[];
  currentUser: User;
  onAddStatusLog: (
    orderId: string,
    from: string,
    to: string,
    remark: string
  ) => void;
  onAddRemark: (orderId: string, content: string) => void;
  onAssignHandler: (orderId: string, userId: string) => void;
  onConfirmPayment: (
    repairId: string,
    amount: number,
    remark: string
  ) => void;
}

const roleColor: Record<RoleType, string> = {
  operator: 'blue',
  customer_service: 'green',
  maintenance: 'orange',
};

const statusColor: Record<string, string> = {
  pending_enter: 'default',
  entered: 'blue',
  pending_pay: 'gold',
  paid: 'cyan',
  pending_exit: 'purple',
  exited: 'green',
  abnormal: 'orange',
  stuck: 'red',
};

const abnormalColor: Record<string, string> = {
  gate_malfunction: 'red',
  payment_timeout: 'orange',
  plate_recognition_error: 'magenta',
  fee_dispute: 'gold',
  force_exit: 'volcano',
  unknown: 'default',
};

const OrderList: React.FC<OrderListProps> = ({
  orders,
  repairs,
  users,
  currentUser,
  onAddStatusLog,
  onAddRemark,
  onAssignHandler,
  onConfirmPayment,
}) => {
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<ParkingOrderStatus[] | undefined>();
  const [abnormalFilter, setAbnormalFilter] = useState<string[] | undefined>();
  const [lotFilter, setLotFilter] = useState<string | undefined>();
  const [handlerRoleFilter, setHandlerRoleFilter] = useState<RoleType | 'all' | 'unassigned'>('all');
  const [mineOnly, setMineOnly] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [remarkModal, setRemarkModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [remarkForm] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [paymentForm] = Form.useForm();

  const filtered = useMemo(() => {
    let list = [...orders];
    if (keyword) {
      const k = keyword.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(k) ||
          o.plateNo.toLowerCase().includes(k) ||
          o.parkingLotName.toLowerCase().includes(k)
      );
    }
    if (statusFilter && statusFilter.length > 0) {
      list = list.filter((o) => statusFilter.includes(o.status));
    }
    if (abnormalFilter && abnormalFilter.length > 0) {
      list = list.filter((o) => o.abnormalType && abnormalFilter.includes(o.abnormalType));
    }
    if (lotFilter) {
      list = list.filter((o) => o.parkingLotId === lotFilter);
    }
    if (handlerRoleFilter === 'unassigned') {
      list = list.filter((o) => !o.currentHandlerId);
    } else if (handlerRoleFilter !== 'all') {
      list = list.filter((o) => o.currentHandlerRole === handlerRoleFilter);
    }
    if (mineOnly) {
      list = list.filter((o) => o.currentHandlerId === currentUser.id);
    }
    return list.sort(
      (a, b) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime()
    );
  }, [orders, keyword, statusFilter, abnormalFilter, lotFilter, handlerRoleFilter, mineOnly, currentUser.id]);

  const selected = useMemo(
    () => orders.find((o) => o.id === selectedId) || null,
    [orders, selectedId]
  );

  const selectedRepair = useMemo(
    () => (selected ? repairs.find((r) => r.orderId === selected.id) : null),
    [repairs, selected]
  );

  const openDrawer = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const handleSubmitRemark = async () => {
    const vals = await remarkForm.validateFields();
    if (!selectedId) return;
    onAddRemark(selectedId, vals.content);
    message.success('备注已添加');
    remarkForm.resetFields();
    setRemarkModal(false);
  };

  const handleAssign = async () => {
    const vals = await assignForm.validateFields();
    if (!selectedId) return;
    onAssignHandler(selectedId, vals.userId);
    message.success('处理人已更新');
    assignForm.resetFields();
    setAssignModal(false);
  };

  const handleStatusChange = async () => {
    const vals = await statusForm.validateFields();
    if (!selected) return;
    onAddStatusLog(selected.id, selected.status, vals.toStatus, vals.remark);
    message.success('状态已变更');
    statusForm.resetFields();
    setStatusModal(false);
  };

  const handlePayment = async () => {
    const vals = await paymentForm.validateFields();
    if (!selectedRepair) return;
    onConfirmPayment(selectedRepair.id, vals.amount, vals.remark || '线下补缴确认');
    message.success(`已确认补缴 ¥${vals.amount}`);
    paymentForm.resetFields();
    setPaymentModal(false);
  };

  const columns = [
    {
      title: '订单/车牌',
      dataIndex: 'plateNo',
      key: 'plateNo',
      fixed: 'left' as const,
      width: 200,
      render: (_: string, rec: ParkingOrder) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ fontSize: 15 }}>
            <CarOutlined /> {rec.plateNo}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {rec.orderNo}
          </Text>
          {rec.plateConfidence !== undefined && rec.plateConfidence < 90 && (
            <Tooltip title={`识别置信度 ${rec.plateConfidence}%，偏低请复核`}>
              <Tag color="magenta" icon={<ExclamationCircleOutlined />} style={{ margin: 0 }}>
                识别 {rec.plateConfidence}%
              </Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '订单状态',
      key: 'status',
      width: 180,
      render: (_: unknown, rec: ParkingOrder) => (
        <Space direction="vertical" size={2}>
          <Tag color={statusColor[rec.status]} style={{ fontSize: 13 }}>
            {ORDER_STATUS_LABEL[rec.status]}
          </Tag>
          {rec.abnormalType && (
            <Tag color={abnormalColor[rec.abnormalType]} icon={<AlertOutlined />}>
              {ABNORMAL_TYPE_LABEL[rec.abnormalType]}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '卡点 / 异常说明',
      key: 'stuck',
      width: 280,
      render: (_: unknown, rec: ParkingOrder) => (
        <Space direction="vertical" size={2} style={{ maxWidth: 280 }}>
          {rec.stuckPoint ? (
            <Tooltip title={rec.stuckPoint}>
              <Tag color="warning" icon={<InfoCircleOutlined />} style={{ whiteSpace: 'normal' }}>
                卡点：{rec.stuckPoint.length > 28 ? rec.stuckPoint.slice(0, 28) + '…' : rec.stuckPoint}
              </Tag>
            </Tooltip>
          ) : rec.abnormalDesc ? (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {rec.abnormalDesc.length > 40 ? rec.abnormalDesc.slice(0, 40) + '…' : rec.abnormalDesc}
            </Text>
          ) : (
            <Text type="secondary">—</Text>
          )}
          {(() => {
            const rowRepair = repairs.find((r) => r.orderId === rec.id);
            return rowRepair?.blockerReason ? (
              <Tooltip title={rowRepair.blockerReason}>
                <Tag color="red" icon={<AlertOutlined />}>
                  阻塞原因
                </Tag>
              </Tooltip>
            ) : null;
          })()}
        </Space>
      ),
    },
    {
      title: '谁在处理',
      key: 'handler',
      width: 170,
      render: (_: unknown, rec: ParkingOrder) => (
        <Space direction="vertical" size={2}>
          {rec.currentHandlerName ? (
            <>
              <Space size={4}>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  style={{
                    backgroundColor: rec.currentHandlerRole
                      ? roleColor[rec.currentHandlerRole]
                      : '#999',
                  }}
                />
                <Text strong>{rec.currentHandlerName}</Text>
              </Space>
              <Tag
                color={rec.currentHandlerRole ? roleColor[rec.currentHandlerRole] : 'default'}
                style={{ margin: 0, fontSize: 11 }}
              >
                {rec.currentHandlerRole ? ROLE_LABEL[rec.currentHandlerRole] : '未指定'}
              </Tag>
            </>
          ) : (
            <Tag color="default" icon={<UserOutlined />}>
              待指派
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '停车场 / 道闸',
      key: 'lot',
      width: 180,
      render: (_: unknown, rec: ParkingOrder) => (
        <Space direction="vertical" size={2}>
          <Text style={{ fontSize: 12 }}>{rec.parkingLotName}</Text>
          {rec.gateName && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {rec.gateName}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '费用',
      key: 'fee',
      width: 160,
      render: (_: unknown, rec: ParkingOrder) => (
        <Space direction="vertical" size={0}>
          <Text>
            <DollarOutlined /> 应收 <Text strong>¥{rec.actualFee.toFixed(2)}</Text>
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            已缴 ¥{rec.paidAmount.toFixed(2)}
          </Text>
          {rec.actualFee - rec.paidAmount > 0 && (
            <Text type="danger" style={{ fontSize: 12 }}>
              欠缴 ¥{(rec.actualFee - rec.paidAmount).toFixed(2)}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '关键时间',
      key: 'time',
      width: 180,
      render: (_: unknown, rec: ParkingOrder) => (
        <Space direction="vertical" size={2}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            入场 {dayjs(rec.enterTime).format('MM-DD HH:mm')}
          </Text>
          {rec.exitTime && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              出场 {dayjs(rec.exitTime).format('MM-DD HH:mm')}
            </Text>
          )}
          <Tooltip title={`更新时间：${dayjs(rec.updateTime).format('YYYY-MM-DD HH:mm:ss')}`}>
            <Tag color="blue" icon={<ClockCircleOutlined />} style={{ margin: 0, fontSize: 11 }}>
              {dayjs(rec.updateTime).fromNow()}
            </Tag>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 180,
      render: (_: unknown, rec: ParkingOrder) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDrawer(rec.id)}
          >
            详情
          </Button>
          {rec.currentHandlerId === currentUser.id &&
            (rec.status === 'stuck' || rec.status === 'abnormal') && (
              <Button
                size="small"
                type="primary"
                ghost
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  setSelectedId(rec.id);
                  setStatusModal(true);
                  statusForm.setFieldsValue({ toStatus: 'exited', remark: '' });
                }}
              >
                推进
              </Button>
            )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Form layout="vertical" style={{ marginBottom: -16 }}>
          <Row gutter={[16, 0]} align="bottom">
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="关键字搜索（订单号/车牌/停车场）">
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="输入订单号、车牌或停车场"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="订单状态">
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="选择状态（可多选）"
                  value={statusFilter}
                  onChange={(v) => setStatusFilter(v)}
                  options={Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => ({
                    label: v,
                    value: k,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Form.Item label="异常类型">
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="异常类型"
                  value={abnormalFilter}
                  onChange={(v) => setAbnormalFilter(v)}
                  options={Object.entries(ABNORMAL_TYPE_LABEL).map(([k, v]) => ({
                    label: v,
                    value: k,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item label="停车场">
                <Select
                  allowClear
                  placeholder="选择停车场"
                  value={lotFilter}
                  onChange={(v) => setLotFilter(v)}
                  options={PARKING_LOTS.map((p) => ({ label: p.name, value: p.id }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item label="责任人角色">
                <Select
                  value={handlerRoleFilter}
                  onChange={(v) => setHandlerRoleFilter(v)}
                  options={[
                    { label: '全部', value: 'all' },
                    { label: '未指派', value: 'unassigned' },
                    { label: '运营专员', value: 'operator' },
                    { label: '客服', value: 'customer_service' },
                    { label: '设备维护员', value: 'maintenance' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Form.Item>
                <Space wrap>
                  <Button
                    type={mineOnly ? 'primary' : 'default'}
                    icon={<UserOutlined />}
                    onClick={() => setMineOnly(!mineOnly)}
                  >
                    只看我的 ({orders.filter((o) => o.currentHandlerId === currentUser.id).length})
                  </Button>
                  <Button
                    icon={<FilterOutlined />}
                    onClick={() => {
                      setKeyword('');
                      setStatusFilter(undefined);
                      setAbnormalFilter(undefined);
                      setLotFilter(undefined);
                      setHandlerRoleFilter('all');
                      setMineOnly(false);
                    }}
                  >
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card
        bordered={false}
        title={
          <Space>
            <span>临停订单列表</span>
            <Tag color="blue">{filtered.length} 条</Tag>
            <Tooltip title="支持连续处理：打开详情后可快速切换下一条">
              <InfoCircleOutlined />
            </Tooltip>
          </Space>
        }
      >
        <Table
          rowKey="id"
          size="middle"
          columns={columns as any}
          dataSource={filtered}
          scroll={{ x: 1500 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条订单`,
          }}
          rowClassName={(rec) =>
            rec.status === 'stuck'
              ? 'row-stuck'
              : rec.status === 'abnormal'
              ? 'row-abnormal'
              : ''
          }
        />
      </Card>

      <Drawer
        title={
          selected ? (
            <Space>
              <CarOutlined />
              <span>订单详情：{selected.plateNo}</span>
              <Tag color={statusColor[selected.status]}>{ORDER_STATUS_LABEL[selected.status]}</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {selected.orderNo}
              </Text>
            </Space>
          ) : (
            '订单详情'
          )
        }
        width={820}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          selected && (
            <Space>
              <Button icon={<SwapOutlined />} onClick={() => setAssignModal(true)}>
                指派处理人
              </Button>
              <Button icon={<EditOutlined />} onClick={() => setRemarkModal(true)}>
                添加备注
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  setStatusModal(true);
                  statusForm.setFieldsValue({ toStatus: selected.status, remark: '' });
                }}
              >
                推进状态
              </Button>
            </Space>
          )
        }
      >
        {selected && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card size="small" title="📋 基础信息" bordered={false} style={{ background: '#fafafa' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="车牌号码">
                  <Text strong>{selected.plateNo}</Text>
                  {selected.plateConfidence !== undefined && (
                    <Tag color={selected.plateConfidence < 90 ? 'magenta' : 'green'} style={{ marginLeft: 8 }}>
                      识别 {selected.plateConfidence}%
                    </Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="订单号">{selected.orderNo}</Descriptions.Item>
                <Descriptions.Item label="停车场">{selected.parkingLotName}</Descriptions.Item>
                <Descriptions.Item label="关联道闸">
                  {selected.gateName || <Text type="secondary">—</Text>}
                </Descriptions.Item>
                <Descriptions.Item label="入场时间">
                  {dayjs(selected.enterTime).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="出场时间">
                  {selected.exitTime
                    ? dayjs(selected.exitTime).format('YYYY-MM-DD HH:mm:ss')
                    : <Tag color="warning">未出场</Tag>}
                </Descriptions.Item>
                <Descriptions.Item label="停车时长">
                  {selected.parkingDuration
                    ? `${Math.floor(selected.parkingDuration / 60)}小时${selected.parkingDuration % 60}分钟`
                    : '进行中'}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {dayjs(selected.createTime).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              size="small"
              bordered={false}
              style={{
                borderLeft: `4px solid ${selected.status === 'stuck' || selected.status === 'abnormal' ? '#ff4d4f' : '#52c41a'}`,
              }}
              title={
                <Space>
                  <ExclamationCircleOutlined />
                  <span>主链路三问回答</span>
                </Space>
              }
            >
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Card size="small" type="inner" title="① 谁在处理？">
                    {selected.currentHandlerName ? (
                      <Space direction="vertical" size={4}>
                        <Space>
                          <Avatar
                            size="small"
                            style={{ backgroundColor: roleColor[selected.currentHandlerRole!] }}
                            icon={<UserOutlined />}
                          />
                          <Text strong>{selected.currentHandlerName}</Text>
                        </Space>
                        <Tag color={roleColor[selected.currentHandlerRole!]}>
                          {ROLE_LABEL[selected.currentHandlerRole!]}
                        </Tag>
                        {selected.currentHandlerId === currentUser.id && (
                          <Tag color="green">当前登录人</Tag>
                        )}
                      </Space>
                    ) : (
                      <Tag color="default">待指派</Tag>
                    )}
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" type="inner" title="② 卡在哪里？">
                    <Space direction="vertical" size={4}>
                      <Tag color={statusColor[selected.status]}>
                        当前：{ORDER_STATUS_LABEL[selected.status]}
                      </Tag>
                      {selected.stuckPoint ? (
                        <Text type="danger">{selected.stuckPoint}</Text>
                      ) : selected.abnormalDesc ? (
                        <Text type="warning">{selected.abnormalDesc}</Text>
                      ) : selectedRepair?.blockerReason ? (
                        <Text type="warning">{selectedRepair.blockerReason}</Text>
                      ) : (
                        <Text type="secondary">无明显卡点，流程正常</Text>
                      )}
                    </Space>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" type="inner" title="③ 补缴为什么没完成？">
                    {selectedRepair ? (
                      <Space direction="vertical" size={4}>
                        <Space>
                          <Text>待补缴</Text>
                          <Text strong type="danger">
                            ¥{selectedRepair.unpaidAmount.toFixed(2)}
                          </Text>
                        </Space>
                        <Tag color="processing">当前步骤：{selectedRepair.currentStep}</Tag>
                        {selectedRepair.blockerReason ? (
                          <Text type="warning" style={{ fontSize: 12 }}>
                            ⚠️ {selectedRepair.blockerReason}
                          </Text>
                        ) : null}
                      </Space>
                    ) : selected.actualFee - selected.paidAmount > 0 ? (
                      <Space direction="vertical">
                        <Text type="danger">
                          欠缴 ¥{(selected.actualFee - selected.paidAmount).toFixed(2)}
                        </Text>
                        <Text type="secondary">尚未生成补缴单</Text>
                      </Space>
                    ) : (
                      <Tag color="green">已结清</Tag>
                    )}
                  </Card>
                </Col>
              </Row>
            </Card>

            <Card
              size="small"
              title="💰 费用 & 补缴"
              bordered={false}
              style={{ background: '#f6ffed' }}
              extra={
                selectedRepair && selectedRepair.unpaidAmount > 0 ? (
                  <Button
                    type="primary"
                    icon={<DollarOutlined />}
                    onClick={() => {
                      setPaymentModal(true);
                      paymentForm.setFieldsValue({
                        amount: selectedRepair.unpaidAmount,
                        remark: '',
                      });
                    }}
                  >
                    确认到账
                  </Button>
                ) : null
              }
            >
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic title="基础费用" value={selected.baseFee} prefix="¥" />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="优惠减免"
                    value={selected.discountAmount}
                    prefix="¥"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="已缴金额"
                    value={selected.paidAmount}
                    prefix="¥"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="欠缴金额"
                    value={Math.max(0, selected.actualFee - selected.paidAmount)}
                    prefix="¥"
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
              </Row>
            </Card>

            {selectedRepair && (
              <Card size="small" title="🧾 补缴单追踪" bordered={false}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="补缴单号">
                    <Text strong>{selectedRepair.repairNo}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="补缴状态">
                    <Tag
                      color={
                        selectedRepair.repairStatus === 'completed'
                          ? 'green'
                          : selectedRepair.repairStatus === 'pending'
                          ? 'red'
                          : selectedRepair.repairStatus === 'processing'
                          ? 'processing'
                          : 'gold'
                      }
                    >
                      {selectedRepair.repairStatus === 'completed'
                        ? '已完成'
                        : selectedRepair.repairStatus === 'pending'
                        ? '待处理'
                        : selectedRepair.repairStatus === 'processing'
                        ? '处理中'
                        : selectedRepair.repairStatus === 'pending_confirm'
                        ? '待确认'
                        : '处理失败'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="当前步骤" span={2}>
                    <Steps
                      size="small"
                      current={
                        ['pending', 'processing', 'pending_confirm', 'completed'].indexOf(
                          selectedRepair.repairStatus
                        )
                      }
                      style={{ marginTop: 4 }}
                    >
                      <Steps.Step title="待处理" />
                      <Steps.Step title="处理中" description={selectedRepair.currentStep} />
                      <Steps.Step title="待确认" />
                      <Steps.Step title="已完成" />
                    </Steps>
                  </Descriptions.Item>
                  <Descriptions.Item label="总应缴">¥{selectedRepair.feeAmount.toFixed(2)}</Descriptions.Item>
                  <Descriptions.Item label="实缴 / 待缴">
                    <Text type="success">¥{selectedRepair.paidAmount.toFixed(2)}</Text> /{' '}
                    <Text type="danger">¥{selectedRepair.unpaidAmount.toFixed(2)}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="阻塞原因" span={2}>
                    {selectedRepair.blockerReason || <Text type="secondary">无</Text>}
                  </Descriptions.Item>
                </Descriptions>

                <Divider orientation="left" style={{ margin: '16px 0 8px' }}>
                  补缴处理轨迹
                </Divider>
                <Timeline
                  mode="left"
                  items={selectedRepair.repairLogs
                    .slice()
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                    .map((log) => ({
                      color: log.operatorRole === 'maintenance' ? 'orange' : log.operatorRole === 'customer_service' ? 'green' : 'blue',
                      label: dayjs(log.timestamp).format('MM-DD HH:mm:ss'),
                      children: (
                        <div>
                          <Space>
                            <Text strong>{log.step}</Text>
                            <Text type="secondary">·</Text>
                            <Text type="secondary">{log.action}</Text>
                          </Space>
                          <div style={{ marginTop: 4 }}>
                            <Tag color={roleColor[log.operatorRole]}>
                              {ROLE_LABEL[log.operatorRole]} · {log.operatorName}
                            </Tag>
                            <Text style={{ marginLeft: 8 }}>{log.remark}</Text>
                          </div>
                          {log.result && (
                            <Tag color="green" style={{ marginTop: 4 }}>
                              结果：{log.result}
                            </Tag>
                          )}
                        </div>
                      ),
                    }))}
                />
              </Card>
            )}

            <Card size="small" title="📊 状态流转历史" bordered={false}>
              <Timeline
                mode="left"
                items={selected.statusLogs
                  .slice()
                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                  .map((log) => ({
                    color:
                      log.toStatus === 'stuck' || log.toStatus === 'abnormal'
                        ? 'red'
                        : log.toStatus === 'exited' || log.toStatus === 'paid'
                        ? 'green'
                        : 'blue',
                    label: dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss'),
                    children: (
                      <div>
                        <Space>
                          <Tag color={statusColor[log.fromStatus]}>
                            {ORDER_STATUS_LABEL[log.fromStatus] || log.fromStatus}
                          </Tag>
                          <ArrowRightOutlined />
                          <Tag color={statusColor[log.toStatus]}>
                            {ORDER_STATUS_LABEL[log.toStatus] || log.toStatus}
                          </Tag>
                        </Space>
                        <div style={{ marginTop: 4 }}>
                          <Tag color={roleColor[log.operatorRole]}>
                            {ROLE_LABEL[log.operatorRole]} · {log.operatorName}
                          </Tag>
                          <Text style={{ marginLeft: 8 }}>{log.remark}</Text>
                        </div>
                      </div>
                    ),
                  }))}
              />
            </Card>

            <Card size="small" title="📝 备注记录" bordered={false}>
              {selected.remarks.length === 0 ? (
                <Text type="secondary">暂无备注</Text>
              ) : (
                <List
                  dataSource={[...selected.remarks].sort(
                    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  )}
                  renderItem={(r) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            style={{ backgroundColor: roleColor[r.operatorRole] }}
                            icon={<UserOutlined />}
                          />
                        }
                        title={
                          <Space>
                            <Text strong>{r.operatorName}</Text>
                            <Tag color={roleColor[r.operatorRole]}>
                              {ROLE_LABEL[r.operatorRole]}
                            </Tag>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(r.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                            </Text>
                          </Space>
                        }
                        description={r.content}
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Space>
        )}
      </Drawer>

      <Modal
        title="添加备注"
        open={remarkModal}
        onCancel={() => setRemarkModal(false)}
        onOk={handleSubmitRemark}
        okText="保存备注"
      >
        <Form form={remarkForm} layout="vertical">
          <Form.Item
            name="content"
            label="备注内容"
            rules={[{ required: true, message: '请输入备注内容' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入备注，将记录操作人、时间点" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="指派处理人"
        open={assignModal}
        onCancel={() => setAssignModal(false)}
        onOk={handleAssign}
        okText="确认指派"
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="userId"
            label="选择处理人"
            rules={[{ required: true, message: '请选择处理人' }]}
          >
            <Select
              placeholder="选择处理人（按角色分工）"
              optionFilterProp="label"
              options={users.map((u) => ({
                label: (
                  <Space>
                    <Avatar size="small" style={{ backgroundColor: roleColor[u.role] }}>
                      {u.name[0]}
                    </Avatar>
                    <Text strong>{u.name}</Text>
                    <Tag color={roleColor[u.role]}>{ROLE_LABEL[u.role]}</Tag>
                  </Space>
                ),
                value: u.id,
              }))}
            />
          </Form.Item>
          <Alert
            type="info"
            showIcon
            message="业务分工提示"
            description={
              <Space direction="vertical" size={2}>
                <div>• 运营专员：道闸卡单、放行操作、补缴派单</div>
                <div>• 客服：车主沟通、费用争议、催缴跟进</div>
                <div>• 设备维护员：道闸硬件、识别摄像头、系统崩溃排查</div>
              </Space>
            }
          />
        </Form>
      </Modal>

      <Modal
        title="推进订单状态"
        open={statusModal}
        onCancel={() => setStatusModal(false)}
        onOk={handleStatusChange}
        okText="确认变更"
      >
        {selected && (
          <Form form={statusForm} layout="vertical">
            <Descriptions column={1} size="small" style={{ marginBottom: 12 }}>
              <Descriptions.Item label="车牌">
                <Text strong>{selected.plateNo}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color={statusColor[selected.status]}>
                  {ORDER_STATUS_LABEL[selected.status]}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            <Form.Item
              name="toStatus"
              label="目标状态"
              rules={[{ required: true, message: '请选择目标状态' }]}
            >
              <Select
                options={Object.entries(ORDER_STATUS_LABEL)
                  .filter(([k]) => k !== selected.status)
                  .map(([k, v]) => ({
                    label: (
                      <Space>
                        <Tag color={statusColor[k]}>{v}</Tag>
                      </Space>
                    ),
                    value: k,
                  }))}
              />
            </Form.Item>
            <Form.Item
              name="remark"
              label="变更原因 / 说明"
              rules={[{ required: true, message: '请说明变更原因' }]}
            >
              <Input.TextArea rows={3} placeholder="状态变更将永久记录，包含操作人、时间和原因" />
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title="确认补缴到账"
        open={paymentModal}
        onCancel={() => setPaymentModal(false)}
        onOk={handlePayment}
        okText="确认到账"
        okButtonProps={{ danger: true }}
      >
        <Form form={paymentForm} layout="vertical">
          {selectedRepair && (
            <Descriptions column={1} size="small" style={{ marginBottom: 12 }}>
              <Descriptions.Item label="车牌">{selectedRepair.plateNo}</Descriptions.Item>
              <Descriptions.Item label="补缴单号">{selectedRepair.repairNo}</Descriptions.Item>
              <Descriptions.Item label="待缴金额">
                <Text type="danger" strong>
                  ¥{selectedRepair.unpaidAmount.toFixed(2)}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          )}
          <Form.Item
            name="amount"
            label="本次到账金额 (¥)"
            rules={[{ required: true, message: '请输入到账金额' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.01}
              step={1}
              precision={2}
              placeholder="请输入实际到账金额"
            />
          </Form.Item>
          <Form.Item name="remark" label="备注 / 支付说明">
            <Input.TextArea rows={3} placeholder="例如：微信转账、现金、线下补缴等" />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .row-stuck > td { background: #fff1f0 !important; }
        .row-abnormal > td { background: #fff7e6 !important; }
      `}</style>
    </div>
  );
};

export default OrderList;
