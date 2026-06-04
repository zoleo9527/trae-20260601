import { useEffect, useState } from 'react'
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Table,
  Steps,
  Timeline,
  Modal,
  Form,
  Select,
  Input,
  DatePicker,
  TimePicker,
  Row,
  Col,
  message
} from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { workflowApi, commonApi } from '../services/api'
import { WorkflowDetailVO, WorkflowStatus, CheckItemStatus, UserVO, RoleType } from '../types'

const stepConfig = [
  { status: WorkflowStatus.PENDING_REGISTRATION, title: '登记' },
  { status: WorkflowStatus.PREOP_IN_PROGRESS, title: '术前检查' },
  { status: WorkflowStatus.PREOP_REVIEW, title: '检查审核' },
  { status: WorkflowStatus.PREOP_APPROVED, title: '检查通过' },
  { status: WorkflowStatus.SCHEDULING, title: '手术排期' },
  { status: WorkflowStatus.SCHEDULE_REVIEW, title: '排期审核' },
  { status: WorkflowStatus.SCHEDULE_CONFIRMED, title: '排期确认' },
  { status: WorkflowStatus.COMPLETED, title: '完成' }
]

export default function WorkflowDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workflow, setWorkflow] = useState<WorkflowDetailVO | null>(null)
  const [users, setUsers] = useState<UserVO[]>([])
  const [activeTab, setActiveTab] = useState('info')
  const [checkModal, setCheckModal] = useState(false)
  const [scheduleModal, setScheduleModal] = useState(false)
  const [reviewModal, setReviewModal] = useState(false)
  const [startCheckModal, setStartCheckModal] = useState(false)
  const [selectedCheck, setSelectedCheck] = useState<any>(null)
  const [reviewType, setReviewType] = useState<'check' | 'schedule'>('check')
  const [form] = Form.useForm()
  const [startCheckForm] = Form.useForm()

  const loadDetail = async () => {
    if (!id) return
    try {
      const [detailData, userData] = await Promise.all([
        workflowApi.getDetail(Number(id)),
        commonApi.getUsers()
      ])
      setWorkflow(detailData)
      setUsers(userData)
    } catch (error) {
      message.error('加载详情失败')
    }
  }

  useEffect(() => {
    loadDetail()
  }, [id])

  const getCurrentStep = () => {
    if (!workflow) return 0
    const status = workflow.status
    const idx = stepConfig.findIndex(s => s.status === status)
    return idx >= 0 ? idx : 0
  }

  const canStartCheck = () => {
    if (!workflow) return false
    return workflow.status === WorkflowStatus.PENDING_REGISTRATION
  }

  const canSubmitCheck = () => {
    if (!workflow) return false
    return workflow.status === WorkflowStatus.PREOP_IN_PROGRESS &&
      workflow.checkItems.every(c => c.status === CheckItemStatus.COMPLETED)
  }

  const canReviewCheck = () => {
    if (!workflow) return false
    return workflow.status === WorkflowStatus.PREOP_REVIEW
  }

  const canStartScheduling = () => {
    if (!workflow) return false
    return workflow.status === WorkflowStatus.PREOP_APPROVED
  }

  const canReviewSchedule = () => {
    if (!workflow) return false
    return workflow.status === WorkflowStatus.SCHEDULE_REVIEW
  }

  const handleStartCheck = () => {
    setStartCheckModal(true)
  }

  const handleConfirmStartCheck = async (values: any) => {
    if (!workflow) return
    const receptionist = users.find(u => u.role === RoleType.RECEPTIONIST)
    if (!receptionist) return
    try {
      await workflowApi.startCheck(workflow.id, receptionist.id, values.checkerId)
      message.success('已启动术前检查')
      setStartCheckModal(false)
      startCheckForm.resetFields()
      loadDetail()
    } catch (error: any) {
      message.error(error.message || '操作失败')
    }
  }

  const handleSubmitCheck = async () => {
    if (!workflow) return
    const specialist = users.find(u => u.role === RoleType.SPECIALIST)
    if (!specialist) return
    try {
      await workflowApi.submitCheck(workflow.id, specialist.id)
      message.success('已提交审核')
      loadDetail()
    } catch (error: any) {
      message.error(error.message || '操作失败')
    }
  }

  const handleStartScheduling = async () => {
    if (!workflow) return
    const receptionist = users.find(u => u.role === RoleType.RECEPTIONIST)
    if (!receptionist) return
    try {
      await workflowApi.startScheduling(workflow.id, receptionist.id)
      message.success('已进入排期阶段')
      loadDetail()
    } catch (error: any) {
      message.error(error.message || '操作失败')
    }
  }

  const handleUpdateCheckItem = async (values: any) => {
    try {
      await workflowApi.updateCheckItem({
        checkId: selectedCheck.id,
        ...values
      })
      message.success('检查项已更新')
      setCheckModal(false)
      form.resetFields()
      loadDetail()
    } catch (error: any) {
      message.error(error.message || '操作失败')
    }
  }

  const handleSubmitSchedule = async (values: any) => {
    if (!workflow) return
    const receptionist = users.find(u => u.role === RoleType.RECEPTIONIST)
    if (!receptionist) return
    try {
      await workflowApi.submitSchedule(workflow.id, {
        handlerId: receptionist.id,
        surgeryDate: values.surgeryDate.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm'),
        operatingRoom: values.operatingRoom,
        surgeonId: values.surgeonId,
        materialList: values.materialList,
        remarks: values.remarks
      })
      message.success('排期已提交审核')
      setScheduleModal(false)
      form.resetFields()
      loadDetail()
    } catch (error: any) {
      message.error(error.message || '操作失败')
    }
  }

  const handleReview = async (values: any) => {
    if (!workflow) return
    const supervisor = users.find(u => u.role === RoleType.SUPERVISOR)
    if (!supervisor) return
    try {
      if (reviewType === 'check') {
        await workflowApi.reviewCheck(workflow.id, {
          reviewerId: supervisor.id,
          approved: values.approved,
          rejectionReason: values.rejectionReason
        })
      } else {
        await workflowApi.reviewSchedule(workflow.id, {
          reviewerId: supervisor.id,
          approved: values.approved,
          rejectionReason: values.rejectionReason
        })
      }
      message.success('审核完成')
      setReviewModal(false)
      form.resetFields()
      loadDetail()
    } catch (error: any) {
      message.error(error.message || '操作失败')
    }
  }

  const checkColumns = [
    {
      title: '检查项目',
      dataIndex: 'checkTypeName',
      key: 'checkTypeName'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => (
        <Tag color={
          status === CheckItemStatus.COMPLETED ? 'success' :
          status === CheckItemStatus.IN_PROGRESS ? 'processing' :
          status === CheckItemStatus.ABNORMAL ? 'warning' : 'default'
        }>
          {record.statusName}
        </Tag>
      )
    },
    {
      title: '测量值',
      dataIndex: 'measurementValue',
      key: 'measurementValue'
    },
    {
      title: '参考范围',
      dataIndex: 'referenceRange',
      key: 'referenceRange'
    },
    {
      title: '检查人',
      dataIndex: 'checkedByName',
      key: 'checkedByName'
    },
    {
      title: '检查时间',
      dataIndex: 'checkedAt',
      key: 'checkedAt'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => {
        if (workflow?.status !== WorkflowStatus.PREOP_IN_PROGRESS &&
            workflow?.status !== WorkflowStatus.PREOP_REJECTED) return null
        return (
          <Button type="link" onClick={() => {
            setSelectedCheck(record)
            const currentHandlerUser = users.find(u => u.realName === workflow?.currentHandler)
            const defaultOperatorId = record.checkedByName
              ? users.find(u => u.realName === record.checkedByName)?.id
              : currentHandlerUser?.id
            form.setFieldsValue({
              status: record.status,
              checkResult: record.checkResult,
              measurementValue: record.measurementValue,
              referenceRange: record.referenceRange,
              operatorId: defaultOperatorId
            })
            setCheckModal(true)
          }}>
            编辑
          </Button>
        )
      }
    }
  ]

  if (!workflow) return null

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          {canStartCheck() && (
            <Button type="primary" onClick={handleStartCheck}>
              启动术前检查
            </Button>
          )}
          {canSubmitCheck() && (
            <Button type="primary" onClick={handleSubmitCheck}>
              提交检查审核
            </Button>
          )}
          {canReviewCheck() && (
            <Button type="primary" onClick={() => {
              setReviewType('check')
              setReviewModal(true)
            }}>
              审核检查结果
            </Button>
          )}
          {canStartScheduling() && (
            <Button type="primary" onClick={handleStartScheduling}>
              开始手术排期
            </Button>
          )}
          {workflow.status === WorkflowStatus.SCHEDULING && (
            <Button type="primary" onClick={() => setScheduleModal(true)}>
              提交排期
            </Button>
          )}
          {canReviewSchedule() && (
            <Button type="primary" onClick={() => {
              setReviewType('schedule')
              setReviewModal(true)
            }}>
              审核排期
            </Button>
          )}
        </Space>

        <Steps current={getCurrentStep()} items={stepConfig.map(s => ({ title: s.title }))} />
      </Card>

      <Row gutter={16}>
        <Col span={16}>
          <Card
            tabList={[
              { key: 'info', tab: '基本信息' },
              { key: 'check', tab: '术前检查' },
              { key: 'schedule', tab: '手术排期' }
            ]}
            activeTabKey={activeTab}
            onTabChange={setActiveTab}
          >
            {activeTab === 'info' && (
              <Descriptions column={2}>
                <Descriptions.Item label="流程编号">{workflow.workflowNo}</Descriptions.Item>
                <Descriptions.Item label="患者姓名">{workflow.patientName}</Descriptions.Item>
                <Descriptions.Item label="患者编号">{workflow.patientNo}</Descriptions.Item>
                <Descriptions.Item label="手术类型">{workflow.surgeryTypeName}</Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  <Tag color="blue">{workflow.statusName}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="当前处理人">
                  {workflow.currentHandler} ({workflow.currentHandlerRole})
                </Descriptions.Item>
                <Descriptions.Item label="阻塞原因" span={2}>
                  {workflow.blockReason}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">{workflow.createdAt}</Descriptions.Item>
                <Descriptions.Item label="状态更新时间">{workflow.statusUpdatedAt}</Descriptions.Item>
              </Descriptions>
            )}
            {activeTab === 'check' && (
              <Table
                rowKey="id"
                columns={checkColumns}
                dataSource={workflow.checkItems}
                pagination={false}
              />
            )}
            {activeTab === 'schedule' && workflow.scheduleInfo && (
              <Descriptions column={2}>
                <Descriptions.Item label="手术日期">{workflow.scheduleInfo.surgeryDate}</Descriptions.Item>
                <Descriptions.Item label="手术时间">
                  {workflow.scheduleInfo.startTime} - {workflow.scheduleInfo.endTime}
                </Descriptions.Item>
                <Descriptions.Item label="手术室">{workflow.scheduleInfo.operatingRoom}</Descriptions.Item>
                <Descriptions.Item label="主刀医生">{workflow.scheduleInfo.surgeonName || '-'}</Descriptions.Item>
                <Descriptions.Item label="麻醉师">{workflow.scheduleInfo.anesthesiologistName || '-'}</Descriptions.Item>
                <Descriptions.Item label="确认状态">
                  {workflow.scheduleInfo.confirmed ?
                    <Tag color="success">已确认</Tag> : <Tag color="warning">待确认</Tag>
                  }
                </Descriptions.Item>
                <Descriptions.Item label="耗材清单" span={2}>
                  {workflow.scheduleInfo.materialList || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="备注" span={2}>
                  {workflow.scheduleInfo.remarks || '-'}
                </Descriptions.Item>
              </Descriptions>
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="操作日志">
            <Timeline>
              {workflow.operationLogs.map(log => (
                <Timeline.Item key={log.id} color="blue">
                  <div style={{ marginBottom: 4 }}>
                    <strong>{log.operationType}</strong>
                    <span style={{ color: '#999', marginLeft: 8 }}>{log.createdAt}</span>
                  </div>
                  <div style={{ color: '#666', fontSize: 13 }}>{log.operationDesc}</div>
                  <div style={{ color: '#666', fontSize: 12 }}>操作人：{log.operatorName}</div>
                  {log.remarks && <div style={{ fontSize: 12, color: '#999' }}>{log.remarks}</div>}
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>

      <Modal title="启动术前检查" open={startCheckModal} onCancel={() => setStartCheckModal(false)} footer={null}>
        <Form form={startCheckForm} layout="vertical" onFinish={handleConfirmStartCheck}>
          <Form.Item label="检查负责人" name="checkerId" rules={[{ required: true, message: '请选择检查负责人' }]}>
            <Select
              placeholder="请选择负责本次术前检查的专业人员"
              options={users.filter(u => u.role === RoleType.SPECIALIST).map(u => ({
                label: `${u.realName} (${u.department})`,
                value: u.id
              }))}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认启动</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="编辑检查项" open={checkModal} onCancel={() => setCheckModal(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleUpdateCheckItem}>
          <Form.Item label="检查状态" name="status" rules={[{ required: true }]}>
            <Select options={[
              { label: '待检查', value: CheckItemStatus.PENDING },
              { label: '检查中', value: CheckItemStatus.IN_PROGRESS },
              { label: '已完成', value: CheckItemStatus.COMPLETED },
              { label: '异常', value: CheckItemStatus.ABNORMAL }
            ]} />
          </Form.Item>
          <Form.Item label="检查结果" name="checkResult">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="测量值" name="measurementValue">
            <Input />
          </Form.Item>
          <Form.Item label="参考范围" name="referenceRange">
            <Input />
          </Form.Item>
          <Form.Item label="处理人" name="operatorId" rules={[{ required: true, message: '请选择处理人' }]}>
            <Select options={users.filter(u => u.role === RoleType.SPECIALIST).map(u => ({
              label: u.realName,
              value: u.id
            }))} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="手术排期" open={scheduleModal} onCancel={() => setScheduleModal(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmitSchedule}>
          <Form.Item label="手术日期" name="surgeryDate" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} disabledDate={(d) => d && d.isBefore(dayjs().subtract(1, 'day'))} />
          </Form.Item>
          <Form.Item label="开始时间" name="startTime" rules={[{ required: true }]}>
            <TimePicker minuteStep={15} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="手术室" name="operatingRoom" rules={[{ required: true }]}>
            <Select options={[
              { label: '手术室1', value: 'OR1' },
              { label: '手术室2', value: 'OR2' },
              { label: '手术室3', value: 'OR3' }
            ]} />
          </Form.Item>
          <Form.Item label="主刀医生" name="surgeonId">
            <Select options={users.filter(u => u.role === RoleType.SPECIALIST).map(u => ({
              label: u.realName,
              value: u.id
            }))} />
          </Form.Item>
          <Form.Item label="耗材清单" name="materialList">
            <Input.TextArea rows={2} placeholder="如：人工晶体、手术器械等" />
          </Form.Item>
          <Form.Item label="备注" name="remarks">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>提交审核</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="审核" open={reviewModal} onCancel={() => setReviewModal(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleReview}>
          <Form.Item label="审核结果" name="approved" rules={[{ required: true }]}>
            <Select options={[
              { label: '通过', value: true },
              { label: '驳回', value: false }
            ]} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.approved !== c.approved}>
            {({ getFieldValue }) =>
              !getFieldValue('approved') && (
                <Form.Item label="驳回原因" name="rejectionReason" rules={[{ required: true }]}>
                  <Input.TextArea rows={3} />
                </Form.Item>
              )
            }
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
