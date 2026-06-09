import { useState } from 'react'
import {
  Table, Button, Modal, Descriptions, Tag, Tabs, Card, Space, Select, Timeline, Typography, Divider, List, Form, Input, DatePicker, message, Alert,
} from 'antd'
import { HistoryOutlined, EyeOutlined, LinkOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { v4 as uuid } from 'uuid'
import { useAppStore } from '@/store/useAppStore'
import AssessmentEvidence from '@/components/AssessmentEvidence'
import type { Prescription, RehabGoal, TreatmentPlanItem } from '@/types'

const { Paragraph, Text } = Typography

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  pending_review: { label: '待审核', color: 'orange' },
  approved: { label: '已审核', color: 'green' },
  adjusted: { label: '已调整', color: 'blue' },
  archived: { label: '已归档', color: 'default' },
}

const PRIORITY_COLOR: Record<string, string> = { high: 'red', medium: 'orange', low: 'blue' }
const PRIORITY_LABEL: Record<string, string> = { high: '高', medium: '中', low: '低' }

const TREATMENT_TYPES = [
  '关节活动度训练', '肌力训练', '本体感觉训练', '平衡训练',
  '步态训练', '力量训练', '功能训练', '物理因子',
  '核心稳定训练', '姿势管理', '牵伸训练', '特异性侧弯体操(SSE)', '安全策略', '其他',
]

