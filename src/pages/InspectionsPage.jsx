import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Tag, Button, Space, Select, DatePicker, Modal, Form, InputNumber, Input, Row, Col, Descriptions, Upload, message, Divider, Tooltip, Alert } from 'antd';
import { PlusOutlined, SearchOutlined, CheckCircleOutlined, UploadOutlined, DownloadOutlined, EyeOutlined, WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';
import { api, SHIFT_LABELS, INSPECTION_STATUS, SYSTEM_STATUS_LABELS } from '../api';
import ExceptionDrawer from '../components/ExceptionDrawer';

const { Title, Text } = Typography;

const STATUS_COLORS = {
  pending: 'warning',
  in_progress: 'processing',
  pending_confirm: 'cyan',
  completed: 'success',
  abnormal: 'error',
};

function isAbnormalItem(ventilation, water_system, feed_system, manure_system, dead_count, sick_count) {
  return (ventilation && ventilation !== 'normal') ||
    (water_system && water_system !== 'normal') ||
    (feed_system && feed_system !== 'normal') ||
    (manure_system && manure_system !== 'normal') ||
    (dead_count > 2) ||
    (sick_count > 3);
}

function ElapsedTimer({ startedAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!startedAt) return null;
  const ms = now - new Date(startedAt.replace(' ', 'T')).getTime();
  if (ms < 0) return <span className="timer-elapsed normal">0:00:00</span>;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cls = h >= 2 ? 'overdue' : h >= 1 ? 'warning' : 'normal';
  return <span className={`timer-elapsed ${cls}`}>{h}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</span>;
}

function FlowSteps({ status }) {
  const steps = [
    { key: 'pending', label: '待巡检' },
    { key: 'in_progress', label: '巡检中' },
    { key: 'pending_confirm', label: '待确认' },
    { key: 'completed', label: '已完成' },
  ];
  const idx = steps.findIndex(s => s.key === status);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          {i > 0 && <span className="flow-arrow">→</span>}
          <span className={`flow-step ${status === 'abnormal' && i === idx ? 'stuck' : i < idx ? 'done' : i === idx ? (status === 'abnormal' ? 'stuck' : 'active') : ''}`}>
            {s.label}
          </span>
        </React.Fragment>
      ))}
      {status === 'abnormal' && <><span className="flow-arrow">→</span><span className="flow-step stuck">异常</span></>}
    </span>
  );
}

