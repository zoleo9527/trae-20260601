import { useEffect, useState } from 'react';
import {
  Card, Table, Tag, Button, Space, Input, Select, Drawer, Descriptions, Divider,
  Form, InputNumber, Radio, Alert, App, Row, Col, Statistic, Tooltip, Modal,
} from 'antd';
import {
  SearchOutlined,
  MedicineBoxOutlined,
  EyeOutlined,
  EditOutlined,
  CheckOutlined,
  WarningOutlined,
  SafetyOutlined,
  FileTextOutlined,
  UserOutlined,
  HomeOutlined,
  HistoryOutlined,
  FlagOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import type { Role, PhysicalCheck, PhysicalStatus, Registration, ResponsibilityMark } from 'shared';
import {
  getPhysicals,
  getRegistrations,
  submitPhysical,
  markResponsibility,
  getPhysical,
  getRegistration,
} from '../api';
import { useUserStore, getRoleDefaultUser } from '../store/user';
import {
  physicalStatusMap,
  registrationStatusMap,
  responsibilityMap,
  formatDateTime,
} from '../utils/constants';

interface Props {
  role: Role;
}

const statusFiltersForCoach: { label: string; value: PhysicalStatus | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '待体检', value: 'pending' },
  { label: '已通过', value: 'passed' },
  { label: '待复核', value: 'review' },
  { label: '需重检', value: 'recheck' },
  { label: '未通过', value: 'failed' },
];

const statusFiltersForSafety = [...statusFiltersForCoach];