function GoalsPlanChain({ goals, treatmentPlan }: { goals: RehabGoal[]; treatmentPlan: TreatmentPlanItem[] }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <Card size="small" title="🎯 康复目标" style={{ flex: 1, borderLeft: '4px solid #52c41a', minWidth: 0 }}>
        <List
          size="small"
          dataSource={goals}
          renderItem={(g, idx) => (
            <List.Item style={{ padding: '6px 0', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', width: '100%' }}>
                <Tag color={PRIORITY_COLOR[g.priority]} style={{ marginTop: 2 }}>{PRIORITY_LABEL[g.priority]}</Tag>
                <div style={{ flex: 1 }}>
                  <div><Text strong>{g.description}</Text></div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                    指标: {g.measurable} | 目标: {g.targetDate}
                  </div>
                  {treatmentPlan.length > 0 && idx < treatmentPlan.length && (
                    <div style={{ marginTop: 4, paddingLeft: 8, borderLeft: '2px solid #d9d9d9' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>→ 对应治疗:</Text>
                      <Tag color="purple" style={{ marginLeft: 4, fontSize: 11 }}>{treatmentPlan[idx].type} - {treatmentPlan[idx].name}</Tag>
                    </div>
                  )}
                </div>
              </div>
            </List.Item>
          )}
        />
      </Card>

      <div style={{ display: 'flex', alignItems: 'center', fontSize: 24, color: '#52c41a', padding: '20px 0' }}>
        →
      </div>

      <Card size="small" title="💊 治疗计划" style={{ flex: 1, borderLeft: '4px solid #722ed1', minWidth: 0 }}>
        {treatmentPlan.map((tp) => (
          <div key={tp.id} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px dashed #eee' }}>
            <div>
              <Tag color="purple">{tp.type}</Tag>
              <Text strong>{tp.name}</Text>
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
              {tp.frequency} | {tp.duration} {tp.notes && `| ${tp.notes}`}
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}

export default function PrescriptionPage() {
  const { prescriptions, prescriptionHistory, patients, assessments, getPatientById, getAppointmentsByPrescription, therapists, addPrescription } = useAppStore()
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null)
  const [filterPatient, setFilterPatient] = useState<string | undefined>(undefined)
  const [createOpen, setCreateOpen] = useState(false)
  const [form] = Form.useForm()
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(undefined)

  const filtered = filterPatient
    ? prescriptions.filter((p) => p.patientId === filterPatient)
    : prescriptions

  const getAssessment = (id: string) => assessments.find((a) => a.id === id)

  const patientAssessments = selectedPatientId
    ? assessments.filter((a) => a.patientId === selectedPatientId)
    : []

  const columns = [
    {
      title: '患者', dataIndex: 'patientId', key: 'patient',
      render: (v: string) => getPatientById(v)?.name ?? v,
    },
    {
      title: '版本', dataIndex: 'version', key: 'version',
      render: (v: number) => `V${v}`,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (v: string) => <Tag color={STATUS_MAP[v]?.color}>{STATUS_MAP[v]?.label}</Tag>,
    },
    {
      title: '治疗师', dataIndex: 'therapistName', key: 'therapist',
    },
    {
      title: '目标数', dataIndex: 'goals', key: 'goals',
      render: (v: unknown[]) => v.length,
    },
    {
      title: '治疗项数', dataIndex: 'treatmentPlan', key: 'plan',
      render: (v: unknown[]) => v.length,
    },
    {
      title: '创建日期', dataIndex: 'createdAt', key: 'created',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '操作', key: 'action',
      render: (_: unknown, record: Prescription) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => setSelectedRx(record)}>详情</Button>
      ),
    },
  ]

  const handleCreate = () => {
    form.validateFields().then((values) => {
      const goals: RehabGoal[] = (values.goals ?? []).map((g: { description: string; targetDate: any; measurable: string; priority: string }) => ({
        id: `g${uuid().slice(0, 6)}`,
        description: g.description,
        targetDate: g.targetDate ? g.targetDate.format('YYYY-MM-DD') : '',
        measurable: g.measurable,
        priority: g.priority,
      }))
      const treatmentPlan: TreatmentPlanItem[] = (values.treatmentPlan ?? []).map((tp: { type: string; name: string; frequency: string; duration: string; notes: string }) => ({
        id: `tp${uuid().slice(0, 6)}`,
        type: tp.type,
        name: tp.name,
        frequency: tp.frequency,
        duration: tp.duration,
        notes: tp.notes ?? '',
      }))

      if (goals.length === 0) {
        form.setFields([{ name: 'goals', errors: ['至少添加1项康复目标'] }])
        return
      }
      if (treatmentPlan.length === 0) {
        form.setFields([{ name: 'treatmentPlan', errors: ['至少添加1项治疗项目'] }])
        return
      }

      const therapist = therapists.find((t) => t.id === values.therapistId)
      addPrescription({
        patientId: values.patientId,
        assessmentId: values.assessmentId,
        status: 'pending_review',
        therapistId: values.therapistId,
        therapistName: therapist?.name ?? '',
        goals,
        treatmentPlan,
        rationale: values.rationale,
      })
      form.resetFields()
      setSelectedPatientId(undefined)
      setCreateOpen(false)
      message.success('康复处方开具成功，已提交审核')
    }).catch(() => {})
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span>按患者筛选:</span>
          <Select
            allowClear
            placeholder="全部患者"
            style={{ width: 200 }}
            value={filterPatient}
            onChange={setFilterPatient}
            options={patients.map((p) => ({ value: p.id, label: p.name }))}
          />
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>开具处方</Button>
      </div>

      <Table columns={columns} dataSource={filtered} rowKey={(r) => `${r.id}-v${r.version}`} pagination={false} size="middle" />

      <Modal
        title="处方详情"
        open={!!selectedRx}
        onCancel={() => setSelectedRx(null)}
        footer={null}
        width={1100}
      >
        {selectedRx && (() => {
          const patient = getPatientById(selectedRx.patientId)
          const assessment = getAssessment(selectedRx.assessmentId)
          const relatedAppts = getAppointmentsByPrescription(selectedRx.id)
          const history = prescriptionHistory.filter((p) => p.id === selectedRx.id).sort((a, b) => a.version - b.version)

          return (
            <Tabs
              items={[
                {
                  key: 'chain',
                  label: '评估→目标→治疗 证据链',
                  children: (
                    <div>
                      <Alert
                        type="info"
                        message="证据链回看：评估量表评分 → 疼痛点 → 训练禁忌 → 康复目标 → 治疗计划，所有安排均有据可查"
                        style={{ marginBottom: 12 }}
                        showIcon
                      />

                      {assessment && <AssessmentEvidence assessment={assessment} />}

                      <Divider orientation="left" style={{ margin: '12px 0 8px' }}>评估 → 目标 → 治疗 串联</Divider>

                      <GoalsPlanChain goals={selectedRx.goals} treatmentPlan={selectedRx.treatmentPlan} />

                      <Divider orientation="left">处方依据（为什么这样安排）</Divider>
                      <Paragraph style={{ background: '#e6f7ff', padding: 12, borderRadius: 6, borderLeft: '4px solid #1890ff' }}>
                        {selectedRx.rationale}
                      </Paragraph>

                      {selectedRx.reviewComment && (
                        <>
                          <Divider orientation="left">审核/调整意见</Divider>
                          <Paragraph style={{ background: '#fff7e6', padding: 12, borderRadius: 6, borderLeft: '4px solid #faad14' }}>
                            {selectedRx.reviewerName} | {selectedRx.reviewedAt ? dayjs(selectedRx.reviewedAt).format('YYYY-MM-DD HH:mm') : ''}
                            <br />
                            {selectedRx.reviewComment}
                          </Paragraph>
                        </>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'basic',
                  label: '基本信息',
                  children: (
                    <Descriptions column={2} bordered size="small">
                      <Descriptions.Item label="患者">{patient?.name}</Descriptions.Item>
                      <Descriptions.Item label="版本">V{selectedRx.version}</Descriptions.Item>
                      <Descriptions.Item label="状态"><Tag color={STATUS_MAP[selectedRx.status]?.color}>{STATUS_MAP[selectedRx.status]?.label}</Tag></Descriptions.Item>
                      <Descriptions.Item label="治疗师">{selectedRx.therapistName}</Descriptions.Item>
                      <Descriptions.Item label="创建日期">{dayjs(selectedRx.createdAt).format('YYYY-MM-DD')}</Descriptions.Item>
                      {selectedRx.reviewerName && <Descriptions.Item label="审核人">{selectedRx.reviewerName}</Descriptions.Item>}
                    </Descriptions>
                  ),
                },
                {
                  key: 'history',
                  label: `版本历史(${history.length + 1})`,
                  children: (
                    <Timeline
                      items={[
                        ...history.map((h) => ({
                          color: 'gray' as const,
                          children: (
                            <Card size="small" title={<Space><HistoryOutlined />V{h.version} - 已归档</Space>}>
                              <Descriptions column={1} size="small">
                                <Descriptions.Item label="处方依据">{h.rationale}</Descriptions.Item>
                                <Descriptions.Item label="目标">{h.goals.map((g) => g.description).join('；')}</Descriptions.Item>
                                <Descriptions.Item label="治疗项目">{h.treatmentPlan.map((tp) => tp.name).join('；')}</Descriptions.Item>
                              </Descriptions>
                            </Card>
                          ),
                        })),
                        {
                          color: 'blue' as const,
                          children: (
                            <Card size="small" title={<Space><LinkOutlined />V{selectedRx.version} - 当前版本({STATUS_MAP[selectedRx.status]?.label})</Space>}>
                              <Descriptions column={1} size="small">
                                <Descriptions.Item label="处方依据">{selectedRx.rationale}</Descriptions.Item>
                                <Descriptions.Item label="目标">{selectedRx.goals.map((g) => g.description).join('；')}</Descriptions.Item>
                                <Descriptions.Item label="治疗项目">{selectedRx.treatmentPlan.map((tp) => tp.name).join('；')}</Descriptions.Item>
                              </Descriptions>
                            </Card>
                          ),
                        },
                      ]}
                    />
                  ),
                },
                {
                  key: 'appointments',
                  label: `排课引用(${relatedAppts.length})`,
                  children: relatedAppts.length ? (
                    <Table
                      dataSource={relatedAppts}
                      rowKey="id"
                      size="small"
                      pagination={false}
                      columns={[
                        { title: '日期', dataIndex: 'date', key: 'date' },
                        { title: '时段', dataIndex: 'timeSlot', key: 'timeSlot' },
                        { title: '治疗师', dataIndex: 'therapistName', key: 'therapistName' },
                        { title: '类型', dataIndex: 'type', key: 'type' },
                        { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => v === 'scheduled' ? '已排课' : v === 'completed' ? '已完成' : '已取消' },
                        { title: '备注', dataIndex: 'notes', key: 'notes' },
                      ]}
                    />
                  ) : <Text type="secondary">暂无排课引用</Text>,
                },
              ]}
            />
          )
        })()}
      </Modal>

      <Modal
        title="开具康复处方"
        open={createOpen}
        onOk={handleCreate}
        onCancel={() => { setCreateOpen(false); form.resetFields(); setSelectedPatientId(undefined) }}
        okText="提交处方"
        width={800}
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical">
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item name="patientId" label="患者" rules={[{ required: true, message: '请选择患者' }]} style={{ width: 240 }}>
              <Select
                showSearch placeholder="选择患者" optionFilterProp="label"
                onChange={(v: string) => { setSelectedPatientId(v); form.setFieldsValue({ assessmentId: undefined }) }}
                options={patients.map((p) => ({ value: p.id, label: `${p.name} - ${p.categoryLabel}` }))}
              />
            </Form.Item>
            <Form.Item name="assessmentId" label="关联评估" rules={[{ required: true, message: '请选择评估记录' }]} style={{ width: 320 }}>
              <Select
                placeholder={selectedPatientId ? '选择评估记录' : '请先选择患者'}
                disabled={!selectedPatientId}
                options={patientAssessments.map((a) => ({
                  value: a.id,
                  label: `${dayjs(a.date).format('YYYY-MM-DD')} ${a.therapistName} - ${a.chiefComplaint.slice(0, 20)}`,
                }))}
              />
            </Form.Item>
            <Form.Item name="therapistId" label="处方治疗师" rules={[{ required: true, message: '请选择治疗师' }]} style={{ width: 200 }}>
              <Select showSearch placeholder="选择治疗师" optionFilterProp="label"
                options={therapists.map((t) => ({ value: t.id, label: `${t.name}(${t.specialty})` }))}
              />
            </Form.Item>
          </Space>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.assessmentId !== cur.assessmentId}>
            {({ getFieldValue }) => {
              const aId = getFieldValue('assessmentId')
              const assessment = assessments.find((a) => a.id === aId)
              if (!assessment) return null
              return <AssessmentEvidence assessment={assessment} compact />
            }}
          </Form.Item>

          <Divider orientation="left" style={{ margin: '12px 0 8px' }}>康复目标 <Text type="danger" style={{ fontSize: 12 }}>（至少1项）</Text></Divider>
          <Form.List name="goals" rules={[{ validator: async (_, value) => { if (!value || value.length < 1) return Promise.reject(new Error('至少添加1项康复目标')) } }]}>
            {(fields, { add, remove }, { errors }) => (
              <>
                {errors.length > 0 && <div style={{ color: '#ff4d4f', fontSize: 14, marginBottom: 8, padding: '4px 0' }}>{errors[0]}</div>}
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8, flexWrap: 'wrap' }} align="baseline">
                    <Form.Item {...restField} name={[name, 'description']} rules={[{ required: true, message: '目标描述' }]}>
                      <Input placeholder="目标描述" style={{ width: 200 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'measurable']} rules={[{ required: true, message: '测量指标' }]}>
                      <Input placeholder="可测量指标" style={{ width: 140 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'targetDate']} rules={[{ required: true, message: '目标日期' }]}>
                      <DatePicker placeholder="目标日期" style={{ width: 140 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'priority']} rules={[{ required: true, message: '优先级' }]}>
                      <Select placeholder="优先级" style={{ width: 90 }}
                        options={[{ value: 'high', label: '高' }, { value: 'medium', label: '中' }, { value: 'low', label: '低' }]}
                      />
                    </Form.Item>
                    {fields.length > 1 && <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f' }} />}
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>添加康复目标</Button>
              </>
            )}
          </Form.List>

          <Divider orientation="left" style={{ margin: '12px 0 8px' }}>治疗计划 <Text type="danger" style={{ fontSize: 12 }}>（至少1项）</Text></Divider>
          <Form.List name="treatmentPlan" rules={[{ validator: async (_, value) => { if (!value || value.length < 1) return Promise.reject(new Error('至少添加1项治疗项目')) } }]}>
            {(fields, { add, remove }, { errors }) => (
              <>
                {errors.length > 0 && <div style={{ color: '#ff4d4f', fontSize: 14, marginBottom: 8, padding: '4px 0' }}>{errors[0]}</div>}
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8, flexWrap: 'wrap' }} align="baseline">
                    <Form.Item {...restField} name={[name, 'type']} rules={[{ required: true, message: '类型' }]}>
                      <Select placeholder="治疗类型" style={{ width: 130 }}
                        options={TREATMENT_TYPES.map((t) => ({ value: t, label: t }))}
                      />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'name']} rules={[{ required: true, message: '名称' }]}>
                      <Input placeholder="治疗名称" style={{ width: 180 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'frequency']} rules={[{ required: true, message: '频率' }]}>
                      <Input placeholder="频率" style={{ width: 100 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'duration']} rules={[{ required: true, message: '时长' }]}>
                      <Input placeholder="时长" style={{ width: 80 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'notes']}>
                      <Input placeholder="备注" style={{ width: 120 }} />
                    </Form.Item>
                    {fields.length > 1 && <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f' }} />}
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>添加治疗项目</Button>
              </>
            )}
          </Form.List>

          <Divider orientation="left" style={{ margin: '12px 0 8px' }}>处方依据</Divider>
          <Form.Item name="rationale" rules={[{ required: true, message: '请输入处方依据' }]}>
            <Input.TextArea rows={3} placeholder="基于评估结论，说明为什么这样设定目标和治疗计划" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
