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
  Table,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { handoverAPI, logsAPI } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import {
  HandoverForm,
  Property,
  Contract,
  TimelineEvent,
  decorationNames,
} from '../types';

const { TextArea } = Input;

const HandoverDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [completeForm] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [handover, setHandover] = useState<HandoverForm | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [signModalVisible, setSignModalVisible] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchData(id);
  }, [id]);

  const fetchData = async (handoverId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [handoverRes, timelineRes] = await Promise.all([
        handoverAPI.get(handoverId),
        logsAPI.getTimeline('handover', handoverId),
      ]);
      setHandover(handoverRes.data);
      setProperty(handoverRes.data.property || null);
      setContract(handoverRes.data.contract || null);
      setTimeline(timelineRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || '加载交接单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!id) return;
    try {
      const values = await form.validateFields();
      setActionLoading(true);
      await handoverAPI.signReceiver(id, values.receiverName);
      setSignModalVisible(false);
      fetchData(id);
    } catch (err: any) {
      setError(err.response?.data?.error || '签收失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    try {
      const values = await completeForm.validateFields();
      setActionLoading(true);
      await handoverAPI.complete(id, values);
      setCompleteModalVisible(false);
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
      pending: 'orange',
      in_progress: 'blue',
      completed: 'green',
      disputed: 'red',
    };
    return colors[status] || 'default';
  };

  const getStatusName = (status: string) => {
    const names: Record<string, string> = {
      pending: '待交接',
      in_progress: '交接中',
      completed: '已完成',
      disputed: '有争议',
    };
    return names[status] || status;
  };

  const getConditionName = (condition: string) => {
    const names: Record<string, string> = {
      good: '良好',
      normal: '一般',
      damaged: '损坏',
    };
    return names[condition] || condition;
  };

  const getConditionColor = (condition: string) => {
    const colors: Record<string, string> = {
      good: 'green',
      normal: 'orange',
      damaged: 'red',
    };
    return colors[condition] || 'default';
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

  if (!handover) {
    return <Empty description="未找到交接单" />;
  }

  const isManager = user?.role === 'operation_manager';
  const canSign = handover.status === 'pending' || handover.status === 'in_progress';
  const canComplete = isManager && (handover.status === 'pending' || handover.status === 'in_progress');

  const itemColumns = [
    {
      title: '物品名称',
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
      title: '状态',
      dataIndex: 'condition',
      key: 'condition',
      width: 100,
      render: (condition: string) => (
        <Tag color={getConditionColor(condition)}>{getConditionName(condition)}</Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (text: string) => text || '-',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/handover')}>
            返回列表
          </Button>
          <h1 className="page-title">交接单详情</h1>
          <Tag color={getStatusColor(handover.status)} style={{ fontSize: 14, padding: '4px 12px' }}>
            {getStatusName(handover.status)}
          </Tag>
        </Space>
        <div className="action-bar">
          {canSign && (
            <Button icon={<UserOutlined />} onClick={() => { form.resetFields(); setSignModalVisible(true); }}>
              客户签收
            </Button>
          )}
          {canComplete && (
            <Button type="primary" icon={<CheckOutlined />} onClick={() => { completeForm.resetFields(); setCompleteModalVisible(true); }}>
              完成交接
            </Button>
          )}
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
          <Descriptions.Item label="交接单号">{handover.handoverNo}</Descriptions.Item>
          <Descriptions.Item label="类型">
            <Tag color={handover.type === 'move_in' ? 'blue' : 'orange'}>
              {handover.type === 'move_in' ? '入住交接' : '退租交接'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="交接日期">{formatDate(handover.handoverDate)}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={getStatusColor(handover.status)}>{getStatusName(handover.status)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建人">{handover.createdByName}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDate(handover.createdAt)}</Descriptions.Item>
          {handover.receiverName && (
            <Descriptions.Item label="接收人">{handover.receiverName}</Descriptions.Item>
          )}
          {handover.receiverSignAt && (
            <Descriptions.Item label="接收人签收时间">{formatDate(handover.receiverSignAt)}</Descriptions.Item>
          )}
          {handover.delivererName && (
            <Descriptions.Item label="交付人">{handover.delivererName}</Descriptions.Item>
          )}
          {handover.delivererSignAt && (
            <Descriptions.Item label="交付人签字时间">{formatDate(handover.delivererSignAt)}</Descriptions.Item>
          )}
          {handover.remarks && (
            <Descriptions.Item label="备注" span={2}>
              {handover.remarks}
            </Descriptions.Item>
          )}
          {handover.disputes && (
            <Descriptions.Item label="争议说明" span={2}>
              <Alert message="有争议" description={handover.disputes} type="error" showIcon />
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>

      <div className="detail-section">
        <h2 className="detail-section-title">交接物品清单</h2>
        <Table
          columns={itemColumns}
          dataSource={handover.items}
          rowKey="id"
          pagination={false}
        />
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
        title="客户签收"
        open={signModalVisible}
        onOk={handleSign}
        onCancel={() => setSignModalVisible(false)}
        confirmLoading={actionLoading}
        okText="确认签收"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="receiverName"
            label="接收人姓名"
            rules={[{ required: true, message: '请输入接收人姓名' }]}
          >
            <Input placeholder="请输入接收人姓名" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="完成交接"
        open={completeModalVisible}
        onOk={handleComplete}
        onCancel={() => setCompleteModalVisible(false)}
        confirmLoading={actionLoading}
        okText="确认完成"
        cancelText="取消"
      >
        <Form form={completeForm} layout="vertical">
          <Form.Item name="delivererName" label="交付人姓名">
            <Input placeholder="请输入交付人姓名（选填）" />
          </Form.Item>
          <Form.Item name="disputes" label="争议说明">
            <TextArea rows={3} placeholder="如有争议请在此说明（选填）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HandoverDetail;