export default function Physicals({ role }: Props) {
  const currentUser = useUserStore((s) => s.currentUser);
  const { message, modal } = App.useApp();

  const [list, setList] = useState<PhysicalCheck[]>([]);
  const [filtered, setFiltered] = useState<PhysicalCheck[]>([]);
  const [regMap, setRegMap] = useState<Record<string, Registration>>({});
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<PhysicalStatus | 'all'>('all');

  const [detailOpen, setDetailOpen] = useState(false);
  const [current, setCurrent] = useState<PhysicalCheck | null>(null);
  const [currentReg, setCurrentReg] = useState<Registration | null>(null);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const [historyList, setHistoryList] = useState<PhysicalCheck[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [respModalOpen, setRespModalOpen] = useState(false);
  const [respForm] = Form.useForm();

  const isCoach = role === 'fieldCoach';
  const isSafety = role === 'safetyOfficer';

  useEffect(() => { loadAll(); }, [role]);

  useEffect(() => {
    let f = list;
    if (statusFilter !== 'all') f = f.filter(p => p.status === statusFilter);
    if (keyword) {
      const kw = keyword.toLowerCase();
      f = f.filter(p =>
        p.studentName.toLowerCase().includes(kw) ||
        p.id.toLowerCase().includes(kw) ||
        p.registrationId.toLowerCase().includes(kw)
      );
    }
    setFiltered(f);
  }, [list, keyword, statusFilter]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [phys, regs] = await Promise.all([getPhysicals(), getRegistrations()]);
      setList(phys);
      const m: Record<string, Registration> = {};
      regs.forEach(r => { m[r.id] = r; });
      setRegMap(m);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (p: PhysicalCheck, editMode = false) => {
    try {
      const [freshP, reg] = await Promise.all([getPhysical(p.id), getRegistration(p.registrationId)]);
      setCurrent(freshP);
      setCurrentReg(reg);
      setEditing(editMode);
      form.setFieldsValue({
        eyesightLeft: freshP.eyesightLeft,
        eyesightRight: freshP.eyesightRight,
        hearing: freshP.hearing,
        bloodPressure: freshP.bloodPressure,
        heartRate: freshP.heartRate,
        height: freshP.height,
        limbsCheck: freshP.limbsCheck,
        medicalHistory: freshP.medicalHistory,
        status: freshP.status !== 'pending' ? freshP.status : undefined,
        reviewNote: freshP.reviewNote,
        recheckNote: freshP.recheckNote,
      });
      setDetailOpen(true);
    } catch (e: any) {
      message.error(e.message || '加载失败');
    }
  };

  const loadHistory = async () => {
    if (!current) return;
    try {
      const all = await getPhysicals({ registrationId: current.registrationId });
      setHistoryList(all);
      setHistoryOpen(true);
    } catch {}
  };

  const handleSubmit = async (values: any) => {
    if (!current) return;
    try {
      const status: PhysicalStatus = values.status || 'passed';
      await submitPhysical(current.id, {
        ...current,
        ...values,
        status,
        examiner: currentUser,
        examinerRole: role,
      });
      message.success(`体检${physicalStatusMap[status].label}，已同步到系统`);
      setDetailOpen(false);
      setEditing(false);
      form.resetFields();
      loadAll();
    } catch (e: any) {
      message.error(e.message || '提交失败');
    }
  };

  const openRespModal = () => {
    if (!current) return;
    respForm.setFieldsValue({
      mark: current.responsibilityMark,
      note: current.responsibilityNote,
    });
    setRespModalOpen(true);
  };

  const handleSaveResp = async () => {
    if (!current) return;
    const values = await respForm.validateFields();
    try {
      await markResponsibility(current.id, values);
      message.success('责任归属已标记');
      setRespModalOpen(false);
      openDetail(current, editing);
      loadAll();
    } catch (e: any) {
      message.error(e.message || '保存失败');
    }
  };

  const confirmReview = () => {
    if (!current) return;
    modal.confirm({
      title: isSafety ? '确认复核通过？' : '确认提交待复核？',
      content: isSafety
        ? '作为安全员，你确认此案例的最终复核结果，完成后将不能再修改体检状态。'
        : '此案例存在临界项，提交后将流转给安全员进行最终复核，责任归属建议标记清楚。',
      okText: '确认提交',
      onOk: () => {
        form.setFieldsValue({ status: isSafety ? 'passed' : 'review' });
        form.submit();
      },
    });
  };

  const pendingCount = list.filter(p => p.status === 'pending').length;
  const reviewCount = list.filter(p => p.status === 'review').length;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {pendingCount > 0 && isCoach && (
        <Alert
          type="success"
          showIcon
          icon={<ArrowRightOutlined />}
          style={{ marginBottom: 16 }}
          message={`${pendingCount} 名学员已完成报名，自动流转到体检环节`}
          description={`报名资料完成后系统自动流转，无需报名员另外发消息。点击「编辑」可开始体检核验。`}
        />
      )}
      {reviewCount > 0 && isSafety && (
        <Alert
          type="warning"
          showIcon
          icon={<SafetyOutlined />}
          style={{ marginBottom: 16 }}
          message={`${reviewCount} 个体检案例待复核`}
          description="场地教练提交的临界案例需要你最终确认，复核后请明确标记责任归属。"
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="待处理" value={pendingCount} prefix={<MedicineBoxOutlined />} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="已通过" value={list.filter(p => p.status === 'passed').length} valueStyle={{ color: '#52c41a' }} prefix={<CheckOutlined />} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="待复核" value={reviewCount} valueStyle={{ color: '#faad14' }} prefix={<SafetyOutlined />} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="未通过/重检" value={list.filter(p => p.status === 'failed' || p.status === 'recheck').length} valueStyle={{ color: '#ff4d4f' }} prefix={<WarningOutlined />} /></Card>
        </Col>
      </Row>

      <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
        <Space wrap>
          <Input allowClear prefix={<SearchOutlined />} placeholder="搜索学员姓名/编号" style={{ width: 260 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <Select
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={(isCoach ? statusFiltersForCoach : statusFiltersForSafety).map(f => ({ label: f.label, value: f.value }))}
          />
          <Button type="primary" onClick={loadAll}>刷新</Button>
          <div style={{ flex: 1 }} />
          <span style={{ color: '#8c8c8c', fontSize: 13 }}>共 {filtered.length} 条记录</span>
        </Space>
      </Card>

      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 8 }}>
        <Table<PhysicalCheck>
          rowKey="id"
          loading={loading}
          dataSource={filtered}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1100 }}
          columns={[
            {
              title: '编号', dataIndex: 'id', width: 140, fixed: 'left',
              render: (v, r) => (
                <div>
                  <div style={{ color: '#8c8c8c', fontSize: 12, fontFamily: 'monospace' }}>{v}</div>
                  <Tooltip title="来源报名编号">
                    <div style={{ color: '#bfbfbf', fontSize: 11, fontFamily: 'monospace' }}>← {r.registrationId}</div>
                  </Tooltip>
                </div>
              ),
            },
            { title: '学员姓名', dataIndex: 'studentName', width: 100, fixed: 'left' },
            {
              title: '报名资料状态', width: 110,
              render: (_, r) => {
                const reg = regMap[r.registrationId];
                if (!reg) return <span style={{ color: '#bfbfbf' }}>—</span>;
                const info = registrationStatusMap[reg.status];
                return <Tag color={info.color}>{info.label}</Tag>;
              },
            },
            {
              title: '视力 (左/右)', width: 110,
              render: (_, r) => (r.eyesightLeft != null || r.eyesightRight != null)
                ? <span>{r.eyesightLeft ?? '—'} / {r.eyesightRight ?? '—'}</span>
                : <span style={{ color: '#bfbfbf' }}>未测</span>,
            },
            {
              title: '血压/心率', width: 130,
              render: (_, r) => (r.bloodPressure || r.heartRate)
                ? <span>{r.bloodPressure || '—'} · {r.heartRate ? r.heartRate + '次' : '—'}</span>
                : <span style={{ color: '#bfbfbf' }}>未测</span>,
            },
            {
              title: '体检状态', dataIndex: 'status', width: 100,
              render: (v) => {
                const info = physicalStatusMap[v];
                return <Tag color={info.color}>{info.label}</Tag>;
              },
            },
            {
              title: '责任归属', width: 110,
              render: (_, r) => {
                if (r.responsibilityMark === 'none') return <span style={{ color: '#bfbfbf' }}>—</span>;
                const info = responsibilityMap[r.responsibilityMark];
                return (
                  <Tooltip title={r.responsibilityNote}>
                    <Tag color={info.color} icon={<FlagOutlined />}>{info.label}</Tag>
                  </Tooltip>
                );
              },
            },
            { title: '体检员', dataIndex: 'examiner', width: 90, render: (v) => v || '—' },
            {
              title: '体检时间', dataIndex: 'checkedAt', width: 150,
              render: (v) => v ? <span style={{ fontSize: 12, color: '#8c8c8c' }}>{formatDateTime(v)}</span> : <span style={{ color: '#bfbfbf' }}>未体检</span>,
            },
            {
              title: '操作', width: 210, fixed: 'right',
              render: (_, r) => (
                <Space size="small">
                  <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(r, false)}>查看</Button>
                  <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => { setCurrent(r); loadHistory(); }}>回看</Button>
                  {(isCoach && (r.status === 'pending' || r.status === 'recheck')) && (
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openDetail(r, true)}>核验</Button>
                  )}
                  {(isSafety && r.status === 'review') && (
                    <Button type="link" size="small" icon={<SafetyOutlined />} onClick={() => openDetail(r, true)}>复核</Button>
                  )}
                  {(r.status !== 'pending') && (isSafety || r.examiner === currentUser) && (
                    <Button type="link" size="small" icon={<FlagOutlined />} onClick={() => { setCurrent(r); openRespModal(); }}>责</Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span><MedicineBoxOutlined /> 体检核验详情</span>
            {current && (
              <Tag color={physicalStatusMap[current.status].color}>{physicalStatusMap[current.status].label}</Tag>
            )}
            {current?.responsibilityMark !== 'none' && current && (
              <Tag color={responsibilityMap[current.responsibilityMark].color} icon={<FlagOutlined />}>
                {responsibilityMap[current.responsibilityMark].label}
              </Tag>
            )}
          </div>
        }
        placement="right"
        open={detailOpen}
        width={760}
        onClose={() => { setDetailOpen(false); setEditing(false); form.resetFields(); }}
        extra={
          current && (
            <Space>
              <Button icon={<HistoryOutlined />} onClick={loadHistory}>体检回看</Button>
              {(current.status !== 'pending') && (isSafety || current.examiner === currentUser) && (
                <Button icon={<FlagOutlined />} onClick={openRespModal}>标记责任</Button>
              )}
              {editing ? (
                <>
                  <Button onClick={() => setEditing(false)}>取消编辑</Button>
                  <Button type="primary" onClick={() => form.submit()}>提交体检结果</Button>
                </>
              ) : (
                (isCoach && (current.status === 'pending' || current.status === 'recheck')) ||
                (isSafety && current.status === 'review') ? (
                  <Button type="primary" icon={<EditOutlined />} onClick={() => setEditing(true)}>
                    {isSafety ? '开始复核' : '开始体检核验'}
                  </Button>
                ) : null
              )}
            </Space>
          )
        }
      >
        {current && currentReg && (
          <div>
            {current.responsibilityMark !== 'none' && (
              <div className={`responsibility-banner ${current.responsibilityMark}`}>
                <div className="title"><WarningOutlined style={{ marginRight: 6 }} /> 责任归属：{responsibilityMap[current.responsibilityMark].label}</div>
                <div className="note">{current.responsibilityNote}</div>
              </div>
            )}

            {editing && (current.status === 'pending' || current.status === 'recheck') && currentReg.status !== 'completed' && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="⚠️ 报名资料尚未标记为『完成』"
                description={`当前报名状态为「${registrationStatusMap[currentReg.status].label}」，若继续体检，系统将自动在责任归属中建议标记「报名员责任（提前流转）」。`}
              />
            )}

            <div className="flow-line">
              <div className={`flow-step ${currentReg.status === 'completed' ? 'done' : ''}`}>
                <FileTextOutlined /> 报名资料
                <Tag style={{ marginLeft: 6 }} color={registrationStatusMap[currentReg.status].color}>
                  {registrationStatusMap[currentReg.status].label}
                </Tag>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step active">
                <MedicineBoxOutlined /> 体检核验
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">🏍️ 训练场</div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">📋 考试</div>
            </div>

            <Row gutter={16}>
              <Col xs={24} md={14}>
                <Descriptions title="学员信息" column={2} size="small" bordered style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="体检编号" span={2}>{current.id}</Descriptions.Item>
                  <Descriptions.Item label="姓名" span={2}><UserOutlined /> {current.studentName}</Descriptions.Item>
                  <Descriptions.Item label="手机号" span={2}>{currentReg.phone}</Descriptions.Item>
                  <Descriptions.Item label="身份证" span={2}><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{currentReg.idCard}</span></Descriptions.Item>
                  <Descriptions.Item label="地址" span={2}><HomeOutlined /> {currentReg.address}</Descriptions.Item>
                  <Descriptions.Item label="报名员">{currentReg.registrarName}</Descriptions.Item>
                  <Descriptions.Item label="体检员">{current.examiner || '—'}</Descriptions.Item>
                  <Descriptions.Item label="创建时间" span={2}>{formatDateTime(currentReg.createdAt)}</Descriptions.Item>
                  <Descriptions.Item label="体检时间" span={2}>{formatDateTime(current.checkedAt)}</Descriptions.Item>
                </Descriptions>
              </Col>
              <Col xs={24} md={10}>
                <Card size="small" title={<span><FileTextOutlined /> 报名备注</span>} style={{ marginBottom: 16 }}>
                  {currentReg.remark ? (
                    <div style={{ fontSize: 13, lineHeight: 1.8, color: '#595959' }}>{currentReg.remark}</div>
                  ) : (
                    <div style={{ color: '#bfbfbf' }}>无备注</div>
                  )}
                  {currentReg.status === 'supplement' && currentReg.supplementNote && (
                    <Alert style={{ marginTop: 12 }} type="warning" size="small" showIcon message="补录说明" description={currentReg.supplementNote} />
                  )}
                  {currentReg.status === 'delayed' && (
                    <Alert style={{ marginTop: 12 }} type="warning" size="small" showIcon message={`拖延 ${currentReg.delayHours} 小时`} description={currentReg.remark} />
                  )}
                </Card>
              </Col>
            </Row>

            <Divider orientation="left"><MedicineBoxOutlined /> 体检项目{editing && '（可编辑）'}</Divider>

            {!editing ? (
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="左眼视力">{current.eyesightLeft != null ? current.eyesightLeft : '—'}</Descriptions.Item>
                <Descriptions.Item label="右眼视力">{current.eyesightRight != null ? current.eyesightRight : '—'}</Descriptions.Item>
                <Descriptions.Item label="听力">
                  {current.hearing ? (current.hearing === 'normal' ? <Tag color="success">正常</Tag> : <Tag color="error">异常</Tag>) : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="血压">{current.bloodPressure || '—'}</Descriptions.Item>
                <Descriptions.Item label="心率">{current.heartRate != null ? current.heartRate + ' 次/分' : '—'}</Descriptions.Item>
                <Descriptions.Item label="身高">{current.height != null ? current.height + ' cm' : '—'}</Descriptions.Item>
                <Descriptions.Item label="肢体检查" span={2}>
                  {current.limbsCheck ? (current.limbsCheck === 'normal' ? <Tag color="success">正常</Tag> : <Tag color="error">异常</Tag>) : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="既往病史" span={2}>{current.medicalHistory || '无'}</Descriptions.Item>
                {current.reviewNote && <Descriptions.Item label="复核说明" span={2}><span style={{ color: '#faad14' }}>{current.reviewNote}</span></Descriptions.Item>}
                {current.recheckNote && <Descriptions.Item label="重检建议" span={2}><span style={{ color: '#fa8c16' }}>{current.recheckNote}</span></Descriptions.Item>}
              </Descriptions>
            ) : (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{ hearing: current.hearing, limbsCheck: current.limbsCheck }}
              >
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="eyesightLeft" label="左眼视力" rules={[{ required: true, message: '请输入' }]}>
                      <InputNumber min={3.0} max={5.3} step={0.1} style={{ width: '100%' }} placeholder="例如 5.0" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="eyesightRight" label="右眼视力" rules={[{ required: true, message: '请输入' }]}>
                      <InputNumber min={3.0} max={5.3} step={0.1} style={{ width: '100%' }} placeholder="例如 5.0" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="hearing" label="听力" rules={[{ required: true, message: '请选择' }]}>
                      <Radio.Group options={[{ label: '正常', value: 'normal' }, { label: '异常', value: 'abnormal' }]} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="limbsCheck" label="肢体检查" rules={[{ required: true, message: '请选择' }]}>
                      <Radio.Group options={[{ label: '正常', value: 'normal' }, { label: '异常', value: 'abnormal' }]} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="bloodPressure" label="血压" rules={[{ required: true, message: '请输入' }]}>
                      <Input placeholder="例如 120/80" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="heartRate" label="心率（次/分）" rules={[{ required: true, message: '请输入' }]}>
                      <InputNumber min={30} max={200} style={{ width: '100%' }} placeholder="例如 72" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="height" label="身高（cm）" rules={[{ required: true, message: '请输入' }]}>
                      <InputNumber min={100} max={230} style={{ width: '100%' }} placeholder="例如 170" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="medicalHistory" label="既往病史">
                  <Input.TextArea rows={2} placeholder="填写高血压、心脏病、癫痫等病史，无则填『无』" />
                </Form.Item>

                <Divider orientation="left" plain style={{ paddingTop: 8 }}>体检结论</Divider>

                <Form.Item name="status" label="体检结果" rules={[{ required: true, message: '请选择结论' }]}>
                  <Radio.Group>
                    <Space direction="vertical">
                      <Radio value="passed"><Tag color="success">通过</Tag> - 各项指标正常</Radio>
                      <Radio value="review"><Tag color="warning">待安全员复核</Tag> - 临界项（视力/血压等接近标准）</Radio>
                      <Radio value="recheck"><Tag color="orange">需重检</Tag> - 需去医院进一步检查或复查</Radio>
                      <Radio value="failed"><Tag color="error">未通过</Tag> - 明显不合格项</Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item>

                <Form.Item noStyle shouldUpdate={(prev, cur) => prev.status !== cur.status}>
                  {({ getFieldValue }) => {
                    const s = getFieldValue('status');
                    if (s === 'review') {
                      return (
                        <Form.Item name="reviewNote" label="复核说明（必填）" rules={[{ required: true, message: '请详细说明哪些临界项，供安全员判断' }]}>
                          <Input.TextArea rows={3} placeholder="例如：左眼视力4.6接近临界值，血压140/90临界高值，需安全员确认是否通过。" />
                        </Form.Item>
                      );
                    }
                    if (s === 'recheck') {
                      return (
                        <Form.Item name="recheckNote" label="重检建议（必填）" rules={[{ required: true, message: '请填写重检要求' }]}>
                          <Input.TextArea rows={3} placeholder="例如：听力异常，需到指定医院做纯音测听后复诊。" />
                        </Form.Item>
                      );
                    }
                    if (s === 'failed') {
                      return (
                        <Form.Item name="reviewNote" label="不合格说明（必填）" rules={[{ required: true, message: '请填写原因' }]}>
                          <Input.TextArea rows={3} placeholder="说明不合格的具体项目和原因。" />
                        </Form.Item>
                      );
                    }
                    return null;
                  }}
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button onClick={() => setEditing(false)}>取消</Button>
                    <Button onClick={() => {
                      const s = form.getFieldValue('status');
                      if (s === 'review' || s === 'passed' && isSafety) {
                        confirmReview();
                      } else {
                        form.submit();
                      }
                    }} type="primary">提交结论</Button>
                    <Tooltip title="提交后如发现责任归属不清，可点击右上角『标记责任'补充记录">
                      <Tag color="blue" style={{ borderStyle: 'dashed' }}>
                        <FlagOutlined /> 提示：记得标记责任
                      </Tag>
                    </Tooltip>
                  </Space>
                </Form.Item>
              </Form>
            )}
          </div>
        )}
      </Drawer>

      <Drawer
        title={<span><HistoryOutlined /> 体检核验回看 · {current?.studentName}</span>}
        placement="right"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        width={640}
      >
        {historyList.length === 0 ? (
          <div style={{ color: '#8c8c8c' }}>暂无记录</div>
        ) : (
          historyList.map((p, idx) => (
            <div
              key={p.id}
              style={{
                padding: 16,
                marginBottom: 12,
                borderRadius: 8,
                border: '1px solid #f0f0f0',
                background: idx === 0 ? '#f6ffed' : '#fff',
                position: 'relative',
              }}
            >
              {idx === 0 && <Tag color="success" style={{ position: 'absolute', top: 12, right: 12 }}>最新</Tag>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Tag color={physicalStatusMap[p.status].color}>{physicalStatusMap[p.status].label}</Tag>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                  {p.examiner && `${p.examiner} · `}{formatDateTime(p.checkedAt || p.id.replace('P', '20'))}
                </span>
              </div>
              <Row gutter={[12, 8]} style={{ fontSize: 13 }}>
                <Col xs={12}><span style={{ color: '#8c8c8c' }}>视力：</span>{p.eyesightLeft ?? '—'} / {p.eyesightRight ?? '—'}</Col>
                <Col xs={12}><span style={{ color: '#8c8c8c' }}>听力：</span>{p.hearing ? (p.hearing === 'normal' ? '正常' : '异常') : '—'}</Col>
                <Col xs={12}><span style={{ color: '#8c8c8c' }}>血压：</span>{p.bloodPressure || '—'}</Col>
                <Col xs={12}><span style={{ color: '#8c8c8c' }}>心率：</span>{p.heartRate ?? '—'} 次/分</Col>
                <Col xs={12}><span style={{ color: '#8c8c8c' }}>身高：</span>{p.height ?? '—'} cm</Col>
                <Col xs={12}><span style={{ color: '#8c8c8c' }}>肢体：</span>{p.limbsCheck ? (p.limbsCheck === 'normal' ? '正常' : '异常') : '—'}</Col>
                <Col xs={24}><span style={{ color: '#8c8c8c' }}>病史：</span>{p.medicalHistory || '无'}</Col>
              </Row>
              {p.reviewNote && <Alert style={{ marginTop: 8 }} type="warning" size="small" showIcon message="复核说明" description={p.reviewNote} />}
              {p.recheckNote && <Alert style={{ marginTop: 8 }} type="warning" size="small" showIcon message="重检建议" description={p.recheckNote} />}
              {p.responsibilityMark !== 'none' && (
                <div className={`responsibility-banner ${p.responsibilityMark}`} style={{ marginTop: 8 }}>
                  <div className="title">责任：{responsibilityMap[p.responsibilityMark].label}</div>
                  <div className="note">{p.responsibilityNote}</div>
                </div>
              )}
            </div>
          ))
        )}
      </Drawer>

      <Modal
        title={<span><FlagOutlined /> 标记责任归属（界定报名/体检责任不清）</span>}
        open={respModalOpen}
        onCancel={() => setRespModalOpen(false)}
        onOk={handleSaveResp}
        okText="保存标记"
        width={620}
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="用于交班时快速界定责任"
          description="当报名资料和体检环节存在争议时，提前标记清楚，避免交班时说不清。标记后所有人可见。"
        />
        <Form form={respForm} layout="vertical">
          <Form.Item
            name="mark"
            label="责任类型"
            rules={[{ required: true, message: '请选择' }]}
          >
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="none"><Tag color="default">无争议</Tag> - 流程顺畅，无任何问题</Radio>
                <Radio value="registrar_issue"><Tag color="processing">报名员责任</Tag> - 资料不全/错误流转/信息缺失</Radio>
                <Radio value="coach_issue"><Tag color="success">教练责任</Tag> - 体检遗漏/未及时记录/操作不当</Radio>
                <Radio value="borderline"><Tag color="warning">边界不清</Tag> - 双方都有一定责任，需共同确认</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="note"
            label="详细说明（交班时直接看到，必填）"
            rules={[{ required: true, message: '请详细说明责任归属原因' }]}
          >
            <Input.TextArea rows={4} placeholder="例如：报名员未提前告知学员矫正视力要求，体检时才发现视力不达标；教练未及时提醒学员去配眼镜，导致流程拖延2天。" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
