import { useState, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Button,
  Space,
  Select,
  DatePicker,
  Input,
  Modal,
  Form,
  message,
  Tag,
} from 'antd';
import {
  ExclamationCircleOutlined,
  WarningOutlined,
  ShopOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useStore } from '@/store';
import {
  AlertStatusTag,
  AlertSeverityTag,
  AlertTypeTag,
} from '@/components/common/StatusTags';
import {
  Alert,
  AlertStatus,
  AlertType,
  Alert as AlertTypeDef,
} from '@/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const Dashboard: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<AlertStatus | undefined>();
  const [typeFilter, setTypeFilter] = useState<AlertType | undefined>();
  const [severityFilter, setSeverityFilter] = useState<AlertTypeDef['severity'] | undefined>();
  const [storeFilter, setStoreFilter] = useState<string | undefined>();
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [form] = Form.useForm();

  const {
    getDashboardStats,
    getAlerts,
    updateAlertStatus,
    stores,
    getLossTrendData,
    getLossTypeDistribution,
    getDifferenceTypeDistribution,
    currentUser,
  } = useStore();

  const stats = getDashboardStats();
  const lossTrendData = getLossTrendData();
  const lossTypeData = getLossTypeDistribution();
  const differenceTypeData = getDifferenceTypeDistribution();

  const alertData = useMemo(() => {
    return getAlerts(
      { page, pageSize },
      {
        status: statusFilter,
        alertType: typeFilter,
        severity: severityFilter,
        storeId: storeFilter,
      }
    );
  }, [page, pageSize, statusFilter, typeFilter, severityFilter, storeFilter, getAlerts]);

  const handleProcess = (alert: Alert) => {
    updateAlertStatus(alert.id, 'processing');
    message.success('已标记为处理中');
  };

  const handleResolve = (alert: Alert) => {
    setSelectedAlert(alert);
    setResolveModalVisible(true);
  };

  const handleResolveSubmit = () => {
    form.validateFields().then((values) => {
      if (selectedAlert) {
        updateAlertStatus(selectedAlert.id, 'resolved', values.resolution);
        message.success('预警已解决');
        setResolveModalVisible(false);
        form.resetFields();
      }
    });
  };

  const handleIgnore = (alert: Alert) => {
    Modal.confirm({
      title: '确认忽略',
      content: '确定要忽略此预警吗？',
      onOk: () => {
        updateAlertStatus(alert.id, 'ignored');
        message.success('已忽略预警');
      },
    });
  };

  const getActionButtons = (alert: Alert) => {
    if (currentUser.role === 'store_manager') {
      return (
        <Space>
          {alert.status === 'active' && (
            <Button size="small" type="primary" onClick={() => handleProcess(alert)}>
              开始处理
            </Button>
          )}
          {alert.status === 'processing' && (
            <Button size="small" type="primary" onClick={() => handleResolve(alert)}>
              解决
            </Button>
          )}
          <Button size="small" onClick={() => handleIgnore(alert)}>
            忽略
          </Button>
        </Space>
      );
    }

    if (currentUser.role === 'supervisor') {
      return (
        <Space>
          {alert.status === 'active' && (
            <Button size="small" type="primary" onClick={() => handleProcess(alert)}>
              督促处理
            </Button>
          )}
          {alert.status === 'processing' && (
            <Button size="small" onClick={() => handleResolve(alert)}>
              查看
            </Button>
          )}
        </Space>
      );
    }

    return (
      <Button size="small" onClick={() => handleResolve(alert)}>
        查看详情
      </Button>
    );
  };

  const columns: ColumnsType<Alert> = [
    {
      title: '预警编号',
      dataIndex: 'alertNo',
      width: 140,
      render: (text) => <span className="font-mono">{text}</span>,
    },
    {
      title: '类型',
      dataIndex: 'alertType',
      width: 120,
      render: (type: AlertType) => <AlertTypeTag type={type} />,
    },
    {
      title: '门店',
      dataIndex: 'storeName',
      width: 150,
    },
    {
      title: '商品',
      dataIndex: 'productName',
      width: 180,
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div className="text-gray-400 text-xs">{record.sku}</div>
        </div>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      width: 100,
      render: (severity: AlertTypeDef['severity']) => (
        <AlertSeverityTag severity={severity} />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: AlertStatus) => <AlertStatusTag status={status} />,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (text) => <span className="text-gray-500">{text}</span>,
    },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      width: 120,
      render: (text) =>
        text ? (
          <Tag
            color={dayjs(text).isBefore(dayjs()) ? 'red' : 'default'}
            icon={<ClockCircleOutlined />}
          >
            {text}
          </Tag>
        ) : (
          '-'
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => getActionButtons(record),
    },
  ];

  return (
    <div className="space-y-6">
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃预警"
              value={stats.activeAlerts}
              prefix={<ExclamationCircleOutlined className="text-red-500" />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="紧急预警"
              value={stats.criticalAlerts}
              prefix={<WarningOutlined className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理差异"
              value={stats.pendingDifferences}
              prefix={<FileTextOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="累计损耗金额"
              value={stats.totalLoss}
              precision={2}
              prefix={<ShopOutlined className="text-green-500" />}
              suffix="元"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="损耗趋势（近7天）">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={lossTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="amount"
                  name="损耗金额(元)"
                  stroke="#ff7300"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="count"
                  name="损耗次数"
                  stroke="#387908"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={6}>
          <Card title="损耗类型分布">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={lossTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {lossTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={6}>
          <Card title="差异类型分布">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={differenceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {differenceTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card title="预警列表" extra={<Space size="large">
        <Select
          placeholder="状态"
          style={{ width: 120 }}
          allowClear
          value={statusFilter}
          onChange={setStatusFilter}
        >
          <Option value="active">待处理</Option>
          <Option value="processing">处理中</Option>
          <Option value="resolved">已解决</Option>
          <Option value="ignored">已忽略</Option>
        </Select>
        <Select
          placeholder="类型"
          style={{ width: 130 }}
          allowClear
          value={typeFilter}
          onChange={setTypeFilter}
        >
          <Option value="expiry_near">临期预警</Option>
          <Option value="price_tag_error">价签错误</Option>
          <Option value="out_of_stock">缺货预警</Option>
          <Option value="restock_slow">补货延迟</Option>
        </Select>
        <Select
          placeholder="严重程度"
          style={{ width: 120 }}
          allowClear
          value={severityFilter}
          onChange={setSeverityFilter}
        >
          <Option value="critical">紧急</Option>
          <Option value="high">高</Option>
          <Option value="medium">中</Option>
          <Option value="low">低</Option>
        </Select>
        <Select
          placeholder="门店"
          style={{ width: 150 }}
          allowClear
          value={storeFilter}
          onChange={setStoreFilter}
        >
          {stores.map((store) => (
            <Option key={store.id} value={store.id}>
              {store.name}
            </Option>
          ))}
        </Select>
        <RangePicker />
      </Space>}>
        <Table
          columns={columns}
          dataSource={alertData.data}
          rowKey="id"
          pagination={{
            current: page,
            pageSize,
            total: alertData.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          scroll={{ x: 1300 }}
        />
      </Card>

      <Modal
        title="解决预警"
        open={resolveModalVisible}
        onOk={handleResolveSubmit}
        onCancel={() => setResolveModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="resolution"
            label="处理结果"
            rules={[{ required: true, message: '请输入处理结果' }]}
          >
            <TextArea rows={4} placeholder="请描述处理结果和整改措施..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
