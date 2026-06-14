import { useEffect, useState } from 'react';
import {
  Card, Table, Tag, Button, Space, Modal, Form, Input, App, Row, Col, Statistic,
  Empty, Divider, Timeline, Descriptions, List, Avatar,
} from 'antd';
import {
  SwapOutlined, PlusOutlined, FileTextOutlined, MedicineBoxOutlined,
  WarningOutlined, CheckCircleOutlined, UserOutlined, ClockCircleOutlined,
  FlagOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { Role, HandoverLog, DashboardStats, ExceptionRecord, Registration, PhysicalCheck, ResponsibilityWarning } from 'shared';
import {
  getHandoverLogs,
  createHandover,
  getStats,
  getExceptions,
  getRegistrations,
  getPhysicals,
} from '../api';
import { useUserStore, getRoleDefaultUser } from '../store/user';
import {
  formatDateTime,
  roleMap,
  exceptionLevelMap,
  registrationStatusMap,
  physicalStatusMap,
  responsibilityMap,
} from '../utils/constants';

interface Props {
  role: Role;
}

const nextRoleMap: Record<Role, { role: Role; label: string; user: string }> = {
  registrar: { role: 'fieldCoach', label: '场地教练', user: getRoleDefaultUser('fieldCoach') },
  fieldCoach: { role: 'safetyOfficer', label: '安全员', user: getRoleDefaultUser('safetyOfficer') },
  safetyOfficer: { role: 'registrar', label: '报名员', user: getRoleDefaultUser('registrar') },
};

export default function Handover({ role }: Props) {
  const currentUser = useUserStore((s) => s.currentUser);
  const { message } = App.useApp();

  const [list, setList] = useState<HandoverLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingExceptions, setPendingExceptions] = useState<ExceptionRecord[]>([]);
  const [pendingRegs, setPendingRegs] = useState<Registration[]>([]);
  const [pendingPhysicals, setPendingPhysicals] = useState<PhysicalCheck[]>([]);
  const [respWarnings, setRespWarnings] = useState<{ reg: Registration; warning: ResponsibilityWarning }[]>([]);
  const [respPhysicals, setRespPhysicals] = useState<PhysicalCheck[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const next = nextRoleMap[role];

  useEffect(() => { loadAll(); }, [role]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [logs, s, exs, regs, phys] = await Promise.all([
        getHandoverLogs(),
        getStats(),
        getExceptions({ resolved: false }),
        getRegistrations(),
        getPhysicals(),
      ]);
      setList(logs);
      setStats(s);
      setPendingExceptions(exs);
      setPendingRegs(regs.filter(r => r.status === 'pending' || r.status === 'supplement' || r.status === 'delayed'));
      setPendingPhysicals(phys.filter(p => p.status === 'pending' || p.status === 'review' || p.status === 'recheck'));
      const warnings: { reg: Registration; warning: ResponsibilityWarning }[] = [];
      regs.forEach(r => {
        if (r.responsibilityWarning?.triggered) warnings.push({ reg: r, warning: r.responsibilityWarning });
      });
      setRespWarnings(warnings);
      setRespPhysicals(phys.filter(p => p.responsibilityMark !== 'none'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await createHandover({
        fromRole: role,
        toRole: next.role,
        fromUser: currentUser,
        toUser: next.user,
        summary: values.summary,
        pendingItems: pendingRegs.length + pendingPhysicals.length,
        exceptionItems: pendingExceptions.length,
        responsibilityItems: respWarnings.length + respPhysicals.length,
        responsibilityDetails: [
          ...respWarnings.map(({ reg, warning }) => ({
            studentName: reg.studentName,
            registrationId: reg.id,
            mark: 'registrar_issue' as const,
            description: `缺${warning.missingDocs.length}项资料（${warning.missingDocs.join('、')}），报名员：${warning.registrarName}`,
          })),
          ...respPhysicals.map(p => ({
            studentName: p.studentName,
            registrationId: p.registrationId,
            mark: p.responsibilityMark,
            description: p.responsibilityNote || '已标记责任归属',
          })),
        ],
      });
      message.success('交班记录已创建');
      setCreateOpen(false);
      form.resetFields();
      loadAll();
    } catch (e: any) {
      message.error(e.message || '创建失败');
    }
  };

  const buildDefaultSummary = () => {
    const parts: string[] = [];
    parts.push(`交班时间：${new Date().toLocaleString('zh-CN')}`);
    if (pendingRegs.length > 0) parts.push(`待处理报名资料 ${pendingRegs.length} 项：${pendingRegs.map(r => r.studentName).join('、')}`);
    if (pendingPhysicals.length > 0) parts.push(`待处理体检 ${pendingPhysicals.length} 项：${pendingPhysicals.map(p => p.studentName).join('、')}`);
    if (pendingExceptions.length > 0) parts.push(`未处理异常 ${pendingExceptions.length} 项：${pendingExceptions.map(e => `${e.studentName}(${e.content.slice(0, 20)})`).join('；')}`);
    if (respWarnings.length > 0) {
      parts.push(`责任预警（报名缺项流转）${respWarnings.length} 项：`);
      respWarnings.forEach(({ reg, warning }) => {
        parts.push(`  - ${reg.studentName}：缺${warning.missingDocs.length}项资料（${warning.missingDocs.join('、')}），报名员：${warning.registrarName}`);
      });
    }
    if (respPhysicals.length > 0) {
      parts.push(`责任归属已标记 ${respPhysicals.length} 条体检：`);
      respPhysicals.forEach(p => {
        parts.push(`  - ${p.studentName}（${responsibilityMap[p.responsibilityMark].label}）：${p.responsibilityNote?.slice(0, 40) || ''}`);
      });
    }
    if (parts.length === 1) parts.push('无未完成事项，流程顺畅。');
    return parts.join('\n');
  };

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>
      <Card
        style={{ marginBottom: 16, borderRadius: 8 }}
        bodyStyle={{ padding: 24 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <span className={`role-badge ${role}`}>{roleMap[role].icon} {currentUser}（{roleMap[role].label}）</span>
              <SwapOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />
              <span className={`role-badge ${next.role}`}>{roleMap[next.role].icon} {next.user}（{next.label}）</span>
            </div>
            <div style={{ color: '#8c8c8c', fontSize: 13 }}>
              当前岗位交接给下一岗位 — 提交后对方入口即可看到待办事项
            </div>
          </div>
          <Space>
            <Button onClick={loadAll}><SwapOutlined /> 刷新</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              form.setFieldsValue({ summary: buildDefaultSummary() });
              setCreateOpen(true);
            }}>
              创建交班记录
            </Button>
          </Space>
        </div>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="交班记录数" value={list.length} prefix={<SwapOutlined />} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="待办事项" value={pendingRegs.length + pendingPhysicals.length} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#1677ff' }} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="未处理异常" value={pendingExceptions.length} prefix={<WarningOutlined />} valueStyle={{ color: pendingExceptions.length > 0 ? '#eb2f96' : '#8c8c8c' }} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="责任预警"
              value={respWarnings.length + respPhysicals.length}
              prefix={<FlagOutlined />}
              valueStyle={{ color: (respWarnings.length + respPhysicals.length) > 0 ? '#eb2f96' : '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card
            size="small"
            title={<span><FileTextOutlined /> 待处理报名资料 ({pendingRegs.length})</span>}
            style={{ borderRadius: 8 }}
            bodyStyle={{ padding: pendingRegs.length ? 0 : 24 }}
          >
            {pendingRegs.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无待处理报名资料" />
            ) : (
              <List
                dataSource={pendingRegs}
                renderItem={(r) => (
                  <List.Item style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} style={{ background: '#1677ff' }} />}
                      title={
                        <Space>
                          <strong>{r.studentName}</strong>
                          <Tag color={registrationStatusMap[r.status].color}>{registrationStatusMap[r.status].label}</Tag>
                        </Space>
                      }
                      description={
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                          {r.id} · {r.phone} · 报名员：{r.registrarName}
                          {r.remark && <div style={{ marginTop: 4, color: '#595959' }}>📝 {r.remark}</div>}
                          {r.rejectReason && <div style={{ marginTop: 4, color: '#ff4d4f' }}>❌ {r.rejectReason}</div>}
                          {r.supplementNote && <div style={{ marginTop: 4, color: '#faad14' }}>⚠️ {r.supplementNote}</div>}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            size="small"
            title={<span><MedicineBoxOutlined /> 待处理体检 ({pendingPhysicals.length})</span>}
            style={{ borderRadius: 8 }}
            bodyStyle={{ padding: pendingPhysicals.length ? 0 : 24 }}
          >
            {pendingPhysicals.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无待处理体检" />
            ) : (
              <List
                dataSource={pendingPhysicals}
                renderItem={(p) => (
                  <List.Item style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                    <List.Item.Meta
                      avatar={<Avatar icon={<MedicineBoxOutlined />} style={{ background: '#52c41a' }} />}
                      title={
                        <Space>
                          <strong>{p.studentName}</strong>
                          <Tag color={physicalStatusMap[p.status].color}>{physicalStatusMap[p.status].label}</Tag>
                          {p.responsibilityMark !== 'none' && (
                            <Tag color="magenta">⚠️ 有责</Tag>
                          )}
                        </Space>
                      }
                      description={
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                          {p.id} · 体检员：{p.examiner || '待体检'}
                          {p.reviewNote && <div style={{ marginTop: 4, color: '#faad14' }}>复核：{p.reviewNote}</div>}
                          {p.recheckNote && <div style={{ marginTop: 4, color: '#fa8c16' }}>重检：{p.recheckNote}</div>}
                          {p.responsibilityNote && (
                            <div style={{ marginTop: 4, color: '#eb2f96', padding: 4, background: '#fff0f6', borderRadius: 4 }}>
                              🚩 {p.responsibilityNote}
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {pendingExceptions.length > 0 && (
        <Card
          size="small"
          style={{ marginBottom: 16, borderRadius: 8, borderColor: '#ffccc7' }}
          title={<span style={{ color: '#ff4d4f' }}><WarningOutlined /> ⚠️ 交班时必须说明清楚的未处理异常 ({pendingExceptions.length})</span>}
          bodyStyle={{ padding: 0 }}
        >
          <List
            dataSource={pendingExceptions}
            renderItem={(e) => (
              <List.Item
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  background: e.level === 'error' ? '#fff2f0' : undefined,
                }}
              >
                <List.Item.Meta
                  avatar={<Tag color={exceptionLevelMap[e.level].color}>{exceptionLevelMap[e.level].label}</Tag>}
                  title={
                    <Space>
                      <strong>{e.studentName}</strong>
                      <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                        {e.handler} · {formatDateTime(e.createdAt)}
                      </span>
                    </Space>
                  }
                  description={<div style={{ color: '#595959' }}>{e.content}</div>}
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {(respWarnings.length > 0 || respPhysicals.length > 0) && (
        <Card
          size="small"
          style={{ marginBottom: 16, borderRadius: 8, borderColor: '#ffadd2' }}
          title={
            <span style={{ color: '#eb2f96' }}>
              <FlagOutlined /> 🚩 责任预警清单（共 {respWarnings.length + respPhysicals.length} 项）
            </span>
          }
          bodyStyle={{ padding: 0 }}
        >
          {respWarnings.length > 0 && (
            <div>
              <div style={{ padding: '8px 16px', background: '#fff0f6', fontWeight: 600, color: '#eb2f96', fontSize: 13 }}>
                报名缺项流转预警 ({respWarnings.length})
              </div>
              <List
                dataSource={respWarnings}
                renderItem={({ reg, warning }) => (
                  <List.Item style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                    <List.Item.Meta
                      avatar={<Avatar icon={<ExclamationCircleOutlined />} style={{ background: '#eb2f96' }} />}
                      title={
                        <Space>
                          <strong>{reg.studentName}</strong>
                          <Tag color="error">缺{warning.missingDocs.length}项资料</Tag>
                          <Tag color="blue">{warning.triggerType}</Tag>
                          {warning.syncedToException && <Tag color="red">已同步异常</Tag>}
                        </Space>
                      }
                      description={
                        <div style={{ fontSize: 12, color: '#595959', lineHeight: 1.8 }}>
                          <div>📋 缺项：{warning.missingDocs.join('、')}</div>
                          <div>👤 报名员：{warning.registrarName} · 流转时间：{formatDateTime(warning.flowTime)}</div>
                          <div>📝 {warning.description}</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          )}
          {respPhysicals.length > 0 && (
            <div>
              <div style={{ padding: '8px 16px', background: '#f9f0ff', fontWeight: 600, color: '#722ed1', fontSize: 13 }}>
                体检责任已标记 ({respPhysicals.length})
              </div>
              <List
                dataSource={respPhysicals}
                renderItem={(p) => (
                  <List.Item style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                    <List.Item.Meta
                      avatar={<Avatar icon={<FlagOutlined />} style={{ background: responsibilityMap[p.responsibilityMark].color?.startsWith('#') ? responsibilityMap[p.responsibilityMark].color : '#722ed1' }} />}
                      title={
                        <Space>
                          <strong>{p.studentName}</strong>
                          <Tag color={responsibilityMap[p.responsibilityMark].color}>
                            {responsibilityMap[p.responsibilityMark].label}
                          </Tag>
                          <Tag color={physicalStatusMap[p.status].color}>{physicalStatusMap[p.status].label}</Tag>
                        </Space>
                      }
                      description={
                        <div style={{ fontSize: 12, color: '#595959' }}>
                          🏷️ {p.responsibilityNote || '无详细说明'}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          )}
        </Card>
      )}

      <Card
        size="small"
        title={<span><SwapOutlined /> 交班历史时间线</span>}
        style={{ borderRadius: 8 }}
      >
        {list.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无交班记录" />
        ) : (
          <Timeline
            mode="left"
            items={list.map((log) => ({
              color: log.exceptionItems > 0 ? 'red' : 'green',
              label: <div style={{ fontSize: 12, color: '#8c8c8c' }}>{formatDateTime(log.createdAt)}</div>,
              children: (
                <Card size="small" style={{ marginBottom: 8, borderRadius: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span className={`role-badge ${log.fromRole}`} style={{ fontSize: 11 }}>{roleMap[log.fromRole].label} · {log.fromUser}</span>
                    <SwapOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
                    <span className={`role-badge ${log.toRole}`} style={{ fontSize: 11 }}>{roleMap[log.toRole].label} · {log.toUser}</span>
                    {log.responsibilityItems > 0 && (
                      <Tag color="magenta" style={{ marginLeft: 8 }}>
                        <FlagOutlined /> 含 {log.responsibilityItems} 项责任预警
                      </Tag>
                    )}
                  </div>
                  <Descriptions column={3} size="small">
                    <Descriptions.Item label="待办事项">{log.pendingItems} 项</Descriptions.Item>
                    <Descriptions.Item label="异常事项">{log.exceptionItems} 项</Descriptions.Item>
                    <Descriptions.Item label="责任预警">{log.responsibilityItems || 0} 项</Descriptions.Item>
                    <Descriptions.Item label="记录编号" span={3}>{log.id}</Descriptions.Item>
                  </Descriptions>
                  {log.responsibilityDetails && log.responsibilityDetails.length > 0 && (
                    <>
                      <Divider style={{ margin: '8px 0' }} />
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#eb2f96', marginBottom: 8 }}>
                        <FlagOutlined /> 责任预警明细：
                      </div>
                      <List
                        size="small"
                        dataSource={log.responsibilityDetails}
                        renderItem={(item: any) => (
                          <List.Item style={{ padding: '4px 0' }}>
                            <Space size="small" wrap>
                              <Tag color={responsibilityMap[item.mark]?.color || 'warning'}>
                                {responsibilityMap[item.mark]?.label || item.mark}
                              </Tag>
                              <strong>{item.studentName}</strong>
                              <span style={{ fontSize: 12, color: '#595959' }}>{item.description}</span>
                            </Space>
                          </List.Item>
                        )}
                      />
                    </>
                  )}
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{
                    fontSize: 13,
                    color: '#595959',
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                    background: '#fafafa',
                    padding: 12,
                    borderRadius: 6,
                  }}>
                    {log.summary}
                  </div>
                </Card>
              ),
            }))}
          />
        )}
      </Card>

      <Modal
        title={<span><PlusOutlined /> 创建交班记录</span>}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        okText="确认交班"
        okButtonProps={{ type: 'primary' }}
        cancelText="取消"
        width={640}
      >
        <Card size="small" style={{ marginBottom: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}>
          <Row gutter={16}>
            <Col xs={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>交接人</div>
                <div style={{ fontWeight: 600, color: '#1677ff' }}>{currentUser}</div>
                <div style={{ fontSize: 12 }}>{roleMap[role].label}</div>
              </div>
            </Col>
            <Col xs={8} style={{ textAlign: 'center' }}>
              <SwapOutlined style={{ fontSize: 24, color: '#52c41a', marginTop: 12 }} />
            </Col>
            <Col xs={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>接交人</div>
                <div style={{ fontWeight: 600, color: '#52c41a' }}>{next.user}</div>
                <div style={{ fontSize: 12 }}>{roleMap[next.role].label}</div>
              </div>
            </Col>
          </Row>
        </Card>

        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col xs={12}>
              <Form.Item label="待办事项数">
                <Input value={pendingRegs.length + pendingPhysicals.length} disabled />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item label="未处理异常数">
                <Input value={pendingExceptions.length} disabled />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="summary"
            label="交班详细说明（必填）"
            rules={[{ required: true, message: '请填写交班说明' }]}
            extra="系统已自动填入待办事项摘要，可根据实际情况补充修改。对方入口会看到此说明。"
          >
            <Input.TextArea
              rows={6}
              placeholder="详细说明交接内容、待办事项、异常情况、注意事项等。"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
