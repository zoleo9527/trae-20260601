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
                {transition.action}
              </Button>
            ))}
          </div>
        )}
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
