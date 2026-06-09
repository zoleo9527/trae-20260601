import { useState } from 'react'
import {
  Table, Button, Modal, Descriptions, Tag, Tabs, Space, Select, Card, Typography, Divider, Progress, Form, Input, InputNumber, DatePicker, message,
} from 'antd'
import { PlusOutlined, MinusCircleOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { v4 as uuid } from 'uuid'
import { useAppStore } from '@/store/useAppStore'
import type { Assessment, PainPoint, Contraindication, ScaleItem } from '@/types'

const { Text, Paragraph } = Typography

const SEVERITY_COLOR = (s: number) => {
  if (s <= 3) return '#52c41a'
  if (s <= 6) return '#faad14'
  return '#ff4d4f'
}

export default function AssessmentPage() {
  const { assessments, patients, getPatientById, prescriptions, getAppointmentsByPrescription, therapists, addAssessment } = useAppStore()
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)
  const [filterPatient, setFilterPatient] = useState<string | undefined>(undefined)
  const [createOpen, setCreateOpen] = useState(false)
  const [form] = Form.useForm()

  const filteredAssessments = filterPatient
    ? assessments.filter((a) => a.patientId === filterPatient)
    : assessments

  const columns = [
    {
      title: '评估日期', dataIndex: 'date', key: 'date',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '患者', dataIndex: 'patientId', key: 'patient',
      render: (v: string) => getPatientById(v)?.name ?? v,
    },
    {
      title: '治疗师', dataIndex: 'therapistName', key: 'therapist',
    },
    {
      title: '主诉', dataIndex: 'chiefComplaint', key: 'complaint', ellipsis: true,
    },
    {
      title: '量表数', dataIndex: 'scales', key: 'scales',
      render: (v: unknown[]) => v.length,
    },
    {
      title: '痛痛点', dataIndex: 'painPoints', key: 'pain',
      render: (v: PainPoint[]) => (
        <Space>
          {v.map((p) => (
            <Tag key={p.id} color={SEVERITY_COLOR(p.severity)}>{p.region} {p.severity}/10</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '禁忌', dataIndex: 'contraindications', key: 'ci',
      render: (v: Contraindication[]) => v.map((c) => (
        <Tag key={c.id} color={c.type === 'absolute' ? 'red' : 'orange'}>{c.type === 'absolute' ? '绝对禁忌' : '相对禁忌'}</Tag>
      )),
    },
    {
      title: '操作', key: 'action',
      render: (_: unknown, record: Assessment) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => setSelectedAssessment(record)}>查看详情</Button>
      ),
    },
  ]

  const handleCreate = () => {
    form.validateFields().then((values) => {
      const scales: ScaleItem[] = (values.scales ?? []).map((s: { name: string; score: number; maxScore: number; interpretation: string }) => ({
        id: `s${uuid().slice(0, 6)}`,
        name: s.name,
        score: s.score,
        maxScore: s.maxScore,
        interpretation: s.interpretation,
      }))

      if (scales.length === 0) {
        form.setFields([{ name: 'scales', errors: ['至少添加1项评估量表'] }])
        return
      }

      const painPoints: PainPoint[] = (values.painPoints ?? []).map((p: { region: string; side: string; severity: number; nature: string; notes: string }) => ({
        id: `pp${uuid().slice(0, 6)}`,
        region: p.region,
        side: p.side,
        severity: p.severity,
        nature: p.nature,
        notes: p.notes ?? '',
      }))
      const contraindications: Contraindication[] = (values.contraindications ?? []).map((c: { type: string; description: string; reason: string }) => ({
        id: `ci${uuid().slice(0, 6)}`,
        type: c.type,
        description: c.description,
        reason: c.reason,
      }))

      const therapist = therapists.find((t) => t.id === values.therapistId)
      addAssessment({
        patientId: values.patientId,
        therapistId: values.therapistId,
        therapistName: therapist?.name ?? '',
        date: values.date.format('YYYY-MM-DD'),
        chiefComplaint: values.chiefComplaint,
        presentIllness: values.presentIllness ?? '',
        scales,
        painPoints,
        contraindications,
        conclusion: values.conclusion,
      })
      form.resetFields()
      setCreateOpen(false)
      message.success('评估记录创建成功')
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新建评估</Button>
      </div>

      <Table columns={columns} dataSource={filteredAssessments} rowKey="id" pagination={false} size="middle" />

      <Modal
        title="评估详情"
        open={!!selectedAssessment}
        onCancel={() => setSelectedAssessment(null)}
        footer={null}
        width={900}
      >
        {selectedAssessment && (() => {
          const patient = getPatientById(selectedAssessment.patientId)
          const relatedPrescriptions = prescriptions.filter((p) => p.assessmentId === selectedAssessment.id)
          return (
            <Tabs
              items={[
                {
                  key: 'overview',
                  label: '评估概要',
                  children: (
                    <>
                      <Descriptions column={2} bordered size="small">
                        <Descriptions.Item label="患者">{patient?.name}</Descriptions.Item>
                        <Descriptions.Item label="评估日期">{dayjs(selectedAssessment.date).format('YYYY-MM-DD')}</Descriptions.Item>
                        <Descriptions.Item label="治疗师">{selectedAssessment.therapistName}</Descriptions.Item>
                        <Descriptions.Item label="诊断">{patient?.diagnosis}</Descriptions.Item>
                        <Descriptions.Item label="主诉" span={2}>{selectedAssessment.chiefComplaint}</Descriptions.Item>
                        <Descriptions.Item label="现病史" span={2}>{selectedAssessment.presentIllness}</Descriptions.Item>
                      </Descriptions>
                      <Divider orientation="left" style={{ marginTop: 16 }}>评估结论</Divider>
                      <Paragraph style={{ background: '#f6ffed', padding: 12, borderRadius: 6, borderLeft: '4px solid #52c41a' }}>
                        {selectedAssessment.conclusion}
                      </Paragraph>
                    </>
                  ),
                },
                {
                  key: 'scales',
                  label: `量表(${selectedAssessment.scales.length})`,
                  children: (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      {selectedAssessment.scales.map((scale) => (
                        <Card key={scale.id} size="small" title={scale.name}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                            <Text strong style={{ fontSize: 24, color: '#1890ff' }}>{scale.score}</Text>
                            <Text type="secondary">/ {scale.maxScore}</Text>
                            <Progress
                              percent={Math.round((scale.score / scale.maxScore) * 100)}
                              strokeColor={scale.score / scale.maxScore < 0.4 ? '#52c41a' : scale.score / scale.maxScore < 0.7 ? '#faad14' : '#ff4d4f'}
                              style={{ flex: 1 }}
                              size="small"
                            />
                          </div>
                          <Text type="secondary">{scale.interpretation}</Text>
                        </Card>
                      ))}
                    </Space>
                  ),
                },
                {
                  key: 'pain',
                  label: `疼痛点(${selectedAssessment.painPoints.length})`,
                  children: selectedAssessment.painPoints.length ? (
                    <Table
                      dataSource={selectedAssessment.painPoints}
                      rowKey="id"
                      size="small"
                      pagination={false}
                      columns={[
                        { title: '部位', dataIndex: 'region', key: 'region' },
                        { title: '侧别', dataIndex: 'side', key: 'side', render: (v: string) => ({ left: '左侧', right: '右侧', bilateral: '双侧', center: '中央' }[v] ?? v) },
                        { title: '疼痛程度', dataIndex: 'severity', key: 'severity', render: (v: number) => <Tag color={SEVERITY_COLOR(v)}>{v}/10</Tag> },
                        { title: '性质', dataIndex: 'nature', key: 'nature' },
                        { title: '备注', dataIndex: 'notes', key: 'notes' },
                      ]}
                    />
                  ) : <Text type="secondary">无疼痛点记录</Text>,
                },
                {
                  key: 'contraindications',
                  label: `训练禁忌(${selectedAssessment.contraindications.length})`,
                  children: selectedAssessment.contraindications.length ? (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      {selectedAssessment.contraindications.map((ci) => (
                        <Card
                          key={ci.id}
                          size="small"
                          style={{ borderLeft: `4px solid ${ci.type === 'absolute' ? '#ff4d4f' : '#faad14'}` }}
                        >
                          <Space>
                            <Tag color={ci.type === 'absolute' ? 'red' : 'orange'}>
                              {ci.type === 'absolute' ? '绝对禁忌' : '相对禁忌'}
                            </Tag>
                            <Text strong>{ci.description}</Text>
                          </Space>
                          <div style={{ marginTop: 4, color: '#666' }}>原因: {ci.reason}</div>
                        </Card>
                      ))}
                    </Space>
                  ) : <Text type="secondary">无禁忌记录</Text>,
                },
                {
                  key: 'prescription',
                  label: `关联处方(${relatedPrescriptions.length})`,
                  children: relatedPrescriptions.length ? relatedPrescriptions.map((rx) => (
                    <Card key={rx.id} size="small" style={{ marginBottom: 8 }}>
                      <Descriptions column={2} size="small">
                        <Descriptions.Item label="版本">V{rx.version}</Descriptions.Item>
                        <Descriptions.Item label="状态">
                          <Tag color={rx.status === 'approved' ? 'green' : rx.status === 'adjusted' ? 'blue' : rx.status === 'pending_review' ? 'orange' : 'default'}>
                            {rx.status === 'approved' ? '已审核' : rx.status === 'adjusted' ? '已调整' : rx.status === 'pending_review' ? '待审核' : '草稿'}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="处方依据" span={2}>{rx.rationale}</Descriptions.Item>
                        <Descriptions.Item label="康复目标" span={2}>
                          <ul style={{ margin: 0, paddingLeft: 16 }}>
                            {rx.goals.map((g) => (
                              <li key={g.id}>
                                <Tag color={g.priority === 'high' ? 'red' : g.priority === 'medium' ? 'orange' : 'blue'}>{g.priority === 'high' ? '高' : g.priority === 'medium' ? '中' : '低'}</Tag>
                                {g.description}（目标: {g.targetDate}）
                              </li>
                            ))}
                          </ul>
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  )) : <Text type="secondary">暂无关联处方</Text>,
                },
              ]}
            />
          )
        })()}
      </Modal>

      <Modal
        title="新建评估记录"
        open={createOpen}
        onOk={handleCreate}
        onCancel={() => { setCreateOpen(false); form.resetFields() }}
        okText="提交评估"
        width={800}
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical">
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item name="patientId" label="患者" rules={[{ required: true, message: '请选择患者' }]} style={{ width: 280 }}>
              <Select showSearch placeholder="选择患者" optionFilterProp="label"
                options={patients.map((p) => ({ value: p.id, label: `${p.name} - ${p.categoryLabel}` }))}
              />
            </Form.Item>
            <Form.Item name="therapistId" label="评估治疗师" rules={[{ required: true, message: '请选择治疗师' }]} style={{ width: 240 }}>
              <Select showSearch placeholder="选择治疗师" optionFilterProp="label"
                options={therapists.map((t) => ({ value: t.id, label: `${t.name}(${t.specialty})` }))}
              />
            </Form.Item>
            <Form.Item name="date" label="评估日期" rules={[{ required: true, message: '请选择日期' }]} style={{ width: 180 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item name="chiefComplaint" label="主诉" rules={[{ required: true, message: '请输入主诉' }]}>
            <Input placeholder="患者主要症状和诉求" />
          </Form.Item>
          <Form.Item name="presentIllness" label="现病史">
            <Input.TextArea rows={3} placeholder="详细病史描述" />
          </Form.Item>

          <Divider orientation="left" style={{ margin: '12px 0 8px' }}>评估量表 <Text type="danger" style={{ fontSize: 12 }}>（至少1项，必填）</Text></Divider>
          <Form.List name="scales" rules={[{ validator: async (_, value) => { if (!value || value.length < 1) return Promise.reject(new Error('至少添加1项评估量表')) } }]}>
            {(fields, { add, remove }, { errors }) => (
              <>
                {errors.length > 0 && <div style={{ color: '#ff4d4f', fontSize: 14, marginBottom: 8, padding: '4px 0' }}>{errors[0]}</div>}
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item {...restField} name={[name, 'name']} rules={[{ required: true, message: '量表名' }]}>
                      <Input placeholder="量表名称" style={{ width: 160 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'score']} rules={[{ required: true, message: '得分' }]}>
                      <InputNumber placeholder="得分" min={0} style={{ width: 80 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'maxScore']} rules={[{ required: true, message: '满分' }]}>
                      <InputNumber placeholder="满分" min={1} style={{ width: 80 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'interpretation']} rules={[{ required: true, message: '解读' }]}>
                      <Input placeholder="评分解读" style={{ width: 200 }} />
                    </Form.Item>
                    {fields.length > 1 && <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f' }} />}
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>添加量表</Button>
              </>
            )}
          </Form.List>

          <Divider orientation="left" style={{ margin: '12px 0 8px' }}>疼痛点</Divider>
          <Form.List name="painPoints">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item {...restField} name={[name, 'region']} rules={[{ required: true, message: '部位' }]}>
                      <Input placeholder="疼痛部位" style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'side']} rules={[{ required: true, message: '侧别' }]}>
                      <Select placeholder="侧别" style={{ width: 90 }}
                        options={[{ value: 'left', label: '左侧' }, { value: 'right', label: '右侧' }, { value: 'bilateral', label: '双侧' }, { value: 'center', label: '中央' }]}
                      />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'severity']} rules={[{ required: true, message: '程度' }]}>
                      <InputNumber placeholder="1-10" min={1} max={10} style={{ width: 70 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'nature']} rules={[{ required: true, message: '性质' }]}>
                      <Select placeholder="性质" style={{ width: 100 }}
                        options={[{ value: '酸痛', label: '酸痛' }, { value: '刺痛', label: '刺痛' }, { value: '钝痛', label: '钝痛' }, { value: '牵拉痛', label: '牵拉痛' }, { value: '烧灼痛', label: '烧灼痛' }]}
                      />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'notes']}>
                      <Input placeholder="备注" style={{ width: 120 }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f' }} />
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>添加疼痛点</Button>
              </>
            )}
          </Form.List>

          <Divider orientation="left" style={{ margin: '12px 0 8px' }}>训练禁忌</Divider>
          <Form.List name="contraindications">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item {...restField} name={[name, 'type']} rules={[{ required: true, message: '类型' }]}>
                      <Select placeholder="类型" style={{ width: 100 }}
                        options={[{ value: 'absolute', label: '绝对禁忌' }, { value: 'relative', label: '相对禁忌' }]}
                      />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'description']} rules={[{ required: true, message: '描述' }]}>
                      <Input placeholder="禁忌描述" style={{ width: 200 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'reason']} rules={[{ required: true, message: '原因' }]}>
                      <Input placeholder="禁忌原因" style={{ width: 200 }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f' }} />
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>添加训练禁忌</Button>
              </>
            )}
          </Form.List>

          <Divider orientation="left" style={{ margin: '12px 0 8px' }}>评估结论</Divider>
          <Form.Item name="conclusion" rules={[{ required: true, message: '请输入评估结论' }]}>
            <Input.TextArea rows={3} placeholder="综合评估结论，将作为康复处方的依据" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
