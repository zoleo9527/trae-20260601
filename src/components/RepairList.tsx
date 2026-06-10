import {
    AlertOutlined,
    CarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    DollarOutlined,
    EditOutlined,
    EyeOutlined,
    HistoryOutlined,
    InfoCircleOutlined,
    SearchOutlined,
    StopOutlined,
    SwapOutlined,
    TeamOutlined,
    UserOutlined,
    WarningOutlined
} from '@ant-design/icons';
import {
    Alert,
    Avatar,
    Button,
    Card,
    Col,
    Descriptions,
    Drawer,
    Form,
    Input,
    InputNumber,
    message,
    Modal,
    Progress,
    Row,
    Select,
    Space,
    Statistic,
    Steps,
    Table,
    Tag,
    Timeline,
    Tooltip,
    Typography
} from 'antd';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import {
    ABNORMAL_TYPE_LABEL,
    REPAIR_STATUS_LABEL,
    ROLE_LABEL
} from '../mock/data';
import type {
    AbnormalRepair,
    ParkingOrder,
    RepairStatus,
    RoleType,
    User,
} from '../types';

const { Title, Text } = Typography;

interface RepairListProps {
  repairs: AbnormalRepair[];
  orders: ParkingOrder[];
  users: User[];
  currentUser: User;
  onUpdateStatus: (
    repairId: string,
    status: RepairStatus,
    step: string,
    action: string,
    remark: string,
    currentStep?: string,
    blockerReason?: string
  ) => void;
  onAddLog: (
    repairId: string,
    step: string,
    action: string,
    remark: string,
    currentStep?: string,
    blockerReason?: string
  ) => void;
  onConfirmPayment: (repairId: string, amount: number, remark: string) => void;
  onAssignRepair: (repairId: string, userId: string) => void;
}

const roleColor: Record<RoleType, string> = {
  operator: 'blue',
  customer_service: 'green',
  maintenance: 'orange',
};

const repairStatusColor: Record<string, string> = {
  pending: 'red',
  processing: 'processing',
  pending_confirm: 'gold',
  completed: 'green',
  failed: 'default',
};

const abnormalColor: Record<string, string> = {
  gate_malfunction: 'red',
  payment_timeout: 'orange',
  plate_recognition_error: 'magenta',
  fee_dispute: 'gold',
  force_exit: 'volcano',
  unknown: 'default',
};

