import React from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Button, 
  Space, 
  Row, 
  Col,
  Tag
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  FilterOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { OrderFilterParams, PriorityNames, StatusNames } from '../types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface Props {
  filters: OrderFilterParams;
  onChange: (filters: OrderFilterParams) => void;
  onSearch: () => void;
  onReset: () => void;
  quickFilters?: {
    label: string;
    value: OrderFilterParams;
    type?: 'primary' | 'success' | 'warning' | 'danger';
  }[];
}

const statusOptions = Object.entries(StatusNames).map(([value, label]) => ({ value, label }));
const priorityOptions = Object.entries(PriorityNames).map(([value, label]) => ({ value, label }));

const handlerOptions = [
  { value: '李明', label: '李明（主播助理）' },
  { value: '王芳', label: '王芳（场控）' },
  { value: '赵敏', label: '赵敏（售后组长）' },
];

const OrderFilter: React.FC<Props> = ({ 
  filters, 
  onChange, 
  onSearch, 
  onReset,
  quickFilters 
}) => {
  const [form] = Form.useForm();

  const handleFormChange = (changedValues: any) => {
    const newFilters = { ...filters, ...changedValues };
    
    if (changedValues.liveTimeRange) {
      const [from, to] = changedValues.liveTimeRange || [];
      newFilters.liveTimeFrom = from ? from.toISOString() : undefined;
      newFilters.liveTimeTo = to ? to.toISOString() : undefined;
      delete newFilters.liveTimeRange;
    }
    
    onChange(newFilters);
  };

  const handleQuickFilter = (quickFilter: OrderFilterParams) => {
    onChange(quickFilter);
    form.setFieldsValue({
      ...quickFilter,
      liveTimeRange: quickFilter.liveTimeFrom ? 
        [dayjs(quickFilter.liveTimeFrom), quickFilter.liveTimeTo ? dayjs(quickFilter.liveTimeTo) : null] 
        : undefined
    });
    onSearch();
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  return (
    <Card 
      size="small" 
      style={{ marginBottom: 16 }}
      title={
        <Space>
          <FilterOutlined />
          <span>筛选条件</span>
        </Space>
      }
      extra={
        quickFilters && quickFilters.length > 0 && (
          <Space size="small" wrap>
            <span style={{ fontSize: 12, color: '#999' }}>快捷筛选:</span>
            {quickFilters.map((qf, index) => (
              <Tag
                key={index}
                color={qf.type || 'blue'}
                style={{ cursor: 'pointer', padding: '4px 12px' }}
                onClick={() => handleQuickFilter(qf.value)}
              >
                {qf.label}
              </Tag>
            ))}
          </Space>
        )
      }
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleFormChange}
        initialValues={filters}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="直播场次" name="liveSessionName">
              <Input 
                placeholder="输入场次名称搜索" 
                allowClear
                prefix={<SearchOutlined />}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="优先级" name="priority">
              <Select placeholder="选择优先级" allowClear>
                {priorityOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="订单状态" name="status">
              <Select placeholder="选择状态" allowClear>
                {statusOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="当前处理人" name="currentHandler">
              <Select placeholder="选择处理人" allowClear showSearch>
                {handlerOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={16} lg={12}>
            <Form.Item label="预计开播时间" name="liveTimeRange">
              <RangePicker
                showTime
                style={{ width: '100%' }}
                format="YYYY-MM-DD HH:mm"
                placeholder={['开始时间', '结束时间']}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8} lg={12}>
            <Form.Item label="&nbsp;">
              <Space>
                <Button 
                  type="primary" 
                  icon={<SearchOutlined />}
                  onClick={onSearch}
                >
                  搜索
                </Button>
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                >
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default OrderFilter;
