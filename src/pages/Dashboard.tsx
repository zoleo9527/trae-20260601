import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Tag, Button, Empty } from 'antd';
import {
  ToolOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DollarOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { DatabaseStats, ReturnRecord, RETURN_STATUS_LABELS, EQUIPMENT_STATUS_LABELS, Contract } from '@shared/types';
import dayjs from 'dayjs';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [recentReturns, setRecentReturns] = useState<ReturnRecord[]>([]);
  const [activeContracts, setActiveContracts] = useState<Contract[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const s = await api.getStats();
    setStats(s);
    const returns = await api.getReturnRecords();
    setRecentReturns(returns.slice(0, 5));
    const contracts = await api.getContracts({ status: 'active' });
    setActiveContracts(contracts.slice(0, 5));
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'gold',
      confirmed: 'blue',
      customer_confirmed: 'cyan',
      disputed: 'red',
      settled: 'green',
    };
    return map[status] || 'default';
  };

  const eqStatusColor = (status: string) => {
    const map: Record<string, string> = {
      idle: 'green',
      rented: 'blue',
      maintenance: 'orange',
      returned: 'cyan',
    };
    return map[status] || 'default';
  };

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <div className="stats-card">
            <ToolOutlined className="stats-icon" style={{ color: '#2e75b6' }} />
            <div className="stats-value">{stats?.equipmentCount || 0}</div>
            <div className="stats-label">设备总数</div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stats-card">
            <FileTextOutlined className="stats-icon" style={{ color: '#52c41a' }} />
            <div className="stats-value">{stats?.contractCount || 0}</div>
            <div className="stats-label">租赁合同</div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stats-card">
            <WarningOutlined className="stats-icon" style={{ color: '#faad14' }} />
            <div className="stats-value">{stats?.pendingCount || 0}</div>
            <div className="stats-label">待结算</div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stats-card">
            <DollarOutlined className="stats-icon" style={{ color: '#d4380d' }} />
            <div className="stats-value">¥{(stats?.totalRevenue || 0).toLocaleString()}</div>
            <div className="stats-label">累计收入</div>
          </div>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <div className="page-card">
            <div className="page-title">
              <span>最近回场记录</span>
              <Button type="link" onClick={() => navigate('/return')}>
                查看全部 <ArrowRightOutlined />
              </Button>
            </div>
            {recentReturns.length === 0 ? (
              <Empty description="暂无回场记录" />
            ) : (
              <Table
                dataSource={recentReturns}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  { title: '合同编号', dataIndex: 'contractNo', width: 140 },
                  { title: '客户', dataIndex: 'customerName', width: 140 },
                  { title: '设备', dataIndex: 'equipmentName', width: 140 },
                  {
                    title: '回场时间',
                    dataIndex: 'actualReturnDate',
                    width: 120,
                    render: (v) => dayjs(v).format('YYYY-MM-DD'),
                  },
                  {
                    title: '应收金额',
                    dataIndex: 'totalRent',
                    width: 110,
                    align: 'right',
                    render: (v) => `¥${(v || 0).toFixed(2)}`,
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    width: 100,
                    render: (v: keyof typeof RETURN_STATUS_LABELS) => <Tag color={statusColor(v)}>{RETURN_STATUS_LABELS[v]}</Tag>,
                  },
                  {
                    title: '操作',
                    width: 80,
                    render: (_, r) => (
                      <Button type="link" size="small" onClick={() => navigate(`/return/${r.id}`)}>
                        详情
                      </Button>
                    ),
                  },
                ]}
              />
            )}
          </div>
        </Col>

        <Col xs={24} lg={10}>
          <div className="page-card">
            <div className="page-title">
              <span>进行中的合同</span>
              <Button type="link" onClick={() => navigate('/contract')}>
                全部合同 <ArrowRightOutlined />
              </Button>
            </div>
            {activeContracts.length === 0 ? (
              <Empty description="暂无进行中合同" />
            ) : (
              <Table
                dataSource={activeContracts}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  { title: '合同编号', dataIndex: 'contractNo', width: 140 },
                  { title: '客户', dataIndex: 'customerName' },
                  {
                    title: '租期截止',
                    dataIndex: 'plannedReturnDate',
                    width: 120,
                    render: (v) => (
                      <span style={{ color: dayjs(v).isBefore(dayjs()) ? '#ff4d4f' : undefined }}>
                        {dayjs(v).format('MM-DD')}
                      </span>
                    ),
                  },
                  {
                    title: '押金',
                    dataIndex: 'deposit',
                    align: 'right',
                    width: 100,
                    render: (v) => `¥${(v || 0).toLocaleString()}`,
                  },
                ]}
              />
            )}
          </div>

          <div className="page-card" style={{ marginTop: 16 }}>
            <div className="page-title">
              <span>快捷操作</span>
            </div>
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Button block type="primary" size="large" icon={<CheckCircleOutlined />} onClick={() => navigate('/return/new')}>
                  新增回场验收
                </Button>
              </Col>
              <Col span={12}>
                <Button block size="large" icon={<FileTextOutlined />} onClick={() => navigate('/contract')}>
                  合同管理
                </Button>
              </Col>
              <Col span={12}>
                <Button block size="large" icon={<ToolOutlined />} onClick={() => navigate('/equipment')}>
                  设备档案
                </Button>
              </Col>
              <Col span={12}>
                <Button block size="large" icon={<WarningOutlined />} onClick={() => navigate('/return')}>
                  待办结算
                </Button>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
