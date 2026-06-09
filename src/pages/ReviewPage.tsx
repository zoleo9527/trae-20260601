import { useState } from 'react'
import {
  Table, Button, Modal, Descriptions, Tag, Space, Input, Typography, Card, Divider, message,
} from 'antd'
import { CheckCircleOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAppStore } from '@/store/useAppStore'
import type { Prescription } from '@/types'

const { Paragraph, Text } = Typography

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  pending_review: { label: '待审核', color: 'orange' },
  approved: { label: '已审核', color: 'green' },
  adjusted: { label: '已调整', color: 'blue' },
  archived: { label: '已归档', color: 'default' },
}

export default function ReviewPage() {
  const { prescriptions, prescriptionHistory, getPatientById, assessments, approvePrescription, adjustPrescription } = useAppStore()
  const [reviewRx, setReviewRx] = useState<Prescription | null>(null)
  const [adjustRx, setAdjustRx] = useState<Prescription | null>(null)
  const [adjustComment, setAdjustComment] = useState('')
  const [approveComment, setApproveComment] = useState('')
  const [detailRx, setDetailRx] = useState<Prescription | null>(null)

  const pendingList = prescriptions.filter((p) => p.status === 'pending_review')
  const reviewedList = prescriptions.filter((p) => p.status === 'approved' || p.status === 'adjusted')

  const getAssessment = (id: string) => assessments.find((a) => a.id === id)

  const handleApprove = (rx: Prescription) => {
    approvePrescription(rx.id, 'dir1', '刘主任', approveComment || '处方合理，批准执行')
    setReviewRx(null)
    setApproveComment('')
    message.success(`处方 ${rx.id} V${rx.version} 已批准`)
  }

  const handleAdjust = (rx: Prescription) => {
    if (!adjustComment.trim()) {
      message.warning('请填写调整意见')
      return
    }
    adjustPrescription(rx.id, {}, adjustComment)
    setAdjustRx(null)
    setAdjustComment('')
    message.success(`处方 ${rx.id} 已调整，旧版本已归档`)
  }

  const renderReviewCard = (rx: Prescription) => {
    const patient = getPatientById(rx.patientId)
    const assessment = getAssessment(rx.assessmentId)

    return (
      <Card
        key={`${rx.id}-v${rx.version}`}
        size="small"
        style={{ marginBottom: 12, borderLeft: '4px solid #faad14' }}
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
        <div>
          <Text type="secondary">康复目标: </Text>
          {rx.goals.map((g) => (
            <Tag key={g.id} color={g.priority === 'high' ? 'red' : g.priority === 'medium' ? 'orange' : 'blue'} style={{ marginBottom: 4 }}>
              {g.description}
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
        onOk={() => adjustRx && handleAdjust(adjustRx)}
        onCancel={() => setAdjustRx(null)}
        okText="确认调整"
      >
        {adjustRx && (
          <>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="患者">{getPatientById(adjustRx.patientId)?.name}</Descriptions.Item>
              <Descriptions.Item label="当前版本">V{adjustRx.version}</Descriptions.Item>
            </Descriptions>
            <Paragraph type="secondary" style={{ marginTop: 8 }}>
              调整后处方版本将递增为 V{adjustRx.version + 1}，当前版本 V{adjustRx.version} 将归档保留。
            </Paragraph>
            <div style={{ marginTop: 12 }}>
              <Text>调整意见 (必填):</Text>
              <Input.TextArea rows={3} value={adjustComment} onChange={(e) => setAdjustComment(e.target.value)} placeholder="请说明调整原因和调整内容" />
            </div>
          </>
        )}
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
