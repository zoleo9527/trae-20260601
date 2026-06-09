import { useState, useEffect } from 'react'
import {
  Table, Button, Modal, Descriptions, Tag, Space, Input, Typography, Card, Divider, message, Form, Select, DatePicker,
} from 'antd'
import { CheckCircleOutlined, EditOutlined, EyeOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { v4 as uuid } from 'uuid'
import { useAppStore } from '@/store/useAppStore'
import type { Prescription, RehabGoal, TreatmentPlanItem } from '@/types'

const { Paragraph, Text } = Typography

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  pending_review: { label: '待审核', color: 'orange' },
  approved: { label: '已审核', color: 'green' },
  adjusted: { label: '已调整', color: 'blue' },
  archived: { label: '已归档', color: 'default' },
}

const TREATMENT_TYPES = [
  '关节活动度训练', '肌力训练', '本体感觉训练', '平衡训练',
  '步态训练', '力量训练', '功能训练', '物理因子',
  '核心稳定训练', '姿势管理', '牵伸训练', '特异性侧弯体操(SSE)', '安全策略', '其他',
]

export default function ReviewPage() {
  const { prescriptions, prescriptionHistory, getPatientById, assessments, approvePrescription, adjustPrescription } = useAppStore()
  const [reviewRx, setReviewRx] = useState<Prescription | null>(null)
  const [adjustRx, setAdjustRx] = useState<Prescription | null>(null)
  const [adjustComment, setAdjustComment] = useState('')
  const [approveComment, setApproveComment] = useState('')
  const [detailRx, setDetailRx] = useState<Prescription | null>(null)
  const [adjustForm] = Form.useForm()

  const pendingList = prescriptions.filter((p) => p.status === 'pending_review')
  const reviewedList = prescriptions.filter((p) => p.status === 'approved' || p.status === 'adjusted')

  const getAssessment = (id: string) => assessments.find((a) => a.id === id)

  useEffect(() => {
    if (adjustRx) {
      adjustForm.setFieldsValue({
        goals: adjustRx.goals.map((g) => ({
          description: g.description,
          measurable: g.measurable,
          targetDate: dayjs(g.targetDate),
          priority: g.priority,
        })),
        treatmentPlan: adjustRx.treatmentPlan.map((tp) => ({
          type: tp.type,
          name: tp.name,
          frequency: tp.frequency,
          duration: tp.duration,
          notes: tp.notes,
        })),
        rationale: adjustRx.rationale,
      })
    }
  }, [adjustRx, adjustForm])

  const handleApprove = (rx: Prescription) => {
    approvePrescription(rx.id, 'dir1', '刘主任', approveComment || '处方合理，批准执行')
    setReviewRx(null)
    setApproveComment('')
    message.success(`处方 ${rx.id} V${rx.version} 已批准`)
  }

  const handleAdjust = () => {
    if (!adjustRx) return
    if (!adjustComment.trim()) {
      message.warning('请填写调整意见')
      return
    }
    adjustForm.validateFields().then((values) => {
      const goals: RehabGoal[] = (values.goals ?? []).map((g: { description: string; targetDate: any; measurable: string; priority: string }) => ({
        id: `g${uuid().slice(0, 6)}`,
        description: g.description,
        targetDate: g.targetDate ? (typeof g.targetDate === 'string' ? g.targetDate : g.targetDate.format('YYYY-MM-DD')) : '',
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

      adjustPrescription(adjustRx.id, { goals, treatmentPlan, rationale: values.rationale }, adjustComment)
      setAdjustRx(null)
      setAdjustComment('')
      adjustForm.resetFields()
      message.success(`处方已调整为 V${adjustRx.version + 1}，旧版本 V${adjustRx.version} 已归档`)
    })
  }

  const renderReviewCard = (rx: Prescription) => {
    const patient = getPatientById(rx.patientId)
    const assessment = getAssessment(rx.assessmentId)

    return (
      <Card
        key={`${rx.id}-v${rx.version}`}
        size="small"
        style={{ marginBottom: 12, borderLeft: rx.status === 'pending_review' ? '4px solid #faad14' : '4px solid #52c41a' }}
        title={
          <Space>
            <Tag color={STATUS_MAP[rx.status]?.color}>{STATUS_MAP[rx.status]?.label}</Tag>
            <Text strong>{patient?.name}</Text>
            <Text type="secondary">V{rx.version} | {rx.therapistName} | {dayjs(rx.createdAt).format('YYYY-MM-DD')}</Text>
          </Space>
        }
        extra={
          rx.status === 'pending_review' ? (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailRx(rx)}>查看</Button>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => { setReviewRx(rx); setApproveComment('') }}>批准</Button>
              <Button size="small" danger icon={<EditOutlined />} onClick={() => { setAdjustRx(rx); setAdjustComment('') }}>调整</Button>
            </Space>
          ) : (
            <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailRx(rx)}>查看</Button>
          )
        }
      >
        {assessment && (
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary">评估结论: </Text>
            <Text>{assessment.conclusion}</Text>
          </div>
        )}
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary">处方依据: </Text>
          <Text>{rx.rationale}</Text>
        </div>
        <div style={{ marginBottom: 4 }}>
          <Text type="secondary">康复目标: </Text>
          {rx.goals.map((g) => (
            <Tag key={g.id} color={g.priority === 'high' ? 'red' : g.priority === 'medium' ? 'orange' : 'blue'} style={{ marginBottom: 4 }}>
              {g.description}
            </Tag>
          ))}
        </div>
        <div>
          <Text type="secondary">治疗项目: </Text>
          {rx.treatmentPlan.map((tp) => (
            <Tag key={tp.id} color="purple" style={{ marginBottom: 4 }}>
              {tp.type}-{tp.name}
            </Tag>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <div>
      <Divider orientation="left">待审核处方 ({pendingList.length})</Divider>
      {pendingList.length ? pendingList.map(renderReviewCard) : <Text type="secondary">暂无待审核处方</Text>}

      <Divider orientation="left" style={{ marginTop: 24 }}>已审核处方 ({reviewedList.length})</Divider>
      {reviewedList.length ? reviewedList.map(renderReviewCard) : <Text type="secondary">暂无已审核处方</Text>}

      <Modal
        title="批准处方"
        open={!!reviewRx}
        onOk={() => reviewRx && handleApprove(reviewRx)}
        onCancel={() => setReviewRx(null)}
        okText="确认批准"
      >
        {reviewRx && (
          <>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="患者">{getPatientById(reviewRx.patientId)?.name}</Descriptions.Item>
              <Descriptions.Item label="版本">V{reviewRx.version}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 8, marginBottom: 4 }}>
              <Text type="secondary">康复目标: </Text>
              {reviewRx.goals.map((g) => (
                <Tag key={g.id} color={g.priority === 'high' ? 'red' : g.priority === 'medium' ? 'orange' : 'blue'}>
                  {g.description}
                </Tag>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <Text>审核意见:</Text>
              <Input.TextArea rows={3} value={approveComment} onChange={(e) => setApproveComment(e.target.value)} placeholder="填写审核意见（可选）" />
            </div>
          </>
        )}
      </Modal>

      <Modal
        title="调整处方（旧版本将归档保留）"
        open={!!adjustRx}
        onOk={handleAdjust}
        onCancel={() => { setAdjustRx(null); adjustForm.resetFields() }}
        okText="确认调整并归档旧版本"
        width={900}
        style={{ top: 20 }}
      >
        {adjustRx && (() => {
          const patient = getPatientById(adjustRx.patientId)
          const assessment = getAssessment(adjustRx.assessmentId)
          return (
            <>
              <Descriptions column={3} size="small" style={{ marginBottom: 8 }}>
                <Descriptions.Item label="患者">{patient?.name}</Descriptions.Item>
                <Descriptions.Item label="当前版本">V{adjustRx.version}</Descriptions.Item>
                <Descriptions.Item label="调整后版本">V{adjustRx.version + 1}</Descriptions.Item>
              </Descriptions>

              {assessment && (
                <Card size="small" style={{ marginBottom: 8, background: '#f6ffed', borderLeft: '4px solid #52c41a' }}>
                  <Text strong>评估结论: </Text><Text>{assessment.conclusion}</Text>
                  {assessment.contraindications.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary">训练禁忌: </Text>
                      {assessment.contraindications.map((ci) => (
                        <Tag key={ci.id} color={ci.type === 'absolute' ? 'red' : 'orange'}>
                          {ci.type === 'absolute' ? '绝对' : '相对'}: {ci.description}
                        </Tag>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              <Paragraph type="secondary" style={{ margin: '8px 0' }}>
                修改下方目标和治疗项目，确认后当前 V{adjustRx.version} 将归档，生成新版本 V{adjustRx.version + 1}。
              </Paragraph>

              <Form form={adjustForm} layout="vertical">
                <Divider orientation="left" style={{ margin: '8px 0' }}>康复目标（可修改/增删）</Divider>
                <Form.List name="goals">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Space key={key} style={{ display: 'flex', marginBottom: 8, flexWrap: 'wrap' }} align="baseline">
                          <Form.Item {...restField} name={[name, 'description']} rules={[{ required: true, message: '目标描述' }]}>
                            <Input placeholder="目标描述" style={{ width: 180 }} />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'measurable']} rules={[{ required: true, message: '测量指标' }]}>
                            <Input placeholder="可测量指标" style={{ width: 120 }} />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'targetDate']} rules={[{ required: true, message: '目标日期' }]}>
                            <DatePicker placeholder="目标日期" style={{ width: 130 }} />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'priority']} rules={[{ required: true, message: '优先级' }]}>
                            <Select placeholder="优先级" style={{ width: 80 }}
                              options={[{ value: 'high', label: '高' }, { value: 'medium', label: '中' }, { value: 'low', label: '低' }]}
                            />
                          </Form.Item>
                          <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f' }} />
                        </Space>
                      ))}
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ marginBottom: 8 }}>添加目标</Button>
                    </>
                  )}
                </Form.List>

                <Divider orientation="left" style={{ margin: '8px 0' }}>治疗计划（可修改/增删）</Divider>
                <Form.List name="treatmentPlan">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Space key={key} style={{ display: 'flex', marginBottom: 8, flexWrap: 'wrap' }} align="baseline">
                          <Form.Item {...restField} name={[name, 'type']} rules={[{ required: true, message: '类型' }]}>
                            <Select placeholder="治疗类型" style={{ width: 130 }}
                              options={TREATMENT_TYPES.map((t) => ({ value: t, label: t }))}
                            />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'name']} rules={[{ required: true, message: '名称' }]}>
                            <Input placeholder="治疗名称" style={{ width: 160 }} />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'frequency']} rules={[{ required: true, message: '频率' }]}>
                            <Input placeholder="频率" style={{ width: 90 }} />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'duration']} rules={[{ required: true, message: '时长' }]}>
                            <Input placeholder="时长" style={{ width: 70 }} />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'notes']}>
                            <Input placeholder="备注" style={{ width: 100 }} />
                          </Form.Item>
                          <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f' }} />
                        </Space>
                      ))}
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ marginBottom: 8 }}>添加治疗项目</Button>
                    </>
                  )}
                </Form.List>

                <Divider orientation="left" style={{ margin: '8px 0' }}>处方依据（可修改）</Divider>
                <Form.Item name="rationale" rules={[{ required: true, message: '请输入处方依据' }]}>
                  <Input.TextArea rows={2} />
                </Form.Item>
              </Form>

              <Divider orientation="left" style={{ margin: '8px 0' }}>调整意见 (必填)</Divider>
              <Input.TextArea rows={2} value={adjustComment} onChange={(e) => setAdjustComment(e.target.value)} placeholder="请说明调整原因和调整内容" />
            </>
          )
        })()}
      </Modal>

      <Modal
        title="处方完整详情"
        open={!!detailRx}
        onCancel={() => setDetailRx(null)}
        footer={null}
        width={800}
      >
        {detailRx && (() => {
          const patient = getPatientById(detailRx.patientId)
          const assessment = getAssessment(detailRx.assessmentId)
          const history = prescriptionHistory.filter((p) => p.id === detailRx.id)
          return (
            <div>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="患者">{patient?.name}</Descriptions.Item>
                <Descriptions.Item label="分类">{patient?.categoryLabel}</Descriptions.Item>
                <Descriptions.Item label="诊断" span={2}>{patient?.diagnosis}</Descriptions.Item>
                <Descriptions.Item label="版本">V{detailRx.version}</Descriptions.Item>
                <Descriptions.Item label="状态"><Tag color={STATUS_MAP[detailRx.status]?.color}>{STATUS_MAP[detailRx.status]?.label}</Tag></Descriptions.Item>
              </Descriptions>

              {assessment && (
                <>
                  <Divider orientation="left">关联评估</Divider>
                  <Paragraph style={{ background: '#f6ffed', padding: 12, borderRadius: 6, borderLeft: '4px solid #52c41a' }}>
                    {assessment.conclusion}
                  </Paragraph>
                  {assessment.contraindications.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">训练禁忌: </Text>
                      {assessment.contraindications.map((ci) => (
                        <Tag key={ci.id} color={ci.type === 'absolute' ? 'red' : 'orange'}>
                          {ci.type === 'absolute' ? '绝对' : '相对'}: {ci.description}
                        </Tag>
                      ))}
                    </div>
                  )}
                </>
              )}

              <Divider orientation="left">处方依据</Divider>
              <Paragraph>{detailRx.rationale}</Paragraph>

              <Divider orientation="left">康复目标</Divider>
              {detailRx.goals.map((g) => (
                <div key={g.id} style={{ marginBottom: 4 }}>
                  <Tag color={g.priority === 'high' ? 'red' : g.priority === 'medium' ? 'orange' : 'blue'}>{g.priority === 'high' ? '高' : g.priority === 'medium' ? '中' : '低'}</Tag>
                  <Text>{g.description}</Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>指标: {g.measurable} | 目标日期: {g.targetDate}</Text>
                </div>
              ))}

              <Divider orientation="left">治疗计划</Divider>
              <Table
                dataSource={detailRx.treatmentPlan}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => <Tag color="purple">{v}</Tag> },
                  { title: '名称', dataIndex: 'name', key: 'name' },
                  { title: '频率', dataIndex: 'frequency', key: 'frequency' },
                  { title: '时长', dataIndex: 'duration', key: 'duration' },
                  { title: '备注', dataIndex: 'notes', key: 'notes' },
                ]}
              />

              {detailRx.reviewComment && (
                <>
                  <Divider orientation="left">审核/调整意见</Divider>
                  <Paragraph style={{ background: '#fff7e6', padding: 12, borderRadius: 6, borderLeft: '4px solid #faad14' }}>
                    {detailRx.reviewerName} | {detailRx.reviewedAt ? dayjs(detailRx.reviewedAt).format('YYYY-MM-DD HH:mm') : ''}
                    <br />{detailRx.reviewComment}
                  </Paragraph>
                </>
              )}

              {history.length > 0 && (
                <>
                  <Divider orientation="left">历史版本</Divider>
                  {history.map((h) => (
                    <Card key={`h-${h.version}`} size="small" style={{ marginBottom: 8, opacity: 0.7 }}>
                      <Descriptions column={1} size="small" title={`V${h.version} - 已归档`}>
                        <Descriptions.Item label="处方依据">{h.rationale}</Descriptions.Item>
                        <Descriptions.Item label="目标">{h.goals.map((g) => g.description).join('；')}</Descriptions.Item>
                        <Descriptions.Item label="治疗项目">
                          {h.treatmentPlan.map((tp) => tp.name).join('；')}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  ))}
                </>
              )}
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
