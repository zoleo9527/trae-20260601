import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Descriptions,
  Tag,
  Tabs,
  Timeline,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Spin,
  Alert,
  Table,
  Empty,
} from 'antd';
import {
  ArrowLeftOutlined,
  EyeOutlined,
  FileTextOutlined,
  ContractOutlined,
  CarOutlined,
  DollarOutlined,
  HomeOutlined,
  UserOutlined,
  CalculatorOutlined,
  FileSearchOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  LogoutOutlined,
  RollbackOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { propertyAPI, logsAPI } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import {
  Property,
  ViewingRecord,
  Quotation,
  Contract,
  HandoverForm,
  DepositRecord,
  TimelineEvent,
  StatusTransition,
  decorationNames,
  viewingStatusNames,
  interestLevelNames,
  depositTypeNames,
} from '../types';

const { TextArea } = Input;

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<Property | null>(null);
  const [viewings, setViewings] = useState<ViewingRecord[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [handovers, setHandovers] = useState<HandoverForm[]>([]);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [transitions, setTransitions] = useState<StatusTransition[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [transitionModalVisible, setTransitionModalVisible] = useState(false);
  const [selectedTransition, setSelectedTransition] = useState<StatusTransition | null>(null);
  const [transitionLoading, setTransitionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchData(id);
  }, [id]);

  const fetchData = async (propertyId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [propertyRes, relatedRes, timelineRes, transitionsRes] = await Promise.all([
        propertyAPI.get(propertyId),
        propertyAPI.getRelated(propertyId),
        logsAPI.getTimeline('property', propertyId),
        propertyAPI.getAvailableTransitions(propertyId),
      ]);

      setProperty(propertyRes.data);
      setViewings(relatedRes.data.viewings);
      setQuotations(relatedRes.data.quotations);
      setContracts(relatedRes.data.contracts);
      setHandovers(relatedRes.data.handovers);
      setDeposits(relatedRes.data.deposits);
      setTimeline(timelineRes.data);
      setTransitions(transitionsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || '加载房源详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTransitionClick = (transition: StatusTransition) => {
    setSelectedTransition(transition);
    form.resetFields();
    setTransitionModalVisible(true);
  };

  const handleTransitionConfirm = async () => {
    if (!id || !selectedTransition) return;

    try {
      const values = await form.validateFields();
      setTransitionLoading(true);
      await propertyAPI.transition(id, selectedTransition.to, values.remark);
      setTransitionModalVisible(false);
      fetchData(id);
    } catch (err: any) {
      setError(err.response?.data?.error || '状态转换失败');
    } finally {
      setTransitionLoading(false);
    }
  };

  const canPerformTransition = (transition: StatusTransition) => {
    if (!user) return false;
    return transition.allowedRoles.includes(user.role);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  const viewingColumns = [
    {
      title: '客户姓名',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '联系电话',
      dataIndex: 'customerPhone',
      key: 'customerPhone',
    },
    {
      title: '预约时间',
      dataIndex: 'scheduledAt',
      key: 'scheduledAt',
      render: (text: string) => formatDate(text),
    },
    {
      title: '顾问',
      dataIndex: 'consultantName',
      key: 'consultantName',
    },
    {
      title: '兴趣程度',
      dataIndex: 'interestLevel',
      key: 'interestLevel',
      render: (level: string) => interestLevelNames[level] || level,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : status === 'cancelled' ? 'red' : 'blue'}>
          {viewingStatusNames[status] || status}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ViewingRecord) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/viewings/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

  const quotationColumns = [
    {
      title: '报价单号',
      dataIndex: 'quotationNo',
      key: 'quotationNo',
    },
    {
      title: '客户姓名',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: '有效期至',
      dataIndex: 'validUntil',
      key: 'validUntil',
      render: (text: string) => formatDate(text),
    },
    {
      title: '状态',
      dataIndex: 'statusDisplay',
      key: 'status',
      render: (display: { label: string; color: string }) => (
        <Tag color={display?.color}>{display?.label}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Quotation) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/quotations/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

  const contractColumns = [
    {
      title: '合同编号',
      dataIndex: 'contractNo',
      key: 'contractNo',
    },
    {
      title: '客户姓名',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '租期',
      key: 'leaseTerm',
      render: (_: any, record: Contract) => `${record.leaseTerm}个月`,
    },
    {
      title: '月租金',
      dataIndex: 'monthlyRent',
      key: 'monthlyRent',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: '状态',
      dataIndex: 'statusDisplay',
      key: 'status',
      render: (display: { label: string; color: string }) => (
        <Tag color={display?.color}>{display?.label}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Contract) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/contracts/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

  const handoverColumns = [
    {
      title: '交接单号',
      dataIndex: 'handoverNo',
      key: 'handoverNo',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (type === 'move_in' ? '入住交接' : '退租交接'),
    },
    {
      title: '交接日期',
      dataIndex: 'handoverDate',
      key: 'handoverDate',
      render: (text: string) => formatDate(text),
    },
    {
      title: '状态',
      dataIndex: 'statusDisplay',
      key: 'status',
      render: (display: { label: string; color: string }) => (
        <Tag color={display?.color}>{display?.label}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: HandoverForm) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/handover/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

  const depositColumns = [
    {
      title: '押金单号',
      dataIndex: 'depositNo',
      key: 'depositNo',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => depositTypeNames[type] || type,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: '客户姓名',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '状态',
      dataIndex: 'statusDisplay',
      key: 'status',
      render: (display: { label: string; color: string }) => (
        <Tag color={display?.color}>{display?.label}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: DepositRecord) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/deposits/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

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

  if (!property) {
    return <Empty description="未找到房源信息" />;
  }

  const tabItems = [
    {
      key: 'viewings',
      label: (
        <span>
          <EyeOutlined />
          看房记录 ({viewings.length})
        </span>
      ),
      children: (
        <Table
          columns={viewingColumns}
          dataSource={viewings}
          rowKey="id"
          locale={{ emptyText: '暂无看房记录' }}
        />
      ),
    },
    {
      key: 'quotations',
      label: (
        <span>
          <FileTextOutlined />
          报价单 ({quotations.length})
        </span>
      ),
      children: (
        <Table
          columns={quotationColumns}
          dataSource={quotations}
          rowKey="id"
          locale={{ emptyText: '暂无报价单' }}
        />
      ),
    },
    {
      key: 'contracts',
      label: (
        <span>
          <ContractOutlined />
          合同 ({contracts.length})
        </span>
      ),
      children: (
        <Table
          columns={contractColumns}
          dataSource={contracts}
          rowKey="id"
          locale={{ emptyText: '暂无合同' }}
        />
      ),
    },
    {
      key: 'handovers',
      label: (
        <span>
          <CarOutlined />
          交接单 ({handovers.length})
        </span>
      ),
      children: (
        <Table
          columns={handoverColumns}
          dataSource={handovers}
          rowKey="id"
          locale={{ emptyText: '暂无交接单' }}
        />
      ),
    },
    {
      key: 'deposits',
      label: (
        <span>
          <DollarOutlined />
          押金记录 ({deposits.length})
        </span>
      ),
      children: (
        <Table
          columns={depositColumns}
          dataSource={deposits}
          rowKey="id"
          locale={{ emptyText: '暂无押金记录' }}
        />
      ),
    },
  ];

  const availableTransitions = transitions.filter(canPerformTransition);

  const flowSteps = [
    { key: 'vacant', title: '空置房源', icon: <HomeOutlined />, role: '系统' },
    { key: 'viewing_scheduled', title: '预约看房', icon: <EyeOutlined />, role: '租赁顾问' },
    { key: 'viewing_completed', title: '看房完成', icon: <UserOutlined />, role: '租赁顾问' },
    { key: 'quotation_pending', title: '待报价', icon: <CalculatorOutlined />, role: '租赁顾问' },
    { key: 'quotation_submitted', title: '已报价待确认', icon: <FileTextOutlined />, role: '租赁顾问' },
    { key: 'quotation_approved', title: '报价已确认', icon: <CheckCircleOutlined />, role: '运营经理' },
    { key: 'contract_drafting', title: '合同起草中', icon: <FileTextOutlined />, role: '租赁顾问' },
    { key: 'contract_reviewing', title: '合同审核中', icon: <FileSearchOutlined />, role: '运营经理' },
    { key: 'contract_signed', title: '合同已签署', icon: <SafetyCertificateOutlined />, role: '运营经理' },
    { key: 'handover_pending', title: '待交接', icon: <KeyOutlined />, role: '租赁顾问' },
    { key: 'handover_completed', title: '交接完成', icon: <CheckCircleOutlined />, role: '运营经理' },
    { key: 'occupied', title: '已入住', icon: <HomeOutlined />, role: '系统' },
  ];

  const getCurrentStepIndex = () => {
    const statusOrder = [
      'vacant',
      'viewing_scheduled',
      'viewing_completed',
      'quotation_pending',
      'quotation_submitted',
      'quotation_approved',
      'contract_drafting',
      'contract_reviewing',
      'contract_signed',
      'handover_pending',
      'handover_completed',
      'occupied',
    ];
    const index = statusOrder.indexOf(property.status);
    return index >= 0 ? index : 0;
  };

  const currentStepIndex = getCurrentStepIndex();

  const getFlowStatusDescription = () => {
    const descriptions: Record<string, { basis: string[]; next: string[] }> = {
      vacant: {
        basis: ['房源当前处于空置状态，可随时预约看房'],
        next: ['租赁顾问可预约客户看房，启动租赁流程'],
      },
      viewing_scheduled: {
        basis: ['已预约客户看房，等待看房进行'],
        next: ['看房完成后，记录客户反馈和兴趣程度'],
      },
      viewing_completed: {
        basis: ['看房已完成，已记录客户反馈'],
        next: ['根据客户意向，准备租赁报价方案'],
      },
      quotation_pending: {
        basis: ['处于待报价状态，可创建报价单'],
        next: ['租赁顾问创建报价单，提交后由运营经理确认'],
      },
      quotation_submitted: {
        basis: ['报价单已提交，等待运营经理确认'],
        next: ['运营经理确认报价后，进入合同起草阶段'],
      },
      quotation_approved: {
        basis: ['报价已由运营经理确认生效'],
        next: ['租赁顾问基于报价内容起草租赁合同'],
      },
      contract_drafting: {
        basis: ['合同正在起草中，租赁顾问负责编写条款'],
        next: ['合同起草完成后，提交运营经理审核'],
      },
      contract_reviewing: {
        basis: ['合同已提交审核，等待运营经理审批'],
        next: ['审核通过后签署合同，或退回修改'],
      },
      contract_signed: {
        basis: ['合同已签署，正式生效'],
        next: ['准备物业交接，安排入住'],
      },
      handover_pending: {
        basis: ['待物业交接，已安排交接时间'],
        next: ['完成物业交接，确认物品清单和状态'],
      },
      handover_completed: {
        basis: ['物业交接已完成，双方确认签字'],
        next: ['确认入住，进入租约期'],
      },
      occupied: {
        basis: ['客户已入住，租约正常履行中'],
        next: ['租期结束后安排退租交接'],
      },
    };
    return descriptions[property.status] || { basis: [], next: [] };
  };

  const flowDesc = getFlowStatusDescription();

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/properties')}>
            返回列表
          </Button>
          <h1 className="page-title">
            {property.building} {property.floor}层 {property.roomNumber}
          </h1>
          {property.statusDisplay && (
            <Tag color={property.statusDisplay.color} style={{ fontSize: 14, padding: '4px 12px' }}>
              {property.statusDisplay.label}
            </Tag>
          )}
        </Space>
        {availableTransitions.length > 0 && (
          <div className="action-bar">
            {availableTransitions.map((transition) => (
              <Button
                key={transition.to}
                type="primary"
                onClick={() => handleTransitionClick(transition)}
              >
                {transition.description}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="flow-overview">
        <h2 className="detail-section-title">全流程流转概览</h2>
        <div className="flow-steps">
          {flowSteps.map((step, index) => (
            <div
              key={step.key}
              className={`flow-step ${index < currentStepIndex ? 'completed' : ''} ${index === currentStepIndex ? 'active' : ''}`}
            >
              <div className="flow-step-icon">{step.icon}</div>
              <div className="flow-step-title">{step.title}</div>
              <div className="flow-step-role">{step.role}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, padding: '12px 16px', background: '#e6f7ff', borderRadius: 8, border: '1px solid #91d5ff' }}>
            <div style={{ fontWeight: 500, color: '#1890ff', marginBottom: 8 }}>
              <InfoCircleOutlined style={{ marginRight: 8 }} />
              当前状态判断依据
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#333' }}>
              {flowDesc.basis.map((item, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{item}</li>
              ))}
            </ul>
          </div>
          <div style={{ flex: 1, padding: '12px 16px', background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
            <div style={{ fontWeight: 500, color: '#389e0d', marginBottom: 8 }}>
              <CheckCircleOutlined style={{ marginRight: 8 }} />
              下一步操作指引
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#333' }}>
              {flowDesc.next.map((item, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h2 className="detail-section-title">基本信息</h2>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="位置">
            {property.building} {property.floor}层 {property.roomNumber}
          </Descriptions.Item>
          <Descriptions.Item label="面积">
            {property.area} ㎡
          </Descriptions.Item>
          <Descriptions.Item label="单价">
            ¥{property.unitPrice.toLocaleString()} / ㎡/月
          </Descriptions.Item>
          <Descriptions.Item label="装修">
            {decorationNames[property.decoration] || property.decoration}
          </Descriptions.Item>
          <Descriptions.Item label="朝向">
            {property.orientation}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {property.statusDisplay?.label || property.status}
          </Descriptions.Item>
          <Descriptions.Item label="配套设施" span={2}>
            <Space wrap>
              {property.facilities.map((facility, index) => (
                <Tag key={index} className="facility-tag">
                  {facility}
                </Tag>
              ))}
            </Space>
          </Descriptions.Item>
          {property.description && (
            <Descriptions.Item label="描述" span={2}>
              {property.description}
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>

      <div className="detail-section">
        <h2 className="detail-section-title">关联数据</h2>
        <Tabs items={tabItems} defaultActiveKey="viewings" />
      </div>

      <div className="detail-section">
        <h2 className="detail-section-title">状态流转时间线</h2>
        <div className="timeline-container">
          {timeline.length > 0 ? (
            <Timeline
              items={timeline.map((event) => ({
                color: event.newStatus ? 'blue' : 'gray',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>{event.title}</div>
                    <div style={{ color: '#666', margin: '4px 0' }}>{event.description}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {event.operator} ({event.operatorRole}) · {formatDate(event.timestamp)}
                    </div>
                  </div>
                ),
              }))}
            />
          ) : (
            <Empty description="暂无状态流转记录" />
          )}
        </div>
      </div>

      <Modal
        title={selectedTransition?.action}
        open={transitionModalVisible}
        onOk={handleTransitionConfirm}
        onCancel={() => setTransitionModalVisible(false)}
        confirmLoading={transitionLoading}
        okText="确认"
        cancelText="取消"
      >
        <p style={{ marginBottom: 16 }}>
          确定要将状态从 <strong>{property.statusDisplay?.label}</strong> 变更为{' '}
          <strong>{selectedTransition?.description}</strong> 吗？
        </p>
        <Form form={form} layout="vertical">
          <Form.Item
            name="remark"
            label="备注"
            rules={[{ required: true, message: '请输入备注信息' }]}
          >
            <TextArea rows={4} placeholder="请输入状态变更的备注信息..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PropertyDetail;