const RepairList: React.FC<RepairListProps> = ({
  repairs,
  orders,
  users,
  currentUser,
  onUpdateStatus,
  onAddLog,
  onConfirmPayment,
  onAssignRepair,
}) => {
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<RepairStatus[] | undefined>();
  const [abnormalFilter, setAbnormalFilter] = useState<string[] | undefined>();
  const [assigneeRoleFilter, setAssigneeRoleFilter] = useState<RoleType | 'all' | 'unassigned'>('all');
  const [hasBlockerOnly, setHasBlockerOnly] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [stepModal, setStepModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [stepForm] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [assignForm] = Form.useForm();

  const filtered = useMemo(() => {
    let list = [...repairs];
    if (keyword) {
      const k = keyword.toLowerCase();
      list = list.filter(
        (r) =>
          r.repairNo.toLowerCase().includes(k) ||
          r.orderNo.toLowerCase().includes(k) ||
          r.plateNo.toLowerCase().includes(k)
      );
    }
    if (statusFilter && statusFilter.length > 0) {
      list = list.filter((r) => statusFilter.includes(r.repairStatus));
    }
    if (abnormalFilter && abnormalFilter.length > 0) {
      list = list.filter((r) => abnormalFilter.includes(r.abnormalType));
    }
    if (assigneeRoleFilter === 'unassigned') {
      list = list.filter((r) => !r.assigneeId);
    } else if (assigneeRoleFilter !== 'all') {
      list = list.filter((r) => r.assigneeRole === assigneeRoleFilter);
    }
    if (hasBlockerOnly) {
      list = list.filter((r) => r.blockerReason && r.blockerReason.length > 0);
    }
    if (mineOnly) {
      list = list.filter((r) => r.assigneeId === currentUser.id);
    }
    return list.sort(
      (a, b) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime()
    );
  }, [repairs, keyword, statusFilter, abnormalFilter, assigneeRoleFilter, hasBlockerOnly, mineOnly, currentUser.id]);

  const selected = useMemo(
    () => repairs.find((r) => r.id === selectedId) || null,
    [repairs, selectedId]
  );

  const relatedOrder = useMemo(
    () => (selected ? orders.find((o) => o.id === selected.orderId) : null),
    [orders, selected]
  );

  const openDrawer = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const handleStepSubmit = async () => {
    const vals = await stepForm.validateFields();
    if (!selectedId) return;
    onAddLog(
      selectedId,
      vals.step,
      vals.action,
      vals.remark,
      vals.currentStep || undefined,
      typeof vals.blockerReason === 'string' ? vals.blockerReason : ''
    );
    message.success('处理步骤已记录');
    stepForm.resetFields();
    setStepModal(false);
  };

  const handleStatusSubmit = async () => {
    const vals = await statusForm.validateFields();
    if (!selected) return;
    onUpdateStatus(
      selected.id,
      vals.toStatus,
      '状态变更',
      `推进至 ${REPAIR_STATUS_LABEL[vals.toStatus]}`,
      vals.remark,
      vals.currentStep || undefined,
      typeof vals.blockerReason === 'string' ? vals.blockerReason : ''
    );
    message.success('补缴状态已更新');
    statusForm.resetFields();
    setStatusModal(false);
  };

  const handlePayment = async () => {
    const vals = await paymentForm.validateFields();
    if (!selected) return;
    onConfirmPayment(selected.id, vals.amount, vals.remark || '线下补缴确认');
    message.success(`已确认补缴 ¥${vals.amount}`);
    paymentForm.resetFields();
    setPaymentModal(false);
  };

  const handleAssign = async () => {
    const vals = await assignForm.validateFields();
    if (!selectedId) return;
    onAssignRepair(selectedId, vals.userId);
    message.success('已重新指派处理人');
    assignForm.resetFields();
    setAssignModal(false);
  };

  const summary = useMemo(() => {
    const totalUnpaid = repairs.reduce((s, r) => s + r.unpaidAmount, 0);
    const byStatus: Record<string, number> = {};
    repairs.forEach((r) => {
      byStatus[r.repairStatus] = (byStatus[r.repairStatus] || 0) + 1;
    });
    const byRole: Record<RoleType, number> = { operator: 0, customer_service: 0, maintenance: 0 };
    repairs.forEach((r) => {
      if (r.assigneeRole && (r.repairStatus === 'pending' || r.repairStatus === 'processing')) {
        byRole[r.assigneeRole]++;
      }
    });
    const hasBlockerCount = repairs.filter((r) => r.blockerReason).length;
    return { totalUnpaid, byStatus, byRole, hasBlockerCount };
  }, [repairs]);

  const columns = [
    {
      title: '补缴单 / 车牌',
      key: 'plate',
      fixed: 'left' as const,
      width: 220,
      render: (_: unknown, r: AbnormalRepair) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ fontSize: 15 }}>
            <CarOutlined /> {r.plateNo}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.repairNo}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            关联：{r.orderNo}
          </Text>
        </Space>
      ),
    },
    {
      title: '异常类型 / 补缴状态',
      key: 'status',
      width: 200,
      render: (_: unknown, r: AbnormalRepair) => (
        <Space direction="vertical" size={2}>
          <Tag color={abnormalColor[r.abnormalType]} icon={<AlertOutlined />}>
            {ABNORMAL_TYPE_LABEL[r.abnormalType]}
          </Tag>
          <Tag color={repairStatusColor[r.repairStatus]}>
            {REPAIR_STATUS_LABEL[r.repairStatus]}
          </Tag>
        </Space>
      ),
    },
    {
      title: '为什么还没完成？',
      key: 'why',
      width: 300,
      render: (_: unknown, r: AbnormalRepair) => (
        <Space direction="vertical" size={2}>
          <Tooltip title={r.currentStep}>
            <Tag color="processing" icon={<ClockCircleOutlined />} style={{ whiteSpace: 'normal' }}>
              当前：{r.currentStep.length > 24 ? r.currentStep.slice(0, 24) + '…' : r.currentStep}
            </Tag>
          </Tooltip>
          {r.blockerReason ? (
            <Tooltip title={r.blockerReason}>
              <Tag color="red" icon={<StopOutlined />} style={{ whiteSpace: 'normal' }}>
                阻塞：{r.blockerReason.length > 24 ? r.blockerReason.slice(0, 24) + '…' : r.blockerReason}
              </Tag>
            </Tooltip>
          ) : null}
          {r.abnormalDesc && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.abnormalDesc.length > 40 ? r.abnormalDesc.slice(0, 40) + '…' : r.abnormalDesc}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '谁在处理',
      key: 'who',
      width: 170,
      render: (_: unknown, r: AbnormalRepair) => (
        <Space direction="vertical" size={2}>
          {r.assigneeName ? (
            <>
              <Space size={4}>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  style={{
                    backgroundColor: r.assigneeRole ? roleColor[r.assigneeRole] : '#999',
                  }}
                />
                <Text strong>{r.assigneeName}</Text>
                {r.assigneeId === currentUser.id && <Tag color="green" style={{ margin: 0 }}>我</Tag>}
              </Space>
              <Tag color={r.assigneeRole ? roleColor[r.assigneeRole] : 'default'} style={{ margin: 0, fontSize: 11 }}>
                {r.assigneeRole ? ROLE_LABEL[r.assigneeRole] : '未指定'}
              </Tag>
            </>
          ) : (
            <Tag color="default" icon={<TeamOutlined />}>
              待指派
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '补缴金额',
      key: 'money',
      width: 180,
      render: (_: unknown, r: AbnormalRepair) => (
        <Space direction="vertical" size={0}>
          <Text>
            应收 <Text strong>¥{r.feeAmount.toFixed(2)}</Text>
          </Text>
          <Text type="success" style={{ fontSize: 12 }}>
            已缴 ¥{r.paidAmount.toFixed(2)}
          </Text>
          {r.unpaidAmount > 0 ? (
            <Text type="danger" style={{ fontSize: 12 }}>
              待缴 ¥{r.unpaidAmount.toFixed(2)}
            </Text>
          ) : (
            <Tag color="green" style={{ fontSize: 11 }}>已结清</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '进度',
      key: 'progress',
      width: 130,
      render: (_: unknown, r: AbnormalRepair) => {
        const percent = r.feeAmount > 0 ? Math.round((r.paidAmount / r.feeAmount) * 100) : 0;
        return (
          <Progress
            percent={percent}
            size="small"
            status={r.repairStatus === 'completed' ? 'success' : r.blockerReason ? 'exception' : 'active'}
            strokeColor={r.repairStatus === 'completed' ? '#52c41a' : r.blockerReason ? '#ff4d4f' : '#1890ff'}
          />
        );
      },
    },
    {
      title: '时间',
      key: 'time',
      width: 150,
      render: (_: unknown, r: AbnormalRepair) => (
        <Space direction="vertical" size={2}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            异常 {dayjs(r.abnormalTime).format('MM-DD HH:mm')}
          </Text>
          <Tooltip title={`更新于 ${dayjs(r.updateTime).format('YYYY-MM-DD HH:mm:ss')}`}>
            <Tag color="blue" icon={<HistoryOutlined />} style={{ margin: 0, fontSize: 11 }}>
              {dayjs(r.updateTime).fromNow()}
            </Tag>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 220,
      render: (_: unknown, r: AbnormalRepair) => (
        <Space wrap>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDrawer(r.id)}
          >
            回看
          </Button>
          {r.assigneeId === currentUser.id && r.repairStatus !== 'completed' && (
            <>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setSelectedId(r.id);
                  stepForm.resetFields();
                  setStepModal(true);
                }}
              >
                跟进
              </Button>
              {r.unpaidAmount > 0 && (
                <Button
                  size="small"
                  type="primary"
                  danger
                  icon={<DollarOutlined />}
                  onClick={() => {
                    setSelectedId(r.id);
                    paymentForm.setFieldsValue({ amount: r.unpaidAmount, remark: '' });
                    setPaymentModal(true);
                  }}
                >
                  到账
                </Button>
              )}
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Alert
        message={
          <Space>
            <InfoCircleOutlined />
            <Text strong>异常补缴回看</Text>
            <Text type="secondary">
              支持按"为什么还没完成"筛选阻塞项，逐条跟进催办，记录每一步动作、责任人和时间点
            </Text>
          </Space>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderTop: '3px solid #13c2c2' }}>
            <Statistic
              title={
                <Space>
                  <DollarOutlined /> 累计待补缴
                </Space>
              }
              value={summary.totalUnpaid}
              prefix="¥"
              precision={2}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title={
                <Space>
                  <WarningOutlined style={{ color: '#ff4d4f' }} /> 待处理补缴单
                </Space>
              }
              value={summary.byStatus.pending || 0}
              suffix="单"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: '#1890ff' }} /> 处理中
                </Space>
              }
              value={summary.byStatus.processing || 0}
              suffix="单"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title={
                <Space>
                  <StopOutlined style={{ color: '#fa8c16' }} /> 有阻塞原因
                </Space>
              }
              value={summary.hasBlockerCount}
              suffix="单"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Row gutter={[16, 0]} align="bottom">
          <Col xs={24} sm={12} md={6}>
            <Form.Item label="搜索（补缴单/订单/车牌）" style={{ marginBottom: 0 }}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="输入关键字"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Form.Item label="补缴状态" style={{ marginBottom: 0 }}>
              <Select
                mode="multiple"
                allowClear
                placeholder="选择状态"
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                options={Object.entries(REPAIR_STATUS_LABEL).map(([k, v]) => ({ label: v, value: k }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Form.Item label="异常类型" style={{ marginBottom: 0 }}>
              <Select
                mode="multiple"
                allowClear
                placeholder="选择异常类型"
                value={abnormalFilter}
                onChange={(v) => setAbnormalFilter(v)}
                options={Object.entries(ABNORMAL_TYPE_LABEL).map(([k, v]) => ({ label: v, value: k }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Form.Item label="责任人角色" style={{ marginBottom: 0 }}>
              <Select
                value={assigneeRoleFilter}
                onChange={(v) => setAssigneeRoleFilter(v)}
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
          <Col xs={24} md={4}>
            <Form.Item style={{ marginBottom: 0 }}>
              <Space wrap>
                <Button
                  type={mineOnly ? 'primary' : 'default'}
                  icon={<UserOutlined />}
                  onClick={() => setMineOnly(!mineOnly)}
                >
                  我的 ({repairs.filter((r) => r.assigneeId === currentUser.id).length})
                </Button>
                <Button
                  type={hasBlockerOnly ? 'primary' : 'default'}
                  danger={hasBlockerOnly}
                  icon={<StopOutlined />}
                  onClick={() => setHasBlockerOnly(!hasBlockerOnly)}
                >
                  有阻塞 ({summary.hasBlockerCount})
                </Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        bordered={false}
        title={
          <Space>
            <span>异常补缴单列表</span>
            <Tag color="blue">{filtered.length} 条</Tag>
          </Space>
        }
      >
        <Table
          rowKey="id"
          size="middle"
          columns={columns as any}
          dataSource={filtered}
          scroll={{ x: 1600 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条补缴单`,
          }}
          rowClassName={(r) =>
            r.repairStatus === 'pending'
              ? 'repair-pending'
              : r.blockerReason
              ? 'repair-blocker'
              : ''
          }
        />
      </Card>

      <Drawer
        title={
          selected ? (
            <Space>
              <HistoryOutlined />
              <span>补缴回看：{selected.plateNo}</span>
              <Tag color={repairStatusColor[selected.repairStatus]}>
                {REPAIR_STATUS_LABEL[selected.repairStatus]}
              </Tag>
              <Tag color={abnormalColor[selected.abnormalType]}>
                {ABNORMAL_TYPE_LABEL[selected.abnormalType]}
              </Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {selected.repairNo}
              </Text>
            </Space>
          ) : (
            '补缴回看'
          )
        }
        width={880}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          selected && selected.repairStatus !== 'completed' && (
            <Space>
              <Button icon={<SwapOutlined />} onClick={() => setAssignModal(true)}>
                改派
              </Button>
              <Button
                icon={<EditOutlined />}
                onClick={() => {
                  stepForm.resetFields();
                  setStepModal(true);
                }}
              >
                记录步骤
              </Button>
              <Button
                icon={<SwapOutlined />}
                onClick={() => {
                  statusForm.resetFields();
                  setStatusModal(true);
                }}
              >
                推进状态
              </Button>
              {selected.unpaidAmount > 0 && (
                <Button
                  type="primary"
                  danger
                  icon={<DollarOutlined />}
                  onClick={() => {
                    paymentForm.setFieldsValue({ amount: selected.unpaidAmount, remark: '' });
                    setPaymentModal(true);
                  }}
                >
                  确认到账
                </Button>
              )}
            </Space>
          )
        }
      >
        {selected && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
              message={
                <Space>
                  <TeamOutlined />
                  <Text strong>处理人：</Text>
                  {selected.assigneeName ? (
                    <Space>
                      <Avatar
                        size="small"
                        style={{ backgroundColor: roleColor[selected.assigneeRole!] }}
                        icon={<UserOutlined />}
                      />
                      <Text>{selected.assigneeName}</Text>
                      <Tag color={roleColor[selected.assigneeRole!]}>
                        {ROLE_LABEL[selected.assigneeRole!]}
                      </Tag>
                      {selected.assigneeId === currentUser.id && <Tag color="green">我</Tag>}
                    </Space>
                  ) : (
                    <Tag color="default">未指派</Tag>
                  )}
                </Space>
              }
              type={selected.assigneeId ? 'info' : 'warning'}
              showIcon
              style={{ marginBottom: 0 }}
            />

            <Card size="small" title="📋 补缴单基础信息" bordered={false} style={{ background: '#fafafa' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="补缴单号">
                  <Text strong>{selected.repairNo}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="关联订单">{selected.orderNo}</Descriptions.Item>
                <Descriptions.Item label="车牌号码">
                  <Text strong>{selected.plateNo}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="异常类型">
                  <Tag color={abnormalColor[selected.abnormalType]}>
                    {ABNORMAL_TYPE_LABEL[selected.abnormalType]}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="异常发生时间">
                  {dayjs(selected.abnormalTime).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="最后更新">
                  {dayjs(selected.updateTime).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="异常描述" span={2}>
                  {selected.abnormalDesc}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              size="small"
              title="🔎 三问定位"
              bordered={false}
              style={{ borderLeft: '4px solid #1677ff' }}
            >
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Card size="small" type="inner" title="① 谁在处理？">
                    <Space direction="vertical" size={4}>
                      {selected.assigneeName ? (
                        <>
                          <Space>
                            <Avatar
                              size="small"
                              style={{ backgroundColor: roleColor[selected.assigneeRole!] }}
                              icon={<UserOutlined />}
                            />
                            <Text strong>{selected.assigneeName}</Text>
                          </Space>
                          <Tag color={roleColor[selected.assigneeRole!]}>
                            {ROLE_LABEL[selected.assigneeRole!]}
                          </Tag>
                        </>
                      ) : (
                        <Tag color="default">待指派处理人</Tag>
                      )}
                    </Space>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" type="inner" title="② 卡在哪里？">
                    <Space direction="vertical" size={4}>
                      <Tag color="processing">当前步骤：{selected.currentStep}</Tag>
                      {selected.blockerReason && (
                        <Alert
                          type="error"
                          showIcon
                          icon={<StopOutlined />}
                          message={<Text type="danger">阻塞：{selected.blockerReason}</Text>}
                          style={{ padding: '4px 8px', fontSize: 12 }}
                        />
                      )}
                    </Space>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" type="inner" title="③ 补缴为什么没完成？">
                    <Space direction="vertical" size={4}>
                      <Space>
                        <Text>待缴</Text>
                        <Text strong type="danger">
                          ¥{selected.unpaidAmount.toFixed(2)}
                        </Text>
                      </Space>
                      {selected.repairStatus === 'completed' ? (
                        <Tag color="green">已完成</Tag>
                      ) : (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          状态：{REPAIR_STATUS_LABEL[selected.repairStatus]}
                        </Text>
                      )}
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Card>

            <Card
              size="small"
              title="💰 补缴进度"
              bordered={false}
              style={{ background: '#f6ffed' }}
            >
              <Row gutter={16} align="middle">
                <Col span={16}>
                  <Progress
                    percent={
                      selected.feeAmount > 0
                        ? Math.round((selected.paidAmount / selected.feeAmount) * 100)
                        : 0
                    }
                    status={selected.unpaidAmount === 0 ? 'success' : 'active'}
                    strokeColor={{ '0%': '#52c41a', '100%': '#13c2c2' }}
                  />
                </Col>
                <Col span={8}>
                  <Space direction="vertical" size={0}>
                    <Text>
                      应收 <Text strong>¥{selected.feeAmount.toFixed(2)}</Text>
                    </Text>
                    <Text type="success">已缴 ¥{selected.paidAmount.toFixed(2)}</Text>
                    <Text type="danger" strong>
                      待缴 ¥{selected.unpaidAmount.toFixed(2)}
                    </Text>
                  </Space>
                </Col>
              </Row>
            </Card>

            <Card size="small" title="📈 状态推进步骤" bordered={false}>
              <Steps
                size="small"
                current={['pending', 'processing', 'pending_confirm', 'completed'].indexOf(
                  selected.repairStatus
                )}
                status={selected.repairStatus === 'failed' ? 'error' : undefined}
              >
                <Steps.Step
                  title="异常登记"
                  description="系统/人工发现异常，创建补缴单"
                />
                <Steps.Step
                  title="处理中"
                  description={selected.currentStep}
                />
                <Steps.Step title="待确认" description="车主/内部确认结果" />
                <Steps.Step title="已完成" description="补缴完成，流程闭环" />
              </Steps>
            </Card>

            {relatedOrder && (
              <Card size="small" title="🚗 关联临停订单" bordered={false}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="订单号">{relatedOrder.orderNo}</Descriptions.Item>
                  <Descriptions.Item label="停车场">{relatedOrder.parkingLotName}</Descriptions.Item>
                  <Descriptions.Item label="入场时间">
                    {dayjs(relatedOrder.enterTime).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                  <Descriptions.Item label="出场时间">
                    {relatedOrder.exitTime
                      ? dayjs(relatedOrder.exitTime).format('YYYY-MM-DD HH:mm:ss')
                      : '未出场'}
                  </Descriptions.Item>
                  <Descriptions.Item label="停车时长">
                    {relatedOrder.parkingDuration
                      ? `${Math.floor(relatedOrder.parkingDuration / 60)}小时${relatedOrder.parkingDuration % 60}分钟`
                      : '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="订单状态">
                    <Tag>{relatedOrder.status}</Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            <Card size="small" title="📜 完整处理轨迹（按时间正序）" bordered={false}>
              <Timeline
                mode="left"
                items={selected.repairLogs
                  .slice()
                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                  .map((log) => ({
                    color:
                      log.operatorRole === 'maintenance'
                        ? 'orange'
                        : log.operatorRole === 'customer_service'
                        ? 'green'
                        : 'blue',
                    label: dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss'),
                    children: (
                      <div>
                        <Space wrap>
                          <Text strong style={{ fontSize: 14 }}>
                            {log.step}
                          </Text>
                          <Text type="secondary">·</Text>
                          <Text type="secondary">{log.action}</Text>
                        </Space>
                        <div style={{ marginTop: 4 }}>
                          <Space wrap>
                            <Avatar
                              size="small"
                              style={{ backgroundColor: roleColor[log.operatorRole] }}
                              icon={<UserOutlined />}
                            />
                            <Text strong>{log.operatorName}</Text>
                            <Tag color={roleColor[log.operatorRole]}>
                              {ROLE_LABEL[log.operatorRole]}
                            </Tag>
                          </Space>
                          <div style={{ marginTop: 4, paddingLeft: 32 }}>
                            <Text type="secondary">操作说明：</Text>
                            <Text> {log.remark}</Text>
                          </div>
                          {log.result && (
                            <Tag color="green" style={{ marginLeft: 32, marginTop: 4 }}>
                              <CheckCircleOutlined /> 结果：{log.result}
                            </Tag>
                          )}
                        </div>
                      </div>
                    ),
                  }))}
              />
            </Card>
          </Space>
        )}
      </Drawer>

      <Modal
        title="记录跟进步骤"
        open={stepModal}
        onCancel={() => setStepModal(false)}
        onOk={handleStepSubmit}
        okText="保存记录"
        width={580}
      >
        <Form form={stepForm} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="step"
                label="当前步骤名"
                rules={[{ required: true, message: '请填写步骤' }]}
              >
                <Input placeholder="如：联系车主 / 调阅监控 / 设备维修" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="action"
                label="动作类型"
                rules={[{ required: true, message: '请填写动作' }]}
              >
                <Input placeholder="如：拨打电话 / 提交工单" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="remark"
            label="操作说明 / 具体内容"
            rules={[{ required: true, message: '请说明具体操作内容' }]}
          >
            <Input.TextArea rows={3} placeholder="记录本次跟进的具体内容和沟通结果" />
          </Form.Item>
          <Form.Item name="currentStep" label="更新当前步骤（可选）">
            <Input placeholder="留空则不更新，填写后将作为新的当前步骤" />
          </Form.Item>
          <Form.Item name="blockerReason" label="阻塞原因（如有）">
            <Input placeholder="如：车主关机 / 道闸未修好，留空表示无阻塞" />
          </Form.Item>
          <Alert
            type="info"
            showIcon
            message="以上操作将记录操作人、时间点，并在处理轨迹中永久保留"
          />
        </Form>
      </Modal>

      <Modal
        title="推进补缴状态"
        open={statusModal}
        onCancel={() => setStatusModal(false)}
        onOk={handleStatusSubmit}
        okText="确认变更"
      >
        {selected && (
          <Form form={statusForm} layout="vertical">
            <Descriptions column={1} size="small" style={{ marginBottom: 12 }}>
              <Descriptions.Item label="当前状态">
                <Tag color={repairStatusColor[selected.repairStatus]}>
                  {REPAIR_STATUS_LABEL[selected.repairStatus]}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            <Form.Item
              name="toStatus"
              label="目标状态"
              rules={[{ required: true, message: '请选择目标状态' }]}
            >
              <Select
                placeholder="选择目标状态"
                options={Object.entries(REPAIR_STATUS_LABEL)
                  .filter(([k]) => k !== selected.repairStatus)
                  .map(([k, v]) => ({ label: v, value: k }))}
              />
            </Form.Item>
            <Form.Item name="currentStep" label="更新当前步骤（可选）">
              <Input placeholder="例如：等待车主确认 / 等待审批" />
            </Form.Item>
            <Form.Item name="blockerReason" label="阻塞原因（如有）">
              <Input placeholder="留空表示清除阻塞原因" />
            </Form.Item>
            <Form.Item
              name="remark"
              label="变更说明"
              rules={[{ required: true, message: '请说明变更原因' }]}
            >
              <Input.TextArea rows={3} placeholder="说明为什么变更、做了什么" />
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
        {selected && (
          <Form form={paymentForm} layout="vertical">
            <Descriptions column={1} size="small" style={{ marginBottom: 12 }}>
              <Descriptions.Item label="待缴金额">
                <Text type="danger" strong style={{ fontSize: 16 }}>
                  ¥{selected.unpaidAmount.toFixed(2)}
                </Text>
              </Descriptions.Item>
            </Descriptions>
            <Form.Item
              name="amount"
              label="本次到账金额 (¥)"
              rules={[{ required: true, message: '请输入到账金额' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0.01}
                max={selected.unpaidAmount}
                step={1}
                precision={2}
              />
            </Form.Item>
            <Form.Item name="remark" label="到账方式 / 备注">
              <Input.TextArea rows={2} placeholder="如：微信转账/现金/银行托收等" />
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title="重新指派处理人"
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
              placeholder="选择处理人"
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
        </Form>
      </Modal>

      <style>{`
        .repair-pending > td { background: #fff1f0 !important; }
        .repair-blocker > td { background: #fffbe6 !important; }
      `}</style>
    </div>
  );
};

export default RepairList;
