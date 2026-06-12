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
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  DollarOutlined,
  RollbackOutlined,
  MinusOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { depositAPI, logsAPI } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import {
  DepositRecord,
  Property,
  Contract,
  TimelineEvent,
  depositTypeNames,
  decorationNames,
} from '../types';

const { TextArea } = Input;

const DepositDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [confirmForm] = Form.useForm();
  const [refundForm] = Form.useForm();
  const [deductForm] = Form.useForm();
  const [disputeForm] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [deposit, setDeposit] = useState<DepositRecord | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [deductModalVisible, setDeductModalVisible] = useState(false);
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchData(id);
  }, [id]);

  const fetchData = async (depositId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [depositRes, timelineRes] = await Promise.all([
        depositAPI.get(depositId),
        logsAPI.getTimeline('deposit', depositId),
      ]);
      setDeposit(depositRes.data);
      setProperty(depositRes.data.property || null);
      setContract(depositRes.data.contract || null);
      setTimeline(timelineRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || '加载押金记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await depositAPI.confirmPayment(id);
      setConfirmModalVisible(false);
      fetchData(id);
    } catch (err: any) {
      setError(err.response?.data?.error || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartRefund = async () => {
    if (!id) return;
    try {
      const values = await refundForm.validateFields();
      setActionLoading(true);
      await depositAPI.startRefund(id, values.refundAmount);
      setRefundModalVisible(false);
      fetchData(id);
    } catch (err: any) {
      setError(err.response?.data?.error || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRefund = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await depositAPI.confirmRefund(id);
      fetchData(id);
    } catch (err: any) {
      setError(err.response?.data?.error || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeduct = async () => {
    if (!id) return;
    try {
      const values = await deductForm.validateFields();
      setActionLoading(true);
      await depositAPI.deduct(id, {
        deductionReason: values.deductionReason,
        deductionAmount: Number(values.deductionAmount),
        refundAmount: values.refundAmount ? Number(values.refundAmount) : undefined,
      });
      setDeductModalVisible(false);
      fetchData(id);
    } catch (err: any) {
      setError(err.response?.data?.error || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async () => {
    if (!id) return;
    try {
      const values = await disputeForm.validateFields();
      setActionLoading(true);
      await depositAPI.dispute(id, values.disputes);
      setDisputeModalVisible(false);
      fetchData(id);
    } catch (err: any) {
      setError(err.response?.data?.error || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('zh-CN');

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      unpaid: 'orange',
      paid: 'green',
      refunding: 'blue',
      refunded: 'green',
      deducted: 'red',
      disputed: 'red',
    };
    return colors[status] || 'default';
  };

  const getStatusName = (status: string) => {
    const names: Record<string, string> = {
      unpaid: '未支付',
      paid: '已支付',
      refunding: '退款中',
      refunded: '已退还',
      deducted: '已扣除',
      disputed: '有争议',
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

  if (!deposit) {
    return <Empty description="未找到押金记录" />;
  }

  const isFinance = user?.role === 'finance';
  const canConfirmPayment = isFinance && deposit.status === 'unpaid';
  const canStartRefund = isFinance && deposit.status === 'paid';
  const canConfirmRefund = isFinance && deposit.status === 'refunding';
  const canDeduct = isFinance && deposit.status === 'paid';
  const canDispute = user && deposit.status !== 'disputed';

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/deposits')}>
            返回列表
          </Button>
          <h1 className="page-title">押金详情</h1>
          <Tag color={getStatusColor(deposit.status)} style={{ fontSize: 14, padding: '4px 12px' }}>
            {getStatusName(deposit.status)}
          </Tag>
        </Space>
        <div className="action-bar">
          {canConfirmPayment && (
            <Button type="primary" icon={<CheckOutlined />} onClick={() => setConfirmModalVisible(true)}>
              确认到账
            </Button>
          )}
          {canStartRefund && (
            <Button icon={<RollbackOutlined />} onClick={() => { refundForm.setFieldsValue({ refundAmount: deposit.amount }); setRefundModalVisible(true); }}>
              发起退款
            </Button>
          )}
          {canConfirmRefund && (
            <Button type="primary" icon={<CheckOutlined />} onClick={handleConfirmRefund}>
              确认退款
            </Button>
          )}
          {canDeduct && (
            <Button danger icon={<MinusOutlined />} onClick={() => { deductForm.resetFields(); setDeductModalVisible(true); }}>
              扣除押金
            </Button>
          )}
          {canDispute && (
            <Button icon={<WarningOutlined />} onClick={() => { disputeForm.resetFields(); setDisputeModalVisible(true); }}>
              标记争议
            </Button>
          )}
        </div>
      </div>

      <div className="detail-section">
        <h2 className="detail-section-title">押金概览</h2>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic title="押金金额" value={deposit.amount} precision={2} prefix="¥" />
          </Col>
          {deposit.refundAmount !== undefined && (
            <Col span={8}>
              <Statistic title="退款金额" value={deposit.refundAmount} precision={2} prefix="¥" />
            </Col>
          )}
          {deposit.deductionAmount !== undefined && (
            <Col span={8}>
              <Statistic title="扣除金额" value={deposit.deductionAmount} precision={2} prefix="¥" valueStyle={{ color: '#f5222d' }} />
            </Col>
          )}
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

      {contract && (
        <div className="detail-section">
          <h2 className="detail-section-title">关联合同</h2>
          <Card
            size="small"
            hoverable
            onClick={() => navigate(`/contracts/${contract.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <Descriptions column={3} size="small">
              <Descriptions.Item label="合同编号">{contract.contractNo}</Descriptions.Item>
              <Descriptions.Item label="月租金">¥{contract.monthlyRent.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="租期">{contract.leaseTerm}个月</Descriptions.Item>
              <Descriptions.Item label="客户">{contract.customerName}</Descriptions.Item>
              <Descriptions.Item label="押金">¥{contract.depositAmount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="合同状态">
                <Tag color={contract.statusDisplay?.color}>{contract.statusDisplay?.label}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      )}

      <div className="detail-section">
        <h2 className="detail-section-title">基本信息</h2>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="押金单号">{deposit.depositNo}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={getStatusColor(deposit.status)}>{getStatusName(deposit.status)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="类型">{depositTypeNames[deposit.type] || deposit.type}</Descriptions.Item>
          <Descriptions.Item label="金额">¥{deposit.amount.toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="客户姓名">{deposit.customerName}</Descriptions.Item>
          <Descriptions.Item label="创建人">{deposit.createdByName}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDate(deposit.createdAt)}</Descriptions.Item>
          {deposit.paidAt && (
            <Descriptions.Item label="支付时间">{formatDate(deposit.paidAt)}</Descriptions.Item>
          )}
          {deposit.refundAt && (
            <Descriptions.Item label="退款时间">{formatDate(deposit.refundAt)}</Descriptions.Item>
          )}
          {deposit.deductionReason && (
            <Descriptions.Item label="扣除原因" span={2}>
              {deposit.deductionReason}
            </Descriptions.Item>
          )}
          {deposit.disputes && (
            <Descriptions.Item label="争议说明" span={2}>
              <Alert message="有争议" description={deposit.disputes} type="error" showIcon />
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>

      <div className="detail-section">
        <h2 className="detail-section-title">操作时间线</h2>
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
            <Empty description="暂无操作记录" />
          )}
        </div>
      </div>

      <Modal
        title="确认押金到账"
        open={confirmModalVisible}
        onOk={handleConfirmPayment}
        onCancel={() => setConfirmModalVisible(false)}
        confirmLoading={actionLoading}
        okText="确认到账"
        cancelText="取消"
      >
        <p>确认该笔押金已到账吗？</p>
        <p style={{ color: '#666' }}>押金金额：<strong>¥{deposit.amount.toLocaleString()}</strong></p>
      </Modal>

      <Modal
        title="发起退款"
        open={refundModalVisible}
        onOk={handleStartRefund}
        onCancel={() => setRefundModalVisible(false)}
        confirmLoading={actionLoading}
        okText="确认发起"
        cancelText="取消"
      >
        <Form form={refundForm} layout="vertical">
          <Form.Item
            name="refundAmount"
            label="退款金额"
            rules={[{ required: true, message: '请输入退款金额' }]}
          >
            <Input type="number" prefix="¥" placeholder="请输入退款金额" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="扣除押金"
        open={deductModalVisible}
        onOk={handleDeduct}
        onCancel={() => setDeductModalVisible(false)}
        confirmLoading={actionLoading}
        okText="确认扣除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Form form={deductForm} layout="vertical">
          <Form.Item
            name="deductionReason"
            label="扣除原因"
            rules={[{ required: true, message: '请输入扣除原因' }]}
          >
            <TextArea rows={3} placeholder="请输入扣除原因" />
          </Form.Item>
          <Form.Item
            name="deductionAmount"
            label="扣除金额"
            rules={[{ required: true, message: '请输入扣除金额' }]}
          >
            <Input type="number" prefix="¥" placeholder="请输入扣除金额" />
          </Form.Item>
          <Form.Item
            name="refundAmount"
            label="剩余退款金额"
          >
            <Input type="number" prefix="¥" placeholder="请输入剩余退款金额（选填）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="标记争议"
        open={disputeModalVisible}
        onOk={handleDispute}
        onCancel={() => setDisputeModalVisible(false)}
        confirmLoading={actionLoading}
        okText="确认标记"
        cancelText="取消"
      >
        <Form form={disputeForm} layout="vertical">
          <Form.Item
            name="disputes"
            label="争议说明"
            rules={[{ required: true, message: '请输入争议说明' }]}
          >
            <TextArea rows={4} placeholder="请详细说明争议内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DepositDetail;
