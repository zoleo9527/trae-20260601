import { useState } from 'react'
import {
  Table, Tag, Select, Card, Space, Typography, Divider, Button, Modal, Form, Input, DatePicker, TimePicker, message,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { v4 as uuid } from 'uuid'
import { useAppStore } from '@/store/useAppStore'
import type { Appointment } from '@/types'

const { Text } = Typography

const TIME_SLOTS = [
  '08:00-08:45', '09:00-09:45', '10:00-10:45', '11:00-11:45',
  '14:00-14:45', '15:00-15:45', '16:00-16:45',
]

export default function SchedulePage() {
  const { appointments, patients, prescriptions, getPatientById, therapists, addAppointment } = useAppStore()
  const [filterDate, setFilterDate] = useState<string | undefined>(undefined)
  const [filterTherapist, setFilterTherapist] = useState<string | undefined>(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(undefined)

  const dates = [...new Set(appointments.map((a) => a.date))].sort()
  const filtered = appointments.filter((a) => {
    if (filterDate && a.date !== filterDate) return false
    if (filterTherapist && a.therapistId !== filterTherapist) return false
    return true
  })

  const patientPrescriptions = selectedPatientId
    ? prescriptions.filter((p) => p.patientId === selectedPatientId && (p.status === 'approved' || p.status === 'adjusted'))
    : []

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

  const handleAdd = () => {
    form.validateFields().then((values) => {
      const therapist = therapists.find((t) => t.id === values.therapistId)
      const dateStr = values.date.format('YYYY-MM-DD')
      const timeStr = values.timeSlot
      const rx = prescriptions.find((p) => p.id === values.prescriptionId)
      const typeFromPlan = rx?.treatmentPlan.find((tp) => tp.id === values.treatmentType)

      addAppointment({
        patientId: values.patientId,
        prescriptionId: values.prescriptionId,
        therapistId: values.therapistId,
        therapistName: therapist?.name ?? '',
        date: dateStr,
        timeSlot: timeStr,
        type: typeFromPlan?.name ?? values.treatmentType,
        status: 'scheduled',
        notes: values.notes ?? '',
      })
      form.resetFields()
      setSelectedPatientId(undefined)
      setModalOpen(false)
      message.success('预约排课成功')
    })
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建预约</Button>
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

      <Modal
        title="新建预约排课"
        open={modalOpen}
        onOk={handleAdd}
        onCancel={() => { setModalOpen(false); setSelectedPatientId(undefined) }}
        okText="确认排课"
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="patientId" label="患者" rules={[{ required: true, message: '请选择患者' }]}>
            <Select
              showSearch
              placeholder="选择患者"
              optionFilterProp="label"
              onChange={(v: string) => {
                setSelectedPatientId(v)
                form.setFieldsValue({ prescriptionId: undefined, treatmentType: undefined })
              }}
              options={patients.map((p) => ({ value: p.id, label: `${p.name} - ${p.categoryLabel}` }))}
            />
          </Form.Item>

          <Form.Item name="prescriptionId" label="关联处方（仅显示已审核/已调整）" rules={[{ required: true, message: '请选择处方' }]}>
            <Select
              placeholder={selectedPatientId ? '选择处方' : '请先选择患者'}
              disabled={!selectedPatientId}
              options={patientPrescriptions.map((rx) => ({
                value: rx.id,
                label: `V${rx.version} - ${rx.therapistName} - ${rx.goals.map((g) => g.description).slice(0, 2).join('；')}`,
              }))}
            />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.prescriptionId !== cur.prescriptionId}>
            {({ getFieldValue }) => {
              const rxId = getFieldValue('prescriptionId')
              const rx = prescriptions.find((p) => p.id === rxId)
              if (!rx) return null
              return (
                <Form.Item name="treatmentType" label="治疗项目（来自处方）" rules={[{ required: true, message: '请选择治疗项目' }]}>
                  <Select
                    placeholder="选择治疗项目"
                    options={rx.treatmentPlan.map((tp) => ({
                      value: tp.id,
                      label: `${tp.type} - ${tp.name} (${tp.frequency})`,
                    }))}
                  />
                </Form.Item>
              )
            }}
          </Form.Item>

          <Form.Item name="therapistId" label="治疗师" rules={[{ required: true, message: '请选择治疗师' }]}>
            <Select
              showSearch
              placeholder="选择治疗师"
              optionFilterProp="label"
              options={therapists.map((t) => ({ value: t.id, label: `${t.name}(${t.specialty})` }))}
            />
          </Form.Item>

          <Space style={{ width: '100%' }} size="middle">
            <Form.Item name="date" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
              <DatePicker style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="timeSlot" label="时段" rules={[{ required: true, message: '请选择时段' }]}>
              <Select placeholder="选择时段" style={{ width: 180 }} options={TIME_SLOTS.map((s) => ({ value: s, label: s }))} />
            </Form.Item>
          </Space>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} placeholder="排课备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
