import { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Input, 
  Select, 
  Tag, 
  Card, 
  Row, 
  Col, 
  Statistic,
  message,
  Alert,
} from 'antd';
import { 
  SearchOutlined, 
  EyeOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import { addHealthListener } from '../api';
import { 
  REISSUE_STATUS_MAP, 
  REQUEST_TYPE_MAP,
  type ReissueStatus,
} from '../types';
import type { ColumnsType } from 'antd/es/table';
import type { ReissueTracking } from '../types';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

export default function ReissueList() {
  const navigate = useNavigate();
  const { 
    reissueList, 
    loadingReissues, 
    error,
    fetchReissueList,
    serviceHealthy,
    setServiceHealthy,
  } = useAppStore();

  const [status, setStatus] = useState<string | undefined>();
  const [keyword, setKeyword] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    const removeListener = addHealthListener(setServiceHealthy);
    return removeListener;
  }, [setServiceHealthy]);

  useEffect(() => {
    fetchReissueList({ status, keyword, page, pageSize });
  }, [status, keyword, page, pageSize]);

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  const handleStatusChange = (value: string | undefined) => {
    setStatus(value);
    setPage(1);
  };

  const columns: ColumnsType<ReissueTracking> = [
    {
      title: '补发单号',
      dataIndex: 'tracking_no',
      key: 'tracking_no',
      width: 150,
      render: (text, record) => <a onClick={() => navigate(`/reissues/${record.id}`)}>{text}</a>,
    },
    {
      title: '关联申请',
      dataIndex: 'request_no',
      key: 'request_no',
      width: 150,
    },
    {
      title: '类型',
      dataIndex: 'request_type',
      key: 'request_type',
      width: 80,
      render: (type) => type && (
        <Tag color={REQUEST_TYPE_MAP[type as keyof typeof REQUEST_TYPE_MAP]?.color}>
          {REQUEST_TYPE_MAP[type as keyof typeof REQUEST_TYPE_MAP]?.label}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: ReissueStatus) => (
        <Tag color={REISSUE_STATUS_MAP[status].color}>
          {REISSUE_STATUS_MAP[status].label}
        </Tag>
      ),
    },
    {
      title: '关联订单',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 140,
    },
    {
      title: '客户名称',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 200,
    },
    {
      title: '商品数量',
      dataIndex: 'item_count',
      key: 'item_count',
      width: 100,
      render: (count) => count ? `${count} 项` : '-',
    },
    {
      title: '处理人',
      dataIndex: 'handler',
      key: 'handler',
      width: 100,
    },
    {
      title: '司机',
      dataIndex: 'driver_name',
      key: 'driver_name',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button 
          type="link" 
          size="small" 
          icon={<EyeOutlined />}
          onClick={() => navigate(`/reissues/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

  const stats = [
    { title: '全部补发', value: reissueList?.total || 0, color: '#1677ff' },
    { title: '待处理', value: reissueList?.list.filter(r => r.status === 'pending').length || 0, color: '#faad14' },
    { title: '派送中', value: reissueList?.list.filter(r => ['picking', 'shipped', 'out_for_delivery'].includes(r.status)).length || 0, color: '#13c2c2' },
    { title: '已签收', value: reissueList?.list.filter(r => r.status === 'delivered').length || 0, color: '#52c41a' },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          {stats.map((stat, index) => (
            <Col span={6} key={index}>
              <Statistic 
                title={stat.title} 
                value={stat.value}
                valueStyle={{ color: stat.color }}
                prefix={<SyncOutlined />}
              />
            </Col>
          ))}
        </Row>
      </Card>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Search
              placeholder="搜索补发单号、申请单号、订单号、客户名称"
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              style={{ width: 360 }}
              onSearch={handleSearch}
            />
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 150 }}
              onChange={handleStatusChange}
              value={status}
            >
              {Object.entries(REISSUE_STATUS_MAP).map(([key, val]) => (
                <Option key={key} value={key}>{val.label}</Option>
              ))}
            </Select>
          </Space>
        </div>

        {!serviceHealthy && (
          <Alert
            type="warning"
            message="后端服务暂时不可用"
            description="正在尝试自动重连，服务恢复后将自动刷新数据..."
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {error && serviceHealthy && (
          <Alert
            type="error"
            message="服务暂时不可用"
            description={error}
            showIcon
            style={{ marginBottom: 16 }}
            action={
              <Button size="small" type="primary" onClick={() => fetchReissueList({ status, keyword, page, pageSize })}>
                重新加载
              </Button>
            }
          />
        )}

        <Table
          rowKey="id"
          columns={columns}
          dataSource={reissueList?.list || []}
          loading={loadingReissues}
          locale={{ 
            emptyText: error ? '加载失败，请点击重新加载' : '暂无数据' 
          }}
          pagination={{
            current: page,
            pageSize,
            total: reissueList?.total || 0,
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
    </div>
  );
}
