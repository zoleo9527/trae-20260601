import { useEffect, useState } from 'react';
import {
  Card, Table, Tag, Button, Space, Input, Select, Drawer, Form, App, Row, Col,
  Empty, Badge, Tooltip, Modal, Alert, Statistic, Descriptions, Divider, Radio,
} from 'antd';
import {
  SearchOutlined, WarningOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  CheckOutlined, HistoryOutlined, MedicineBoxOutlined, FileTextOutlined,
  SwapOutlined, EyeOutlined, FlagOutlined, UserOutlined, ClockCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { Role, ExceptionRecord, Registration, PhysicalCheck, ResponsibilityWarning } from 'shared';
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
  responsibilityMap,
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
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span><WarningOutlined /> 异常详情</span>
            {detailOpen && (
              <>
                <Tag color={typeMap[detailOpen.type].color}>{typeMap[detailOpen.type].label}</Tag>
                <Tag color={exceptionLevelMap[detailOpen.level].color}>
                  {exceptionLevelMap[detailOpen.level].label}
                </Tag>
                {detailReg?.responsibilityWarning?.triggered && (
                  <Tag color="magenta" icon={<FlagOutlined />}>含报名责任预警</Tag>
                )}
                {detailPhys?.responsibilityMark && detailPhys.responsibilityMark !== 'none' && (
                  <Tag color="purple" icon={<FlagOutlined />}>含体检责任标记</Tag>
                )}
              </>
            )}
          </div>
        }
        placement="right"
        open={!!detailOpen}
        onClose={() => setDetailOpen(null)}
        width={760}
        extra={
          detailOpen && !detailOpen.resolved && canResolve ? (
            <Button type="primary" icon={<CheckOutlined />} onClick={confirmResolve}>处理此异常</Button>
          ) : null
        }
      >
        {detailOpen && (
          <div>
            {detailOpen.resolved ? (
              <Alert type="success" showIcon style={{ marginBottom: 16 }} message="✅ 异常已处理完成" description={
                <div>
                  <div><strong>处理人：</strong>{detailOpen.handler}（{roleMap[detailOpen.handlerRole].label}）</div>
                  <div><strong>处理时间：</strong>{formatDateTime(detailOpen.resolvedAt)}</div>
                  <div><strong>处理备注：</strong>{detailOpen.resolveNote}</div>
                </div>
              } />
            ) : (
              <Alert
                type="warning"
                showIcon
                icon={<ExclamationCircleOutlined />}
                style={{ marginBottom: 16 }}
                message={
                  <Space>
                    <span>⚠️ 待处理异常</span>
                    <Tag color={typeMap[detailOpen.type].color}>{typeMap[detailOpen.type].label}</Tag>
                    <Tag color={exceptionLevelMap[detailOpen.level].color}>{exceptionLevelMap[detailOpen.level].label}</Tag>
                  </Space>
                }
                description={detailOpen.content}
              />
            )}

            {(detailReg?.responsibilityWarning?.triggered || (detailPhys?.responsibilityMark && detailPhys.responsibilityMark !== 'none')) && (
              <Card
                size="small"
                style={{ marginBottom: 16, borderRadius: 8, borderColor: '#ffadd2', background: '#fff0f6' }}
                bodyStyle={{ padding: 16 }}
                title={
                  <span style={{ color: '#eb2f96' }}>
                    <FlagOutlined /> 🚩 责任预警归并汇总
                    {detailReg?.responsibilityWarning?.triggered && detailPhys?.responsibilityMark && detailPhys.responsibilityMark !== 'none'
                      ? `（双链路 ×${1 + 1}）`
                      : detailReg?.responsibilityWarning?.triggered
                        ? '（报名侧）'
                        : '（体检侧）'}
                  </span>
                }
              >
                {detailReg?.responsibilityWarning?.triggered && (
                  <div style={{
                    padding: 12,
                    background: '#fff',
                    borderRadius: 6,
                    marginBottom: detailPhys?.responsibilityMark && detailPhys.responsibilityMark !== 'none' ? 12 : 0,
                    borderLeft: '3px solid #eb2f96',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <Tag color="magenta">报名侧责任预警</Tag>
                      <Tag color="blue">{detailReg.responsibilityWarning.triggerType}</Tag>
                      {detailReg.responsibilityWarning.syncedToException && (
                        <Tag color="red" icon={<FlagOutlined />}>已同步异常清单</Tag>
                      )}
                      {detailReg.responsibilityWarning.exceptionId && (
                        <Tag style={{ borderStyle: 'dashed' }}>关联异常：{detailReg.responsibilityWarning.exceptionId}</Tag>
                      )}
                    </div>
                    <Row gutter={[12, 8]} style={{ fontSize: 13 }}>
                      <Col xs={24} md={12}>
                        <div><span style={{ color: '#8c8c8c' }}>触发时间：</span>{formatDateTime(detailReg.responsibilityWarning.flowTime)}</div>
                      </Col>
                      <Col xs={24} md={12}>
                        <div><span style={{ color: '#8c8c8c' }}>报名员：</span><UserOutlined /> {detailReg.responsibilityWarning.registrarName}</div>
                      </Col>
                      <Col xs={24}>
                        <div style={{ color: '#8c8c8c', marginBottom: 4 }}>缺项资料清单（共 {detailReg.responsibilityWarning.missingDocs.length} 项）：</div>
                        <Space size={[4, 4]} wrap>
                          {detailReg.responsibilityWarning.missingDocs.map((d: string) => (
                            <Tag key={d} color="error" icon={<CloseCircleOutlined />}>{d}</Tag>
                          ))}
                        </Space>
                      </Col>
                      {detailReg.responsibilityWarning.mark && (
                        <Col xs={24} md={12}>
                          <div>
                            <span style={{ color: '#8c8c8c' }}>建议责任归属：</span>
                            <Tag color={responsibilityMap[detailReg.responsibilityWarning.mark as keyof typeof responsibilityMap]?.color || 'default'}>
                              {responsibilityMap[detailReg.responsibilityWarning.mark as keyof typeof responsibilityMap]?.label || detailReg.responsibilityWarning.mark}
                            </Tag>
                          </div>
                        </Col>
                      )}
                      <Col xs={24}>
                        <div style={{
                          marginTop: 4, padding: '8px 12px',
                          background: '#fafafa', borderRadius: 4, fontSize: 13,
                        }}>
                          <strong>📝 责任说明：</strong>{detailReg.responsibilityWarning.description}
                        </div>
                      </Col>
                    </Row>
                  </div>
                )}

                {detailPhys?.responsibilityMark && detailPhys.responsibilityMark !== 'none' && (
                  <div style={{
                    padding: 12,
                    background: '#fff',
                    borderRadius: 6,
                    borderLeft: '3px solid #722ed1',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <Tag color="purple">体检侧责任标记</Tag>
                      <Tag color={responsibilityMap[detailPhys.responsibilityMark].color}>
                        {responsibilityMap[detailPhys.responsibilityMark].label}
                      </Tag>
                      <Tag color={physicalStatusMap[detailPhys.status].color}>{physicalStatusMap[detailPhys.status].label}</Tag>
                    </div>
                    <Row gutter={[12, 8]} style={{ fontSize: 13 }}>
                      <Col xs={24} md={12}>
                        <div><span style={{ color: '#8c8c8c' }}>体检编号：</span>{detailPhys.id}</div>
                      </Col>
                      <Col xs={24} md={12}>
                        <div><span style={{ color: '#8c8c8c' }}>体检员：</span>{detailPhys.examiner || '—'}</div>
                      </Col>
                      <Col xs={24}>
                        <div style={{
                          marginTop: 4, padding: '8px 12px',
                          background: '#f9f0ff', borderRadius: 4, fontSize: 13,
                        }}>
                          <strong>🏷️ 责任详细说明：</strong>{detailPhys.responsibilityNote || '未填写详细说明'}
                        </div>
                      </Col>
                      {detailPhys.reviewNote && (
                        <Col xs={24}>
                          <div style={{
                            marginTop: 4, padding: '8px 12px',
                            background: '#fffbe6', borderRadius: 4, fontSize: 13,
                          }}>
                            <strong>🔍 复核说明：</strong>{detailPhys.reviewNote}
                          </div>
                        </Col>
                      )}
                    </Row>
                  </div>
                )}
              </Card>
            )}

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Descriptions title="异常基本信息" column={1} size="small" bordered style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="异常编号">{detailOpen.id}</Descriptions.Item>
                  <Descriptions.Item label="异常类型">
                    <Tag color={typeMap[detailOpen.type].color} icon={typeMap[detailOpen.type].icon}>
                      {typeMap[detailOpen.type].label}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="严重级别">
                    <Tag color={exceptionLevelMap[detailOpen.level].color}>
                      {exceptionLevelMap[detailOpen.level].label}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="学员姓名">{detailOpen.studentName}</Descriptions.Item>
                  <Descriptions.Item label="关联报名号">
                    <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{detailOpen.registrationId}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="发起时间"><ClockCircleOutlined /> {formatDateTime(detailOpen.createdAt)}</Descriptions.Item>
                  <Descriptions.Item label="发起方">
                    {detailOpen.handler}（{roleMap[detailOpen.handlerRole].label}）
                  </Descriptions.Item>
                </Descriptions>

                <Card size="small" title={<span><FileTextOutlined /> 报名资料详情</span>} style={{ marginBottom: 16 }}>
                  {detailReg ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                        <Tag color={registrationStatusMap[detailReg.status].color}>
                          {registrationStatusMap[detailReg.status].label}
                        </Tag>
                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>报名编号：{detailReg.id}</span>
                      </div>
                      <Row gutter={[8, 8]} style={{ fontSize: 13, marginBottom: 12 }}>
                        <Col xs={12}><div><UserOutlined /> <strong>{detailReg.studentName}</strong></div></Col>
                        <Col xs={12}><div>📞 {detailReg.phone}</div></Col>
                        <Col xs={24}><div style={{ fontFamily: 'monospace', fontSize: 12 }}>🆔 {detailReg.idCard}</div></Col>
                        <Col xs={12}><div>👤 报名员：{detailReg.registrarName}</div></Col>
                        <Col xs={12}><div><ClockCircleOutlined /> {formatDateTime(detailReg.createdAt)}</div></Col>
                      </Row>

                      <Divider style={{ margin: '12px 0' }} plain>
                        <span style={{ fontSize: 12, color: '#595959' }}>资料清单（{detailReg.docs.filter(d => d.submitted).length}/{detailReg.docs.length}）</span>
                      </Divider>
                      <Space size={[4, 6]} wrap style={{ marginBottom: 12 }}>
                        {detailReg.docs.map((d: any) => (
                          <Tag
                            key={d.name}
                            color={d.submitted ? 'success' : 'error'}
                            icon={d.submitted ? <CheckOutlined /> : <CloseCircleOutlined />}
                            style={{ opacity: d.submitted ? 1 : 0.9 }}
                          >
                            {d.name}
                            {d.note && ` (${d.note})`}
                          </Tag>
                        ))}
                      </Space>
                      {detailReg.docs.filter((d: any) => !d.submitted).length > 0 && (
                        <Alert
                          type="error"
                          showIcon
                          style={{ marginBottom: 12 }}
                          message={`缺 ${detailReg.docs.filter((d: any) => !d.submitted).length} 项资料`}
                          description={
                            <span style={{ fontSize: 12 }}>
                              缺项：{detailReg.docs.filter((d: any) => !d.submitted).map((d: any) => d.name).join('、')}
                            </span>
                          }
                        />
                      )}

                      {detailReg.remark && (
                        <div style={{
                          padding: '8px 12px', background: '#e6f4ff', borderRadius: 4,
                          fontSize: 12, borderLeft: '3px solid #1677ff',
                        }}>
                          <strong>📝 报名备注：</strong>{detailReg.remark}
                        </div>
                      )}
                      {detailReg.rejectReason && (
                        <div style={{
                          marginTop: 8, padding: '8px 12px', background: '#fff1f0', borderRadius: 4,
                          fontSize: 12, borderLeft: '3px solid #ff4d4f',
                        }}>
                          <strong>❌ 驳回原因：</strong>{detailReg.rejectReason}
                        </div>
                      )}
                      {detailReg.supplementNote && (
                        <div style={{
                          marginTop: 8, padding: '8px 12px', background: '#fffbe6', borderRadius: 4,
                          fontSize: 12, borderLeft: '3px solid #faad14',
                        }}>
                          <strong>⚠️ 补录说明：</strong>{detailReg.supplementNote}
                        </div>
                      )}
                    </div>
                  ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未找到关联报名资料" />}
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card size="small" title={<span><MedicineBoxOutlined /> 体检核验详情</span>} style={{ marginBottom: 16 }}>
                  {detailPhys ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                        <Tag color={physicalStatusMap[detailPhys.status].color}>
                          {physicalStatusMap[detailPhys.status].label}
                        </Tag>
                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>体检编号：{detailPhys.id}</span>
                        <Tag color="blue">v{detailPhys.version}</Tag>
                      </div>
                      <Row gutter={[8, 8]} style={{ fontSize: 13, marginBottom: 12 }}>
                        <Col xs={12}><div>👁️ 视力：{detailPhys.eyesightLeft ?? '—'} / {detailPhys.eyesightRight ?? '—'}</div></Col>
                        <Col xs={12}><div>🫀 心率：{detailPhys.heartRate ?? '—'} 次/分</div></Col>
                        <Col xs={12}><div>🩸 血压：{detailPhys.bloodPressure || '—'}</div></Col>
                        <Col xs={12}><div>📏 身高：{detailPhys.height ?? '—'} cm</div></Col>
                        <Col xs={12}>
                          <div>👂 听力：
                            {detailPhys.hearing ? (
                              <Tag color={detailPhys.hearing === 'normal' ? 'success' : 'error'} style={{ marginLeft: 4 }}>
                                {detailPhys.hearing === 'normal' ? '正常' : '异常'}
                              </Tag>
                            ) : '—'}
                          </div>
                        </Col>
                        <Col xs={12}>
                          <div>🦵 肢体：
                            {detailPhys.limbsCheck ? (
                              <Tag color={detailPhys.limbsCheck === 'normal' ? 'success' : 'error'} style={{ marginLeft: 4 }}>
                                {detailPhys.limbsCheck === 'normal' ? '正常' : '异常'}
                              </Tag>
                            ) : '—'}
                          </div>
                        </Col>
                        <Col xs={12}><div>🧑‍⚕️ 体检员：{detailPhys.examiner || '—'}</div></Col>
                        <Col xs={12}><div><ClockCircleOutlined /> {formatDateTime(detailPhys.checkedAt)}</div></Col>
                      </Row>

                      {detailPhys.medicalHistory && detailPhys.medicalHistory !== '无' && (
                        <Alert style={{ marginBottom: 12 }} type="warning" showIcon message="既往病史" description={detailPhys.medicalHistory} />
                      )}
                      {detailPhys.reviewNote && (
                        <Alert style={{ marginBottom: 12 }} type="warning" showIcon message="安全员复核说明" description={detailPhys.reviewNote} />
                      )}
                      {detailPhys.recheckNote && (
                        <Alert style={{ marginBottom: 12 }} type="warning" showIcon message="重检建议" description={detailPhys.recheckNote} />
                      )}

                      {detailPhys.responsibilityMark && detailPhys.responsibilityMark !== 'none' && (
                        <div style={{
                          padding: 12, borderRadius: 6,
                          background: `var(--color-${detailPhys.responsibilityMark}-light, #f9f0ff)`,
                          border: `1px solid ${responsibilityMap[detailPhys.responsibilityMark].color}`,
                        }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            marginBottom: 6, flexWrap: 'wrap',
                          }}>
                            <FlagOutlined style={{ color: responsibilityMap[detailPhys.responsibilityMark].color }} />
                            <span style={{ fontWeight: 600 }}>
                              责任归属：{responsibilityMap[detailPhys.responsibilityMark].label}
                            </span>
                          </div>
                          {detailPhys.responsibilityNote && (
                            <div style={{ fontSize: 12, lineHeight: 1.7, color: '#1f1f1f' }}>
                              {detailPhys.responsibilityNote}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无体检记录（报名未流转到体检）" />}
                </Card>

                {(!detailReg?.responsibilityWarning?.triggered && !(detailPhys?.responsibilityMark && detailPhys.responsibilityMark !== 'none')) && (
                  <Alert
                    type="info"
                    showIcon
                    message="责任标记提示"
                    description="此异常暂未在报名侧或体检侧标记责任归属，可根据实际情况到报名资料页或体检核验页补充标记，便于交班时追溯。"
                  />
                )}
              </Col>
            </Row>

            <Divider orientation="left">异常原始描述</Divider>
            <div style={{
              padding: 16,
              borderRadius: 8,
              background: detailOpen.level === 'error' ? '#fff2f0' : '#fffbe6',
              border: `1px solid ${detailOpen.level === 'error' ? '#ffccc7' : '#ffe58f'}`,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 10, flexWrap: 'wrap',
              }}>
                {detailOpen.level === 'error'
                  ? <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
                  : <WarningOutlined style={{ color: '#faad14', fontSize: 18 }} />}
                <span style={{ fontWeight: 600 }}>
                  {typeMap[detailOpen.type].label}异常 · {exceptionLevelMap[detailOpen.level].label}
                </span>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                  由 {detailOpen.handler}（{roleMap[detailOpen.handlerRole].label}）于 {formatDateTime(detailOpen.createdAt)} 发起
                </span>
              </div>
              <div style={{ color: '#1f1f1f', lineHeight: 1.8, fontSize: 13 }}>
                {detailOpen.content}
              </div>
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
