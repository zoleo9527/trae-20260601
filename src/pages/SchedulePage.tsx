import { useState } from 'react'
import { Table, Tag, Select, Card, Space, Descriptions, Typography, Divider } from 'antd'
import dayjs from 'dayjs'
import { useAppStore } from '@/store/useAppStore'
import type { Appointment } from '@/types'

const { Text } = Typography

export default function SchedulePage() {
  const { appointments, patients, prescriptions, getPatientById, getPrescriptionsByPatient, therapists } = useAppStore()
  const [filterDate, setFilterDate] = useState<string | undefined>(undefined)
  const [filterTherapist, setFilterTherapist] = useState<string | undefined>(undefined)

  const dates = [...new Set(appointments.map((a) => a.date))].sort()
  const filtered = appointments.filter((a) => {
    if (filterDate && a.date !== filterDate) return false
    if (filterTherapist && a.therapistId !== filterTherapist) return false
    return true
  })

  const getStatusTag = (status: string) => {
    if (status === 'scheduled') return <Tag color="blue">已排课</Tag>
    if (status === 'completed') return <Tag color="green">已完成</Tag>
    return <Tag color="red">已取消</Tag>
  }

  const columns = [
    {
      title: '日期', dataIndex: 'date', key: 'date',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '时段', dataIndex: 'timeSlot', key: 'timeSlot',
    },
    {
      title: '患者', dataIndex: 'patientId', key: 'patient',
      render: (v: string) => getPatientById(v)?.name ?? v,
    },
    {
      title: '治疗师', dataIndex: 'therapistName', key: 'therapist',
    },
    {
      title: '治疗类型', dataIndex: 'type', key: 'type',
      render: (v: string) => <Tag color="purple">{v}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (v: string) => getStatusTag(v),
    },
    {
      title: '备注', dataIndex: 'notes', key: 'notes', ellipsis: true,
    },
    {
      title: '关联处方', dataIndex: 'prescriptionId', key: 'rx',
      render: (v: string) => {
        const rx = prescriptions.find((p) => p.id === v)
        return rx ? <Tag color="blue">V{rx.version}</Tag> : '-'
      },
    },
  ]

  const groupedByDate = dates.map((date) => ({
    date,
    items: filtered.filter((a) => a.date === date),
  }))

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <span>按日期筛选:</span>
        <Select
          allowClear
          placeholder="全部日期"
          style={{ width: 160 }}
          value={filterDate}
          onChange={setFilterDate}
          options={dates.map((d) => ({ value: d, label: d }))}
        />
        <span style={{ marginLeft: 12 }}>按治疗师:</span>
        <Select
          allowClear
          placeholder="全部治疗师"
          style={{ width: 160 }}
          value={filterTherapist}
          onChange={setFilterTherapist}
          options={therapists.map((t) => ({ value: t.id, label: `${t.name}(${t.specialty})` }))}
        />
      </div>

      <Table columns={columns} dataSource={filtered} rowKey="id" pagination={false} size="middle" />

      <Divider orientation="left" style={{ marginTop: 24 }}>按日期分组视图</Divider>

      {groupedByDate.filter((g) => g.items.length > 0).map((group) => (
        <Card key={group.date} size="small" title={group.date} style={{ marginBottom: 12 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {group.items.map((apt) => {
              const patient = getPatientById(apt.patientId)
              const rx = prescriptions.find((p) => p.id === apt.prescriptionId)
              return (
                <div key={apt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fafafa', borderRadius: 4 }}>
                  <Space>
                    <Text strong>{apt.timeSlot}</Text>
                    <Tag color="purple">{apt.type}</Tag>
                    <Text>{patient?.name}</Text>
                    <Text type="secondary">| {apt.therapistName}</Text>
                  </Space>
                  <Space>
                    {rx && <Tag color="blue">处方V{rx.version}</Tag>}
                    {getStatusTag(apt.status)}
                    {apt.notes && <Text type="secondary" style={{ fontSize: 12 }}>{apt.notes}</Text>}
                  </Space>
                </div>
              )
            })}
          </Space>
        </Card>
      ))}
    </div>
  )
}
