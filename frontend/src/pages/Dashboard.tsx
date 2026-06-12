import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Timeline, Spin, Empty } from 'antd';
import {
  HomeOutlined,
  KeyOutlined,
  PercentageOutlined,
  FileTextOutlined,
  FileSearchOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';
import { propertyAPI, depositAPI, quotationAPI, contractAPI, handoverAPI, logsAPI } from '../services/api';
import { OperationLog, Quotation, Contract, HandoverForm, roleNames } from '../types';
import type { ColumnsType } from 'antd/es/table';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [propertyStats, setPropertyStats] = useState<any>(null);
  const [depositStats, setDepositStats] = useState<any>(null);
  const [pendingQuotations, setPendingQuotations] = useState<Quotation[]>([]);
  const [pendingContracts, setPendingContracts] = useState<Contract[]>([]);
  const [pendingHandovers, setPendingHandovers] = useState<HandoverForm[]>([]);
  const [recentLogs, setRecentLogs] = useState<OperationLog[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          propertyRes,
          depositRes,
          quotationRes,
          contractRes,
          handoverRes,
          logsRes,
        ] = await Promise.all([
          propertyAPI.getStatistics(),
          depositAPI.getStatistics(),
          quotationAPI.list({ status: 'submitted' }),
          contractAPI.list({ status: 'under_review' }),
          handoverAPI.list({ status: 'pending' }),
          logsAPI.list({ pageSize: 10 }),
        ]);

        setPropertyStats(propertyRes.data);
        setDepositStats(depositRes.data);
        setPendingQuotations(quotationRes.data);
        setPendingContracts(contractRes.data);
        setPendingHandovers(handoverRes.data);
        setRecentLogs(logsRes.data.list);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTodoItems = () => {
    const items: { key: string; title: string; count: number; icon: any; status: string }[] = [];

    if (user?.role === 'operation_manager' || user?.role === 'finance') {
      items.push({
        key: 'quotations',
        title: '待我审批的报价',
        count: pendingQuotations.length,
        icon: <FileTextOutlined />,
        status: 'processing',
      });
    }

    if (user?.role === 'operation_manager') {
      items.push({
        key: 'contracts',
        title: '待我审核的合同',
        count: pendingContracts.length,
        icon: <FileSearchOutlined />,
        status: 'processing',
      });
    }

    if (user?.role === 'rental_consultant' || user?.role === 'operation_manager') {
      items.push({
        key: 'handovers',
        title: '待交接的房源',
        count: pendingHandovers.length,
        icon: <KeyOutlined />,
        status: 'warning',
      });
    }

    return items;
  };

  const logColumns: ColumnsType<OperationLog> = [
    {
      title: '操作时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 100,
      render: (text: string, record: OperationLog) => (
        <span>
          {text}
          <Tag color="blue" style={{ marginLeft: 8 }}>
            {roleNames[record.operatorRole]}
          </Tag>
        </span>
      ),
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '操作描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const occupancyRate = propertyStats?.occupancyRate ?? 0;
  const vacantRate = (100 - occupancyRate).toFixed(1);
  const occupiedCount = propertyStats?.statusCounts?.occupied ?? 0;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">工作台</h2>
        <div style={{ color: '#666' }}>
          欢迎回来，{user?.name}！
          <Tag color="green" style={{ marginLeft: 8 }}>
            {user ? roleNames[user.role] : ''}
          </Tag>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <div className="stats-card">
            <Statistic
              title={<span className="label">总房源数</span>}
              value={propertyStats?.total ?? 0}
              prefix={<HomeOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ fontSize: 28, fontWeight: 600 }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <div className="stats-card">
            <Statistic
              title={<span className="label">在租房源数</span>}
              value={occupiedCount}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ fontSize: 28, fontWeight: 600, color: '#52c41a' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <div className="stats-card">
            <Statistic
              title={<span className="label">空置率</span>}
              value={vacantRate}
              suffix="%"
              prefix={<PercentageOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ fontSize: 28, fontWeight: 600, color: '#faad14' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <div className="stats-card">
            <Statistic
              title={<span className="label">待处理报价数</span>}
              value={pendingQuotations.length}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ fontSize: 28, fontWeight: 600 }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <div className="stats-card">
            <Statistic
              title={<span className="label">待审核合同数</span>}
              value={pendingContracts.length}
              prefix={<FileSearchOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ fontSize: 28, fontWeight: 600 }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <div className="stats-card">
            <Statistic
              title={<span className="label">押金总额</span>}
              value={depositStats?.totalPaid ?? 0}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ fontSize: 28, fontWeight: 600, color: '#f5222d' }}
            />
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="待办事项" className="table-container">
            {getTodoItems().length > 0 ? (
              <Timeline
                items={getTodoItems().map((item) => ({
                  color: item.status === 'processing' ? 'blue' : 'orange',
                  dot: item.icon,
                  children: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{item.title}</span>
                      <Tag color={item.status === 'processing' ? 'blue' : 'orange'}>
                        {item.count} 条
                      </Tag>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty description="暂无待办事项" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="最近操作日志" className="table-container">
            {recentLogs.length > 0 ? (
              <Table
                columns={logColumns}
                dataSource={recentLogs}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="暂无操作日志" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
