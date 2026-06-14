import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  App,
  Row,
  Col,
  Statistic,
  Empty,
  Timeline,
  Descriptions,
  List,
  Avatar,
  Steps,
  Tooltip,
  Tabs,
  Drawer,
  Alert,
  Badge,
} from 'antd';
import {
  CarOutlined,
  BellOutlined,
  RollbackOutlined,
  PaperClipOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  BankOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  SaveOutlined,
  EyeOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import type {
  Role,
  TransferOrder,
  CarSource,
  InspectionReport,
  LoanApplication,
  StatusChangeLog,
  UrgencyAction,
} from 'shared';
import {
  getOrders,
  getOrderDetail,
  markOrderUrgency,
  advanceOrder,
  updateTransferRemark,
  updateLoanRemark,
  fundLoan,
} from '../api';
import { useUserStore } from '../store/user';
import {
  stageMap,
  urgencyMap,
  roleMap,
  formatDateTime,
  formatMoney,
  actionLogMap,
  carSourceStatusMap,
  inspectionStatusMap,
  loanStatusMap,
} from '../utils/constants';

interface Props {
  role: Role;
}

const STEPS_ORDER: ('purchase' | 'appraisal' | 'transfer' | 'loan_review' | 'loan_funding' | 'completed')[] = [
  'purchase', 'appraisal', 'transfer', 'loan_review', 'loan_funding', 'completed'
];

export default function TransferFlow({ role }: Props) {
  const currentUser = useUserStore((s) => s.currentUser);
  const { message, modal } = App.useApp();

  const [orders, setOrders] = useState<TransferOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterUrgency, setFilterUrgency] = useState<UrgencyAction | 'all'>('all');
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentDetail, setCurrentDetail] = useState<{
    order: TransferOrder;
    carSource?: CarSource;
    inspection?: InspectionReport;
    loan?: LoanApplication;
    statusLogs: StatusChangeLog[];
  } | null>(null);

  const [urgeOpen, setUrgeOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [supplementOpen, setSupplementOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [editTransferRemarkOpen, setEditTransferRemarkOpen] = useState(false);
  const [editLoanRemarkOpen, setEditLoanRemarkOpen] = useState(false);

  const [urgencyForm] = Form.useForm();
  const [returnForm] = Form.useForm();
  const [supplementForm] = Form.useForm();
  const [advanceForm] = Form.useForm();
  const [transferRemarkForm] = Form.useForm();
  const [loanRemarkForm] = Form.useForm();

  useEffect(() => { loadOrders(); }, [role, filterUrgency]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params: any = { role };
      if (filterUrgency !== 'all') params.urgency = filterUrgency;
      const list = await getOrders(params);
      setOrders(list);
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const detail = await getOrderDetail(id);
      setCurrentDetail(detail);
      setDetailVisible(true);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUrge = async (values: any) => {
    if (!currentDetail) return;
    try {
      await markOrderUrgency(currentDetail.order.id, {
        action: 'urge',
        note: values.note,
        operator: currentUser,
        operatorRole: role,
      });
      message.success('已催办');
      setUrgeOpen(false);
      urgencyForm.resetFields();
      loadOrders();
      loadDetail(currentDetail.order.id);
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleReturn = async (values: any) => {
    if (!currentDetail) return;
    try {
      await markOrderUrgency(currentDetail.order.id, {
        action: 'return',
        note: values.note,
        operator: currentUser,
        operatorRole: role,
      });
      message.success('已退回上一环节');
      setReturnOpen(false);
      returnForm.resetFields();
      loadOrders();
      loadDetail(currentDetail.order.id);
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleSupplement = async (values: any) => {
    if (!currentDetail) return;
    try {
      await markOrderUrgency(currentDetail.order.id, {
        action: 'supplement',
        note: values.note,
        operator: currentUser,
        operatorRole: role,
      });
      message.success('已标记需要补材料');
      setSupplementOpen(false);
      supplementForm.resetFields();
      loadOrders();
      loadDetail(currentDetail.order.id);
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleAdvance = async (values: any) => {
    if (!currentDetail) return;
    try {
      await advanceOrder(currentDetail.order.id, {
        transferRemark: values.transferRemark,
        operator: currentUser,
        operatorRole: role,
      });
      message.success('已推进到下一环节');
      setAdvanceOpen(false);
      advanceForm.resetFields();
      loadOrders();
      loadDetail(currentDetail.order.id);
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleSaveTransferRemark = async (values: any) => {
    if (!currentDetail) return;
    try {
      await updateTransferRemark(currentDetail.order.id, {
        remark: values.remark,
        operator: currentUser,
        operatorRole: role,
      });
      message.success('成交过户备注已保存，贷款放款环节可查看');
      setEditTransferRemarkOpen(false);
      loadDetail(currentDetail.order.id);
    } catch (e: any) {
      message.error(e.message || '保存失败');
    }
  };

  const handleSaveLoanRemark = async (values: any) => {
    if (!currentDetail) return;
    try {
      await updateLoanRemark(currentDetail.order.id, {
        remark: values.remark,
        operator: currentUser,
        operatorRole: role,
      });
      message.success('贷款放款备注已保存');
      setEditLoanRemarkOpen(false);
      loadDetail(currentDetail.order.id);
    } catch (e: any) {
      message.error(e.message || '保存失败');
    }
  };

  const handleFundLoan = () => {
    if (!currentDetail?.loan) return;
    modal.confirm({
      title: '确认放款？',
      content: `确认对 ${currentDetail.order.brand} ${currentDetail.order.model}（${currentDetail.order.plateNumber}）发放贷款 ${formatMoney(currentDetail.loan.loanAmount)}（${currentDetail.loan.loanTerm}期）？放款后交易完成。`,
      okText: '确认放款',
      okButtonProps: { type: 'primary' },
      cancelText: '取消',
      onOk: async () => {
        try {
          await fundLoan(currentDetail.loan!.id, {
            operator: currentUser,
            operatorRole: role,
          });
          message.success('贷款已放款，交易完成 🎉');
          loadOrders();
          loadDetail(currentDetail.order.id);
        } catch (e: any) {
          message.error(e.message || '放款失败');
        }
      },
    });
  };

  const canAdvance = (o: TransferOrder) => {
    if (o.stage === 'completed') return false;
    if (o.currentHandlerRole !== role) return false;
    if (role === 'purchaseManager' && (o.stage === 'purchase' || o.stage === 'transfer')) return true;
    if (role === 'appraiser' && o.stage === 'appraisal') return true;
    if (role === 'financeSpecialist' && (o.stage === 'loan_review' || o.stage === 'loan_funding')) return true;
    return false;
  };

  const canReturn = (o: TransferOrder) => {
    if (o.stage === 'purchase' || o.stage === 'completed') return false;
    if (o.currentHandlerRole === role) return true;
    if (role === 'appraiser' && (o.stage === 'transfer' || o.stage === 'appraisal')) return true;
    if (role === 'financeSpecialist' && (o.stage === 'loan_review' || o.stage === 'loan_funding')) return true;
    return false;
  };

  const canMarkUrgency = (o: TransferOrder) => {
    if (o.stage === 'completed') return false;
    return true;
  };

  const canEditTransferRemark = (o: TransferOrder) => {
    if (o.stage === 'completed') return false;
    return role === 'purchaseManager';
  };

  const canEditLoanRemark = (o: TransferOrder) => {
    if (o.stage === 'completed') return false;
    return role === 'financeSpecialist';
  };

  const getStepIndex = (stage: string) => STEPS_ORDER.indexOf(stage as any);

  const columns = [
    {
      title: '车辆信息',
      dataIndex: 'plateNumber',
      width: 200,
      render: (_: any, r: TransferOrder) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.brand} {r.model}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{r.plateNumber} · {r.year}款</div>
        </div>
      ),
    },
    {
      title: '买家',
      dataIndex: 'buyerName',
      width: 120,
      render: (v: string, r: TransferOrder) => (
        <div>
          <div>{v}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{r.buyerPhone}</div>
        </div>
      ),
    },
    {
      title: '成交价',
      dataIndex: 'dealPrice',
      width: 110,
      render: (v: number) => <strong style={{ color: '#1677ff' }}>{formatMoney(v)}</strong>,
    },
    {
      title: '当前环节',
      dataIndex: 'stage',
      width: 120,
      render: (v: string) => (
        <Tag color={stageMap[v as keyof typeof stageMap].color}>
          {stageMap[v as keyof typeof stageMap].icon} {stageMap[v as keyof typeof stageMap].label}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'urgencyAction',
      width: 110,
      render: (v: UrgencyAction) => (
        v === 'none' ? (
          <Tag color="default">正常</Tag>
        ) : (
          <Tag color={urgencyMap[v].color}>
            {urgencyMap[v].icon} {urgencyMap[v].label}
          </Tag>
        )
      ),
    },
    {
      title: '当前处理人',
      dataIndex: 'currentHandler',
      width: 140,
      render: (v: string, r: TransferOrder) => (
        <Tag color={roleMap[r.currentHandlerRole].color}>
          {roleMap[r.currentHandlerRole].icon} {v}
        </Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 160,
      render: (v: string) => <span style={{ color: '#8c8c8c', fontSize: 12 }}>{formatDateTime(v)}</span>,
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, r: TransferOrder) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => loadDetail(r.id)}>
          详情与处理
        </Button>
      ),
    },
  ];

  const tabs = (
    <Tabs
      activeKey={filterUrgency}
      onChange={(k) => setFilterUrgency(k as any)}
      size="small"
      items={[
        { key: 'all', label: (<span>全部 <Badge count={orders.length} showZero size="small" /></span>) },
        { key: 'urge', label: (<span style={{ color: '#ff4d4f' }}>🔔 有人催 <Badge count={orders.filter(o => o.urgencyAction === 'urge').length} showZero size="small" /></span>) },
        { key: 'return', label: (<span style={{ color: '#fa541c' }}>↩️ 已退回 <Badge count={orders.filter(o => o.urgencyAction === 'return').length} showZero size="small" /></span>) },
        { key: 'supplement', label: (<span style={{ color: '#faad14' }}>📎 补材料 <Badge count={orders.filter(o => o.urgencyAction === 'supplement').length} showZero size="small" /></span>) },
      ]}
    />
  );

  return (
    <div style={{ maxWidth: 1500, margin: '0 auto' }}>
      <Card style={{ marginBottom: 16, borderRadius: 8 }} styles={{ body: { padding: 20 } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 8 }}>
          <div>
            <span className={`role-badge ${role}`} style={{ marginRight: 12 }}>
              {roleMap[role].icon} {currentUser}（{roleMap[role].label}）
            </span>
            <span style={{ color: '#8c8c8c', fontSize: 13 }}>
              成交过户与贷款放款一体化处理 — 收车经理 → 评估师 → 金融专员接力
            </span>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadOrders}>刷新</Button>
          </Space>
        </div>
        <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
          <Col xs={12} md={6}>
            <Card size="small" className="stat-card-mini">
              <Statistic title={<span className="label">待办总数</span>} value={orders.filter(o => o.currentHandlerRole === role && o.stage !== 'completed').length} prefix={<CarOutlined />} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small" className="stat-card-mini">
              <Statistic title={<span className="label">有人催办</span>} value={orders.filter(o => o.urgencyAction === 'urge').length} prefix={<BellOutlined />} valueStyle={{ color: '#ff4d4f' }} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small" className="stat-card-mini">
              <Statistic title={<span className="label">已退回</span>} value={orders.filter(o => o.urgencyAction === 'return').length} prefix={<RollbackOutlined />} valueStyle={{ color: '#fa541c' }} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small" className="stat-card-mini">
              <Statistic title={<span className="label">补材料</span>} value={orders.filter(o => o.urgencyAction === 'supplement').length} prefix={<PaperClipOutlined />} valueStyle={{ color: '#faad14' }} />
            </Card>
          </Col>
        </Row>
      </Card>

      <Card
        style={{ borderRadius: 8 }}
        styles={{ body: { padding: 0 } }}
        title={tabs}
        extra={
          <Tooltip title="可按状态筛选需要处理的单子">
            <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
          </Tooltip>
        }
      >
        <Table<TransferOrder>
          rowKey="id"
          loading={loading}
          dataSource={orders}
          columns={columns}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 1000 }}
          locale={{ emptyText: <Empty description="暂无需要处理的单子 🎉" /> }}
          rowClassName={(r) => {
            if (r.urgencyAction === 'urge') return 'row-urgent';
            if (r.urgencyAction === 'return') return 'row-return';
            if (r.urgencyAction === 'supplement') return 'row-supplement';
            return '';
          }}
        />
      </Card>

      <Drawer
        title={currentDetail ? (
          <div>
            <Space size="small" wrap>
              <strong>{currentDetail.order.brand} {currentDetail.order.model}</strong>
              <Tag color={stageMap[currentDetail.order.stage].color}>
                {stageMap[currentDetail.order.stage].icon} {stageMap[currentDetail.order.stage].label}
              </Tag>
              {currentDetail.order.urgencyAction !== 'none' && (
                <Tag color={urgencyMap[currentDetail.order.urgencyAction].color}>
                  {urgencyMap[currentDetail.order.urgencyAction].icon} {urgencyMap[currentDetail.order.urgencyAction].label}
                </Tag>
              )}
            </Space>
          </div>
        ) : ''}
        placement="right"
        width={860}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        loading={detailLoading}
        extra={currentDetail && (
          <Space wrap>
            {canReturn(currentDetail.order) && (
              <Button danger icon={<RollbackOutlined />} onClick={() => {
                returnForm.setFieldsValue({ note: currentDetail.order.urgencyNote });
                setReturnOpen(true);
              }}>退回</Button>
            )}
            {canMarkUrgency(currentDetail.order) && (
              <Button icon={<PaperClipOutlined />} onClick={() => {
                supplementForm.setFieldsValue({ note: currentDetail.order.urgencyNote });
                setSupplementOpen(true);
              }}>补材料</Button>
            )}
            {canMarkUrgency(currentDetail.order) && (
              <Button icon={<BellOutlined />} onClick={() => {
                urgencyForm.setFieldsValue({ note: currentDetail.order.urgencyNote });
                setUrgeOpen(true);
              }}>催办</Button>
            )}
            {canAdvance(currentDetail.order) && (
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={() => {
                  advanceForm.setFieldsValue({ transferRemark: currentDetail.order.transferRemark });
                  setAdvanceOpen(true);
                }}
              >
                推进下一环节
              </Button>
            )}
            {role === 'financeSpecialist' && currentDetail.loan && currentDetail.loan.status === 'approved' && currentDetail.order.stage === 'loan_funding' && (
              <Button
                type="primary"
                danger
                icon={<DollarOutlined />}
                onClick={handleFundLoan}
              >
                确认放款
              </Button>
            )}
          </Space>
        )}
      >
        {currentDetail && (
          <div>
            <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
              <Steps
                size="small"
                current={getStepIndex(currentDetail.order.stage)}
                items={STEPS_ORDER.map(s => ({
                  title: stageMap[s].label,
                  icon: <span style={{ fontSize: 14 }}>{stageMap[s].icon}</span>,
                  status: getStepIndex(currentDetail.order.stage) > getStepIndex(s) ? 'finish' : getStepIndex(currentDetail.order.stage) === getStepIndex(s) ? 'process' : 'wait',
                }))}
              />
            </Card>

            {currentDetail.order.urgencyAction !== 'none' && (
              <Alert
                style={{ marginBottom: 16 }}
                message={`${urgencyMap[currentDetail.order.urgencyAction].icon} ${urgencyMap[currentDetail.order.urgencyAction].label}`}
                description={
                  <div>
                    {currentDetail.order.urgencyNote}
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                      由 {currentDetail.order.urgencyBy} 于 {formatDateTime(currentDetail.order.urgencyAt)} 标记
                    </div>
                  </div>
                }
                type={
                  currentDetail.order.urgencyAction === 'urge' ? 'error' :
                  currentDetail.order.urgencyAction === 'return' ? 'warning' : 'warning'
                }
                showIcon
              />
            )}

            <Tabs
              size="small"
              defaultActiveKey="basic"
              items={[
                {
                  key: 'basic',
                  label: (<span><FileTextOutlined /> 订单信息</span>),
                  children: (
                    <div>
                      <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
                        <Descriptions.Item label="订单编号">{currentDetail.order.id}</Descriptions.Item>
                        <Descriptions.Item label="创建时间">{formatDateTime(currentDetail.order.createdAt)}</Descriptions.Item>
                        <Descriptions.Item label="车牌号">{currentDetail.order.plateNumber}</Descriptions.Item>
                        <Descriptions.Item label="车辆型号">{currentDetail.order.brand} {currentDetail.order.model} ({currentDetail.order.year}款)</Descriptions.Item>
                        <Descriptions.Item label="买家">{currentDetail.order.buyerName}</Descriptions.Item>
                        <Descriptions.Item label="联系电话">{currentDetail.order.buyerPhone}</Descriptions.Item>
                        <Descriptions.Item label="成交价" span={2}>
                          <strong style={{ color: '#1677ff', fontSize: 16 }}>{formatMoney(currentDetail.order.dealPrice)}</strong>
                        </Descriptions.Item>
                        <Descriptions.Item label="收车经理">
                          <Tag color={roleMap.purchaseManager.color}>{roleMap.purchaseManager.icon} {currentDetail.order.purchaseManager}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="评估师">
                          <Tag color={roleMap.appraiser.color}>{roleMap.appraiser.icon} {currentDetail.order.appraiser}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="金融专员">
                          <Tag color={roleMap.financeSpecialist.color}>{roleMap.financeSpecialist.icon} {currentDetail.order.financeSpecialist}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="当前处理">
                          <Tag color={roleMap[currentDetail.order.currentHandlerRole].color}>
                            {roleMap[currentDetail.order.currentHandlerRole].icon} {currentDetail.order.currentHandler}（{roleMap[currentDetail.order.currentHandlerRole].label}）
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="过户完成时间">{formatDateTime(currentDetail.order.transferCompletedAt)}</Descriptions.Item>
                        <Descriptions.Item label="放款完成时间">{formatDateTime(currentDetail.order.loanCompletedAt)}</Descriptions.Item>
                      </Descriptions>

                      <Card
                        size="small"
                        style={{ marginBottom: 16, borderRadius: 8, borderColor: '#1677ff33' }}
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>📝 成交过户备注 <span style={{ color: '#8c8c8c', fontSize: 12, fontWeight: 'normal' }}>（贷款放款环节可查看此备注）</span></span>
                            {canEditTransferRemark(currentDetail.order) && (
                              <Button
                                size="small"
                                type="link"
                                icon={<EditOutlined />}
                                onClick={() => {
                                  transferRemarkForm.setFieldsValue({ remark: currentDetail.order.transferRemark });
                                  setEditTransferRemarkOpen(true);
                                }}
                              >
                                编辑
                              </Button>
                            )}
                          </div>
                        }
                      >
                        {currentDetail.order.transferRemark ? (
                          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#1f1f1f' }}>
                            {currentDetail.order.transferRemark}
                          </div>
                        ) : (
                          <div style={{ color: '#8c8c8c', fontSize: 13 }}>
                            {role === 'purchaseManager' ? '尚未填写过户备注，点击"编辑"添加。备注会在贷款放款环节展示给金融专员。' : '收车经理暂未填写过户备注。'}
                          </div>
                        )}
                      </Card>

                      {(role === 'financeSpecialist') && (
                        <Card
                          size="small"
                          style={{ marginBottom: 16, borderRadius: 8, borderColor: '#fa8c1633' }}
                          title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>💰 贷款放款备注</span>
                              {canEditLoanRemark(currentDetail.order) && (
                                <Button
                                  size="small"
                                  type="link"
                                  icon={<EditOutlined />}
                                  onClick={() => {
                                    loanRemarkForm.setFieldsValue({ remark: currentDetail.order.loanRemark });
                                    setEditLoanRemarkOpen(true);
                                  }}
                                >
                                  编辑
                                </Button>
                              )}
                            </div>
                          }
                        >
                          {currentDetail.order.loanRemark ? (
                            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#1f1f1f' }}>
                              {currentDetail.order.loanRemark}
                            </div>
                          ) : (
                            <div style={{ color: '#8c8c8c', fontSize: 13 }}>尚未填写贷款放款备注。</div>
                          )}
                        </Card>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'carsource',
                  label: (<span><CarOutlined /> 车源档案</span>),
                  children: currentDetail.carSource ? (
                    <div>
                      <Alert
                        style={{ marginBottom: 16 }}
                        type="info"
                        showIcon
                        icon={<InfoCircleOutlined />}
                        message="车源档案只记录结果状态，不记录为什么变成'事故信息漏标'或'整备成本超预算'的具体原因"
                      />
                      <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
                        <Descriptions.Item label="车源编号">{currentDetail.carSource.id}</Descriptions.Item>
                        <Descriptions.Item label="车牌号">{currentDetail.carSource.plateNumber}</Descriptions.Item>
                        <Descriptions.Item label="品牌型号">{currentDetail.carSource.brand} {currentDetail.carSource.model}</Descriptions.Item>
                        <Descriptions.Item label="年款 / 里程">{currentDetail.carSource.year}款 / {currentDetail.carSource.mileage.toLocaleString()}km</Descriptions.Item>
                        <Descriptions.Item label="车身颜色">{currentDetail.carSource.color}</Descriptions.Item>
                        <Descriptions.Item label="收车价">{formatMoney(currentDetail.carSource.purchasePrice)}</Descriptions.Item>
                        <Descriptions.Item label="预期售价">{formatMoney(currentDetail.carSource.expectedPrice)}</Descriptions.Item>
                        <Descriptions.Item label="档案状态">
                          <Tag color={carSourceStatusMap[currentDetail.carSource.status].color}>
                            {carSourceStatusMap[currentDetail.carSource.status].label}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="原车主">{currentDetail.carSource.ownerName}</Descriptions.Item>
                        <Descriptions.Item label="联系电话">{currentDetail.carSource.ownerPhone}</Descriptions.Item>
                        <Descriptions.Item label="建档人">{currentDetail.carSource.purchaseManager}</Descriptions.Item>
                        <Descriptions.Item label="建档时间">{formatDateTime(currentDetail.carSource.createdAt)}</Descriptions.Item>
                      </Descriptions>
                      <Card size="small" title="📎 档案附件（占位）" style={{ borderRadius: 8 }}>
                        <List
                          size="small"
                          dataSource={currentDetail.carSource.docs}
                          renderItem={(d) => (
                            <List.Item>
                              <Space>
                                {d.submitted ? (
                                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                ) : (
                                  <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                                )}
                                <span>{d.name}</span>
                                {!d.submitted && d.placeholder && (
                                  <Tag color="warning">{d.placeholder}</Tag>
                                )}
                              </Space>
                            </List.Item>
                          )}
                        />
                      </Card>
                    </div>
                  ) : <Empty description="暂无车源档案" />,
                },
                {
                  key: 'inspection',
                  label: (<span><SearchOutlined /> 检测报告</span>),
                  children: currentDetail.inspection ? (
                    <div>
                      <Alert
                        style={{ marginBottom: 16 }}
                        type="info"
                        showIcon
                        icon={<InfoCircleOutlined />}
                        message="检测报告只记录结果状态，不记录具体原因细节"
                      />
                      <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
                        <Descriptions.Item label="报告编号">{currentDetail.inspection.id}</Descriptions.Item>
                        <Descriptions.Item label="检测状态">
                          <Tag color={inspectionStatusMap[currentDetail.inspection.status].color}>
                            {inspectionStatusMap[currentDetail.inspection.status].label}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="评估师">{currentDetail.inspection.appraiser}</Descriptions.Item>
                        <Descriptions.Item label="检测时间">{formatDateTime(currentDetail.inspection.inspectedAt)}</Descriptions.Item>
                        <Descriptions.Item label="整备成本">{formatMoney(currentDetail.inspection.prepCost)}</Descriptions.Item>
                        <Descriptions.Item label="事故标记">
                          {currentDetail.inspection.accidentMarked ? (
                            <Tag color="error">已标记</Tag>
                          ) : (
                            <Tag color="success">未标记</Tag>
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="结果摘要" span={2}>
                          {currentDetail.inspection.resultSummary || '—'}
                        </Descriptions.Item>
                      </Descriptions>
                      <Card size="small" title="🔍 检测项目结果" style={{ borderRadius: 8, marginBottom: 16 }}>
                        <Row gutter={[8, 8]}>
                          {currentDetail.inspection.items.map(i => (
                            <Col xs={12} sm={8} key={i.id}>
                              <div style={{
                                padding: '8px 12px',
                                borderRadius: 6,
                                background: i.result === 'normal' ? '#f6ffed' : i.result === 'abnormal' ? '#fff2f0' : '#fafafa',
                                border: `1px solid ${i.result === 'normal' ? '#b7eb8f' : i.result === 'abnormal' ? '#ffccc7' : '#f0f0f0'}`,
                              }}>
                                <div style={{ fontSize: 13, fontWeight: 500 }}>{i.name}</div>
                                <div style={{ fontSize: 12, marginTop: 2, color: i.result === 'normal' ? '#52c41a' : i.result === 'abnormal' ? '#ff4d4f' : '#8c8c8c' }}>
                                  {i.result === 'normal' ? '✓ 正常' : i.result === 'abnormal' ? '✗ 异常' : '— 未检'}
                                </div>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      </Card>
                    </div>
                  ) : <Empty description="暂无检测报告" />,
                },
                {
                  key: 'loan',
                  label: (<span><BankOutlined /> 贷款资料</span>),
                  children: currentDetail.loan ? (
                    <div>
                      <Alert
                        style={{ marginBottom: 16 }}
                        type="info"
                        showIcon
                        icon={<InfoCircleOutlined />}
                        message="贷款资料只记录结果状态，不记录具体补件原因细节"
                      />
                      <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
                        <Descriptions.Item label="贷款编号">{currentDetail.loan.id}</Descriptions.Item>
                        <Descriptions.Item label="贷款状态">
                          <Tag color={loanStatusMap[currentDetail.loan.status].color}>
                            {loanStatusMap[currentDetail.loan.status].label}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="贷款金额">
                          <strong style={{ color: '#fa8c16', fontSize: 16 }}>{formatMoney(currentDetail.loan.loanAmount)}</strong>
                        </Descriptions.Item>
                        <Descriptions.Item label="贷款期限">{currentDetail.loan.loanTerm} 期</Descriptions.Item>
                        <Descriptions.Item label="申请人">{currentDetail.loan.buyerName}</Descriptions.Item>
                        <Descriptions.Item label="联系电话">{currentDetail.loan.buyerPhone}</Descriptions.Item>
                        <Descriptions.Item label="金融专员">{currentDetail.loan.financeSpecialist}</Descriptions.Item>
                        <Descriptions.Item label="申请时间">{formatDateTime(currentDetail.loan.appliedAt)}</Descriptions.Item>
                        <Descriptions.Item label="审批通过时间">{formatDateTime(currentDetail.loan.approvedAt)}</Descriptions.Item>
                        <Descriptions.Item label="放款时间">{formatDateTime(currentDetail.loan.fundedAt)}</Descriptions.Item>
                      </Descriptions>

                      {currentDetail.order.transferRemark && (
                        <Card
                          size="small"
                          style={{ marginBottom: 16, borderRadius: 8, borderColor: '#1677ff', background: '#e6f4ff' }}
                          title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 16 }}>📝</span>
                              <strong style={{ color: '#1677ff' }}>成交过户备注（收车经理填写 · 放款重要参考）</strong>
                            </div>
                          }
                        >
                          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 2, color: '#1f1f1f', fontSize: 14, fontWeight: 500, padding: '4px 0' }}>
                            {currentDetail.order.transferRemark}
                          </div>
                        </Card>
                      )}

                      <Card size="small" title="📎 贷款资料（含附件占位）" style={{ borderRadius: 8 }}>
                        <List
                          size="small"
                          dataSource={currentDetail.loan.docs}
                          renderItem={(d) => (
                            <List.Item>
                              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                <Space>
                                  {d.submitted ? (
                                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                  ) : (
                                    <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                                  )}
                                  <span style={{ fontWeight: d.submitted ? 'normal' : 600 }}>{d.name}</span>
                                </Space>
                                {!d.submitted && d.placeholder && (
                                  <Tag color="warning" icon={<PaperClipOutlined />}>{d.placeholder}</Tag>
                                )}
                                {d.submitted && <Tag color="success">已提交</Tag>}
                              </Space>
                            </List.Item>
                          )}
                        />
                      </Card>
                    </div>
                  ) : <Empty description="暂无贷款资料（成交过户完成后自动创建）" />,
                },
                {
                  key: 'timeline',
                  label: (<span><HistoryOutlined /> 状态流转时间线</span>),
                  children: currentDetail.statusLogs.length > 0 ? (
                    <Timeline
                      style={{ padding: '8px 0' }}
                      items={currentDetail.statusLogs.map((l) => ({
                        color:
                          l.action === 'urge' ? 'red' :
                          l.action === 'return' ? 'orange' :
                          l.action === 'supplement' ? 'gold' :
                          l.action === 'fund' ? 'green' :
                          l.action === 'pass' ? 'blue' : 'blue',
                        label: (
                          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                            {formatDateTime(l.operatedAt)}
                          </div>
                        ),
                        children: (
                          <div>
                            <Space size="small" wrap style={{ marginBottom: 4 }}>
                              <Tag color={actionLogMap[l.action]?.color || 'default'}>
                                {actionLogMap[l.action]?.label || l.action}
                              </Tag>
                              <Tag color={stageMap[l.stage].color}>
                                {stageMap[l.stage].label}
                              </Tag>
                              {l.fromStage && (
                                <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                                  ← {stageMap[l.fromStage].label}
                                </span>
                              )}
                            </Space>
                            <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                              <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 6, background: roleMap[l.operatorRole].color }} />
                              <strong>{l.operator}</strong>
                              <Tag color="default" style={{ margin: '0 6px', fontSize: 11 }}>{roleMap[l.operatorRole].label}</Tag>
                              {l.remark}
                            </div>
                          </div>
                        ),
                      }))}
                    />
                  ) : <Empty description="暂无状态变化记录" />,
                },
              ]}
            />
          </div>
        )}
      </Drawer>

      <Modal
        title={<span><BellOutlined /> 催办</span>}
        open={urgeOpen}
        onCancel={() => setUrgeOpen(false)}
        onOk={() => urgencyForm.submit()}
        okText="确认催办"
        okButtonProps={{ danger: true }}
        cancelText="取消"
      >
        <Form form={urgencyForm} layout="vertical" onFinish={handleUrge}>
          <Form.Item
            name="note"
            label="催办说明"
            rules={[{ required: true, message: '请输入催办说明' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入催办原因和要求..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span><RollbackOutlined /> 退回上一环节</span>}
        open={returnOpen}
        onCancel={() => setReturnOpen(false)}
        onOk={() => returnForm.submit()}
        okText="确认退回"
        okButtonProps={{ danger: true }}
        cancelText="取消"
      >
        <Form form={returnForm} layout="vertical" onFinish={handleReturn}>
          <Form.Item
            name="note"
            label="退回原因"
            rules={[{ required: true, message: '请输入退回原因' }]}
          >
            <Input.TextArea rows={3} placeholder="请详细说明退回原因..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span><PaperClipOutlined /> 要求补材料</span>}
        open={supplementOpen}
        onCancel={() => setSupplementOpen(false)}
        onOk={() => supplementForm.submit()}
        okText="确认标记"
        okButtonProps={{ type: 'primary' }}
        cancelText="取消"
      >
        <Form form={supplementForm} layout="vertical" onFinish={handleSupplement}>
          <Form.Item
            name="note"
            label="补材料说明"
            rules={[{ required: true, message: '请输入需要补充的材料说明' }]}
          >
            <Input.TextArea rows={3} placeholder="请说明需要补充哪些材料..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span><ArrowRightOutlined /> 推进到下一环节</span>}
        open={advanceOpen}
        onCancel={() => setAdvanceOpen(false)}
        onOk={() => advanceForm.submit()}
        okText="确认推进"
        okButtonProps={{ type: 'primary' }}
        cancelText="取消"
        width={600}
      >
        {currentDetail && (
          <>
            <Alert
              style={{ marginBottom: 16 }}
              type="info"
              showIcon
              message={`当前环节：${stageMap[currentDetail.order.stage].label} → 下一环节：${stageMap[STEPS_ORDER[getStepIndex(currentDetail.order.stage) + 1]]?.label || '完成'}`}
            />
            <Form form={advanceForm} layout="vertical" onFinish={handleAdvance}>
              {(currentDetail.order.stage === 'transfer') && (
                <Form.Item
                  name="transferRemark"
                  label="成交过户备注（可选）"
                  extra="此备注会在贷款放款环节展示给金融专员，作为放款参考。"
                >
                  <Input.TextArea rows={4} placeholder="填写过户相关说明，如车况、付款情况、特殊约定等..." />
                </Form.Item>
              )}
            </Form>
          </>
        )}
      </Modal>

      <Modal
        title={<span><EditOutlined /> 编辑成交过户备注</span>}
        open={editTransferRemarkOpen}
        onCancel={() => setEditTransferRemarkOpen(false)}
        onOk={() => transferRemarkForm.submit()}
        okText={<span><SaveOutlined /> 保存</span>}
        okButtonProps={{ type: 'primary' }}
        cancelText="取消"
        width={600}
      >
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          message="成交过户备注会在贷款放款环节展示给金融专员，作为放款参考依据"
        />
        <Form form={transferRemarkForm} layout="vertical" onFinish={handleSaveTransferRemark}>
          <Form.Item
            name="remark"
            label="备注内容"
            rules={[{ required: true, message: '请输入备注内容' }]}
          >
            <Input.TextArea rows={6} placeholder="填写过户相关说明，如车况、付款情况、特殊约定等..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span><EditOutlined /> 编辑贷款放款备注</span>}
        open={editLoanRemarkOpen}
        onCancel={() => setEditLoanRemarkOpen(false)}
        onOk={() => loanRemarkForm.submit()}
        okText={<span><SaveOutlined /> 保存</span>}
        okButtonProps={{ type: 'primary' }}
        cancelText="取消"
        width={600}
      >
        <Form form={loanRemarkForm} layout="vertical" onFinish={handleSaveLoanRemark}>
          <Form.Item
            name="remark"
            label="备注内容"
            rules={[{ required: true, message: '请输入备注内容' }]}
          >
            <Input.TextArea rows={6} placeholder="填写贷款审核、放款相关说明..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
