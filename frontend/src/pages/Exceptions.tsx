import { useEffect, useState } from 'react';
import {
  Card, Table, Tag, Button, Space, Input, Select, Drawer, Form, App, Row, Col,
  Empty, Badge, Tooltip, Modal, Alert, Statistic, Descriptions, Divider, Radio,
} from 'antd';
import {
  SearchOutlined, WarningOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  CheckOutlined, HistoryOutlined, MedicineBoxOutlined, FileTextOutlined,
  SwapOutlined, EyeOutlined,
} from '@ant-design/icons';
import type { Role, ExceptionRecord, Registration, PhysicalCheck } from 'shared';
import {
  getExceptions,
  resolveException,
  getRegistrations,
  getPhysicals,
} from '../api';
import { useUserStore } from '../store/user';
import {
  exceptionLevelMap,
  formatDateTime,
  registrationStatusMap,
  physicalStatusMap,
  roleMap,
} from '../utils/constants';

interface Props {
  role: Role;
}

const typeMap: Record<string, { label: string; color: string; icon: JSX.Element }> = {
  registration: { label: '报名资料', color: '#1677ff', icon: <FileTextOutlined /> },
  physical: { label: '体检核验', color: '#52c41a', icon: <MedicineBoxOutlined /> },
  handover: { label: '交班争议', color: '#faad14', icon: <SwapOutlined /> },
};

