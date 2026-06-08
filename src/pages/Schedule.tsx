import { useState } from 'react'
import { CalendarClock, Plus, FileWarning } from 'lucide-react'
import { Table, Button, Tag, Modal, Form, Input, Select, DatePicker, message, Drawer, Steps } from 'antd'
import dayjs from 'dayjs'
import { useScheduleStore, useRoleStore, useExceptionStore } from '@/stores'
import { useSettlementStore } from '@/stores/settlementStore'
import { useLogStore } from '@/stores/logStore'
import { useNavigate } from 'react-router-dom'
import type { Schedule, Vehicle, ScheduleStatus } from '@/types'
import { SCHEDULE_STATUS_MAP, EXCEPTION_TYPE_MAP, ROLE_CONFIGS, REJECTION_CATEGORY_MAP } from '@/types'

const STATUS_COLOR_MAP: Record<string, string> = {
  PENDING: 'blue',
  DEPARTED: 'orange',
  RETURNED: 'green',
  SETTLED: 'default',
}

const STATUS_STEPS: ScheduleStatus[] = ['PENDING', 'DEPARTED', 'RETURNED', 'SETTLED']

export default function SchedulePage() {
  const { schedules, vehicles, createSchedule, createSupplementSchedule, departSchedule, returnSchedule } = useScheduleStore()
  const { currentRole, hasPermission } = useRoleStore()
  const { createException, getExceptionsByScheduleId } = useExceptionStore()
  const { settlements, getRejectionsBySettlementId } = useSettlementStore()
  const { getLogsByEntityId } = useLogStore()
  const navigate = useNavigate()

  const [drawerVisible, setDrawerVisible] = useState(false)
  const [supplementDrawerVisible, setSupplementDrawerVisible] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ visible: boolean; type: 'depart' | 'return'; schedule: Schedule | null }>({
    visible: false,
    type: 'depart',
    schedule: null,
  })
  const [exceptionModal, setExceptionModal] = useState<{ visible: boolean; scheduleId: string }>({
    visible: false,
    scheduleId: '',
  })
  const [detailModal, setDetailModal] = useState(false)

  const [createForm] = Form.useForm()
  const [supplementForm] = Form.useForm()
  const [exceptionForm] = Form.useForm()

  const roleLabel = ROLE_CONFIGS.find((c) => c.name === currentRole)?.label ?? ''

  const getPlateNo = (vehicleId: string) => {
    const vehicle = vehicles.find((v: Vehicle) => v.id === vehicleId)
    return vehicle?.plateNo ?? vehicleId
  }

  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields()
      createSchedule({
        ...values,
        departTime: values.departTime?.toISOString() ?? '',
        expectedReturn: values.expectedReturn?.toISOString() ?? '',
        actualReturn: '',
        isSupplement: false,
        createdBy: roleLabel,
      })
      message.success('排班创建成功')
      setDrawerVisible(false)
      createForm.resetFields()
    } catch {}
  }

  const handleSupplementSubmit = async () => {
    try {
      const values = await supplementForm.validateFields()
      createSupplementSchedule({
        ...values,
        departTime: values.departTime?.toISOString() ?? '',
        expectedReturn: values.expectedReturn?.toISOString() ?? '',
        actualReturn: '',
        isSupplement: true,
        createdBy: roleLabel,
      })
      message.success('补录排班创建成功')
      setSupplementDrawerVisible(false)
      supplementForm.resetFields()
    } catch {}
  }

  const handleConfirmOk = () => {
    if (!confirmModal.schedule) return
    if (confirmModal.type === 'depart') {
      departSchedule(confirmModal.schedule.id, roleLabel, currentRole)
      message.success('已确认出车')
    } else {
      returnSchedule(confirmModal.schedule.id, roleLabel, currentRole)
      message.success('已确认回车')
    }
    setConfirmModal({ visible: false, type: 'depart', schedule: null })
  }

  const handleExceptionOk = async () => {
    try {
      const values = await exceptionForm.validateFields()
      createException({
        scheduleId: exceptionModal.scheduleId,
        type: values.type,
        description: values.description,
        reportedBy: roleLabel,
      })
      message.success('异常标记成功')
      setExceptionModal({ visible: false, scheduleId: '' })
      exceptionForm.resetFields()
    } catch {}
  }

  const sortedSchedules = [...schedules].sort((a, b) =>
    dayjs(b.departTime).unix() - dayjs(a.departTime).unix()
  )

  const detailSchedule = selectedSchedule
  const detailExceptions = detailSchedule ? getExceptionsByScheduleId(detailSchedule.id) : []
  const detailSettlement = detailSchedule ? settlements.find((s) => s.scheduleId === detailSchedule.id) : undefined
  const detailRejections = detailSettlement ? getRejectionsBySettlementId(detailSettlement.id) : []
  const detailLogs = detailSchedule ? getLogsByEntityId(detailSchedule.id) : []

  const currentStep = detailSchedule ? STATUS_STEPS.indexOf(detailSchedule.status) : 0

  const columns = [
    {
      title: '行程单号',
      dataIndex: 'tripNo',
      key: 'tripNo',
      width: 150,
      render: (v: string, record: Schedule) => (
        <div className="flex items-center gap-1.5">
          {record.isSupplement && (
            <Tag color="amber" className="text-xs shrink-0">补录</Tag>
          )}
          <span className="font-medium">{v}</span>
        </div>
      ),
    },
    { title: '车辆', dataIndex: 'vehicleId', key: 'vehicleId', width: 100, render: (v: string) => getPlateNo(v) },
    { title: '司机', dataIndex: 'driverName', key: 'driverName', width: 80 },
    { title: '导游', dataIndex: 'guideName', key: 'guideName', width: 80 },
    {
      title: '出发时间',
      dataIndex: 'departTime',
      key: 'departTime',
      width: 140,
      render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-',
    },
    {
      title: '预计返回',
      dataIndex: 'expectedReturn',
      key: 'expectedReturn',
      width: 140,
      render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: Schedule['status']) => (
        <Tag color={STATUS_COLOR_MAP[status]}>{SCHEDULE_STATUS_MAP[status]}</Tag>
      ),
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 120, ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 260,
      render: (_: unknown, record: Schedule) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {record.status === 'PENDING' && hasPermission('schedule:depart') && (
            <Button size="small" type="primary" onClick={() => setConfirmModal({ visible: true, type: 'depart', schedule: record })}>确认出车</Button>
          )}
          {record.status === 'DEPARTED' && hasPermission('schedule:return') && (
            <Button size="small" type="primary" onClick={() => setConfirmModal({ visible: true, type: 'return', schedule: record })}>确认回车</Button>
          )}
          {hasPermission('exception:create') && (
            <Button size="small" danger onClick={() => setExceptionModal({ visible: true, scheduleId: record.id })}>标记异常</Button>
          )}
          <Button size="small" type="link" onClick={() => { setSelectedSchedule(record); setDetailModal(true) }}>详情</Button>
        </div>
      ),
    },
  ]

  const vehicleOptions = vehicles.map((v: Vehicle) => ({ label: `${v.plateNo}（${v.type}）`, value: v.id }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock size={20} className="text-[#1a2332]" />
          <h1 className="text-lg font-semibold text-[#1a2332] m-0">车辆排班</h1>
          <span className="text-xs text-gray-400">共{schedules.length}条</span>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission('schedule:create') && (
            <>
              <Button type="primary" icon={<Plus size={14} />} onClick={() => setDrawerVisible(true)}>
                新增排班
              </Button>
              <Button icon={<FileWarning size={14} />} onClick={() => setSupplementDrawerVisible(true)}>
                补录排班
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <Table
          rowKey="id"
          bordered
          size="middle"
          columns={columns}
          dataSource={sortedSchedules}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Drawer
        title="新增排班"
        open={drawerVisible}
        onClose={() => { setDrawerVisible(false); createForm.resetFields() }}
        width={420}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => { setDrawerVisible(false); createForm.resetFields() }}>取消</Button>
            <Button type="primary" onClick={handleCreateSubmit}>提交</Button>
          </div>
        }
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="tripNo" label="行程单号" rules={[{ required: true, message: '请输入行程单号' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="vehicleId" label="车辆" rules={[{ required: true, message: '请选择车辆' }]}>
            <Select options={vehicleOptions} placeholder="请选择车辆" />
          </Form.Item>
          <Form.Item name="driverName" label="司机" rules={[{ required: true, message: '请输入司机姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="guideName" label="导游" rules={[{ required: true, message: '请输入导游姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="departTime" label="出发时间" rules={[{ required: true, message: '请选择出发时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expectedReturn" label="预计返回" rules={[{ required: true, message: '请选择预计返回时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title={
          <div className="flex items-center gap-2">
            <FileWarning size={16} className="text-amber-500" />
            <span>补录排班</span>
            <Tag color="amber" className="ml-1">补录</Tag>
          </div>
        }
        open={supplementDrawerVisible}
        onClose={() => { setSupplementDrawerVisible(false); supplementForm.resetFields() }}
        width={420}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => { setSupplementDrawerVisible(false); supplementForm.resetFields() }}>取消</Button>
            <Button type="primary" onClick={handleSupplementSubmit}>提交补录</Button>
          </div>
        }
      >
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 text-xs text-amber-800">
          补录排班用于未提前创建排班但实际已发生用车的情况。补录排班会标记「补录」标签，全程可追溯。
        </div>
        <Form form={supplementForm} layout="vertical">
          <Form.Item name="tripNo" label="行程单号" rules={[{ required: true, message: '请输入行程单号' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="vehicleId" label="车辆" rules={[{ required: true, message: '请选择车辆' }]}>
            <Select options={vehicleOptions} placeholder="请选择车辆" />
          </Form.Item>
          <Form.Item name="driverName" label="司机" rules={[{ required: true, message: '请输入司机姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="guideName" label="导游" rules={[{ required: true, message: '请输入导游姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="departTime" label="出发时间" rules={[{ required: true, message: '请选择出发时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expectedReturn" label="预计返回" rules={[{ required: true, message: '请选择预计返回时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请填写补录原因" />
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        title={confirmModal.type === 'depart' ? '确认出车' : '确认回车'}
        open={confirmModal.visible}
        onOk={handleConfirmOk}
        onCancel={() => setConfirmModal({ visible: false, type: 'depart', schedule: null })}
        okText="确认"
        cancelText="取消"
      >
        <p>确定要{confirmModal.type === 'depart' ? '确认出车' : '确认回车'}吗？</p>
        {confirmModal.schedule && (
          <div className="bg-gray-50 rounded p-3 text-sm mt-2">
            <div>行程单号：{confirmModal.schedule.tripNo}</div>
            <div>车辆：{getPlateNo(confirmModal.schedule.vehicleId)}</div>
            <div>司机：{confirmModal.schedule.driverName}</div>
          </div>
        )}
      </Modal>

      <Modal
        title="标记异常"
        open={exceptionModal.visible}
        onOk={handleExceptionOk}
        onCancel={() => { setExceptionModal({ visible: false, scheduleId: '' }); exceptionForm.resetFields() }}
        okText="确认标记"
        cancelText="取消"
      >
        <Form form={exceptionForm} layout="vertical">
          <Form.Item name="type" label="异常类型" rules={[{ required: true, message: '请选择异常类型' }]}>
            <Select>
              {Object.entries(EXCEPTION_TYPE_MAP).map(([key, label]) => (
                <Select.Option key={key} value={key}>{label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述" rules={[{ required: true, message: '请输入异常描述' }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={null}
        open={detailModal}
        onCancel={() => { setDetailModal(false); setSelectedSchedule(null) }}
        footer={<Button onClick={() => { setDetailModal(false); setSelectedSchedule(null) }}>关闭</Button>}
        width={720}
      >
        {detailSchedule && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-[#1a2332] m-0">{detailSchedule.tripNo}</h3>
                {detailSchedule.isSupplement && <Tag color="amber">补录</Tag>}
                <Tag color={STATUS_COLOR_MAP[detailSchedule.status]}>{SCHEDULE_STATUS_MAP[detailSchedule.status]}</Tag>
              </div>
            </div>

            <Steps
              size="small"
              current={currentStep}
              items={STATUS_STEPS.map((s) => ({
                title: SCHEDULE_STATUS_MAP[s],
              }))}
            />

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">车辆</span>
                <div className="font-medium text-[#1a2332] mt-0.5">{getPlateNo(detailSchedule.vehicleId)}</div>
              </div>
              <div>
                <span className="text-gray-400">司机</span>
                <div className="font-medium text-[#1a2332] mt-0.5">{detailSchedule.driverName}</div>
              </div>
              <div>
                <span className="text-gray-400">导游</span>
                <div className="font-medium text-[#1a2332] mt-0.5">{detailSchedule.guideName}</div>
              </div>
              <div>
                <span className="text-gray-400">出发时间</span>
                <div className="font-medium text-[#1a2332] mt-0.5">{detailSchedule.departTime ? dayjs(detailSchedule.departTime).format('YYYY-MM-DD HH:mm') : '-'}</div>
              </div>
              <div>
                <span className="text-gray-400">预计返回</span>
                <div className="font-medium text-[#1a2332] mt-0.5">{detailSchedule.expectedReturn ? dayjs(detailSchedule.expectedReturn).format('YYYY-MM-DD HH:mm') : '-'}</div>
              </div>
              <div>
                <span className="text-gray-400">实际返回</span>
                <div className="font-medium text-[#1a2332] mt-0.5">{detailSchedule.actualReturn ? dayjs(detailSchedule.actualReturn).format('YYYY-MM-DD HH:mm') : '-'}</div>
              </div>
            </div>

            {detailSchedule.remark && (
              <div className="bg-gray-50 rounded p-3 text-sm">
                <span className="text-gray-400">备注：</span>
                <span className="text-[#1a2332]">{detailSchedule.remark}</span>
              </div>
            )}

            {detailExceptions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[#1a2332] mb-2 flex items-center gap-1.5">
                  <span className="w-1 h-4 bg-red-400 rounded" />
                  关联异常
                </h4>
                <div className="space-y-2">
                  {detailExceptions.map((exc) => (
                    <div key={exc.id} className="flex items-center gap-2 bg-red-50 rounded px-3 py-2 text-sm">
                      <Tag color="red">{EXCEPTION_TYPE_MAP[exc.type]}</Tag>
                      <span className="text-gray-700 flex-1">{exc.description}</span>
                      <span className="text-xs text-gray-400">{dayjs(exc.reportedAt).format('MM-DD HH:mm')}</span>
                      <Tag color={exc.status === 'pending' ? 'red' : 'green'} className="text-xs">
                        {exc.status === 'pending' ? '待处理' : '已处理'}
                      </Tag>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailSettlement && (
              <div>
                <h4 className="text-sm font-semibold text-[#1a2332] mb-2 flex items-center gap-1.5">
                  <span className="w-1 h-4 bg-emerald-400 rounded" />
                  关联结算
                  <Button
                    type="link"
                    size="small"
                    onClick={() => navigate('/settlement')}
                    className="text-xs"
                  >
                    查看结算详情 →
                  </Button>
                </h4>
                <div className="bg-gray-50 rounded p-3">
                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">基础车费</span>
                      <div className="font-medium text-[#1a2332]">¥{detailSettlement.baseFee}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">超时费</span>
                      <div className="font-medium text-[#1a2332]">¥{detailSettlement.overtimeFee}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">路桥费</span>
                      <div className="font-medium text-[#1a2332]">¥{detailSettlement.tollFee}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">停车费</span>
                      <div className="font-medium text-[#1a2332]">¥{detailSettlement.parkingFee}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-500">合计</span>
                    <span className="text-base font-bold text-[#1a2332]">¥{detailSettlement.totalFee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Tag color={
                      detailSettlement.status === 'APPROVED' ? 'green' :
                      detailSettlement.status === 'REJECTED' ? 'red' : 'blue'
                    }>
                      {detailSettlement.status === 'APPROVED' ? '已通过' :
                       detailSettlement.status === 'REJECTED' ? '已驳回' : '待审核'}
                    </Tag>
                    {detailRejections.length > 0 && detailRejections.map((rej) => (
                      <div key={rej.id} className="flex items-center gap-2">
                        {rej.category && (() => {
                          const catConfig = REJECTION_CATEGORY_MAP[rej.category]
                          return catConfig ? (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${catConfig.color} ${catConfig.bgColor} border ${catConfig.borderColor}`}>
                              {catConfig.label}
                            </span>
                          ) : null
                        })()}
                        <span className="text-xs text-red-500">
                          {rej.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {detailLogs.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[#1a2332] mb-2 flex items-center gap-1.5">
                  <span className="w-1 h-4 bg-blue-400 rounded" />
                  操作记录
                </h4>
                <div className="space-y-1.5">
                  {detailLogs
                    .sort((a, b) => b.operatedAt.localeCompare(a.operatedAt))
                    .map((log) => (
                      <div key={log.id} className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="text-gray-300">{dayjs(log.operatedAt).format('MM-DD HH:mm')}</span>
                        <span className="font-medium text-gray-700">{log.operator}</span>
                        <span>{log.action === 'create' ? '创建' : log.action === 'depart' ? '确认出车' : log.action === 'return' ? '确认回车' : log.action === 'supplement' ? '补录排班' : log.action === 'settle' ? '标记结算' : log.action === 'edit' ? '编辑' : log.action}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
