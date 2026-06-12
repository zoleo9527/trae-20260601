import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Descriptions,
  Tag,
  Timeline,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Spin,
  Alert,
  Empty,
  Card,
  Table,
  Divider,
  Statistic,
  Row,
  Col,
  message,
  DatePicker,
  InputNumber,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  SendOutlined,
  EditOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  UserOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { quotationAPI, contractAPI, logsAPI } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import {
  Quotation,
  QuotationItem,
  Property,
  ViewingRecord,
  TimelineEvent,
  paymentMethodNames,
  decorationNames,
  viewingStatusNames,
  interestLevelNames,
} from '../types';

const { TextArea } = Input;

const QuotationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [viewing, setViewing] = useState<ViewingRecord | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [contractModalVisible, setContractModalVisible] = useState(false);
  const [contractForm] = Form.useForm();
  const [contractCreating, setContractCreating] = useState(false);
  const [relatedContract, setRelatedContract] = useState<any>(null);
  const [contractSuccessVisible, setContractSuccessVisible] = useState(false);
  const [newlyCreatedContract, setNewlyCreatedContract] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    fetchData(id);
  }, [id]);

  const fetchData = async (quotationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [quotationRes, timelineRes, contractsRes] = await Promise.all([
        quotationAPI.get(quotationId),
        logsAPI.getTimeline('quotation', quotationId),
        contractAPI.list(),
      ]);
      setQuotation(quotationRes.data);
      setProperty(quotationRes.data.property || null);
      setViewing(quotationRes.data.viewing || null);
      setTimeline(timelineRes.data);

      const existing = (contractsRes.data || []).find(
        (c: any) => c.quotationId === quotationId && c.status !== 'terminated'
      );
      setRelatedContract(existing || null);
    } catch (err: any) {
      setError(err.response?.data?.error || '加载报价单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await quotationAPI.submit(id);
      setSubmitModalVisible(false);
      fetchData(id);
    } catch (err: any) {
      setError(err.response?.data?.error || '提交失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    try {
      const values = await form.validateFields();
      setActionLoading(true);
      await quotationAPI.approve(id, values.approvalComment);
      setApproveModalVisible(false);
      fetchData(id);
    } catch (err: any) {
      setError(err.response?.data?.error || '审批失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    try {
      const values = await form.validateFields();
      setActionLoading(true);
      await quotationAPI.reject(id, values.approvalComment);
      setRejectModalVisible(false);
      fetchData(id);
    } catch (err: any) {
      setError(err.response?.data?.error || '拒绝失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!id || !quotation) return;
    try {
      const values = await editForm.validateFields();
      setActionLoading(true);
      const items: QuotationItem[] = values.items.map((item: any, index: number) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        amount: Number(item.quantity) * Number(item.unitPrice),
      }));
      await quotationAPI.update(id, {
        ...values,
        items,
        leaseTerm: Number(values.leaseTerm),
        rentFreePeriod: Number(values.rentFreePeriod),
        depositMonths: Number(values.depositMonths),
      });
      setEditModalVisible(false);
      fetchData(id);
    } catch (err: any) {
      setError(err.response?.data?.error || '修改失败');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = () => {
    if (!quotation) return;
    editForm.setFieldsValue({
      customerName: quotation.customerName,
      customerPhone: quotation.customerPhone,
      companyName: quotation.companyName,
      leaseTerm: quotation.leaseTerm,
      rentFreePeriod: quotation.rentFreePeriod,
      paymentMethod: quotation.paymentMethod,
      depositMonths: quotation.depositMonths,
      validUntil: quotation.validUntil.slice(0, 10),
      remarks: quotation.remarks,
      items: quotation.items.map((item) => ({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
      })),
    });
    setEditModalVisible(true);
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('zh-CN');

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'default',
      submitted: 'blue',
      approved: 'green',
      rejected: 'red',
      expired: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusName = (status: string) => {
    const names: Record<string, string> = {
      draft: '草稿',
      submitted: '已提交',
      approved: '已确认',
      rejected: '已拒绝',
      expired: '已过期',
    };
    return names[status] || status;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert message="错误" description={error} type="error" showIcon />;
  }

  if (!quotation) {
    return <Empty description="未找到报价单" />;
  }

  const isOwner = user && quotation.consultantId === user.id;
  const isManager = user?.role === 'operation_manager';
  const canEdit = isOwner && (quotation.status === 'draft' || quotation.status === 'rejected');
  const canSubmit = isOwner && (quotation.status === 'draft' || quotation.status === 'rejected');
  const canApprove = isManager && quotation.status === 'submitted';
  const canReject = isManager && quotation.status === 'submitted';
  const canDraftContract = user?.role === 'rental_consultant' && quotation.status === 'approved';

  const openContractModal = () => {
    if (!quotation) return;
    contractForm.resetFields();
    contractForm.setFieldsValue({
      customerName: quotation.customerName,
      customerPhone: quotation.customerPhone,
      companyName: quotation.companyName,
      monthlyRent: quotation.items.find(i => i.name === '房屋租金')?.unitPrice || 0,
      leaseTerm: quotation.leaseTerm,
      rentFreePeriod: quotation.rentFreePeriod,
      depositAmount: quotation.items.find(i => i.name === '房屋租金')?.unitPrice * quotation.depositMonths || 0,
      paymentMethod: quotation.paymentMethod,
      leaseStartDate: null,
      leaseEndDate: null,
    });
    setContractModalVisible(true);
  };

  const handleCreateContract = async () => {
    if (!id || !quotation || !property) return;
    try {
      const values = await contractForm.validateFields();
      setContractCreating(true);
      const res = await contractAPI.create({
        propertyId: quotation.propertyId,
        quotationId: quotation.id,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        companyName: values.companyName,
        monthlyRent: values.monthlyRent,
        leaseTerm: values.leaseTerm,
        rentFreePeriod: values.rentFreePeriod,
        depositAmount: values.depositAmount,
        paymentMethod: values.paymentMethod,
        leaseStartDate: values.leaseStartDate?.format('YYYY-MM-DD'),
        leaseEndDate: values.leaseEndDate?.format('YYYY-MM-DD'),
        clauses: [
          { category: 'basic', title: '租赁期限', content: `租期${values.leaseTerm}个月，自${values.leaseStartDate?.format('YYYY-MM-DD')}至${values.leaseEndDate?.format('YYYY-MM-DD')}`, order: 1 },
          { category: 'payment', title: '租金及付款方式', content: `月租金${values.monthlyRent}元，付款方式为${values.paymentMethod === 'monthly' ? '月付' : values.paymentMethod === 'quarterly' ? '季付' : values.paymentMethod === 'semi_annual' ? '半年付' : '年付'}`, order: 2 },
          { category: 'payment', title: '押金', content: `押金${values.depositAmount}元`, order: 3 },
          { category: 'basic', title: '免租期', content: `免租期${values.rentFreePeriod}个月`, order: 4 },
        ],
      });
      setContractModalVisible(false);
      setNewlyCreatedContract(res.data);
      setRelatedContract(res.data);
      setContractSuccessVisible(true);
      fetchData(id);
    } catch (err: any) {
      const errData = err.response?.data;
      if (errData) {
        if (errData.errorCode === 'QUOTATION_DUPLICATE_CONTRACT' && errData.existingContractId) {
          Modal.confirm({
            title: '该报价单已创建合同',
            content: (
              <div>
                <p>{errData.error}</p>
                <p style={{ marginTop: 8 }}>是否直接跳转到已有合同？</p>
              </div>
            ),
            okText: '查看合同',
            cancelText: '取消',
            onOk: () => {
              navigate(`/contracts/${errData.existingContractId}`);
            },
          });
        } else {
          message.error(errData.error);
        }
      }
    } finally {
      setContractCreating(false);
    }
  };

  const getStatusJudgment = () => {
    const judgments: Record<string, { title: string; basis: string[]; nextSteps: string[]; restrictions: string[] }> = {
      draft: {
        title: '草稿状态',
        basis: [
          '报价单由租赁顾问创建，尚未提交审批',
          `创建人：${quotation.consultantName}（租赁顾问）`,
          '可随时编辑修改内容',
        ],
        nextSteps: [
          '租赁顾问确认内容无误后，可"提交报价"进入审批流程',
          '提交后将由运营经理进行确认',
        ],
        restrictions: [
          '只有创建人（租赁顾问）可以编辑和提交',
          '提交后不能再修改，需等待审批或退回',
        ],
      },
      submitted: {
        title: '已提交待确认',
        basis: [
          '租赁顾问已提交报价单，等待运营经理确认',
          `提交人：${quotation.consultantName}（租赁顾问）`,
          '房源状态同步更新为"已报价待确认"',
        ],
        nextSteps: [
          '运营经理审核报价内容，可"确认报价"或"退回修改"',
          '确认后报价生效，可进入合同起草阶段',
          '退回后租赁顾问可修改后重新提交',
        ],
        restrictions: [
          '提交后租赁顾问不能再修改报价内容',
          '只有运营经理可以审批确认',
        ],
      },
      approved: {
        title: '已确认生效',
        basis: [
          '运营经理已确认报价单，报价正式生效',
          `确认人：${quotation.approverName || '-'}（运营经理）`,
          quotation.approvalComment ? `确认意见：${quotation.approvalComment}` : '无特殊确认意见',
          '房源状态同步更新为"报价已确认"',
        ],
        nextSteps: [
          '租赁顾问可基于此报价起草租赁合同',
          '合同条款需与报价内容保持一致',
        ],
        restrictions: [
          '报价已生效，不能再修改内容',
          '如需调整需重新创建报价单',
        ],
      },
      rejected: {
        title: '已退回修改',
        basis: [
          '运营经理审核后退回修改，报价未通过',
          `退回人：${quotation.approverName || '-'}（运营经理）`,
          `退回原因：${quotation.approvalComment || '未填写'}`,
          '房源状态同步回退为"待报价"',
        ],
        nextSteps: [
          '租赁顾问根据退回意见修改报价内容',
          '修改完成后可重新提交审批',
        ],
        restrictions: [
          '只有创建人（租赁顾问）可以修改',
          '需重新提交后才能再次进入审批流程',
        ],
      },
      expired: {
        title: '已过期',
        basis: [
          '报价单已超过有效期，自动失效',
          `有效期至：${formatDate(quotation.validUntil)}`,
        ],
        nextSteps: [
          '如需继续报价，需重新创建新的报价单',
        ],
        restrictions: [
          '过期报价单不能再提交或审批',
          '不具备法律效力',
        ],
      },
    };
    return judgments[quotation.status] || { title: quotation.status, basis: [], nextSteps: [], restrictions: [] };
  };

  const judgment = getStatusJudgment();

  const getPendingRole = () => {
    const roleMap: Record<string, { role: string; roleName: string; action: string }> = {
      draft: { role: 'rental_consultant', roleName: '租赁顾问', action: '提交报价' },
      submitted: { role: 'operation_manager', roleName: '运营经理', action: '审核报价' },
      approved: { role: 'rental_consultant', roleName: '租赁顾问', action: '起草合同' },
      rejected: { role: 'rental_consultant', roleName: '租赁顾问', action: '修改后重新提交' },
      expired: { role: 'rental_consultant', roleName: '租赁顾问', action: '重新创建报价' },
    };
    return roleMap[quotation.status] || { role: '-', roleName: '-', action: '-' };
  };

  const getLatestReview = () => {
    if (!timeline || timeline.length === 0) return null;
    const reviewEvents = timeline.filter(
      (e) => e.title === 'approve' || e.title === 'reject'
    );
    if (reviewEvents.length === 0) return null;
    return reviewEvents[0];
  };

  const getLatestOperation = () => {
    if (!timeline || timeline.length === 0) return null;
    return timeline[0];
  };

  const getTimeFromNow = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const pendingRole = getPendingRole();
  const latestReview = getLatestReview();
  const latestOperation = getLatestOperation();

  const itemColumns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 60,
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      render: (price: number) => `¥${price.toLocaleString()}`,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (amount: number) => (
        <span style={{ fontWeight: 600 }}>¥{amount.toLocaleString()}</span>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/quotations')}>
            返回列表
          </Button>
          <h1 className="page-title">报价单详情</h1>
          <Tag color={getStatusColor(quotation.status)} style={{ fontSize: 14, padding: '4px 12px' }}>
            {getStatusName(quotation.status)}
          </Tag>
        </Space>
        <div className="action-bar">
          {canEdit && (
            <Button icon={<EditOutlined />} onClick={openEditModal}>
              编辑
            </Button>
          )}
          {canSubmit && (
            <Button type="primary" icon={<SendOutlined />} onClick={() => setSubmitModalVisible(true)}>
              提交报价
            </Button>
          )}
          {canApprove && (
            <Button type="primary" icon={<CheckOutlined />} onClick={() => { form.resetFields(); setApproveModalVisible(true); }}>
              确认报价
            </Button>
          )}
          {canReject && (
            <Button danger icon={<CloseOutlined />} onClick={() => { form.resetFields(); setRejectModalVisible(true); }}>
              退回修改
            </Button>
          )}
          {relatedContract && (
            <>
              <Button icon={<EyeOutlined />} onClick={() => navigate(`/contracts/${relatedContract.id}#contract-timeline`)}>
                查看关联合同
              </Button>
              <Button icon={<ClockCircleOutlined />} onClick={() => navigate(`/contracts/${relatedContract.id}#contract-timeline`)}>
                流转回看
              </Button>
            </>
          )}
          {canDraftContract && !relatedContract && (
            <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={openContractModal}>
              起草合同
            </Button>
          )}
        </div>
      </div>

      <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
        <Row gutter={24}>
          <Col span={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserOutlined style={{ color: '#1890ff', fontSize: 16 }} />
              <span style={{ color: '#666', fontSize: 13 }}>待处理角色：</span>
              <Tag color={pendingRole.role === 'operation_manager' ? 'purple' : 'blue'} style={{ margin: 0 }}>
                {pendingRole.roleName}
              </Tag>
              <span style={{ color: '#333', fontWeight: 500 }}>{pendingRole.action}</span>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {latestReview ? (
                <>
                  <CommentOutlined style={{ color: latestReview.title === 'reject' ? '#ff4d4f' : '#52c41a', fontSize: 16 }} />
                  <span style={{ color: '#666', fontSize: 13 }}>最近审核：</span>
                  <span style={{ 
                    color: latestReview.title === 'reject' ? '#ff4d4f' : '#52c41a', 
                    fontWeight: 500,
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }} title={quotation.approvalComment || latestReview.description}>
                    {quotation.approvalComment || latestReview.description}
                  </span>
                </>
              ) : (
                <>
                  <CommentOutlined style={{ color: '#bfbfbf', fontSize: 16 }} />
                  <span style={{ color: '#999', fontSize: 13 }}>最近审核：暂无审核记录</span>
                </>
              )}
            </div>
          </Col>
          <Col span={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {latestOperation ? (
                <>
                  <ClockCircleOutlined style={{ color: '#722ed1', fontSize: 16 }} />
                  <span style={{ color: '#666', fontSize: 13 }}>最近操作：</span>
                  <span style={{ color: '#333', fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={latestOperation.description}>
                    {latestOperation.description}
                  </span>
                  <span style={{ color: '#999', fontSize: 12, marginLeft: 4 }}>
                    · {getTimeFromNow(latestOperation.timestamp)}
                  </span>
                </>
              ) : (
                <>
                  <ClockCircleOutlined style={{ color: '#bfbfbf', fontSize: 16 }} />
                  <span style={{ color: '#999', fontSize: 13 }}>最近操作：暂无</span>
                </>
              )}
            </div>
          </Col>
        </Row>
      </div>

      {property && (
        <div className="detail-section">
          <h2 className="detail-section-title">关联房源</h2>
          <Card
            size="small"
            hoverable
            onClick={() => navigate(`/properties/${property.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <Descriptions column={3} size="small">
              <Descriptions.Item label="位置">
                {property.building} {property.floor}层 {property.roomNumber}
              </Descriptions.Item>
              <Descriptions.Item label="面积">{property.area} ㎡</Descriptions.Item>
              <Descriptions.Item label="单价">¥{property.unitPrice}/㎡/月</Descriptions.Item>
              <Descriptions.Item label="装修">{decorationNames[property.decoration]}</Descriptions.Item>
              <Descriptions.Item label="朝向">{property.orientation}</Descriptions.Item>
              <Descriptions.Item label="房源状态">
                <Tag color={property.statusDisplay?.color}>{property.statusDisplay?.label}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      )}

      {viewing && (
        <div className="detail-section">
          <h2 className="detail-section-title">关联看房记录</h2>
          <Card
            size="small"
            hoverable
            onClick={() => navigate(`/viewings/${viewing.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <Descriptions column={3} size="small">
              <Descriptions.Item label="客户姓名">{viewing.customerName}</Descriptions.Item>
              <Descriptions.Item label="预约时间">{formatDate(viewing.scheduledAt)}</Descriptions.Item>
              <Descriptions.Item label="顾问">{viewing.consultantName}</Descriptions.Item>
              <Descriptions.Item label="兴趣程度">
                <Tag color={viewing.interestLevel === 'high' ? 'red' : viewing.interestLevel === 'medium' ? 'orange' : 'default'}>
                  {interestLevelNames[viewing.interestLevel]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="看房状态">
                <Tag>{viewingStatusNames[viewing.status]}</Tag>
              </Descriptions.Item>
              {viewing.feedback && (
                <Descriptions.Item label="反馈" span={2}>
                  {viewing.feedback}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </div>
      )}

      <div className="detail-section">
        <h2 className="detail-section-title">状态判断与流转指引</h2>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card size="small" className="judgment-card">
              <div className="judgment-card-title">
                <InfoCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                <span>当前状态判断依据</span>
              </div>
              <div className="judgment-card-content">
                <p className="judgment-status">{judgment.title}</p>
                <ul className="judgment-list">
                  {judgment.basis.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" className="judgment-card">
              <div className="judgment-card-title">
                <ArrowRightOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <span>下一步操作指引</span>
              </div>
              <div className="judgment-card-content">
                <ul className="judgment-list">
                  {judgment.nextSteps.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" className="judgment-card">
              <div className="judgment-card-title">
                <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
                <span>限制与注意事项</span>
              </div>
              <div className="judgment-card-content">
                <ul className="judgment-list">
                  {judgment.restrictions.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {relatedContract && (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
          message={
            <Space size="large">
              <span>
                <SafetyCertificateOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                已关联合同：<strong>{relatedContract.contractNo}</strong>，当前状态：
                <Tag color={relatedContract.statusDisplay?.color} style={{ marginLeft: 8 }}>
                  {relatedContract.statusDisplay?.label}
                </Tag>
              </span>
              <Space>
                <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/contracts/${relatedContract.id}`)}>
                  查看合同详情
                </Button>
                <Button size="small" icon={<ClockCircleOutlined />} onClick={() => navigate(`/contracts/${relatedContract.id}`)}>
                  流转回看
                </Button>
              </Space>
            </Space>
          }
        />
      )}

      <div className="detail-section">
        <h2 className="detail-section-title">报价概览</h2>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="总金额" value={quotation.totalAmount} precision={2} prefix="¥" />
          </Col>
          <Col span={6}>
            <Statistic title="租期" value={quotation.leaseTerm} suffix="个月" />
          </Col>
          <Col span={6}>
            <Statistic title="免租期" value={quotation.rentFreePeriod} suffix="个月" />
          </Col>
          <Col span={6}>
            <Statistic title="押金" value={quotation.depositMonths} suffix="个月租金" />
          </Col>
        </Row>
      </div>

      <div className="detail-section">
        <h2 className="detail-section-title">基本信息</h2>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="报价单号">{quotation.quotationNo}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={getStatusColor(quotation.status)}>{getStatusName(quotation.status)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="客户姓名">{quotation.customerName}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{quotation.customerPhone}</Descriptions.Item>
          <Descriptions.Item label="公司名称">{quotation.companyName || '-'}</Descriptions.Item>
          <Descriptions.Item label="顾问">{quotation.consultantName}</Descriptions.Item>
          <Descriptions.Item label="付款方式">{paymentMethodNames[quotation.paymentMethod] || quotation.paymentMethod}</Descriptions.Item>
          <Descriptions.Item label="有效期至">{formatDate(quotation.validUntil)}</Descriptions.Item>
          {quotation.approverName && (
            <Descriptions.Item label="审批人">{quotation.approverName}</Descriptions.Item>
          )}
          {quotation.approvedAt && (
            <Descriptions.Item label="审批时间">{formatDate(quotation.approvedAt)}</Descriptions.Item>
          )}
          {quotation.approvalComment && (
            <Descriptions.Item label="审批意见" span={2}>
              {quotation.approvalComment}
            </Descriptions.Item>
          )}
          {quotation.remarks && (
            <Descriptions.Item label="备注" span={2}>
              {quotation.remarks}
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>

      <div className="detail-section">
        <h2 className="detail-section-title">报价明细</h2>
        <Table
          columns={itemColumns}
          dataSource={quotation.items}
          rowKey="name"
          pagination={false}
          summary={(pageData) => {
            let total = 0;
            pageData.forEach((item) => {
              total += item.amount;
            });
            return (
              <>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5} style={{ textAlign: 'right', fontWeight: 600 }}>
                    合计：
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} style={{ fontWeight: 600, color: '#f5222d' }}>
                    ¥{total.toLocaleString()}
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </>
            );
          }}
        />
      </div>

      <div className="detail-section" id="quotation-timeline">
        <h2 className="detail-section-title">流转时间线</h2>
        <div className="timeline-container">
          {timeline.length > 0 ? (
            <Timeline
              items={timeline.map((event) => {
                const isReview = event.title === 'approve' || event.title === 'reject';
                const isReject = event.title === 'reject';
                return {
                  color: isReject ? 'red' : isReview ? 'green' : event.newStatus ? 'blue' : 'gray',
                  dot: isReview ? (isReject ? <CloseOutlined /> : <CheckOutlined />) : undefined,
                  children: (
                    <div style={isReview ? {
                      background: isReject ? '#fff2f0' : '#f6ffed',
                      border: `1px solid ${isReject ? '#ffccc7' : '#b7eb8f'}`,
                      borderRadius: 8,
                      padding: '12px 16px',
                      marginBottom: 8,
                    } : {}}>
                      <div style={{ fontWeight: 500 }}>
                        {event.title === 'approve' ? '审核通过' :
                         event.title === 'reject' ? '退回修改' :
                         event.title === 'submit' ? '提交报价' :
                         event.title === 'create' ? '创建报价' :
                         event.title === 'edit' ? '编辑报价' :
                         event.title === 'expire' ? '报价过期' :
                         event.title}
                      </div>
                      <div style={{ color: '#666', margin: '4px 0' }}>{event.description}</div>
                      {isReview && (event.details?.approvalComment || event.details?.reviewComment || quotation.approvalComment) && (
                        <Alert
                          type={isReject ? 'error' : 'success'}
                          showIcon
                          message={isReject ? '退回原因' : '审核意见'}
                          description={event.details?.approvalComment || event.details?.reviewComment || quotation.approvalComment}
                          style={{ marginTop: 8, fontSize: 13 }}
                        />
                      )}
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                        {event.operator} ({event.operatorRole === 'rental_consultant' ? '租赁顾问' : event.operatorRole === 'operation_manager' ? '运营经理' : '财务'}) · {formatDate(event.timestamp)}
                      </div>
                    </div>
                  ),
                };
              })}
            />
          ) : (
            <Empty description="暂无流转记录" />
          )}
        </div>
      </div>

      <Modal
        title="提交报价"
        open={submitModalVisible}
        onOk={handleSubmit}
        onCancel={() => setSubmitModalVisible(false)}
        confirmLoading={actionLoading}
        okText="确认提交"
        cancelText="取消"
      >
        <p>确定要提交这份报价单吗？提交后将由运营经理进行确认。</p>
        <Alert
          message="提交后将进入待确认状态，运营经理可以确认或退回修改"
          type="info"
          showIcon
          style={{ marginTop: 12 }}
        />
      </Modal>

      <Modal
        title="确认报价"
        open={approveModalVisible}
        onOk={handleApprove}
        onCancel={() => setApproveModalVisible(false)}
        confirmLoading={actionLoading}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="approvalComment"
            label="确认意见"
          >
            <TextArea rows={3} placeholder="请输入确认意见（选填）..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="退回修改"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => setRejectModalVisible(false)}
        confirmLoading={actionLoading}
        okText="确认退回"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="approvalComment"
            label="退回原因"
            rules={[{ required: true, message: '请输入退回原因' }]}
          >
            <TextArea rows={4} placeholder="请详细说明需要修改的内容..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑报价单"
        open={editModalVisible}
        onOk={handleEdit}
        onCancel={() => setEditModalVisible(false)}
        confirmLoading={actionLoading}
        okText="保存"
        cancelText="取消"
        width={800}
      >
        <Form form={editForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customerName" label="客户姓名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customerPhone" label="联系电话" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="companyName" label="公司名称">
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="leaseTerm" label="租期（月）" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="rentFreePeriod" label="免租期（月）" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="depositMonths" label="押金（月）" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="paymentMethod" label="付款方式" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="monthly">月付</Select.Option>
              <Select.Option value="quarterly">季付</Select.Option>
              <Select.Option value="semi_annual">半年付</Select.Option>
              <Select.Option value="annual">年付</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="validUntil" label="有效期至" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
          <Divider orientation="left">报价明细</Divider>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'name']}
                      rules={[{ required: true, message: '请输入项目名称' }]}
                      style={{ width: 120, marginBottom: 0 }}
                    >
                      <Input placeholder="项目名称" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'description']}
                      style={{ width: 150, marginBottom: 0 }}
                    >
                      <Input placeholder="描述" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      rules={[{ required: true, message: '请输入数量' }]}
                      style={{ width: 80, marginBottom: 0 }}
                    >
                      <Input type="number" placeholder="数量" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'unit']}
                      rules={[{ required: true, message: '请输入单位' }]}
                      style={{ width: 60, marginBottom: 0 }}
                    >
                      <Input placeholder="单位" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'unitPrice']}
                      rules={[{ required: true, message: '请输入单价' }]}
                      style={{ width: 100, marginBottom: 0 }}
                    >
                      <Input type="number" placeholder="单价" />
                    </Form.Item>
                    <Button type="dashed" onClick={() => remove(name)} danger size="small">
                      删除
                    </Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<FileTextOutlined />}>
                  添加报价项目
                </Button>
              </>
            )}
          </Form.List>
          <Form.Item name="remarks" label="备注" style={{ marginTop: 16 }}>
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="起草合同"
        open={contractModalVisible}
        onOk={handleCreateContract}
        onCancel={() => setContractModalVisible(false)}
        confirmLoading={contractCreating}
        okText="创建合同"
        cancelText="取消"
        width={700}
      >
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f', fontSize: 13 }}>
          <InfoCircleOutlined style={{ color: '#52c41a', marginRight: 6 }} />
          基于已确认报价单自动带入客户与金额字段，创建后房源状态将同步更新为「合同起草中」
        </div>
        <Form form={contractForm} layout="vertical">
          <Divider orientation="left">客户信息（自动带入）</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="customerName" label="客户姓名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="customerPhone" label="联系电话" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="companyName" label="公司名称">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left">合同条款</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="monthlyRent" label="月租金（元）" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="leaseTerm" label="租期（月）" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="depositAmount" label="押金金额（元）" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="rentFreePeriod" label="免租期（月）" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="paymentMethod" label="付款方式" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="monthly">月付</Select.Option>
                  <Select.Option value="quarterly">季付</Select.Option>
                  <Select.Option value="semi_annual">半年付</Select.Option>
                  <Select.Option value="annual">年付</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="leaseStartDate" label="租期开始日期" rules={[{ required: true, message: '请选择开始日期' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="leaseEndDate" label="租期结束日期" rules={[{ required: true, message: '请选择结束日期' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        open={contractSuccessVisible}
        onCancel={() => setContractSuccessVisible(false)}
        footer={null}
        width={520}
        centered
      >
        <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f6ffed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <SafetyCertificateOutlined style={{ fontSize: 36, color: '#52c41a' }} />
          </div>
          <h3 style={{ marginBottom: 8, fontSize: 18 }}>合同创建成功</h3>
          <p style={{ color: '#595959', marginBottom: 24 }}>
            合同编号：<strong>{newlyCreatedContract?.contractNo}</strong><br />
            房源状态已同步更新为「合同起草中」
          </p>
          <div className="create-btn-group" style={{ justifyContent: 'center' }}>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="large"
              onClick={() => {
                setContractSuccessVisible(false);
                navigate(`/contracts/${newlyCreatedContract?.id}#contract-timeline`);
              }}
            >
              查看合同详情
            </Button>
            <Button
              icon={<ClockCircleOutlined />}
              size="large"
              onClick={() => {
                setContractSuccessVisible(false);
                navigate(`/contracts/${newlyCreatedContract?.id}#contract-timeline`);
              }}
            >
              流转回看
            </Button>
            <Button
              size="large"
              onClick={() => setContractSuccessVisible(false)}
            >
              留在报价页
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuotationDetail;
