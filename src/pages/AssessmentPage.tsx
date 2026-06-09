import { useState } from 'react'
import {
  Table, Button, Modal, Descriptions, Tag, Tabs, Space, Select, Card, Typography, Divider, Progress,
} from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAppStore } from '@/store/useAppStore'
import type { Assessment, PainPoint, Contraindication } from '@/types'

const { Text, Paragraph } = Typography

const SEVERITY_COLOR = (s: number) => {
  if (s <= 3) return '#52c41a'
  if (s <= 6) return '#faad14'
  return '#ff4d4f'
}

export default function AssessmentPage() {
  const { assessments, patients, getPatientById, prescriptions, getAppointmentsByPrescription } = useAppStore()
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)
  const [filterPatient, setFilterPatient] = useState<string | undefined>(undefined)

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
    </div>
  )
}
