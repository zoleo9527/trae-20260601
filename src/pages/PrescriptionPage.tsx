import { useState } from 'react'
import {
  Table, Button, Modal, Descriptions, Tag, Tabs, Card, Space, Select, Timeline, Typography, Divider, List,
} from 'antd'
import { HistoryOutlined, EyeOutlined, LinkOutlined } from '@ant-design/icons'
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

const PRIORITY_COLOR: Record<string, string> = { high: 'red', medium: 'orange', low: 'blue' }
const PRIORITY_LABEL: Record<string, string> = { high: '高', medium: '中', low: '低' }

export default function PrescriptionPage() {
  const { prescriptions, prescriptionHistory, patients, assessments, getPatientById, getAppointmentsByPrescription } = useAppStore()
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null)
  const [filterPatient, setFilterPatient] = useState<string | undefined>(undefined)

  const filtered = filterPatient
    ? prescriptions.filter((p) => p.patientId === filterPatient)
    : prescriptions

  const getAssessment = (id: string) => assessments.find((a) => a.id === id)

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

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
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

      <Table columns={columns} dataSource={filtered} rowKey={(r) => `${r.id}-v${r.version}`} pagination={false} size="middle" />

      <Modal
        title="处方详情"
        open={!!selectedRx}
        onCancel={() => setSelectedRx(null)}
        footer={null}
        width={1000}
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
                  label: '评估→目标→治疗',
                  children: (
                    <div>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
                        <Card size="small" title="📋 评估结论" style={{ flex: 1, borderLeft: '4px solid #1890ff' }}>
                          {assessment ? (
                            <>
                              <Paragraph style={{ margin: 0 }}>
                                <Text type="secondary">{assessment.therapistName} | {dayjs(assessment.date).format('YYYY-MM-DD')}</Text>
                              </Paragraph>
                              <Paragraph style={{ marginTop: 8 }}>{assessment.conclusion}</Paragraph>
                              {assessment.contraindications.length > 0 && (
                                <div>
                                  <Text type="secondary">训练禁忌:</Text>
                                  <div style={{ marginTop: 4 }}>
                                    {assessment.contraindications.map((ci) => (
                                      <Tag key={ci.id} color={ci.type === 'absolute' ? 'red' : 'orange'} style={{ marginBottom: 4 }}>
                                        {ci.type === 'absolute' ? '绝对' : '相对'}: {ci.description}
                                      </Tag>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : <Text type="secondary">未找到关联评估</Text>}
                        </Card>

                        <div style={{ display: 'flex', alignItems: 'center', fontSize: 24, color: '#1890ff' }}>
                          →
                        </div>

                        <Card size="small" title="🎯 康复目标" style={{ flex: 1, borderLeft: '4px solid #52c41a' }}>
                          <List
                            size="small"
                            dataSource={selectedRx.goals}
                            renderItem={(g) => (
                              <List.Item style={{ padding: '4px 0' }}>
                                <Space>
                                  <Tag color={PRIORITY_COLOR[g.priority]}>{PRIORITY_LABEL[g.priority]}</Tag>
                                  <Text>{g.description}</Text>
                                </Space>
                                <div style={{ fontSize: 12, color: '#999' }}>{g.measurable} | {g.targetDate}</div>
                              </List.Item>
                            )}
                          />
                        </Card>

                        <div style={{ display: 'flex', alignItems: 'center', fontSize: 24, color: '#52c41a' }}>
                          →
                        </div>

                        <Card size="small" title="💊 治疗计划" style={{ flex: 1, borderLeft: '4px solid #722ed1' }}>
                          {selectedRx.treatmentPlan.map((tp) => (
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
    </div>
  )
}
