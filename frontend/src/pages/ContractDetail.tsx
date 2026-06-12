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
  Spin,
  Alert,
  Empty,
  Card,
  Divider,
  Statistic,
  Row,
  Col,
  Steps,
  Collapse,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  SendOutlined,
  EditOutlined,
  FileTextOutlined,
  FileSearchOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { contractAPI, logsAPI } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import {
  Contract,
  ContractClause,
  Property,
  Quotation,
  TimelineEvent,
  decorationNames,
} from '../types';

const { TextArea } = Input;
const { Panel } = Collapse;

const ContractDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [signForm] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<Contract | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [signModalVisible, setSignModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchData(id);
  }, [id]);

  const fetchData = async (contractId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [contractRes, timelineRes] = await Promise.all([
        contractAPI.get(contractId),
        logsAPI.getTimeline('contract', contractId),
      ]);
      setContract(contractRes.data);
      setProperty(contractRes.data.property || null);
      setQuotation(contractRes.data.quotation || null);
      setTimeline(timelineRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || '加载合同失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await contractAPI.submitReview(id);
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
      await contractAPI.approve(id, values.reviewComment);
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
      await contractAPI.reject(id, values.reviewComment);
      setRejectModalVisible(false);
      fetchData(id);
    } catch (err: any) {
      setError(err.response?.data?.error || '拒绝失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSign = async () => {
    if (!id) return;
    try {
      const values = await signForm.validateFields();
      setActionLoading(true);
      await contractAPI.sign(id, values);
      setSignModalVisible(false);
      fetchData(id);
    } catch (err: any) {
      setError(err.response?.data?.error || '签署失败');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('zh-CN');

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'default',
      under_review: 'blue',
      approved: 'purple',
      signed: 'green',
      rejected: 'red',
      terminated: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusName = (status: string) => {
    const names: Record<string, string> = {
      draft: '草稿',
      under_review: '审核中',
      approved: '已批准',
      signed: '已签署',
      rejected: '已拒绝',
      terminated: '已终止',
    };
    return names[status] || status;
  };

  const getStepStatus = (status: string) => {
    const order = ['draft', 'under_review', 'approved', 'signed'];
    const currentIndex = order.indexOf(status);
    if (currentIndex === -1) return 'process';
    return currentIndex >= 3 ? 'finish' : 'process';
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

  if (!contract) {
    return <Empty description="未找到合同" />;
  }

  const isOwner = user && contract.createdBy === user.id;
  const isManager = user?.role === 'operation_manager';
  const canSubmit = isOwner && (contract.status === 'draft' || contract.status === 'rejected');
  const canApprove = isManager && contract.status === 'under_review';
  const canReject = isManager && contract.status === 'under_review';
  const canSign = isManager && contract.status === 'approved';

  const stepItems = [
    { title: '起草', icon: <FileTextOutlined />, description: '租赁顾问起草合同' },
    { title: '审核', icon: <FileSearchOutlined />, description: '运营经理审核合同' },
    { title: '批准', icon: <CheckOutlined />, description: '审核通过，待签署' },
    { title: '签署', icon: <SafetyCertificateOutlined />, description: '双方签署生效' },
  ];

  const clauseCategoryNames: Record<string, string> = {
    basic: '基本条款',
    payment: '付款条款',
    liability: '违约责任',
    termination: '终止条款',
    other: '其他条款',
  };

  const getStatusJudgment = () => {
    const judgments: Record<string, { title: string; basis: string[]; nextSteps: string[]; restrictions: string[] }> = {
      draft: {
        title: '草稿状态',
        basis: [
          '合同由租赁顾问创建，尚未提交审核',
          '当前可自由编辑合同条款内容',
          '创建合同时房源状态已同步更新为「合同起草中」',
        ],
        nextSteps: [
          '完善合同所有条款内容，确保条款完整准确',
          '确认条款与报价单内容一致',
          '点击"提交审核"按钮，提交给运营经理审批',
        ],
        restrictions: [
          '草稿状态合同不具有法律效力',
          '不能作为正式履约依据',
          '提交审核前请仔细核对条款内容',
        ],
      },
      under_review: {
        title: '审核中',
        basis: [
          '合同已提交审核，等待运营经理审批',
          '由租赁顾问提交，运营经理负责审核',
          '审核过程中合同内容不可修改，房源状态为「合同审核中」',
        ],
        nextSteps: [
          '运营经理审核合同条款的合法性和完整性',
          '审核通过后进入"已批准"状态',
          '审核不通过则退回修改，状态变更为"已拒绝"',
        ],
        restrictions: [
          '审核期间合同内容锁定，不可编辑',
          '如需修改，需等待退回后重新提交',
          '审核时限建议不超过2个工作日',
        ],
      },
      approved: {
        title: '已批准',
        basis: [
          '合同已通过运营经理审核批准',
          '条款内容已确认，待双方签署',
          '当前房源状态仍为「合同审核中」，签署后才会同步更新',
        ],
        nextSteps: [
          '联系客户确认合同条款细节',
          '安排双方签署合同（线下或电子签）',
          '签署完成后由运营经理更新状态为"已签署"',
        ],
        restrictions: [
          '已批准但未签署的合同尚未正式生效',
          '签署前如条款有重大变更需重新审核',
          '批准后超过30天未签署需重新确认',
        ],
      },
      signed: {
        title: '已签署',
        basis: [
          '合同已由双方签署，正式生效',
          '签署后合同具有法律效力',
          '房源状态已同步更新为「合同已签署」',
        ],
        nextSteps: [
          '安排物业交接，准备入住（状态流转为「待交接」）',
          '创建押金记录，收取押金和首期租金',
          '跟进客户入住后的相关服务',
        ],
        restrictions: [
          '已签署合同不可随意修改',
          '如需变更需签订补充协议',
          '终止合同需按违约条款处理',
        ],
      },
      rejected: {
        title: '已拒绝',
        basis: [
          '合同经审核未通过，已退回修改',
          '退回时会附带审核意见，可在审核记录中查看',
          '房源状态同步回退为「合同起草中」',
        ],
        nextSteps: [
          '查看审核意见，了解退回原因',
          '根据意见修改合同条款',
          '修改完成后重新提交审核',
        ],
        restrictions: [
          '已拒绝的合同不生效',
          '需修改后重新走审核流程',
          '多次被拒可能需要重新评估客户需求',
        ],
      },
      terminated: {
        title: '已终止',
        basis: [
          '合同已提前终止或到期终止',
          '终止后合同不再具有法律效力',
          '需按合同约定处理退租和押金',
        ],
        nextSteps: [
          '安排物业退租交接',
          '结算各项费用和押金',
          '更新房源状态为可租',
        ],
        restrictions: [
          '终止后合同不可恢复',
          '如有争议按合同约定处理',
          '需做好交接记录和费用清算',
        ],
      },
    };
    return judgments[contract.status] || {
      title: '未知状态',
      basis: ['当前状态信息不详'],
      nextSteps: ['请联系系统管理员'],
      restrictions: [],
    };
  };

  const statusJudgment = getStatusJudgment();

  const groupedClauses = contract.clauses.reduce((acc: Record<string, ContractClause[]>, clause) => {
    const category = clause.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(clause);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/contracts')}>
            返回列表
          </Button>
          <h1 className="page-title">合同详情</h1>
          <Tag color={getStatusColor(contract.status)} style={{ fontSize: 14, padding: '4px 12px' }}>
            {getStatusName(contract.status)}
          </Tag>
        </Space>
        <div className="action-bar">
          {canSubmit && (
            <Button type="primary" icon={<SendOutlined />} onClick={() => setSubmitModalVisible(true)}>
              提交审核
            </Button>
          )}
          {canApprove && (
            <Button type="primary" icon={<CheckOutlined />} onClick={() => { form.resetFields(); setApproveModalVisible(true); }}>
              审核通过
            </Button>
          )}
          {canReject && (
            <Button danger icon={<CloseOutlined />} onClick={() => { form.resetFields(); setRejectModalVisible(true); }}>
              退回修改
            </Button>
          )}
          {canSign && (
            <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={() => { signForm.resetFields(); setSignModalVisible(true); }}>
              签署合同
            </Button>
          )}
        </div>
      </div>

      <div className="detail-section">
        <h2 className="detail-section-title">合同流转状态</h2>
        <Steps
          current={
            contract.status === 'draft' ? 0 :
            contract.status === 'under_review' ? 1 :
            contract.status === 'approved' ? 2 :
            contract.status === 'signed' ? 3 : 0
          }
          status={contract.status === 'rejected' ? 'error' : getStepStatus(contract.status)}
          items={stepItems}
        />
      </div>

      <div className="judgment-section">
        <h3 className="judgment-section-title">
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          状态判断与流转指引
        </h3>
        <div className="judgment-row">
          <div className="judgment-card">
            <div className="judgment-card-title">
              <InfoCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
              当前状态判断依据
            </div>
            <div className="judgment-card-subtitle">{statusJudgment.title}</div>
            <ul className="judgment-list">
              {statusJudgment.basis.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="judgment-card">
            <div className="judgment-card-title">
              <ArrowRightOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              下一步操作指引
            </div>
            <div className="judgment-card-subtitle">操作建议</div>
            <ul className="judgment-list">
              {statusJudgment.nextSteps.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="judgment-card">
            <div className="judgment-card-title">
              <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
              限制与注意事项
            </div>
            <div className="judgment-card-subtitle">风险提示</div>
            <ul className="judgment-list">
              {statusJudgment.restrictions.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
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

      {quotation && (
        <div className="detail-section">
          <h2 className="detail-section-title">关联报价单</h2>
          <Card
            size="small"
            hoverable
            onClick={() => navigate(`/quotations/${quotation.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <Descriptions column={3} size="small">
              <Descriptions.Item label="报价单号">{quotation.quotationNo}</Descriptions.Item>
              <Descriptions.Item label="总金额">¥{quotation.totalAmount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="租期">{quotation.leaseTerm}个月</Descriptions.Item>
              <Descriptions.Item label="免租期">{quotation.rentFreePeriod}个月</Descriptions.Item>
              <Descriptions.Item label="押金">{quotation.depositMonths}个月</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={quotation.statusDisplay?.color}>{quotation.statusDisplay?.label}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      )}

      <div className="detail-section">
        <h2 className="detail-section-title">合同概览</h2>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="月租金" value={contract.monthlyRent} precision={2} prefix="¥" />
          </Col>
          <Col span={6}>
            <Statistic title="年租金" value={contract.annualRent} precision={2} prefix="¥" />
          </Col>
          <Col span={6}>
            <Statistic title="租期" value={contract.leaseTerm} suffix="个月" />
          </Col>
          <Col span={6}>
            <Statistic title="押金" value={contract.depositAmount} precision={2} prefix="¥" />
          </Col>
        </Row>
      </div>

      <div className="detail-section">
        <h2 className="detail-section-title">基本信息</h2>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="合同编号">{contract.contractNo}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={getStatusColor(contract.status)}>{getStatusName(contract.status)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="客户姓名">{contract.customerName}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{contract.customerPhone}</Descriptions.Item>
          <Descriptions.Item label="公司名称">{contract.companyName || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建人">{contract.createdByName}</Descriptions.Item>
          <Descriptions.Item label="起租日期">{formatDate(contract.leaseStartDate)}</Descriptions.Item>
          <Descriptions.Item label="到期日期">{formatDate(contract.leaseEndDate)}</Descriptions.Item>
          <Descriptions.Item label="付款方式">{contract.paymentMethod}</Descriptions.Item>
          <Descriptions.Item label="免租期">{contract.rentFreePeriod} 个月</Descriptions.Item>
          {contract.reviewerName && (
            <Descriptions.Item label="审核人">{contract.reviewerName}</Descriptions.Item>
          )}
          {contract.reviewedAt && (
            <Descriptions.Item label="审核时间">{formatDate(contract.reviewedAt)}</Descriptions.Item>
          )}
          {contract.reviewComment && (
            <Descriptions.Item label="审核意见" span={2}>
              {contract.reviewComment}
            </Descriptions.Item>
          )}
          {contract.signatoryPartyA && (
            <Descriptions.Item label="甲方签署">{contract.signatoryPartyA}</Descriptions.Item>
          )}
          {contract.signatoryPartyB && (
            <Descriptions.Item label="乙方签署">{contract.signatoryPartyB}</Descriptions.Item>
          )}
          {contract.signedAt && (
            <Descriptions.Item label="签署时间" span={2}>
              {formatDate(contract.signedAt)}
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>

      <div className="detail-section">
        <h2 className="detail-section-title">合同条款</h2>
        <Collapse defaultActiveKey={Object.keys(groupedClauses)}>
          {Object.entries(groupedClauses).map(([category, clauses]) => (
            <Panel header={clauseCategoryNames[category] || category} key={category}>
              {clauses.map((clause) => (
                <div key={clause.id} style={{ marginBottom: 16 }}>
                  <h4 style={{ marginBottom: 8, fontWeight: 600 }}>{clause.title}</h4>
                  <p style={{ color: '#666', lineHeight: 1.8 }}>{clause.content}</p>
                </div>
              ))}
            </Panel>
          ))}
        </Collapse>
      </div>

      <div className="detail-section">
        <h2 className="detail-section-title">流转时间线</h2>
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
                      {event.operator} ({event.operatorRole === 'rental_consultant' ? '租赁顾问' : event.operatorRole === 'operation_manager' ? '运营经理' : '财务'}) · {formatDate(event.timestamp)}
                    </div>
                  </div>
                ),
              }))}
            />
          ) : (
            <Empty description="暂无流转记录" />
          )}
        </div>
      </div>

      <Modal
        title="提交审核"
        open={submitModalVisible}
        onOk={handleSubmitReview}
        onCancel={() => setSubmitModalVisible(false)}
        confirmLoading={actionLoading}
        okText="确认提交"
        cancelText="取消"
      >
        <p>确定要提交这份合同进行审核吗？提交后将由运营经理进行审核。</p>
        <Alert
          message="提交后将进入审核状态，运营经理可以审核通过或退回修改"
          type="info"
          showIcon
          style={{ marginTop: 12 }}
        />
      </Modal>

      <Modal
        title="审核通过"
        open={approveModalVisible}
        onOk={handleApprove}
        onCancel={() => setApproveModalVisible(false)}
        confirmLoading={actionLoading}
        okText="确认通过"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="reviewComment"
            label="审核意见"
          >
            <TextArea rows={3} placeholder="请输入审核意见（选填）..." />
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
            name="reviewComment"
            label="退回原因"
            rules={[{ required: true, message: '请输入退回原因' }]}
          >
            <TextArea rows={4} placeholder="请详细说明需要修改的内容..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="签署合同"
        open={signModalVisible}
        onOk={handleSign}
        onCancel={() => setSignModalVisible(false)}
        confirmLoading={actionLoading}
        okText="确认签署"
        cancelText="取消"
      >
        <Form form={signForm} layout="vertical">
          <Form.Item
            name="signatoryPartyA"
            label="甲方签署"
            rules={[{ required: true, message: '请输入甲方签署人' }]}
          >
            <Input placeholder="请输入甲方签署人名称" />
          </Form.Item>
          <Form.Item
            name="signatoryPartyB"
            label="乙方签署"
            rules={[{ required: true, message: '请输入乙方签署人' }]}
          >
            <Input placeholder="请输入乙方签署人名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContractDetail;
