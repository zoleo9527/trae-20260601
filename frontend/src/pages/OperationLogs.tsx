import { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Select,
  Button,
  Spin,
  Empty,
  Input,
  Space,
  Card,
  Row,
  Col,
  Statistic,
} from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { logsAPI, propertyAPI, depositAPI } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { OperationLog, roleNames } from '../types';

const { Search } = Input;

const entityTypeNames: Record<string, string> = {
  property: '房源',
  viewing: '看房记录',
  quotation: '报价单',
  contract: '合同',
  handover: '交接单',
  deposit: '押金',
};

const entityTypeOptions = Object.entries(entityTypeNames).map(([value, label]) => ({
  value,
  label,
}));

const OperationLogs = () => {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [entityType, setEntityType] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [stats, setStats] = useState({
    totalProperties: 0,
    totalArea: 0,
    occupancyRate: 0,
    totalDeposits: 0,
    totalPaid: 0,
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (entityType) params.entityType = entityType;
      if (action) params.action = action;
      const response = await logsAPI.list(params);
      setLogs(response.data.list);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [propRes, depositRes] = await Promise.all([
        propertyAPI.getStatistics(),
        depositAPI.getStatistics(),
      ]);
      setStats({
        totalProperties: propRes.data.total,
        totalArea: propRes.data.totalArea,
        occupancyRate: propRes.data.occupancyRate,
        totalDeposits: depositRes.data.total,
        totalPaid: depositRes.data.totalPaid,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [entityType, action, page, pageSize]);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('zh-CN');

  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (text: string) => formatDate(text),
      sorter: (a: OperationLog, b: OperationLog) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: '操作类型',
      dataIndex: 'entityType',
      key: 'entityType',
      width: 100,
      render: (type: string) => (
        <Tag color="blue">{entityTypeNames[type] || type}</Tag>
      ),
    },
    {
      title: '操作动作',
      dataIndex: 'action',
      key: 'action',
      width: 150,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态变更',
      key: 'status',
      width: 200,
      render: (_: unknown, record: OperationLog) => {
        if (record.oldStatus && record.newStatus) {
          return (
            <Space>
              <Tag color="default">{record.oldStatus}</Tag>
              <span>→</span>
              <Tag color="green">{record.newStatus}</Tag>
            </Space>
          );
        }
        return '-';
      },
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 100,
    },
    {
      title: '角色',
      dataIndex: 'operatorRole',
      key: 'operatorRole',
      width: 100,
      render: (role: string) => roleNames[role as keyof typeof roleNames] || role,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">操作日志</h1>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="房源总数" value={stats.totalProperties} suffix="套" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="总面积" value={stats.totalArea} suffix="㎡" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="出租率" value={stats.occupancyRate} precision={1} suffix="%" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="押金笔数" value={stats.totalDeposits} suffix="笔" />
          </Card>
        </Col>
      </Row>

      <div className="filter-bar">
        <Select
          placeholder="选择操作类型"
          value={entityType || undefined}
          onChange={setEntityType}
          allowClear
          style={{ width: 150 }}
          options={entityTypeOptions}
        />
        <Search
          placeholder="搜索操作动作"
          allowClear
          style={{ width: 200 }}
          onSearch={setAction}
          icon={<SearchOutlined />}
        />
        <Button icon={<ReloadOutlined />} onClick={() => { setEntityType(''); setAction(''); setPage(1); }}>
          重置
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <div className="table-container">
          <Table
            columns={columns}
            dataSource={logs}
            rowKey="id"
            locale={{ emptyText: <Empty description="暂无操作日志" /> }}
            pagination={{
              current: page,
              pageSize,
              total,
              showTotal: (total) => `共 ${total} 条记录`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, pageSize) => {
                setPage(page);
                setPageSize(pageSize);
              },
            }}
          />
        </div>
      )}
    </div>
  );
};

export default OperationLogs;
