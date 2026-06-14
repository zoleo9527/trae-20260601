import { useEffect, useState } from 'react';
import {
  Card, Table, Tag, Button, Space, Input, Select, Modal, Form, Checkbox, InputNumber,
  Drawer, Descriptions, Divider, Alert, App, Row, Col, Badge, Tooltip,
} from 'antd';
import {
  SearchOutlined,
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
  SwapOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import type {
  Registration,
  RegistrationDoc,
  RegistrationStatus,
  PhysicalCheck,
} from 'shared';
import {
  getRegistrations,
  updateRegistrationStatus,
  getPhysicals,
  updateRegistration,
} from '../api';
import { useUserStore } from '../store/user';
import {
  registrationStatusMap,
  physicalStatusMap,
  formatDateTime,
  responsibilityMap,
} from '../utils/constants';

const statusFilters: { label: string; value: RegistrationStatus | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '待处理', value: 'pending' },
  { label: '资料完成', value: 'completed' },
  { label: '拖延', value: 'delayed' },
  { label: '补录中', value: 'supplement' },
  { label: '已驳回', value: 'rejected' },
];

export default function Registrations() {
  const currentUser = useUserStore((s) => s.currentUser);
  const { message, modal } = App.useApp();

  const [list, setList] = useState<Registration[]>([]);
  const [filtered, setFiltered] = useState<Registration[]>([]);
  const [physicalMap, setPhysicalMap] = useState<Record<string, PhysicalCheck>>({});
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'all'>('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [current, setCurrent] = useState<Registration | null>(null);
  const [actionModal, setActionModal] = useState<null | { type: 'complete' | 'reject' | 'supplement' | 'delay' }>(null);
  const [form] = Form.useForm();
  const [docForm] = Form.useForm();

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    let f = list;
    if (statusFilter !== 'all') f = f.filter(r => r.status === statusFilter);
    if (keyword) {
      const kw = keyword.toLowerCase();
      f = f.filter(r =>
        r.studentName.toLowerCase().includes(kw) ||
        r.idCard.includes(kw) ||
        r.phone.includes(kw) ||
        r.id.toLowerCase().includes(kw)
      );
    }
    setFiltered(f);
  }, [list, keyword, statusFilter]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [regs, phys] = await Promise.all([getRegistrations(), getPhysicals()]);
      setList(regs);
      const map: Record<string, PhysicalCheck> = {};
      phys.forEach(p => { map[p.registrationId] = p; });
      setPhysicalMap(map);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (r: Registration) => {
    setCurrent(r);
    docForm.setFieldsValue({
      docs: r.docs.map(d => d.id),
      remark: r.remark,
    });
    setDetailOpen(true);
  };

  const handleStatusChange = async (values: any) => {
    if (!current || !actionModal) return;
    try {
      let status: RegistrationStatus = 'completed';
      let body: any = {};
      switch (actionModal.type) {
        case 'complete':
          status = 'completed';
          body = { remark: values.remark };
          break;
        case 'reject':
          status = 'rejected';
          body = { rejectReason: values.rejectReason };
          break;
        case 'supplement':
          status = 'supplement';
          body = { supplementNote: values.supplementNote };
          break;
        case 'delay':
          status = 'delayed';
          body = { delayHours: values.delayHours, remark: values.remark };
          break;
      }
      await updateRegistrationStatus(current.id, { status, ...body });
      message.success(`已更新为"${registrationStatusMap[status].label}"状态，已自动流转`);
      setActionModal(null);
      form.resetFields();
      loadAll();
      setDetailOpen(false);
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleSaveDocs = async () => {
    if (!current) return;
    const values = await docForm.validateFields();
    const newDocs: RegistrationDoc[] = current.docs.map(d => ({
      ...d,
      submitted: (values.docs || []).includes(d.id),
    }));
    try {
      await updateRegistration(current.id, {
        docs: newDocs,
        remark: values.remark,
      });
      message.success('资料清单已保存');
      loadAll();
    } catch (e: any) {
      message.error(e.message || '保存失败');
    }
  };

  const confirmComplete = () => {
    if (!current) return;
    const missing = current.docs.filter(d => !d.submitted);
    if (missing.length > 0) {
      modal.confirm({
        title: '仍有资料未完整提交',
        content: (
          <div>
            <p>以下资料仍未提交，确认完成流转到体检环节？</p>
            <ul>
              {missing.map(m => <li key={m.id} style={{ color: '#faad14' }}>{m.name}{m.note ? `（${m.note}）` : ''}</li>)}
            </ul>
            <Alert
              type="warning"
              showIcon
              style={{ marginTop: 12 }}
              message="提示：若确认流转，责任不清问题将在体检环节被自动标记，避免事后无法界定。"
            />
          </div>
        ),
        okText: '仍要流转',
        okButtonProps: { danger: false },
        cancelText: '再检查',
        onOk: () => {
          setActionModal({ type: 'complete' });
          form.setFieldsValue({ remark: `报名员${currentUser}：资料有缺项（${missing.map(m => m.name).join('、')}）仍流转，请体检环节注意` });
        },
      });
    } else {
      setActionModal({ type: 'complete' });
      form.setFieldsValue({ remark: `资料齐全，报名员${currentUser}确认流转` });
    }
  };

  const physicalInfo = (rId: string) => physicalMap[rId];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Alert
        type="info"
        showIcon
        icon={<SwapOutlined />}
        style={{ marginBottom: 16 }}
        message="交班提示：资料完成后将自动流转到体检核验环节，无需另外发消息。如有缺项流转，系统会自动标记责任点。"
      />

      <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
        <Space wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索姓名/身份证/手机/编号"
            style={{ width: 280 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Select
            style={{ width: 160 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusFilters.map(f => ({ label: f.label, value: f.value }))}
          />
          <Button type="primary" onClick={loadAll}>刷新</Button>
          <div style={{ flex: 1 }} />
          <span style={{ color: '#8c8c8c', fontSize: 13 }}>共 {filtered.length} 条记录</span>
        </Space>
      </Card>

      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 8 }}>
        <Table<Registration>
          rowKey="id"
          loading={loading}
          dataSource={filtered}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1100 }}
          columns={[
            {
              title: '编号', dataIndex: 'id', width: 140, fixed: 'left',
              render: (v) => <span style={{ color: '#8c8c8c', fontSize: 12, fontFamily: 'monospace' }}>{v}</span>,
            },
            { title: '学员姓名', dataIndex: 'studentName', width: 100, fixed: 'left' },
            { title: '手机号', dataIndex: 'phone', width: 120 },
            { title: '身份证号', dataIndex: 'idCard', width: 190, render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
            {
              title: '资料完整', width: 110,
              render: (_, r) => {
                const ok = r.docs.filter(d => d.submitted).length;
                const total = r.docs.length;
                const color = ok === total ? 'success' : ok > 0 ? 'warning' : 'error';
                return <Badge color={color} text={`${ok}/${total}项`} />;
              },
            },
            {
              title: '报名状态', dataIndex: 'status', width: 100,
              render: (v) => {
                const info = registrationStatusMap[v];
                return <Tag color={info.color}>{info.label}</Tag>;
              },
            },
            {
              title: '流转状态（体检）', width: 120,
              render: (_, r) => {
                const p = physicalInfo(r.id);
                if (!p) {
                  if (r.status === 'completed') {
                    return <Tag icon={<ClockCircleOutlined />} color="processing">自动流转中</Tag>;
                  }
                  return <span style={{ color: '#bfbfbf' }}>—</span>;
                }
                const info = physicalStatusMap[p.status];
                const content = <Tag icon={<MedicineBoxOutlined />} color={info.color}>{info.label}</Tag>;
                if (p.responsibilityMark !== 'none') {
                  return (
                    <Tooltip title={`⚠️ 责任标记：${responsibilityMap[p.responsibilityMark].label}`}>
                      <Badge dot offset={[-3, 3]} color="#eb2f96">{content}</Badge>
                    </Tooltip>
                  );
                }
                return content;
              },
            },
            { title: '报名员', dataIndex: 'registrarName', width: 90 },
            {
              title: '更新时间', dataIndex: 'updatedAt', width: 150,
              render: (v) => <span style={{ fontSize: 12, color: '#8c8c8c' }}>{formatDateTime(v)}</span>,
            },
            {
              title: '操作', width: 140, fixed: 'right',
              render: (_, r) => (
                <Space size="small">
                  <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>查看</Button>
                  {(r.status === 'pending' || r.status === 'delayed' || r.status === 'supplement') && (
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openDetail(r)}>处理</Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        title={current ? `报名资料详情 · ${current.studentName}` : ''}
        placement="right"
        open={detailOpen}
        width={720}
        onClose={() => setDetailOpen(false)}
        extra={
          current && (current.status === 'pending' || current.status === 'delayed' || current.status === 'supplement') ? (
            <Space>
              <Button onClick={() => { setActionModal({ type: 'reject' }); form.resetFields(); }} danger icon={<CloseOutlined />}>驳回</Button>
              <Button onClick={() => { setActionModal({ type: 'supplement' }); form.resetFields(); }} icon={<FileTextOutlined />}>补录</Button>
              <Button onClick={() => { setActionModal({ type: 'delay' }); form.resetFields(); }} icon={<ClockCircleOutlined />}>标记拖延</Button>
              <Button type="primary" onClick={confirmComplete} icon={<CheckOutlined />}>完成并流转体检</Button>
            </Space>
          ) : null
        }
      >
        {current && (
          <div>
            {current.status !== 'pending' && current.remark && (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message={`上次处理说明`}
                description={current.remark}
              />
            )}
            {current.rejectReason && (
              <Alert type="error" showIcon style={{ marginBottom: 16 }} message="驳回原因" description={current.rejectReason} />
            )}
            {current.supplementNote && (
              <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="补录说明" description={current.supplementNote} />
            )}
            {current.delayHours && (
              <Alert type="warning" showIcon style={{ marginBottom: 16 }} message={`拖延时长：${current.delayHours} 小时`} description={current.remark} />
            )}

            <div className="flow-line">
              <div className={`flow-step ${['completed'].includes(current.status) ? 'done' : current.status === 'pending' ? 'active' : ''}`}>
                <FileTextOutlined /> 提交资料
              </div>
              <div className="flow-arrow">→</div>
              <div className={`flow-step ${current.status === 'completed' ? 'active' : ''}`}>
                <MedicineBoxOutlined /> 体检核验
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">🚗 训练安排</div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">📋 考试</div>
            </div>

            <Descriptions title="学员信息" column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="编号" span={2}>{current.id}</Descriptions.Item>
              <Descriptions.Item label="姓名">{current.studentName}</Descriptions.Item>
              <Descriptions.Item label="手机号">{current.phone}</Descriptions.Item>
              <Descriptions.Item label="身份证号" span={2}><span style={{ fontFamily: 'monospace' }}>{current.idCard}</span></Descriptions.Item>
              <Descriptions.Item label="地址" span={2}>{current.address}</Descriptions.Item>
              <Descriptions.Item label="报名员">{current.registrarName}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={registrationStatusMap[current.status].color}>{registrationStatusMap[current.status].label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>{formatDateTime(current.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="更新时间" span={2}>{formatDateTime(current.updatedAt)}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: 16 }}>
              <h3 className="section-title"><FileTextOutlined /> 资料清单</h3>
              <Form form={docForm} layout="vertical">
                <Form.Item
                  name="docs"
                  label="已收到资料（勾选后保存）"
                  rules={[{ required: true, message: '请至少勾选一项，或使用驳回功能' }]}
                >
                  <Checkbox.Group>
                    <Space direction="vertical">
                      {current.docs.map(d => (
                        <div key={d.id} style={{ padding: 8, background: '#fafafa', borderRadius: 4, width: '100%' }}>
                          <Checkbox value={d.id}>
                            <strong>{d.name}</strong>
                            {d.submitted ? (
                              <Tag color="success" style={{ marginLeft: 8 }}>已提交</Tag>
                            ) : (
                              <Tag color="warning" style={{ marginLeft: 8 }}>缺 / 不合格</Tag>
                            )}
                          </Checkbox>
                          {d.note && <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4, paddingLeft: 24 }}>备注：{d.note}</div>}
                        </div>
                      ))}
                    </Space>
                  </Checkbox.Group>
                </Form.Item>
                <Form.Item name="remark" label="备注说明">
                  <Input.TextArea rows={2} placeholder="填写处理备注（保存后可见）" />
                </Form.Item>
                {(current.status === 'pending' || current.status === 'delayed' || current.status === 'supplement') && (
                  <Form.Item>
                    <Button icon={<FileTextOutlined />} onClick={handleSaveDocs}>保存资料状态</Button>
                  </Form.Item>
                )}
              </Form>
            </div>

            {physicalInfo(current.id) && (
              <>
                <Divider />
                <h3 className="section-title"><MedicineBoxOutlined /> 体检环节信息</h3>
                {(() => {
                  const p = physicalInfo(current.id);
                  const rMap = responsibilityMap;
                  return (
                    <div>
                      <Row gutter={[12, 12]}>
                        <Col xs={12}><div style={{ padding: 12, background: '#fafafa', borderRadius: 6 }}><div style={{ color: '#8c8c8c', fontSize: 12 }}>体检状态</div><Tag color={physicalStatusMap[p.status].color}>{physicalStatusMap[p.status].label}</Tag></div></Col>
                        <Col xs={12}><div style={{ padding: 12, background: '#fafafa', borderRadius: 6 }}><div style={{ color: '#8c8c8c', fontSize: 12 }}>体检员</div><strong>{p.examiner || '—'}</strong></div></Col>
                        <Col xs={24}><div style={{ padding: 12, background: '#fafafa', borderRadius: 6 }}><div style={{ color: '#8c8c8c', fontSize: 12 }}>体检时间</div><strong>{formatDateTime(p.checkedAt)}</strong></div></Col>
                      </Row>
                      {p.responsibilityMark !== 'none' && (
                        <div
                          className={`responsibility-banner ${p.responsibilityMark}`}
                          style={{ marginTop: 16 }}
                        >
                          <div className="title">
                            <WarningOutlined style={{ marginRight: 6 }} />
                            责任归属已标记：{rMap[p.responsibilityMark].label}
                          </div>
                          <div className="note">{p.responsibilityNote}</div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        title={
          actionModal?.type === 'complete' ? '确认完成报名并流转体检' :
          actionModal?.type === 'reject' ? '驳回报名资料' :
          actionModal?.type === 'supplement' ? '标记为补录中' :
          actionModal?.type === 'delay' ? '标记为拖延' : ''
        }
        open={!!actionModal}
        onCancel={() => { setActionModal(null); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="确认"
        cancelText="取消"
        okButtonProps={actionModal?.type === 'reject' ? { danger: true } : { type: 'primary' }}
      >
        {actionModal && (
          <Form form={form} layout="vertical" onFinish={handleStatusChange}>
            {actionModal.type === 'complete' && (
              <Alert
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
                message="确认后系统将自动流转至体检环节"
                description="体检侧会立刻看到此学员待体检，无需另外发消息通知。"
              />
            )}
            {actionModal.type === 'complete' && (
              <Form.Item name="remark" label="流转备注">
                <Input.TextArea rows={3} placeholder="说明资料情况，体检侧可见" />
              </Form.Item>
            )}
            {actionModal.type === 'reject' && (
              <Form.Item name="rejectReason" label="驳回原因" rules={[{ required: true, message: '请填写驳回原因' }]}>
                <Input.TextArea rows={4} placeholder="详细说明哪些资料不符合要求，学员需要如何补充" />
              </Form.Item>
            )}
            {actionModal.type === 'supplement' && (
              <Form.Item name="supplementNote" label="补录说明" rules={[{ required: true, message: '请填写补录说明' }]}>
                <Input.TextArea rows={4} placeholder="说明需要补录的资料和预计补录时间" />
              </Form.Item>
            )}
            {actionModal.type === 'delay' && (
              <>
                <Form.Item name="delayHours" label="拖延时长（小时）" rules={[{ required: true, message: '请输入拖延时长' }]}>
                  <InputNumber min={1} max={720} style={{ width: '100%' }} placeholder="例如：48" />
                </Form.Item>
                <Form.Item name="remark" label="拖延原因说明" rules={[{ required: true, message: '请填写原因' }]}>
                  <Input.TextArea rows={3} placeholder="说明拖延原因和学员承诺补资料的时间" />
                </Form.Item>
              </>
            )}
          </Form>
        )}
      </Modal>
    </div>
  );
}