export default function Exceptions({ role }: Props) {
  const currentUser = useUserStore((s) => s.currentUser);
  const { message, modal } = App.useApp();

  const [list, setList] = useState<ExceptionRecord[]>([]);
  const [filtered, setFiltered] = useState<ExceptionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [resolvedFilter, setResolvedFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const [detailOpen, setDetailOpen] = useState<ExceptionRecord | null>(null);
  const [detailReg, setDetailReg] = useState<Registration | null>(null);
  const [detailPhys, setDetailPhys] = useState<PhysicalCheck | null>(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [form] = Form.useForm();

  const canResolve = role === 'safetyOfficer' || role === 'fieldCoach';

  useEffect(() => { loadAll(); }, [role]);

  useEffect(() => {
    let f = list;
    if (resolvedFilter === 'unresolved') f = f.filter(e => !e.resolved);
    if (resolvedFilter === 'resolved') f = f.filter(e => e.resolved);
    if (typeFilter !== 'all') f = f.filter(e => e.type === typeFilter);
    if (levelFilter !== 'all') f = f.filter(e => e.level === levelFilter);
    if (keyword) {
      const kw = keyword.toLowerCase();
      f = f.filter(e =>
        e.studentName.toLowerCase().includes(kw) ||
        e.content.toLowerCase().includes(kw) ||
        e.id.toLowerCase().includes(kw)
      );
    }
    setFiltered(f);
  }, [list, keyword, resolvedFilter, typeFilter, levelFilter]);

  const loadAll = async () => {
    setLoading(true);
    try {
      setList(await getExceptions());
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (e: ExceptionRecord) => {
    setDetailOpen(e);
    try {
      const [regs, phys] = await Promise.all([getRegistrations(), getPhysicals()]);
      setDetailReg(regs.find(r => r.id === e.registrationId) || null);
      setDetailPhys(phys.find(p => p.registrationId === e.registrationId) || null);
    } catch {}
  };

  const handleResolve = async (values: any) => {
    if (!detailOpen) return;
    try {
      await resolveException(detailOpen.id, {
        resolveNote: values.resolveNote,
        handler: currentUser,
        handlerRole: role,
      });
      message.success('异常已处理完成');
      setResolveModalOpen(false);
      form.resetFields();
      loadAll();
      if (detailOpen) openDetail(detailOpen);
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const confirmResolve = () => {
    if (!detailOpen) return;
    if (detailOpen.type === 'handover' && role !== 'safetyOfficer') {
      modal.warning({
        title: '需要安全员仲裁',
        content: '交班争议类异常只能由安全员处理，请联系安全员或切换到安全员入口处理。',
      });
      return;
    }
    form.setFieldsValue({ handler: currentUser });
    setResolveModalOpen(true);
  };

  const unresolved = list.filter(e => !e.resolved).length;
  const errorCount = list.filter(e => !e.resolved && e.level === 'error').length;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {role === 'safetyOfficer' && unresolved > 0 && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={errorCount > 0 ? `你有 ${unresolved} 个待处理异常，其中 ${errorCount} 个严重级别` : `你有 ${unresolved} 个待处理异常`}
          description="请优先处理严重异常，处理后再交班。"
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="未处理异常" value={list.filter(e => !e.resolved).length} prefix={<WarningOutlined />} valueStyle={{ color: unresolved > 3 ? '#eb2f96' : '#faad14' }} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="严重级别" value={errorCount} prefix={<ExclamationCircleOutlined />} valueStyle={{ color: '#ff4d4f' }} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="已处理" value={list.filter(e => e.resolved).length} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="总计" value={list.length} prefix={<HistoryOutlined />} /></Card>
        </Col>
      </Row>

      <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
        <Space wrap>
          <Input allowClear prefix={<SearchOutlined />} placeholder="搜索学员/内容" style={{ width: 260 }} value={keyword} onChange={e => setKeyword(e.target.value)} />
          <Select style={{ width: 140 }} value={resolvedFilter} onChange={setResolvedFilter} options={[
            { label: '仅未处理', value: 'unresolved' },
            { label: '仅已处理', value: 'resolved' },
            { label: '全部', value: 'all' },
          ]} />
          <Select style={{ width: 140 }} value={typeFilter} onChange={setTypeFilter} options={[
            { label: '全部类型', value: 'all' },
            { label: '报名资料', value: 'registration' },
            { label: '体检核验', value: 'physical' },
            { label: '交班争议', value: 'handover' },
          ]} />
          <Select style={{ width: 140 }} value={levelFilter} onChange={setLevelFilter} options={[
            { label: '全部级别', value: 'all' },
            { label: '严重', value: 'error' },
            { label: '警告', value: 'warning' },
            { label: '提示', value: 'info' },
          ]} />
          <Button type="primary" onClick={loadAll}>刷新</Button>
          <div style={{ flex: 1 }} />
          <span style={{ color: '#8c8c8c', fontSize: 13 }}>共 {filtered.length} 条</span>
        </Space>
      </Card>

      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 8 }}>
        <Table<ExceptionRecord>
          rowKey="id"
          loading={loading}
          dataSource={filtered}
          locale={{ emptyText: <Empty description="暂无异常记录" /> }}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
          rowClassName={(r) => r.resolved ? '' : (r.level === 'error' ? 'ant-table-row-selected' : '')}
          columns={[
            {
              title: '类型', dataIndex: 'type', width: 110,
              render: (v) => {
                const info = typeMap[v];
                return (
                  <Tag color={info.color} icon={info.icon}>
                  {info.label}
                  </Tag>
                );
              },
            },
            {
              title: '级别', dataIndex: 'level', width: 100,
              render: (v) => {
                const info = exceptionLevelMap[v];
                return <Badge status={v === 'error' ? 'error' : v === 'warning' ? 'warning' : 'processing'} text={<Tag color={info.color}>{info.label}</Tag>} />;
              },
            },
            { title: '学员', dataIndex: 'studentName', width: 100 },
            {
              title: '异常内容', dataIndex: 'content', ellipsis: true,
              render: (v, r) => (
                <Tooltip title={v} placement="topLeft">
                <span style={{ color: r.resolved ? '#8c8c8c' : '#1f1f1f' }}>{v}</span>
                </Tooltip>
              ),
            },
            {
              title: '发起方', width: 130,
              render: (_, r) => (
                <div>
                  <div>{r.handler}</div>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>{roleMap[r.handlerRole].label}</div>
                </div>
              ),
            },
            {
              title: '状态', width: 90,
              render: (_, r) => r.resolved
                ? <Tag color="success" icon={<CheckOutlined />}>已处理</Tag>
                : <Tag color="warning">待处理</Tag>,
            },
            {
              title: '创建时间', dataIndex: 'createdAt', width: 150,
              render: (v) => <span style={{ fontSize: 12, color: '#8c8c8c' }}>{formatDateTime(v)}</span>,
            },
            {
              title: '操作', width: 130, fixed: 'right',
              render: (_, r) => (
                <Space size="small">
                  <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>详情</Button>
                  {!r.resolved && canResolve && (
                    <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => { setDetailOpen(r); confirmResolve(); }}>
                      处理
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        title={<span><WarningOutlined /> 异常详情</span>}
        placement="right"
        open={!!detailOpen}
        onClose={() => setDetailOpen(null)}
        width={680}
        extra={
          detailOpen && !detailOpen.resolved && canResolve ? (
            <Button type="primary" icon={<CheckOutlined />} onClick={confirmResolve}>处理此异常</Button>
          ) : null
        }
      >
        {detailOpen && (
          <div>
            {detailOpen.resolved ? (
              <Alert type="success" showIcon style={{ marginBottom: 16 }} message="已处理" description={
                <div>
                  <div>处理人：{detailOpen.handler}（{roleMap[detailOpen.handlerRole].label}）</div>
                  <div>处理时间：{formatDateTime(detailOpen.resolvedAt)}</div>
                  <div>处理备注：{detailOpen.resolveNote}</div>
                </div>
              } />
            ) : (
              <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="待处理" description={detailOpen.content} />
            )}

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Descriptions title="异常信息" column={1} size="small" bordered style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="编号">{detailOpen.id}</Descriptions.Item>
                  <Descriptions.Item label="类型">
                    <Tag color={typeMap[detailOpen.type].color} icon={typeMap[detailOpen.type].icon}>
                      {typeMap[detailOpen.type].label}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="级别">
                    <Tag color={exceptionLevelMap[detailOpen.level].color}>
                      {exceptionLevelMap[detailOpen.level].label}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="学员">{detailOpen.studentName}</Descriptions.Item>
                  <Descriptions.Item label="关联编号">{detailOpen.registrationId}</Descriptions.Item>
                  <Descriptions.Item label="发起时间">{formatDateTime(detailOpen.createdAt)}</Descriptions.Item>
                  <Descriptions.Item label="发起方">
                    {detailOpen.handler}（{roleMap[detailOpen.handlerRole].label}）
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title={<span><FileTextOutlined /> 报名资料</span>} style={{ marginBottom: 16 }}>
                  {detailReg ? (
                    <div style={{ fontSize: 13 }}>
                      <div style={{ marginBottom: 4 }}>
                        <Tag color={registrationStatusMap[detailReg.status].color}>
                          {registrationStatusMap[detailReg.status].label}
                        </Tag>
                      </div>
                      <div>📞 {detailReg.phone}</div>
                      <div>🆔 {detailReg.idCard}</div>
                      <div style={{ marginTop: 4, color: '#8c8c8c' }}>报名员：{detailReg.registrarName}</div>
                      {detailReg.remark && <div style={{ marginTop: 8, padding: 8, background: '#fafafa', borderRadius: 4 }}>备注：{detailReg.remark}</div>}
                    </div>
                  ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未找到报名资料" />}
                </Card>
                <Card size="small" title={<span><MedicineBoxOutlined /> 体检核验</span>}>
                  {detailPhys ? (
                    <div style={{ fontSize: 13 }}>
                      <div style={{ marginBottom: 4 }}>
                        <Tag color={physicalStatusMap[detailPhys.status].color}>
                          {physicalStatusMap[detailPhys.status].label}
                        </Tag>
                      </div>
                      <div>体检员：{detailPhys.examiner || '—'}</div>
                      <div>体检时间：{formatDateTime(detailPhys.checkedAt)}</div>
                      {detailPhys.reviewNote && <div style={{ marginTop: 8, padding: 8, background: '#fffbe6', borderRadius: 4 }}>复核：{detailPhys.reviewNote}</div>}
                      {detailPhys.recheckNote && <div style={{ marginTop: 8, padding: 8, background: '#fff7e6', borderRadius: 4 }}>重检：{detailPhys.recheckNote}</div>}
                    </div>
                  ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无体检记录" />}
                </Card>
              </Col>
            </Row>

            <Divider orientation="left">异常详情</Divider>
            <div style={{
              padding: 16,
              borderRadius: 8,
              background: detailOpen.level === 'error' ? '#fff2f0' : '#fffbe6',
              border: detailOpen.level === 'error' ? '1px solid #ffccc7' : '1px solid #ffe58f',
            }}>
              <div style={{ color: '#1f1f1f', lineHeight: 1.8 }}>{detailOpen.content}</div>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title={<span><CheckOutlined /> 处理异常</span>}
        open={resolveModalOpen}
        onCancel={() => setResolveModalOpen(false)}
        onOk={() => form.submit()}
        okText="确认处理"
        width={560}
      >
        {detailOpen && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message={`${detailOpen.studentName} · ${typeMap[detailOpen.type].label}异常`}
            description={detailOpen.content}
          />
        )}
        <Form form={form} layout="vertical" onFinish={handleResolve}>
          <Form.Item name="handler" label="处理人">
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="resolveNote"
            label="处理说明（必填）"
            rules={[{ required: true, message: '请填写处理结果' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="详细说明处理方案、责任归属、后续跟进事项等，供交班时查看。"
            />
          </Form.Item>
          {detailOpen?.type === 'handover' && role === 'safetyOfficer' && (
            <Form.Item name="responsibility" label="仲裁结论（安全员）">
              <Radio.Group>
                <Radio value="registrar">主要为报名员责任</Radio>
                <Radio value="coach">主要为教练责任</Radio>
                <Radio value="both">双方各有责任</Radio>
                <Radio value="none">属于系统问题，双方无责</Radio>
              </Radio.Group>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
