import { useState } from 'react'
import {
  Table, Button, Modal, Form, Input, Select, InputNumber, Tag, Space, Descriptions, Divider, Tabs,
} from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAppStore } from '@/store/useAppStore'
import type { Patient, PatientCategory } from '@/types'

const CATEGORY_OPTIONS: { value: PatientCategory; label: string }[] = [
  { value: 'post_surgical', label: '术后康复' },
  { value: 'pediatric_posture', label: '儿童姿态矫正' },
  { value: 'elderly_balance', label: '老人平衡训练' },
]

const CATEGORY_COLOR: Record<PatientCategory, string> = {
  post_surgical: 'red',
  pediatric_posture: 'blue',
  elderly_balance: 'green',
}

export default function PatientRegistry() {
  const { patients, addPatient, assessments, prescriptions, appointments, therapists } = useAppStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [detailPatient, setDetailPatient] = useState<Patient | null>(null)
  const [form] = Form.useForm()

  const handleAdd = () => {
    form.validateFields().then((values) => {
      const cat = CATEGORY_OPTIONS.find((c) => c.value === values.category)
      addPatient({ ...values, categoryLabel: cat?.label ?? '', phone: values.phone ?? '' })
      form.resetFields()
      setModalOpen(false)
    })
  }

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '性别', dataIndex: 'gender', key: 'gender', render: (v: string) => v === 'male' ? '男' : '女' },
    { title: '年龄', dataIndex: 'age', key: 'age' },
    { title: '分类', dataIndex: 'category', key: 'category', render: (v: PatientCategory) => <Tag color={CATEGORY_COLOR[v]}>{CATEGORY_OPTIONS.find((c) => c.value === v)?.label}</Tag> },
    { title: '诊断', dataIndex: 'diagnosis', key: 'diagnosis', ellipsis: true },
    { title: '建档日期', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => dayjs(v).format('YYYY-MM-DD') },
    {
      title: '操作', key: 'action',
      render: (_: unknown, record: Patient) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => setDetailPatient(record)}>详情</Button>
      ),
    },
  ]

  const patientAssessments = detailPatient ? assessments.filter((a) => a.patientId === detailPatient.id) : []
  const patientPrescriptions = detailPatient ? prescriptions.filter((p) => p.patientId === detailPatient.id) : []
  const patientAppointments = detailPatient ? appointments.filter((a) => a.patientId === detailPatient.id) : []

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#666' }}>共 {patients.length} 名患者</span>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建档案</Button>
      </div>

      <Table columns={columns} dataSource={patients} rowKey="id" pagination={false} size="middle" />

      <Modal title="新建患者档案" open={modalOpen} onOk={handleAdd} onCancel={() => setModalOpen(false)} width={600} okText="建档">
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item name="gender" label="性别" rules={[{ required: true }]} style={{ width: 120 }}>
              <Select options={[{ value: 'male', label: '男' }, { value: 'female', label: '女' }]} />
            </Form.Item>
            <Form.Item name="age" label="年龄" rules={[{ required: true }]} style={{ width: 120 }}>
              <InputNumber min={0} max={150} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="category" label="分类" rules={[{ required: true }]} style={{ width: 180 }}>
              <Select options={CATEGORY_OPTIONS} />
            </Form.Item>
          </Space>
          <Form.Item name="phone" label="联系电话">
            <Input />
          </Form.Item>
          <Form.Item name="diagnosis" label="诊断" rules={[{ required: true, message: '请输入诊断' }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`患者详情 - ${detailPatient?.name ?? ''}`}
        open={!!detailPatient}
        onCancel={() => setDetailPatient(null)}
        footer={null}
        width={800}
      >
        {detailPatient && (
          <Tabs
            items={[
              {
                key: 'basic',
                label: '基本信息',
                children: (
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="姓名">{detailPatient.name}</Descriptions.Item>
                    <Descriptions.Item label="性别">{detailPatient.gender === 'male' ? '男' : '女'}</Descriptions.Item>
                    <Descriptions.Item label="年龄">{detailPatient.age}岁</Descriptions.Item>
                    <Descriptions.Item label="分类"><Tag color={CATEGORY_COLOR[detailPatient.category]}>{detailPatient.categoryLabel}</Tag></Descriptions.Item>
                    <Descriptions.Item label="诊断" span={2}>{detailPatient.diagnosis}</Descriptions.Item>
                    <Descriptions.Item label="联系电话">{detailPatient.phone}</Descriptions.Item>
                    <Descriptions.Item label="建档日期">{dayjs(detailPatient.createdAt).format('YYYY-MM-DD')}</Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'assessments',
                label: `评估记录(${patientAssessments.length})`,
                children: patientAssessments.length ? patientAssessments.map((a) => (
                  <div key={a.id} style={{ marginBottom: 16 }}>
                    <Descriptions column={2} bordered size="small" title={`${dayjs(a.date).format('YYYY-MM-DD')} - ${a.therapistName}`}>
                      <Descriptions.Item label="主诉" span={2}>{a.chiefComplaint}</Descriptions.Item>
                      <Descriptions.Item label="评估结论" span={2}>{a.conclusion}</Descriptions.Item>
                    </Descriptions>
                    <Divider style={{ margin: '8px 0' }} />
                  </div>
                )) : <div style={{ color: '#999' }}>暂无评估记录</div>,
              },
              {
                key: 'prescriptions',
                label: `康复处方(${patientPrescriptions.length})`,
                children: patientPrescriptions.length ? patientPrescriptions.map((p) => (
                  <div key={p.id} style={{ marginBottom: 16 }}>
                    <Descriptions column={2} bordered size="small" title={`处方 V${p.version} - ${p.status === 'approved' ? '已审核' : p.status === 'adjusted' ? '已调整' : p.status === 'pending_review' ? '待审核' : '草稿'}`}>
                      <Descriptions.Item label="处方依据" span={2}>{p.rationale}</Descriptions.Item>
                      <Descriptions.Item label="康复目标" span={2}>
                        <ul style={{ margin: 0, paddingLeft: 16 }}>{p.goals.map((g) => <li key={g.id}>{g.description}（{g.measurable}，目标日期{g.targetDate}）</li>)}</ul>
                      </Descriptions.Item>
                    </Descriptions>
                    <Divider style={{ margin: '8px 0' }} />
                  </div>
                )) : <div style={{ color: '#999' }}>暂无处方</div>,
              },
              {
                key: 'appointments',
                label: `排课(${patientAppointments.length})`,
                children: patientAppointments.length ? (
                  <Table
                    dataSource={patientAppointments}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    columns={[
                      { title: '日期', dataIndex: 'date', key: 'date' },
                      { title: '时段', dataIndex: 'timeSlot', key: 'timeSlot' },
                      { title: '治疗师', dataIndex: 'therapistName', key: 'therapistName' },
                      { title: '类型', dataIndex: 'type', key: 'type' },
                      { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => v === 'scheduled' ? '已排课' : v === 'completed' ? '已完成' : '已取消' },
                    ]}
                  />
                ) : <div style={{ color: '#999' }}>暂无排课</div>,
              },
            ]}
          />
        )}
      </Modal>
    </div>
  )
}
