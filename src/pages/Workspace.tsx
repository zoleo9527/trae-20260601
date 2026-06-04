import { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Select,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Input,
  message
} from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { workflowApi, commonApi } from '../services/api'
import { WorkflowSimpleVO, WorkflowStatus, SurgeryType, SurgeryTypeLabel, UserVO, PatientVO } from '../types'

const statusColors: Record<string, string> = {
  [WorkflowStatus.PENDING_REGISTRATION]: 'default',
  [WorkflowStatus.PREOP_IN_PROGRESS]: 'processing',
  [WorkflowStatus.PREOP_REVIEW]: 'warning',
  [WorkflowStatus.PREOP_APPROVED]: 'success',
  [WorkflowStatus.PREOP_REJECTED]: 'error',
  [WorkflowStatus.SCHEDULING]: 'processing',
  [WorkflowStatus.SCHEDULE_REVIEW]: 'warning',
  [WorkflowStatus.SCHEDULE_CONFIRMED]: 'success',
  [WorkflowStatus.SCHEDULE_REJECTED]: 'error',
  [WorkflowStatus.COMPLETED]: 'success',
  [WorkflowStatus.CANCELLED]: 'default'
}

export default function Workspace() {
  const navigate = useNavigate()
  const [workflows, setWorkflows] = useState<WorkflowSimpleVO[]>([])
  const [users, setUsers] = useState<UserVO[]>([])
  const [patients, setPatients] = useState<PatientVO[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<number | undefined>()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const [workflowData, userData, patientData] = await Promise.all([
        workflowApi.getList(selectedUser),
        commonApi.getUsers(),
        commonApi.getPatients()
      ])
      setWorkflows(workflowData)
      setUsers(userData)
      setPatients(patientData)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedUser])

  const handleCreate = async (values: any) => {
    try {
      await workflowApi.create(values)
      message.success('创建成功')
      setIsModalOpen(false)
      form.resetFields()
      loadData()
    } catch (error: any) {
      message.error(error.message || '创建失败')
    }
  }

  const stats = {
    total: workflows.length,
    inCheck: workflows.filter(w =>
      [WorkflowStatus.PREOP_IN_PROGRESS, WorkflowStatus.PREOP_REVIEW].includes(w.status)
    ).length,
    inSchedule: workflows.filter(w =>
      [WorkflowStatus.SCHEDULING, WorkflowStatus.SCHEDULE_REVIEW].includes(w.status)
    ).length,
    blocked: workflows.filter(w =>
      [WorkflowStatus.PREOP_REJECTED, WorkflowStatus.SCHEDULE_REJECTED].includes(w.status)
    ).length
  }

  const columns = [
    {
      title: '流程编号',
      dataIndex: 'workflowNo',
      key: 'workflowNo',
      width: 140
    },
    {
      title: '患者姓名',
      dataIndex: 'patientName',
      key: 'patientName',
      width: 100
    },
    {
      title: '手术类型',
      dataIndex: 'surgeryTypeName',
      key: 'surgeryTypeName',
      width: 120
    },
    {
      title: '当前状态',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string, record: WorkflowSimpleVO) => (
        <Tag color={statusColors[status]}>{record.statusName}</Tag>
      )
    },
    {
      title: '当前处理人',
      dataIndex: 'currentHandler',
      key: 'currentHandler',
      width: 100,
      render: (handler: string | null, record: WorkflowSimpleVO) => (
        <div>
          <div>{handler || '-'}</div>
          {record.currentHandlerRole && (
            <div style={{ fontSize: 12, color: '#999' }}>{record.currentHandlerRole}</div>
          )}
        </div>
      )
    },
    {
      title: '阻塞原因',
      dataIndex: 'blockReason',
      key: 'blockReason',
      ellipsis: true
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: WorkflowSimpleVO) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/workflow/${record.id}`)}
        >
          查看
        </Button>
      )
    }
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="待处理总数" value={stats.total} />
          </Col>
          <Col span={6}>
            <Statistic title="术前检查中" value={stats.inCheck} />
          </Col>
          <Col span={6}>
            <Statistic title="排期中" value={stats.inSchedule} />
          </Col>
          <Col span={6}>
            <Statistic title="已驳回" value={stats.blocked} valueStyle={{ color: '#cf1322' }} />
          </Col>
        </Row>
      </Card>

      <Card
        title="工作面板"
        extra={
          <Space>
            <Select
              style={{ width: 150 }}
              placeholder="筛选处理人"
              allowClear
              onChange={setSelectedUser}
              options={users.map(u => ({ label: u.realName, value: u.id }))}
            />
            <Button icon={<PlusOutlined />} type="primary" onClick={() => setIsModalOpen(true)}>
              新建流程
            </Button>
            <Button onClick={() => navigate('/schedule')}>手术排班表</Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={workflows}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="新建手术流程"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label="患者ID"
            name="patientId"
            rules={[{ required: true, message: '请输入患者ID' }]}
          >
            <Select
              placeholder="选择患者"
              options={patients.map(p => ({
                label: `${p.patientNo} - ${p.name} (${p.gender}，${p.age}岁)`,
                value: p.id
              }))}
            />
          </Form.Item>
          <Form.Item
            label="手术类型"
            name="surgeryType"
            rules={[{ required: true, message: '请选择手术类型' }]}
          >
            <Select
              options={Object.entries(SurgeryType).map(([key]) => ({
                label: SurgeryTypeLabel[key as SurgeryType],
                value: key
              }))}
            />
          </Form.Item>
          <Form.Item label="备注" name="remarks">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
