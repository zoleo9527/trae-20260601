import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Tag, Button, Space, Select, Row, Col, Statistic } from 'antd';
import { WarningOutlined, ReloadOutlined } from '@ant-design/icons';
import { api, EXCEPTION_STATUS, SEVERITY_LABELS } from '../api';
import { useAuth, ROLE_LABELS, ROLE_COLORS } from '../contexts/AuthContext';
import ExceptionDrawer from '../components/ExceptionDrawer';

const { Title, Text } = Typography;

const SEVERITY_COLORS = {
  critical: 'error',
  urgent: 'error',
  warning: 'warning',
  info: 'processing',
};

const STATUS_COLORS = {
  open: 'error',
  assigned: 'warning',
  handling: 'processing',
  resolved: 'success',
  closed: 'default',
};

export default function ExceptionsPage() {
  const { user } = useAuth();
  const [exceptions, setExceptions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [drawer, setDrawer] = useState({ open: false, exceptionId: null });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.severity) params.severity = filters.severity;
      if (filters.source_type) params.source_type = filters.source_type;
      const d = await api.exceptions.list(params);
      setExceptions(d.exceptions || []);
      const s = await api.exceptions.summary();
      setSummary(s);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filters]);

  const columns = [
    {
      title: '紧急度', dataIndex: 'severity', width: 90,
      render: v => <span className={`pressure-badge ${v}`}>{SEVERITY_LABELS[v]}</span>,
    },
    {
      title: '鸡舍', dataIndex: 'house_name', width: 110,
      render: (t, r) => <Text strong style={{ color: '#e0e0e0' }}>{r.house_code} {t}</Text>,
    },
    {
      title: '类别', dataIndex: 'category', width: 100,
      render: v => <Tag>{v}</Tag>,
    },
    {
      title: '来源', dataIndex: 'source_type', width: 90,
      render: v => v === 'inspection' ? '巡检' : v === 'egg_record' ? '产蛋' : '系统',
    },
    {
      title: '异常描述', dataIndex: 'description', ellipsis: true,
      render: v => <Text style={{ fontSize: 13, color: '#b0b0b0' }}>{v}</Text>,
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: v => <Space><span className={`status-dot ${v}`} /><Tag color={STATUS_COLORS[v]}>{EXCEPTION_STATUS[v]}</Tag></Space>,
    },
    {
      title: '处理人', width: 130,
      render: (_, r) => r.handler_name ? (
        <Space>
          <Text style={{ color: '#e0e0e0' }}>{r.handler_name}</Text>
          <Tag color={ROLE_COLORS[r.handler_role]} style={{ fontSize: 10 }}>{ROLE_LABELS[r.handler_role]}</Tag>
        </Space>
      ) : <Text type="danger">未指派</Text>,
    },
    {
      title: '操作', width: 100, fixed: 'right',
      render: (_, r) => (
        <Button size="small" type="link" onClick={() => setDrawer({ open: true, exceptionId: r.id })} style={{ color: '#ff6b35' }}>
          处理
        </Button>
      ),
    },
  ];

  const openCount = summary?.byStatus?.find(s => s.status === 'open')?.count || 0;
  const assignedCount = summary?.byStatus?.find(s => s.status === 'assigned')?.count || 0;
  const handlingCount = summary?.byStatus?.find(s => s.status === 'handling')?.count || 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, color: '#e0e0e0' }}>
          <WarningOutlined style={{ color: '#e63946', marginRight: 8 }} />异常处理
        </Title>
        <Button icon={<ReloadOutlined />} onClick={fetchData} style={{ background: 'rgba(22,33,62,0.6)', borderColor: 'rgba(255,255,255,0.1)', color: '#e0e0e0' }}>刷新</Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={8}>
          <Card size="small" className="pressure-stat-card danger">
            <Statistic title="待处理" value={openCount} valueStyle={{ color: '#e63946' }} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small" className="pressure-stat-card warn">
            <Statistic title="已指派" value={assignedCount} valueStyle={{ color: '#f4a261' }} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small" className="pressure-stat-card warn">
            <Statistic title="处理中" value={handlingCount} valueStyle={{ color: '#00b4d8' }} />
          </Card>
        </Col>
      </Row>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="状态" allowClear style={{ width: 120 }}
            value={filters.status || undefined}
            onChange={v => setFilters(f => ({ ...f, status: v }))}
            options={Object.entries(EXCEPTION_STATUS).map(([k, v]) => ({ value: k, label: v }))}
          />
          <Select
            placeholder="紧急度" allowClear style={{ width: 120 }}
            value={filters.severity || undefined}
            onChange={v => setFilters(f => ({ ...f, severity: v }))}
            options={Object.entries(SEVERITY_LABELS).map(([k, v]) => ({ value: k, label: v }))}
          />
          <Select
            placeholder="来源" allowClear style={{ width: 120 }}
            value={filters.source_type || undefined}
            onChange={v => setFilters(f => ({ ...f, source_type: v }))}
            options={[{ value: 'inspection', label: '巡检' }, { value: 'egg_record', label: '产蛋' }, { value: 'system', label: '系统' }]}
          />
        </Space>
      </Card>

      <Card size="small">
        <Table
          dataSource={exceptions}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="small"
          scroll={{ x: 920 }}
          pagination={{ pageSize: 15 }}
          rowClassName={r => r.severity === 'critical' ? 'ant-table-row-danger' : r.severity === 'urgent' ? 'ant-table-row-warning' : ''}
        />
      </Card>

      <ExceptionDrawer
        open={drawer.open}
        exceptionId={drawer.exceptionId}
        onClose={() => setDrawer({ open: false, exceptionId: null })}
        onRefresh={fetchData}
      />
    </div>
  );
}