export default function InspectionsPage() {
  const { user } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: dayjs().format('YYYY-MM-DD') });
  const [detailModal, setDetailModal] = useState({ open: false, data: null });
  const [fillModal, setFillModal] = useState({ open: false, card: null });
  const [createModal, setCreateModal] = useState(false);
  const [exceptionDrawer, setExceptionDrawer] = useState({ open: false, exceptionId: null });
  const [houses, setHouses] = useState([]);
  const [fillForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [autoAbnormal, setAutoAbnormal] = useState(false);

  useEffect(() => {
    api.dashboard.houses().then(d => setHouses(d.houses)).catch(() => {});
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.house_id) params.house_id = filters.house_id;
      if (filters.status) params.status = filters.status;
      const d = await api.inspections.list(params);
      setInspections(d.inspections || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filters]);

  const handleStart = async (id) => {
    try {
      await api.inspections.start(id);
      message.success('已开始巡检');
      fetchData();
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleOpenFill = (card) => {
    fillForm.resetFields();
    setAutoAbnormal(false);
    setFillModal({ open: true, card });
  };

  const handleFillValuesChange = () => {
    const values = fillForm.getFieldsValue();
    const detected = isAbnormalItem(
      values.ventilation, values.water_system, values.feed_system, values.manure_system,
      values.dead_count || 0, values.sick_count || 0
    );
    setAutoAbnormal(detected);
  };

  const handleComplete = async () => {
    try {
      const values = await fillForm.validateFields();
      const isAbnormal = isAbnormalItem(
        values.ventilation, values.water_system, values.feed_system, values.manure_system,
        values.dead_count || 0, values.sick_count || 0
      );
      await api.inspections.complete(fillModal.card.id, {
        ...values,
        is_abnormal: isAbnormal,
        feeder_id: user?.id,
      });
      if (isAbnormal) {
        message.warning('巡检提交成功，检测到异常项，已自动上报');
      } else {
        message.success('巡检提交成功，等待确认');
      }
      setFillModal({ open: false, card: null });
      fetchData();
    } catch (e) {
      if (e.message) message.error(e.message);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await api.inspections.confirm(id, { confirmer_id: user?.id });
      message.success('巡检已确认');
      fetchData();
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      await api.inspections.create({
        ...values,
        date: values.date.format('YYYY-MM-DD'),
      });
      message.success('巡检卡已创建');
      setCreateModal(false);
      createForm.resetFields();
      fetchData();
    } catch (e) {
      if (e.message) message.error(e.message);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const d = await api.inspections.get(id);
      setDetailModal({ open: true, data: d });
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleExport = () => {
    const params = {};
    if (filters.date) params.date = filters.date;
    window.open(api.export.inspections(params), '_blank');
  };

  const stuckInspections = inspections.filter(i => i.status === 'in_progress' && i.started_at);
  const pendingConfirmInspections = inspections.filter(i => i.status === 'pending_confirm');

  const columns = [
    {
      title: '鸡舍', dataIndex: 'house_name', width: 120,
      render: (t, r) => <Text strong style={{ color: '#e0e0e0' }}>{r.house_code} {t}</Text>,
    },
    {
      title: '班次', dataIndex: 'shift', width: 80,
      render: v => <Tag style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#b0b0b0' }}>{SHIFT_LABELS[v] || v}</Tag>,
    },
    {
      title: '饲养员', dataIndex: 'feeder_name', width: 90,
      render: v => <Text style={{ color: '#c0c0c0' }}>{v}</Text>,
    },
    {
      title: '状态', dataIndex: 'status', width: 160,
      render: (v) => (
        <Space size={6}>
          <span className={`status-dot ${v}`} />
          <Tag color={STATUS_COLORS[v]}>{INSPECTION_STATUS[v]}</Tag>
          <FlowSteps status={v} />
        </Space>
      ),
    },
    {
      title: '温度', dataIndex: 'temperature', width: 70,
      render: v => v ? <Text style={{ color: '#4fc3f7' }}>{v}°C</Text> : <Text type="secondary">-</Text>,
    },
    {
      title: '湿度', dataIndex: 'humidity', width: 70,
      render: v => v ? <Text style={{ color: '#4fc3f7' }}>{v}%</Text> : <Text type="secondary">-</Text>,
    },
    {
      title: '死亡', dataIndex: 'dead_count', width: 65,
      render: v => v > 0 ? <Text style={{ color: '#ff4d4f', fontWeight: 700, fontSize: 14 }}>{v}只</Text> : <Text type="secondary">0</Text>,
    },
    {
      title: '病鸡', dataIndex: 'sick_count', width: 65,
      render: v => v > 0 ? <Text style={{ color: '#fa8c16', fontWeight: 700, fontSize: 14 }}>{v}只</Text> : <Text type="secondary">0</Text>,
    },
    {
      title: '开始时间', dataIndex: 'started_at', width: 150,
      render: (v, r) => {
        if (r.status === 'in_progress' && v) {
          return <ElapsedTimer startedAt={v} />;
        }
        return v ? <Text style={{ color: '#888', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{v}</Text> : <Text type="secondary">未开始</Text>;
      },
    },
    {
      title: '操作', width: 260, fixed: 'right',
      render: (_, r) => (
        <Space size={4}>
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(r.id)} style={{ color: '#4fc3f7' }}>详情</Button>
          {r.status === 'pending' && r.feeder_id === user?.id && (
            <Button size="small" type="primary" onClick={() => handleStart(r.id)}>开始巡检</Button>
          )}
          {r.status === 'in_progress' && r.feeder_id === user?.id && (
            <Button size="small" type="primary" onClick={() => handleOpenFill(r)}>填写</Button>
          )}
          {r.status === 'in_progress' && r.feeder_id !== user?.id && user?.role === 'manager' && (
            <Tooltip title="代为填写"><Button size="small" onClick={() => handleOpenFill(r)} style={{ borderColor: '#fa8c16', color: '#fa8c16' }}>代填</Button></Tooltip>
          )}
          {r.status === 'pending_confirm' && (user?.role === 'sorter' || user?.role === 'manager') && (
            <Button size="small" type="primary" style={{ background: '#13c2c2' }} onClick={() => handleConfirm(r.id)}>
              确认
            </Button>
          )}
          {r.status === 'abnormal' && (
            <Tooltip title="查看关联异常"><Button size="small" danger icon={<WarningOutlined />}>异常</Button></Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ background: '#0f0f1e', minHeight: '100vh', padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, color: '#e0e0e0' }}>
          <SearchOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />巡检卡管理
        </Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleExport} style={{ background: '#16213e', borderColor: '#2a3a5c', color: '#b0b0b0' }}>导出CSV</Button>
          {(user?.role === 'feeder' || user?.role === 'manager') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>新建巡检卡</Button>
          )}
        </Space>
      </div>

      {stuckInspections.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1a0a0a 0%, #2a1010 100%)',
          border: '1px solid #5c1a1a',
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 12,
          boxShadow: '0 0 20px rgba(255, 77, 79, 0.15), inset 0 0 30px rgba(255, 77, 79, 0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <ClockCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
            <Text strong style={{ color: '#ff7875', fontSize: 15 }}>
              ⚠ {stuckInspections.length}张巡检卡卡在"巡检中"状态 — 需立即处理
            </Text>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {stuckInspections.map(i => (
              <div key={i.id} style={{
                background: 'rgba(255, 77, 79, 0.1)',
                border: '1px solid rgba(255, 77, 79, 0.3)',
                borderRadius: 6,
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <Text style={{ color: '#ffa39e', fontWeight: 600 }}>{i.house_name}</Text>
                <Tag style={{ background: 'rgba(250,173,20,0.15)', border: '1px solid rgba(250,173,20,0.4)', color: '#ffc53d' }}>{SHIFT_LABELS[i.shift]}</Tag>
                <Text style={{ color: '#888' }}>{i.feeder_name}</Text>
                <ElapsedTimer startedAt={i.started_at} />
              </div>
            ))}
          </div>
          <FlowSteps status="in_progress" />
          <div style={{ marginTop: 8 }}>
            <Text style={{ color: '#666', fontSize: 12 }}>超过2小时未完成将触发超时预警，请尽快处理或代填</Text>
          </div>
        </div>
      )}

      {pendingConfirmInspections.length > 0 && (
        <Alert
          type="info"
          showIcon
          icon={<CheckCircleOutlined />}
          message={`${pendingConfirmInspections.length}张巡检卡等待确认`}
          description="巡检已完成，等待分拣员或场长确认后可关联产蛋数据"
          style={{ marginBottom: 12, background: '#0d1f3c', border: '1px solid #1a3a5c', color: '#91d5ff' }}
        />
      )}

      <Card size="small" style={{ marginBottom: 16, background: '#16213e', border: '1px solid #2a3a5c', borderRadius: 8 }}>
        <Space wrap>
          <DatePicker
            value={filters.date ? dayjs(filters.date) : null}
            onChange={d => setFilters(f => ({ ...f, date: d?.format('YYYY-MM-DD') }))}
            placeholder="选择日期"
            style={{ background: '#0f0f1e', borderColor: '#2a3a5c', color: '#e0e0e0' }}
          />
          <Select
            placeholder="鸡舍" allowClear style={{ width: 140 }}
            value={filters.house_id || undefined}
            onChange={v => setFilters(f => ({ ...f, house_id: v }))}
            options={houses.map(h => ({ value: h.id, label: `${h.code} ${h.name}` }))}
            popupClassName="dark-select-dropdown"
          />
          <Select
            placeholder="状态" allowClear style={{ width: 120 }}
            value={filters.status || undefined}
            onChange={v => setFilters(f => ({ ...f, status: v }))}
            options={Object.entries(INSPECTION_STATUS).map(([k, v]) => ({ value: k, label: v }))}
            popupClassName="dark-select-dropdown"
          />
        </Space>
      </Card>

      <Card size="small" style={{ background: '#16213e', border: '1px solid #2a3a5c', borderRadius: 8 }}>
        <Table
          dataSource={inspections}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="small"
          scroll={{ x: 1200 }}
          pagination={false}
          rowClassName={r => {
            if (r.status === 'abnormal') return 'ant-table-row-danger';
            if (r.status === 'in_progress') return 'ant-table-row-info';
            if (r.status === 'pending_confirm') return 'ant-table-row-cyan';
            return '';
          }}
        />
      </Card>

      <Modal
        title={<span style={{ color: '#e0e0e0' }}>巡检详情</span>}
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, data: null })}
        width={720}
        footer={null}
        styles={{ content: { background: '#16213e', border: '1px solid #2a3a5c' }, header: { background: '#16213e', borderBottom: '1px solid #2a3a5c' }, body: { background: '#16213e' } }}
      >
        {detailModal.data && <InspectionDetail data={detailModal.data} onOpenException={(id) => { setDetailModal({ open: false, data: null }); setExceptionDrawer({ open: true, exceptionId: id }); }} />}
      </Modal>

      <Modal
        title={<span style={{ color: '#e0e0e0' }}>填写巡检卡 — {fillModal.card?.house_name || ''}</span>}
        open={fillModal.open}
        onOk={handleComplete}
        onCancel={() => setFillModal({ open: false, card: null })}
        width={600}
        okText={autoAbnormal ? '提交（标记异常）' : '提交巡检'}
        okButtonProps={autoAbnormal ? { danger: true } : {}}
        styles={{ content: { background: '#16213e', border: '1px solid #2a3a5c' }, header: { background: '#16213e', borderBottom: '1px solid #2a3a5c' }, body: { background: '#16213e' } }}
      >
        {autoAbnormal && (
          <Alert
            type="error"
            showIcon
            message="检测到异常项"
            description="系统检测到巡检项中存在异常，提交后将自动上报异常并通知场长"
            style={{ marginBottom: 16, background: 'rgba(255,77,79,0.1)', border: '1px solid rgba(255,77,79,0.4)' }}
          />
        )}
        <Form form={fillForm} layout="vertical" onValuesChange={handleFillValuesChange}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<span style={{ color: '#b0b0b0' }}>温度(°C)</span>} name="temperature" rules={[{ required: true, message: '请输入' }]}>
                <InputNumber min={10} max={40} step={0.1} style={{ width: '100%', background: '#0f0f1e', borderColor: '#2a3a5c', color: '#e0e0e0' }} placeholder="如：22.5" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span style={{ color: '#b0b0b0' }}>湿度(%)</span>} name="humidity" rules={[{ required: true, message: '请输入' }]}>
                <InputNumber min={30} max={100} step={1} style={{ width: '100%', background: '#0f0f1e', borderColor: '#2a3a5c', color: '#e0e0e0' }} placeholder="如：65" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label={<span style={{ color: '#b0b0b0' }}>通风系统</span>} name="ventilation" rules={[{ required: true }]}>
                <Select options={[{ value: 'normal', label: '正常' }, { value: 'poor', label: '异常' }, { value: 'off', label: '停机' }]} popupClassName="dark-select-dropdown" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={<span style={{ color: '#b0b0b0' }}>饮水系统</span>} name="water_system" rules={[{ required: true }]}>
                <Select options={[{ value: 'normal', label: '正常' }, { value: 'leak', label: '漏水' }, { value: 'blocked', label: '堵塞' }, { value: 'off', label: '停机' }]} popupClassName="dark-select-dropdown" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={<span style={{ color: '#b0b0b0' }}>饲喂系统</span>} name="feed_system" rules={[{ required: true }]}>
                <Select options={[{ value: 'normal', label: '正常' }, { value: 'jam', label: '卡料' }, { value: 'low', label: '不足' }, { value: 'off', label: '停机' }]} popupClassName="dark-select-dropdown" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label={<span style={{ color: '#b0b0b0' }}>清粪系统</span>} name="manure_system" rules={[{ required: true }]}>
                <Select options={[{ value: 'normal', label: '正常' }, { value: 'clogged', label: '堵塞' }, { value: 'overflow', label: '溢出' }]} popupClassName="dark-select-dropdown" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={<span style={{ color: '#b0b0b0' }}>死亡(只)</span>} name="dead_count">
                <InputNumber min={0} style={{ width: '100%', background: '#0f0f1e', borderColor: '#2a3a5c', color: '#e0e0e0' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={<span style={{ color: '#b0b0b0' }}>病鸡(只)</span>} name="sick_count">
                <InputNumber min={0} style={{ width: '100%', background: '#0f0f1e', borderColor: '#2a3a5c', color: '#e0e0e0' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label={<span style={{ color: '#b0b0b0' }}>备注</span>} name="notes">
            <Input.TextArea rows={2} placeholder="补充说明..." style={{ background: '#0f0f1e', borderColor: '#2a3a5c', color: '#e0e0e0' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span style={{ color: '#e0e0e0' }}>新建巡检卡</span>}
        open={createModal}
        onOk={handleCreate}
        onCancel={() => { setCreateModal(false); createForm.resetFields(); }}
        okText="创建"
        styles={{ content: { background: '#16213e', border: '1px solid #2a3a5c' }, header: { background: '#16213e', borderBottom: '1px solid #2a3a5c' }, body: { background: '#16213e' } }}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item label={<span style={{ color: '#b0b0b0' }}>鸡舍</span>} name="house_id" rules={[{ required: true }]}>
            <Select options={houses.filter(h => h.status === 'active').map(h => ({ value: h.id, label: `${h.code} ${h.name}` }))} popupClassName="dark-select-dropdown" />
          </Form.Item>
          <Form.Item label={<span style={{ color: '#b0b0b0' }}>日期</span>} name="date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%', background: '#0f0f1e', borderColor: '#2a3a5c', color: '#e0e0e0' }} />
          </Form.Item>
          <Form.Item label={<span style={{ color: '#b0b0b0' }}>班次</span>} name="shift" rules={[{ required: true }]}>
            <Select options={[{ value: 'morning', label: '早班' }, { value: 'afternoon', label: '午班' }, { value: 'night', label: '夜班' }]} popupClassName="dark-select-dropdown" />
          </Form.Item>
          <Form.Item label={<span style={{ color: '#b0b0b0' }}>饲养员</span>} name="feeder_id" rules={[{ required: true }]} initialValue={user?.id}>
            <Select options={[{ value: user?.id, label: `${user?.name}（当前用户）` }]} disabled />
          </Form.Item>
        </Form>
      </Modal>

      <ExceptionDrawer
        open={exceptionDrawer.open}
        exceptionId={exceptionDrawer.exceptionId}
        onClose={() => setExceptionDrawer({ open: false, exceptionId: null })}
        onRefresh={fetchData}
      />

      <style>{`
        .timer-elapsed {
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .timer-elapsed.normal {
          color: #52c41a;
          background: rgba(82, 196, 26, 0.1);
        }
        .timer-elapsed.warning {
          color: #faad14;
          background: rgba(250, 173, 20, 0.15);
          animation: timer-pulse-warning 1.5s ease-in-out infinite;
        }
        .timer-elapsed.overdue {
          color: #ff4d4f;
          background: rgba(255, 77, 79, 0.15);
          animation: timer-pulse-overdue 0.8s ease-in-out infinite;
          text-shadow: 0 0 8px rgba(255, 77, 79, 0.6);
        }
        @keyframes timer-pulse-warning {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes timer-pulse-overdue {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .flow-step {
          display: inline-block;
          padding: 1px 8px;
          border-radius: 3px;
          font-size: 11px;
          font-weight: 500;
          background: rgba(255,255,255,0.04);
          color: #666;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .flow-step.done {
          background: rgba(82, 196, 26, 0.15);
          color: #73d13d;
          border-color: rgba(82, 196, 26, 0.3);
        }
        .flow-step.active {
          background: rgba(22, 119, 255, 0.15);
          color: #4096ff;
          border-color: rgba(22, 119, 255, 0.3);
        }
        .flow-step.stuck {
          background: rgba(255, 77, 79, 0.15);
          color: #ff7875;
          border-color: rgba(255, 77, 79, 0.4);
          animation: flow-stuck-pulse 1.2s ease-in-out infinite;
        }
        @keyframes flow-stuck-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 77, 79, 0); }
          50% { box-shadow: 0 0 8px 2px rgba(255, 77, 79, 0.3); }
        }
        .flow-arrow {
          color: #555;
          font-size: 10px;
          margin: 0 1px;
        }
        .status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 2px;
        }
        .status-dot.pending { background: #faad14; }
        .status-dot.in_progress { background: #1677ff; animation: dot-blink 1.5s infinite; }
        .status-dot.pending_confirm { background: #13c2c2; }
        .status-dot.completed { background: #52c41a; }
        .status-dot.abnormal { background: #ff4d4f; animation: dot-blink 0.8s infinite; }
        @keyframes dot-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .ant-table {
          background: transparent !important;
          color: #c0c0c0 !important;
        }
        .ant-table-thead > tr > th {
          background: #0d1527 !important;
          color: #8899aa !important;
          border-bottom: 1px solid #2a3a5c !important;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid rgba(42, 58, 92, 0.4) !important;
          color: #c0c0c0 !important;
        }
        .ant-table-tbody > tr:hover > td {
          background: rgba(255,255,255,0.03) !important;
        }
        .ant-table-tbody > tr.ant-table-row-danger > td {
          background: rgba(255, 77, 79, 0.08) !important;
        }
        .ant-table-tbody > tr.ant-table-row-info > td {
          background: rgba(22, 119, 255, 0.06) !important;
        }
        .ant-table-tbody > tr.ant-table-row-cyan > td {
          background: rgba(19, 194, 194, 0.06) !important;
        }
        .ant-card {
          color: #c0c0c0 !important;
        }
        .ant-form-item-label > label {
          color: #b0b0b0 !important;
        }
        .dark-select-dropdown .ant-select-item {
          background: #16213e !important;
          color: #c0c0c0 !important;
        }
        .dark-select-dropdown {
          background: #16213e !important;
        }
        .ant-descriptions-bordered .ant-descriptions-item-label {
          background: #0d1527 !important;
          color: #8899aa !important;
        }
        .ant-descriptions-bordered .ant-descriptions-item-content {
          background: #16213e !important;
          color: #c0c0c0 !important;
        }
        .ant-modal-mask {
          background: rgba(0, 0, 0, 0.7) !important;
        }
      `}</style>
    </div>
  );
}

function InspectionDetail({ data, onOpenException }) {
  const { card, eggRecords, exceptions, attachments } = data;

  const handleUpload = async (file) => {
    try {
      await api.attachments.upload('inspection', card.id, file, card.feeder_id);
      message.success('上传成功');
    } catch (e) {
      message.error('上传失败');
    }
    return false;
  };

  return (
    <div>
      <Descriptions
        title={<span style={{ color: '#e0e0e0' }}>{card.house_code} {card.house_name} — {SHIFT_LABELS[card.shift]}</span>}
        bordered size="small" column={3}
      >
        <Descriptions.Item label="状态">
          <Space><span className={`status-dot ${card.status}`} />{INSPECTION_STATUS[card.status]}</Space>
        </Descriptions.Item>
        <Descriptions.Item label="饲养员">{card.feeder_name}</Descriptions.Item>
        <Descriptions.Item label="联系电话">{card.feeder_phone}</Descriptions.Item>
        <Descriptions.Item label="鸡群数量">{card.current_count}</Descriptions.Item>
        <Descriptions.Item label="品种">{card.breed}</Descriptions.Item>
        <Descriptions.Item label="周龄">{card.age_weeks}周</Descriptions.Item>
        <Descriptions.Item label="温度">{card.temperature ? `${card.temperature}°C` : '-'}</Descriptions.Item>
        <Descriptions.Item label="湿度">{card.humidity ? `${card.humidity}%` : '-'}</Descriptions.Item>
        <Descriptions.Item label="通风">{SYSTEM_STATUS_LABELS[card.ventilation] || '-'}</Descriptions.Item>
        <Descriptions.Item label="饮水">{SYSTEM_STATUS_LABELS[card.water_system] || '-'}</Descriptions.Item>
        <Descriptions.Item label="饲喂">{SYSTEM_STATUS_LABELS[card.feed_system] || '-'}</Descriptions.Item>
        <Descriptions.Item label="清粪">{SYSTEM_STATUS_LABELS[card.manure_system] || '-'}</Descriptions.Item>
        <Descriptions.Item label="死亡">{card.dead_count > 0 ? <Text style={{ color: '#ff4d4f', fontWeight: 700 }}>{card.dead_count}只</Text> : '0'}</Descriptions.Item>
        <Descriptions.Item label="病鸡">{card.sick_count > 0 ? <Text style={{ color: '#fa8c16', fontWeight: 700 }}>{card.sick_count}只</Text> : '0'}</Descriptions.Item>
        <Descriptions.Item label="备注">{card.notes || '-'}</Descriptions.Item>
      </Descriptions>

      {exceptions.length > 0 && (
        <>
          <Divider orientation="left" style={{ borderColor: '#2a3a5c', color: '#8899aa' }}>关联异常</Divider>
          {exceptions.map(e => (
            <Card key={e.id} size="small" style={{ marginBottom: 8, borderLeft: `3px solid ${e.severity === 'critical' ? '#cf1322' : e.severity === 'urgent' ? '#d4380d' : '#faad14'}`, background: 'rgba(255,77,79,0.04)', borderColor: '#2a3a5c' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <span className={`pressure-badge ${e.severity}`}>{e.severity === 'critical' ? '紧急' : e.severity === 'urgent' ? '紧急' : e.severity === 'warning' ? '警告' : '提示'}</span>
                  <Tag>{e.category}</Tag>
                  <Text style={{ color: '#c0c0c0' }}>{e.description}</Text>
                </Space>
                <Space>
                  <Text type="secondary">处理人：{e.handler_name || '未指派'}</Text>
                  <Button size="small" type="link" onClick={() => onOpenException(e.id)} style={{ color: '#4fc3f7' }}>处理</Button>
                </Space>
              </Space>
            </Card>
          ))}
        </>
      )}

      {eggRecords.length > 0 && (
        <>
          <Divider orientation="left" style={{ borderColor: '#2a3a5c', color: '#8899aa' }}>关联产蛋记录</Divider>
          {eggRecords.map(er => (
            <Tag key={er.id} color={er.status === 'abnormal' ? 'error' : 'success'} style={{ marginBottom: 4 }}>
              {er.sorter_name}录入 {er.total_count}枚 | A:{er.grade_a} B:{er.grade_b} C:{er.grade_c}
            </Tag>
          ))}
        </>
      )}

      <Divider orientation="left" style={{ borderColor: '#2a3a5c', color: '#8899aa' }}>附件</Divider>
      <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*,.pdf">
        <Button icon={<UploadOutlined />} size="small" style={{ background: '#0f0f1e', borderColor: '#2a3a5c', color: '#b0b0b0' }}>上传附件</Button>
      </Upload>
      {attachments.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {attachments.map(a => (
            <Tag key={a.id} closable style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#b0b0b0' }}>{a.original_name} ({(a.size / 1024).toFixed(1)}KB)</Tag>
          ))}
        </div>
      )}
    </div>
  );
}
