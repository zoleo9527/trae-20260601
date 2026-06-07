import { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Card,
  Statistic,
  Row,
  Col,
  Tag,
  message,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  InboxOutlined,
  WarningOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { StatusTag } from '@/components/common/StatusTags';
import { StorageStatus } from '@/types';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const StorageList = () => {
  const navigate = useNavigate();
  const items = useStore((state) => state.items);
  const addItem = useStore((state) => state.addItem);
  const markAsAbnormal = useStore((state) => state.markAsAbnormal);
  const markAsCompleted = useStore((state) => state.markAsCompleted);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [abnormalModalOpen, setAbnormalModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');
  const [form] = Form.useForm();
  const [abnormalForm] = Form.useForm();

  const stats = useMemo(() => {
    return {
      total: items.length,
      stored: items.filter((i) => i.status === 'stored').length,
      abnormal: items.filter((i) => i.status === 'abnormal').length,
      completed: items.filter((i) => i.status === 'completed').length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !searchText ||
        item.batchNo.toLowerCase().includes(searchText.toLowerCase()) ||
        item.productName.toLowerCase().includes(searchText.toLowerCase()) ||
        item.id.toLowerCase().includes(searchText.toLowerCase());

      const matchStatus = !statusFilter || item.status === statusFilter;

      const matchDate =
        !dateRange ||
        (dayjs(item.inboundTime).isAfter(dateRange[0]) &&
          dayjs(item.inboundTime).isBefore(dateRange[1]));

      return matchSearch && matchStatus && matchDate;
    });
  }, [items, searchText, statusFilter, dateRange]);

  const columns = [
    {
      title: '入库单号',
      dataIndex: 'id',
      key: 'id',
      width: 140,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '批次号',
      dataIndex: 'batchNo',
      key: 'batchNo',
      width: 160,
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 120,
    },
    {
      title: '产品类型',
      dataIndex: 'productType',
      key: 'productType',
      width: 100,
    },
    {
      title: '数量',
      key: 'quantity',
      width: 100,
      render: (_: any, record: any) => `${record.quantity} ${record.unit}`,
    },
    {
      title: '重量(kg)',
      dataIndex: 'weight',
      key: 'weight',
      width: 100,
    },
    {
      title: '冷库/库位',
      key: 'location',
      width: 140,
      render: (_: any, record: any) => `${record.storageRoom} ${record.shelfNo}`,
    },
    {
      title: '当前温度(℃)',
      dataIndex: 'currentTemperature',
      key: 'currentTemperature',
      width: 120,
      render: (temp: number, record: any) => {
        const diff = Math.abs(temp - record.targetTemperature);
        let color = 'text-green-600';
        if (diff > 3) color = 'text-red-600';
        else if (diff > 1) color = 'text-orange-600';
        return <span className={color}>{temp.toFixed(1)}</span>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: StorageStatus) => <StatusTag status={status} />,
    },
    {
      title: '入库时间',
      dataIndex: 'inboundTime',
      key: 'inboundTime',
      width: 160,
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/storage/${record.id}`)}
          >
            详情
          </Button>
          {record.status !== 'abnormal' && record.status !== 'completed' && (
            <Button
              type="link"
              danger
              icon={<ExclamationCircleOutlined />}
              onClick={() => {
                setSelectedId(record.id);
                setAbnormalModalOpen(true);
              }}
            >
              标记异常
            </Button>
          )}
          {record.status !== 'completed' && (
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                markAsCompleted(record.id);
                message.success('已标记为完成');
              }}
            >
              完成
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleSubmit = (values: any) => {
    addItem({
      batchNo: values.batchNo,
      productName: values.productName,
      productType: values.productType,
      quantity: values.quantity,
      unit: values.unit || '件',
      weight: values.weight,
      source: values.source,
      slaughterDate: values.slaughterDate.format('YYYY-MM-DD'),
      storageRoom: values.storageRoom,
      shelfNo: values.shelfNo,
      inboundTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      expectedOutboundTime: values.expectedOutboundTime
        ? values.expectedOutboundTime.format('YYYY-MM-DD')
        : undefined,
      operator: useStore.getState().currentUser,
      status: 'pending',
      initialTemperature: values.initialTemperature,
      targetTemperature: values.targetTemperature,
      currentTemperature: values.initialTemperature,
    });
    setIsModalOpen(false);
    form.resetFields();
    message.success('入库登记成功');
  };

  const handleAbnormalSubmit = (values: any) => {
    markAsAbnormal(selectedId, values.description);
    setAbnormalModalOpen(false);
    abnormalForm.resetFields();
    message.success('已标记为异常');
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-4">冷库入库管理</h2>
        <Row gutter={16} className="mb-4">
          <Col span={6}>
            <Card>
              <Statistic
                title="总入库单数"
                value={stats.total}
                prefix={<InboxOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="存储中"
                value={stats.stored}
                prefix={<InboxOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="异常数"
                value={stats.abnormal}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已完成"
                value={stats.completed}
                prefix={<CheckSquareOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <div className="flex justify-between items-center mb-4">
        <Space>
          <Input
            placeholder="搜索入库单号、批次号、产品名称"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder="筛选状态"
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v || '')}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="pending">待入库</Option>
            <Option value="stored">已入库</Option>
            <Option value="abnormal">异常</Option>
            <Option value="completed">已完成</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(v) => setDateRange(v)}
            placeholder={['开始日期', '结束日期']}
          />
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          新增入库
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredItems}
        rowKey="id"
        scroll={{ x: 1600 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
      />

      <Modal
        title="新增入库登记"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="batchNo"
                label="批次号"
                rules={[{ required: true, message: '请输入批次号' }]}
              >
                <Input placeholder="例如：BATCH-20260601-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="productName"
                label="产品名称"
                rules={[{ required: true, message: '请输入产品名称' }]}
              >
                <Input placeholder="例如：猪后腿肉" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="productType"
                label="产品类型"
                rules={[{ required: true, message: '请选择产品类型' }]}
              >
                <Select>
                  <Option value="猪肉">猪肉</Option>
                  <Option value="牛肉">牛肉</Option>
                  <Option value="羊肉">羊肉</Option>
                  <Option value="鸡肉">鸡肉</Option>
                  <Option value="鸭肉">鸭肉</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="quantity"
                label="数量"
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit" label="单位" initialValue="件">
                <Select>
                  <Option value="件">件</Option>
                  <Option value="箱">箱</Option>
                  <Option value="袋">袋</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="weight"
                label="重量(kg)"
                rules={[{ required: true, message: '请输入重量' }]}
              >
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="source"
                label="来源"
                rules={[{ required: true, message: '请输入来源' }]}
              >
                <Input placeholder="例如：本地屠宰场A" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="slaughterDate"
                label="屠宰日期"
                rules={[{ required: true, message: '请选择屠宰日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expectedOutboundTime" label="预计出库日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="storageRoom"
                label="冷库"
                rules={[{ required: true, message: '请选择冷库' }]}
              >
                <Select>
                  <Option value="1号冷库">1号冷库</Option>
                  <Option value="2号冷库">2号冷库</Option>
                  <Option value="3号冷库">3号冷库</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="shelfNo"
                label="货架号"
                rules={[{ required: true, message: '请输入货架号' }]}
              >
                <Input placeholder="例如：A-01" />
              </Form.Item>
            </Col>
            <Col span={8}></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="initialTemperature"
                label="入库温度(℃)"
                rules={[{ required: true, message: '请输入入库温度' }]}
              >
                <InputNumber step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="targetTemperature"
                label="目标温度(℃)"
                rules={[{ required: true, message: '请输入目标温度' }]}
                initialValue={-18}
              >
                <InputNumber step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="标记异常"
        open={abnormalModalOpen}
        onCancel={() => setAbnormalModalOpen(false)}
        footer={null}
      >
        <Form form={abnormalForm} layout="vertical" onFinish={handleAbnormalSubmit}>
          <Form.Item
            name="description"
            label="异常说明"
            rules={[{ required: true, message: '请输入异常说明' }]}
          >
            <Input.TextArea rows={4} placeholder="请详细描述异常情况..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" danger htmlType="submit">
                确认标记
              </Button>
              <Button onClick={() => setAbnormalModalOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StorageList;
