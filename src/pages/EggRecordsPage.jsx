import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Tag, Button, Space, Select, DatePicker, Modal, Form, InputNumber, Input, Row, Col, Descriptions, Upload, message, Divider, Tooltip } from 'antd';
import { AppstoreOutlined as EggOutlined, PlusOutlined, DownloadOutlined, EyeOutlined, UploadOutlined, ExclamationCircleOutlined, WarningOutlined, ClockCircleOutlined, LinkOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';
import { api, SHIFT_LABELS, EGG_STATUS, INSPECTION_STATUS } from '../api';
import ExceptionDrawer from '../components/ExceptionDrawer';

const { Title, Text } = Typography;

const STATUS_COLORS = {
  pending: 'warning',
  recorded: 'processing',
  confirmed: 'success',
  abnormal: 'error',
};

const INSPECTION_LINK_COLORS = {
  completed: '#52c41a',
  pending_confirm: '#13c2c2',
  in_progress: '#1677ff',
  pending: '#faad14',
  abnormal: '#ff4d4f',
};

function getIncompleteReason(record) {
  if (record.status === 'abnormal') {
    return { text: record.notes || '产蛋异常', color: '#e63946', level: 'critical' };
  }
  if (record.status === 'pending') {
    if (record.inspection_status === 'abnormal') {
      return { text: '巡检异常→产蛋中断', color: '#e63946', level: 'critical' };
    }
    if (record.inspection_status === 'pending' || record.inspection_status === 'in_progress') {
      return { text: '巡检未完成→无法关联', color: '#f4a261', level: 'warning' };
    }
    if (record.inspection_status === 'pending_confirm') {
      return { text: '巡检待确认→等待关联', color: '#f4a261', level: 'warning' };
    }
    return { text: '等待分拣员录入', color: '#8c8c8c', level: 'info' };
  }
  if (record.status === 'recorded') {
    return { text: '等待场长确认', color: '#00b4d8', level: 'info' };
  }
  return null;
}

export default function EggRecordsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: dayjs().format('YYYY-MM-DD') });
  const [detailModal, setDetailModal] = useState({ open: false, data: null });
  const [createModal, setCreateModal] = useState(false);
  const [abnormalModal, setAbnormalModal] = useState({ open: false, id: null });
  const [exceptionDrawer, setExceptionDrawer] = useState({ open: false, exceptionId: null });
  const [houses, setHouses] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [createForm] = Form.useForm();
  const [abnormalForm] = Form.useForm();

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
      const d = await api.eggRecords.list(params);
      setRecords(d.records || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filters]);

  const fetchInspections = async (houseId, date) => {
    if (!houseId || !date) return;
    const d = await api.inspections.list({ house_id: houseId, date, status: 'completed' });
    setInspections(d.inspections || []);
  };

  const handleViewDetail = async (id) => {
    try {
      const d = await api.eggRecords.get(id);
      setDetailModal({ open: true, data: d });
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await api.eggRecords.confirm(id);
      message.success('已确认');
      fetchData();
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleMarkAbnormal = async () => {
    try {
      const values = await abnormalForm.validateFields();
      await api.eggRecords.markAbnormal(abnormalModal.id, values.reason);
      message.success('已标记异常');
      setAbnormalModal({ open: false, id: null });
      abnormalForm.resetFields();
      fetchData();
    } catch (e) {
      if (e.message) message.error(e.message);
    }
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      await api.eggRecords.create({
        ...values,
        date: values.date.format('YYYY-MM-DD'),
      });
      message.success('产蛋记录已创建');
      setCreateModal(false);
      createForm.resetFields();
      fetchData();
    } catch (e) {
      if (e.message) message.error(e.message);
    }
  };

  const handleExport = () => {
    const params = {};
    if (filters.date) params.date = filters.date;
    window.open(api.export.eggRecords(params), '_blank');
  };

  const abnormalRecords = records.filter(r => r.status === 'abnormal');
  const pendingRecords = records.filter(r => r.status === 'pending');
  const recordedRecords = records.filter(r => r.status === 'recorded');
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
      title: '分拣员', dataIndex: 'sorter_name', width: 90,
      render: v => <Text style={{ color: '#c0c0c0' }}>{v || '-'}</Text>,
    },
    {
      title: '总数', dataIndex: 'total_count', width: 80,
      render: v => <Text strong style={{ color: '#e0e0e0', fontSize: 14 }}>{v ?? '-'}</Text>,
    },
    {
      title: 'A级', dataIndex: 'grade_a', width: 60,
      render: v => <Text style={{ color: '#c0c0c0' }}>{v ?? '-'}</Text>,
    },
    {
      title: 'B级', dataIndex: 'grade_b', width: 60,
      render: v => <Text style={{ color: '#c0c0c0' }}>{v ?? '-'}</Text>,
    },
    {
      title: 'C级', dataIndex: 'grade_c', width: 60,
      render: v => <Text style={{ color: '#c0c0c0' }}>{v ?? '-'}</Text>,
    },
    {
      title: '破损', dataIndex: 'cracked', width: 60,
      render: v => v > 0 ? <Text style={{ color: '#ff4d4f', fontWeight: 700 }}>{v}</Text> : <Text style={{ color: '#666' }}>0</Text>,
    },
    {
      title: '状态', dataIndex: 'status', width: 110,
      render: v => (
        <Space size={6}>
          <span className={`status-dot ${v}`} />
          <Tag color={STATUS_COLORS[v]}>{EGG_STATUS[v]}</Tag>
        </Space>
      ),
    },
    {
      title: '巡检卡', dataIndex: 'inspection_status', width: 140,
      render: (v, r) => {
        if (!v && !r.inspection_card_id) {
          return <Text style={{ color: '#555', fontSize: 12 }}>未关联</Text>;
        }
        const color = INSPECTION_LINK_COLORS[v] || '#555';
        return (
          <Space size={4}>
            <LinkOutlined style={{ color, fontSize: 11 }} />
            <Tag style={{
              background: `${color}18`,
              border: `1px solid ${color}50`,
              color,
              fontSize: 11,
            }}>
              {INSPECTION_STATUS[v] || '未知'}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: '原因', width: 160,
      render: (_, r) => {
        const reason = getIncompleteReason(r);
        if (!reason) return <Text style={{ color: '#52c41a', fontSize: 12 }}>已完结</Text>;
        return (
          <Space size={4}>
            {reason.level === 'critical' && <ExclamationCircleOutlined style={{ color: reason.color, fontSize: 13 }} />}
            {reason.level === 'warning' && <WarningOutlined style={{ color: reason.color, fontSize: 13 }} />}
            {reason.level === 'info' && <ClockCircleOutlined style={{ color: reason.color, fontSize: 12 }} />}
            <Text style={{ color: reason.color, fontSize: 12 }}>{reason.text}</Text>
          </Space>
        );
      },
    },
    {
      title: '操作', width: 220, fixed: 'right',
      render: (_, r) => (
        <Space size={4}>
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(r.id)} style={{ color: '#4fc3f7' }}>详情</Button>
          {r.status === 'pending' && r.sorter_id === user?.id && (
            <Tooltip title="录入产蛋数据"><Button size="small" type="primary" onClick={() => { createForm.setFieldsValue({ house_id: r.house_id, date: dayjs(r.date), shift: r.shift, sorter_id: r.sorter_id }); setCreateModal(true); }}>录入</Button></Tooltip>
          )}
          {r.status === 'recorded' && user?.role === 'manager' && (
            <Button size="small" type="primary" style={{ background: '#13c2c2' }} onClick={() => handleConfirm(r.id)}>确认</Button>
          )}
          {r.status === 'pending' && r.sorter_id === user?.id && (
            <Button size="small" danger onClick={() => setAbnormalModal({ open: true, id: r.id })}>标记异常</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ background: '#0f0f1e', minHeight: '100vh', padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, color: '#e0e0e0' }}>
          <EggOutlined style={{ color: '#faad14', marginRight: 8 }} />产蛋记录
        </Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleExport} style={{ background: '#16213e', borderColor: '#2a3a5c', color: '#b0b0b0' }}>导出CSV</Button>
          {(user?.role === 'sorter' || user?.role === 'manager') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>新建记录</Button>
          )}
        </Space>
      </div>

      {abnormalRecords.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1a0a0a 0%, #2a1010 100%)',
          border: '1px solid #5c1a1a',
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 12,
          boxShadow: '0 0 20px rgba(255, 77, 79, 0.15), inset 0 0 30px rgba(255, 77, 79, 0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
            <Text strong style={{ color: '#ff7875', fontSize: 15 }}>
              {abnormalRecords.length}条产蛋异常记录 — 需立即关注
            </Text>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {abnormalRecords.map(r => {
              const reason = getIncompleteReason(r);
              return (
                <div key={r.id} style={{
                  background: 'rgba(255, 77, 79, 0.1)',
                  border: '1px solid rgba(255, 77, 79, 0.3)',
                  borderRadius: 6,
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <Text style={{ color: '#ffa39e', fontWeight: 600 }}>{r.house_name}</Text>
                  <Tag style={{ background: 'rgba(250,173,20,0.15)', border: '1px solid rgba(250,173,20,0.4)', color: '#ffc53d' }}>{SHIFT_LABELS[r.shift]}</Tag>
                  <Text style={{ color: '#888' }}>{r.sorter_name}</Text>
                  {reason && (
                    <Tag style={{ background: `${reason.color}20`, border: `1px solid ${reason.color}60`, color: reason.color, fontSize: 11 }}>
                      {reason.text}
                    </Tag>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pendingRecords.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1a1400 0%, #2a2000 100%)',
          border: '1px solid #5c4a1a',
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 12,
          boxShadow: '0 0 20px rgba(250, 173, 20, 0.1), inset 0 0 30px rgba(250, 173, 20, 0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <WarningOutlined style={{ color: '#faad14', fontSize: 20 }} />
            <Text strong style={{ color: '#ffc53d', fontSize: 15 }}>
              {pendingRecords.length}条待录入记录
            </Text>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {pendingRecords.map(r => {
              const reason = getIncompleteReason(r);
              return (
                <div key={r.id} style={{
                  background: 'rgba(250, 173, 20, 0.08)',
                  border: '1px solid rgba(250, 173, 20, 0.2)',
                  borderRadius: 6,
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <Text style={{ color: '#ffc53d', fontWeight: 600 }}>{r.house_name}</Text>
                  <Tag style={{ background: 'rgba(250,173,20,0.15)', border: '1px solid rgba(250,173,20,0.4)', color: '#ffc53d' }}>{SHIFT_LABELS[r.shift]}</Tag>
                  <Text style={{ color: '#888' }}>{r.sorter_name}</Text>
                  {reason && (
                    <Tag style={{
                      background: `${reason.color}20`,
                      border: `1px solid ${reason.color}60`,
                      color: reason.color,
                      fontSize: 11,
                    }}>
                      {reason.level === 'critical' && <ExclamationCircleOutlined style={{ marginRight: 4 }} />}
                      {reason.level === 'warning' && <WarningOutlined style={{ marginRight: 4 }} />}
                      {reason.level === 'info' && <ClockCircleOutlined style={{ marginRight: 4 }} />}
                      {reason.text}
                    </Tag>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {recordedRecords.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #0a1a2a 0%, #0d2040 100%)',
          border: '1px solid #1a3a5c',
          borderRadius: 8,
          padding: '12px 20px',
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClockCircleOutlined style={{ color: '#00b4d8', fontSize: 16 }} />
            <Text style={{ color: '#91d5ff', fontSize: 14 }}>
              {recordedRecords.length}条已录入记录等待场长确认
            </Text>
            <Text style={{ color: '#555', fontSize: 12, marginLeft: 8 }}>
              {recordedRecords.map(r => `${r.house_name}(${SHIFT_LABELS[r.shift]})`).join('、')}
            </Text>
          </div>
        </div>
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
            options={Object.entries(EGG_STATUS).map(([k, v]) => ({ value: k, label: v }))}
            popupClassName="dark-select-dropdown"
          />
        </Space>
      </Card>

      <Card size="small" style={{ background: '#16213e', border: '1px solid #2a3a5c', borderRadius: 8 }}>
        <Table
          dataSource={records}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="small"
          scroll={{ x: 1300 }}
          pagination={false}
          rowClassName={r => {
            if (r.status === 'abnormal') return 'ant-table-row-danger';
            if (r.status === 'pending') return 'ant-table-row-warning';
            if (r.status === 'recorded') return 'ant-table-row-cyan';
            return '';
          }}
        />
      </Card>

      <Modal
        title={<span style={{ color: '#e0e0e0' }}>产蛋记录详情</span>}
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, data: null })}
        width={720}
        footer={null}
        styles={{ content: { background: '#16213e', border: '1px solid #2a3a5c' }, header: { background: '#16213e', borderBottom: '1px solid #2a3a5c' }, body: { background: '#16213e' } }}
      >
        {detailModal.data && <EggRecordDetail data={detailModal.data} onOpenException={(id) => { setDetailModal({ open: false, data: null }); setExceptionDrawer({ open: true, exceptionId: id }); }} />}
      </Modal>

      <Modal
        title={<span style={{ color: '#e0e0e0' }}>新建/录入产蛋记录</span>}
        open={createModal}
        onOk={handleCreate}
        onCancel={() => { setCreateModal(false); createForm.resetFields(); setInspections([]); }}
        okText="提交"
        width={600}
        styles={{ content: { background: '#16213e', border: '1px solid #2a3a5c' }, header: { background: '#16213e', borderBottom: '1px solid #2a3a5c' }, body: { background: '#16213e' } }}
      >
        <Form form={createForm} layout="vertical" onValuesChange={(changed) => {
          if (changed.house_id || changed.date) {
            const houseId = createForm.getFieldValue('house_id');
            const date = createForm.getFieldValue('date')?.format('YYYY-MM-DD');
            fetchInspections(houseId, date);
          }
        }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label={<span style={{ color: '#b0b0b0' }}>鸡舍</span>} name="house_id" rules={[{ required: true }]}>
                <Select options={houses.filter(h => h.status === 'active').map(h => ({ value: h.id, label: `${h.code} ${h.name}` }))} popupClassName="dark-select-dropdown" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={<span style={{ color: '#b0b0b0' }}>日期</span>} name="date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%', background: '#0f0f1e', borderColor: '#2a3a5c', color: '#e0e0e0' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={<span style={{ color: '#b0b0b0' }}>班次</span>} name="shift" rules={[{ required: true }]}>
                <Select options={[{ value: 'morning', label: '早班' }, { value: 'afternoon', label: '午班' }, { value: 'night', label: '夜班' }]} popupClassName="dark-select-dropdown" />
              </Form.Item>
            </Col>
          </Row>
          {inspections.length > 0 && (
            <div style={{
              background: 'rgba(19, 194, 194, 0.08)',
              border: '1px solid rgba(19, 194, 194, 0.25)',
              borderRadius: 6,
              padding: '10px 14px',
              marginBottom: 16,
            }}>
              <Space style={{ marginBottom: 8 }}>
                <LinkOutlined style={{ color: '#13c2c2' }} />
                <Text style={{ color: '#13c2c2', fontWeight: 600, fontSize: 13 }}>可关联巡检卡</Text>
              </Space>
              <Form.Item name="inspection_card_id" noStyle>
                <Select allowClear placeholder="选择已完成的巡检卡" options={inspections.map(i => ({ value: i.id, label: `${i.house_name} ${SHIFT_LABELS[i.shift]} (${INSPECTION_STATUS[i.status]})` }))} popupClassName="dark-select-dropdown" />
              </Form.Item>
            </div>
          )}
          <Form.Item label={<span style={{ color: '#b0b0b0' }}>分拣员</span>} name="sorter_id" rules={[{ required: true }]} initialValue={user?.id}>
            <Select options={[{ value: user?.id, label: `${user?.name}（当前用户）` }]} disabled />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label={<span style={{ color: '#b0b0b0' }}>总数</span>} name="total_count" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%', background: '#0f0f1e', borderColor: '#2a3a5c', color: '#e0e0e0' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={<span style={{ color: '#b0b0b0' }}>A级</span>} name="grade_a" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%', background: '#0f0f1e', borderColor: '#2a3a5c', color: '#e0e0e0' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={<span style={{ color: '#b0b0b0' }}>B级</span>} name="grade_b" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%', background: '#0f0f1e', borderColor: '#2a3a5c', color: '#e0e0e0' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label={<span style={{ color: '#b0b0b0' }}>C级</span>} name="grade_c" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%', background: '#0f0f1e', borderColor: '#2a3a5c', color: '#e0e0e0' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={<span style={{ color: '#b0b0b0' }}>破损</span>} name="cracked">
                <InputNumber min={0} style={{ width: '100%', background: '#0f0f1e', borderColor: '#2a3a5c', color: '#e0e0e0' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={<span style={{ color: '#b0b0b0' }}>脏蛋</span>} name="dirty">
                <InputNumber min={0} style={{ width: '100%', background: '#0f0f1e', borderColor: '#2a3a5c', color: '#e0e0e0' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={<span style={{ color: '#b0b0b0' }}>软壳</span>} name="soft_shell">
                <InputNumber min={0} style={{ width: '100%', background: '#0f0f1e', borderColor: '#2a3a5c', color: '#e0e0e0' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label={<span style={{ color: '#b0b0b0' }}>备注</span>} name="notes">
            <Input.TextArea rows={2} style={{ background: '#0f0f1e', borderColor: '#2a3a5c', color: '#e0e0e0' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span style={{ color: '#e0e0e0' }}>标记产蛋异常</span>}
        open={abnormalModal.open}
        onOk={handleMarkAbnormal}
        onCancel={() => { setAbnormalModal({ open: false, id: null }); abnormalForm.resetFields(); }}
        okText="确认标记"
        okButtonProps={{ danger: true }}
        styles={{ content: { background: '#16213e', border: '1px solid #2a3a5c' }, header: { background: '#16213e', borderBottom: '1px solid #2a3a5c' }, body: { background: '#16213e' } }}
      >
        <Form form={abnormalForm} layout="vertical">
          <Form.Item label={<span style={{ color: '#b0b0b0' }}>异常原因</span>} name="reason" rules={[{ required: true, message: '请说明异常原因' }]}>
            <Input.TextArea rows={3} placeholder="请说明为何产蛋异常，如：巡检异常导致产蛋中断、鸡群应激等" style={{ background: '#0f0f1e', borderColor: '#2a3a5c', color: '#e0e0e0' }} />
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
        .status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 2px;
        }
        .status-dot.pending { background: #faad14; }
        .status-dot.recorded { background: #1677ff; }
        .status-dot.confirmed { background: #52c41a; }
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
        .ant-table-tbody > tr.ant-table-row-warning > td {
          background: rgba(250, 173, 20, 0.05) !important;
        }
        .ant-table-tbody > tr.ant-table-row-cyan > td {
          background: rgba(19, 194, 194, 0.05) !important;
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

function EggRecordDetail({ data, onOpenException }) {
  const { record, exceptions, attachments } = data;
  const reason = getIncompleteReason(record);

  const handleUpload = async (file) => {
    try {
      await api.attachments.upload('egg_record', record.id, file, record.sorter_id);
      message.success('上传成功');
    } catch (e) {
      message.error('上传失败');
    }
    return false;
  };

  return (
    <div>
      {reason && (
        <div style={{
          background: `${reason.color}15`,
          border: `1px solid ${reason.color}40`,
          borderRadius: 6,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          {reason.level === 'critical' && <ExclamationCircleOutlined style={{ color: reason.color, fontSize: 18 }} />}
          {reason.level === 'warning' && <WarningOutlined style={{ color: reason.color, fontSize: 18 }} />}
          {reason.level === 'info' && <ClockCircleOutlined style={{ color: reason.color, fontSize: 16 }} />}
          <Text style={{ color: reason.color, fontWeight: 600, fontSize: 14 }}>{reason.text}</Text>
        </div>
      )}

      <Descriptions
        title={<span style={{ color: '#e0e0e0' }}>{record.house_code} {record.house_name} — {SHIFT_LABELS[record.shift]}</span>}
        bordered size="small" column={3}
      >
        <Descriptions.Item label="状态">
          <Space><span className={`status-dot ${record.status}`} />{EGG_STATUS[record.status]}</Space>
        </Descriptions.Item>
        <Descriptions.Item label="分拣员">{record.sorter_name}</Descriptions.Item>
        <Descriptions.Item label="鸡群数量">{record.current_count}</Descriptions.Item>
        <Descriptions.Item label="总数"><Text strong style={{ color: '#e0e0e0' }}>{record.total_count}</Text></Descriptions.Item>
        <Descriptions.Item label="A级">{record.grade_a}</Descriptions.Item>
        <Descriptions.Item label="B级">{record.grade_b}</Descriptions.Item>
        <Descriptions.Item label="C级">{record.grade_c}</Descriptions.Item>
        <Descriptions.Item label="破损">{record.cracked > 0 ? <Text style={{ color: '#ff4d4f', fontWeight: 700 }}>{record.cracked}</Text> : 0}</Descriptions.Item>
        <Descriptions.Item label="脏蛋">{record.dirty}</Descriptions.Item>
        <Descriptions.Item label="软壳">{record.soft_shell}</Descriptions.Item>
        <Descriptions.Item label="备注" span={3}>{record.notes || '-'}</Descriptions.Item>
      </Descriptions>

      {record.inspection_card_id && (
        <>
          <Divider orientation="left" style={{ borderColor: '#2a3a5c', color: '#8899aa' }}>
            <Space>
              <LinkOutlined style={{ color: INSPECTION_LINK_COLORS[record.inspection_status] || '#555' }} />
              <span>关联巡检卡（饲养员：{record.feeder_name}）</span>
            </Space>
          </Divider>
          <Descriptions size="small" column={4} bordered>
            <Descriptions.Item label="巡检状态">
              <Tag style={{
                background: `${INSPECTION_LINK_COLORS[record.inspection_status] || '#555'}18`,
                border: `1px solid ${INSPECTION_LINK_COLORS[record.inspection_status] || '#555'}50`,
                color: INSPECTION_LINK_COLORS[record.inspection_status] || '#555',
              }}>
                {INSPECTION_STATUS[record.inspection_status]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="温度">{record.temperature ? `${record.temperature}°C` : '-'}</Descriptions.Item>
            <Descriptions.Item label="湿度">{record.humidity ? `${record.humidity}%` : '-'}</Descriptions.Item>
            <Descriptions.Item label="死亡">{record.insp_dead_count || 0}只 / 病鸡：{record.insp_sick_count || 0}只</Descriptions.Item>
          </Descriptions>
        </>
      )}

      {!record.inspection_card_id && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px dashed rgba(255,255,255,0.12)',
          borderRadius: 6,
          padding: '12px 16px',
          marginTop: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <LinkOutlined style={{ color: '#555' }} />
          <Text style={{ color: '#666' }}>未关联巡检卡 — 产蛋数据无法与巡检数据关联</Text>
        </div>
      )}

      {exceptions.length > 0 && (
        <>
          <Divider orientation="left" style={{ borderColor: '#2a3a5c', color: '#8899aa' }}>关联异常</Divider>
          {exceptions.map(e => (
            <Card key={e.id} size="small" style={{
              marginBottom: 8,
              borderLeft: `3px solid ${e.severity === 'critical' ? '#cf1322' : e.severity === 'urgent' ? '#d4380d' : '#faad14'}`,
              background: 'rgba(255,77,79,0.04)',
              borderColor: '#2a3a5c',
            }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <Tag color={e.severity === 'critical' ? 'error' : e.severity === 'urgent' ? 'error' : 'warning'}>
                    {e.severity === 'critical' ? '紧急' : e.severity === 'urgent' ? '紧急' : '警告'}
                  </Tag>
                  <Tag>{e.category}</Tag>
                  <Text style={{ color: '#c0c0c0' }}>{e.description}</Text>
                </Space>
                <Space>
                  <Text type="secondary">处理人：{e.handler_name || '未指派'}</Text>
                  <Text type="secondary">状态：{e.status === 'resolved' ? '已解决' : e.status === 'closed' ? '已关闭' : '处理中'}</Text>
                  <Button size="small" type="link" onClick={() => onOpenException(e.id)} style={{ color: '#4fc3f7' }}>处理</Button>
                </Space>
              </Space>
            </Card>
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
            <Tag key={a.id} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#b0b0b0' }}>{a.original_name} ({(a.size / 1024).toFixed(1)}KB)</Tag>
          ))}
        </div>
      )}
    </div>
  );
}
