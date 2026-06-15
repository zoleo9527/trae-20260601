import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Card,
  Typography,
  Modal,
  Form,
  Checkbox,
  message,
  Badge,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  UnorderedListOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { orderApi } from '../services/api';
import { useAppContext } from '../App';
import { 
  STATUS_LABELS, 
  STATUS_COLORS, 
  ROLE_LABELS,
  BUSINESS_TYPES,
  ISSUE_TYPE_LABELS
} from '../types';
import type { Order, OrderStatus, UserRole } from '../types';
import dayjs from '../utils/dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function OrderList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, refreshStats } = useAppContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [batchForm] = Form.useForm();
  const [filters, setFilters] = useState({
    keyword: '',
    status: '',
    businessType: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
    urgentOnly: false,
    hasIssuesOnly: false
  });

  const view = searchParams.get('view');

  useEffect(() => {
    loadOrders();
  }, [view]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      let params: any = {};
      
      if (view === 'receptionist') {
        params.role = 'receptionist';
      } else if (view === 'designer') {
        params.status = 'designing';
      } else if (view === 'revisions') {
        params.status = 'revision_needed';
      } else if (view === 'installer') {
        params.status = 'ready_for_install';
      } else if (view === 'production') {
        params.status = 'approved';
      } else if (view === 'quality') {
        params.status = 'quality_check';
      } else if (view === 'customer') {
        params.role = 'customer';
      }

      const data = await orderApi.getOrders(params);
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        if (!order.title.toLowerCase().includes(keyword) &&
            !order.id.toLowerCase().includes(keyword) &&
            !order.customerName.toLowerCase().includes(keyword)) {
          return false;
        }
      }
      if (filters.status && order.status !== filters.status) return false;
      if (filters.businessType && order.businessType !== filters.businessType) return false;
      if (filters.urgentOnly && !order.urgent) return false;
      if (filters.hasIssuesOnly && order.issues?.filter(i => i.status === 'pending').length === 0) return false;
      if (filters.dateRange) {
        const createdAt = dayjs(order.createdAt);
        if (createdAt.isBefore(filters.dateRange[0]) || createdAt.isAfter(filters.dateRange[1])) {
          return false;
        }
      }
      return true;
    });
  }, [orders, filters]);

  const handleBatchAction = async (values: any) => {
    try {
      await orderApi.batchUpdateStatus(
        selectedRowKeys as string[],
        values.status,
        currentUser?.name || '系统',
        values.remark
      );
      message.success(`批量更新了 ${selectedRowKeys.length} 个订单`);
      setBatchModalVisible(false);
      setSelectedRowKeys([]);
      batchForm.resetFields();
      loadOrders();
      refreshStats();
    } catch (e) {
      message.error('批量操作失败');
    }
  };

  const getTitle = () => {
    const titles: Record<string, string> = {
      'receptionist': '订单管理',
      'designer': '设计任务',
      'revisions': '待改稿订单',
      'installer': '安装任务',
      'production': '喷绘任务',
      'quality': '质检任务',
      'customer': '我的订单',
      'batch': '批量处理'
    };
    return titles[view || ''] || '全部订单';
  };

  const canCreateOrder = currentUser?.role === 'admin' || currentUser?.role === 'receptionist';

  const columns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      width: 160,
      render: (text: string, record: Order) => (
        <Space>
          <Text strong>{text}</Text>
          {record.urgent && (
            <Tooltip title="急单">
              <Badge color="red" text={<Tag color="red" style={{ margin: 0 }}>急</Tag>} />
            </Tooltip>
          )}
        </Space>
      )
    },
    {
      title: '订单标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Order) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.businessType} · {record.customerName}
          </Text>
        </Space>
      )
    },
    {
      title: '尺寸',
      key: 'size',
      width: 120,
      render: (_: any, record: Order) => (
        record.width && record.height 
          ? `${record.width}×${record.height}${record.unit}`
          : <Text type="secondary">-</Text>
      )
    },
    {
      title: '材质',
      dataIndex: 'material',
      key: 'material',
      width: 140,
      ellipsis: true
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: OrderStatus) => (
        <Tag color={STATUS_COLORS[status]} style={{ fontSize: 12, padding: '2px 10px' }}>
          {STATUS_LABELS[status]}
        </Tag>
      )
    },
    {
      title: '当前处理',
      dataIndex: 'currentHandler',
      key: 'currentHandler',
      width: 100,
      render: (handler: UserRole | null) => (
        handler ? <Tag color="blue">{ROLE_LABELS[handler]}</Tag> : <Text type="secondary">-</Text>
      )
    },
    {
      title: '问题',
      key: 'issues',
      width: 100,
      render: (_: any, record: Order) => {
        const pendingIssues = record.issues?.filter(i => i.status === 'pending') || [];
        if (pendingIssues.length === 0) {
          return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
        }
        return (
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            <Tag color="orange" style={{ margin: 0 }}>
              {pendingIssues.map(i => ISSUE_TYPE_LABELS[i.type]).join(', ')}
            </Tag>
          </Space>
        );
      }
    },
    {
      title: '交期',
      dataIndex: 'expectedDelivery',
      key: 'expectedDelivery',
      width: 150,
      render: (date: string | null) => {
        if (!date) return <Text type="secondary">-</Text>;
        const isOverdue = dayjs(date).isBefore(dayjs());
        return (
          <Text type={isOverdue ? 'danger' : undefined}>
            {dayjs(date).format('MM-DD HH:mm')}
          </Text>
        );
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Order) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/orders/${record.id}`)}
          >
            详情
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => navigate(`/orders/${record.id}`)}
          >
            处理
          </Button>
        </Space>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>{getTitle()}</Title>
        <Space>
          {selectedRowKeys.length > 0 && (
            <Button 
              type="primary" 
              icon={<UnorderedListOutlined />}
              onClick={() => setBatchModalVisible(true)}
            >
              批量处理 ({selectedRowKeys.length})
            </Button>
          )}
          {canCreateOrder && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/orders/create')}
            >
              新增订单
            </Button>
          )}
          <Button onClick={loadOrders}>刷新</Button>
        </Space>
      </div>

      <Card size="small">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="搜索订单号/标题/客户名"
              prefix={<SearchOutlined />}
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="状态"
              style={{ width: '100%' }}
              value={filters.status || undefined}
              onChange={(v) => setFilters({ ...filters, status: v })}
              allowClear
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <Option key={value} value={value}>{label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="业务类型"
              style={{ width: '100%' }}
              value={filters.businessType || undefined}
              onChange={(v) => setFilters({ ...filters, businessType: v })}
              allowClear
            >
              {BUSINESS_TYPES.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates as any })}
            />
          </Col>
          <Col xs={24} sm={24} md={4}>
            <Space>
              <Checkbox
                checked={filters.urgentOnly}
                onChange={(e) => setFilters({ ...filters, urgentOnly: e.target.checked })}
              >
                仅急单
              </Checkbox>
              <Checkbox
                checked={filters.hasIssuesOnly}
                onChange={(e) => setFilters({ ...filters, hasIssuesOnly: e.target.checked })}
              >
                有问题
              </Checkbox>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredOrders}
          loading={loading}
          rowSelection={rowSelection}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          rowClassName={(record) => record.urgent ? 'order-card-urgent' : ''}
        />
      </Card>

      <Modal
        title="批量处理订单"
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        footer={null}
      >
        <Form form={batchForm} layout="vertical" onFinish={handleBatchAction}>
          <Form.Item
            name="status"
            label="更新状态为"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Option value="pending_review">待审核</Option>
              <Option value="designing">设计中</Option>
              <Option value="pending_approval">待客户确认</Option>
              <Option value="approved">已确认</Option>
              <Option value="printing">喷绘中</Option>
              <Option value="quality_check">质检中</Option>
              <Option value="ready_for_install">待安装</Option>
              <Option value="completed">已完成</Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="处理备注">
            <Input.TextArea rows={3} placeholder="请输入处理备注..." />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                确认批量更新
              </Button>
              <Button onClick={() => setBatchModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
