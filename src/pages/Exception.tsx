import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Plus, Link2 } from 'lucide-react'
import { Card, Tag, Button, Modal, Form, Select, Input, Empty, message } from 'antd'
import dayjs from 'dayjs'
import { useExceptionStore } from '@/stores/exceptionStore'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useRoleStore } from '@/stores/roleStore'
import { useSettlementStore } from '@/stores/settlementStore'
import type { ExceptionRecord, ExceptionType } from '@/types'
import { EXCEPTION_TYPE_MAP, ROLE_CONFIGS } from '@/types'

const TYPE_COLOR_MAP: Record<ExceptionType, string> = {
  DELAY: 'orange',
  VEHICLE_CHANGE: 'purple',
  EMPTY_TRIP: 'red',
  OVERTIME: 'gold',
  OTHER: 'default',
}

const SEVERITY_BORDER_MAP: Record<ExceptionType, string> = {
  DELAY: '#fa8c16',
  VEHICLE_CHANGE: '#722ed1',
  EMPTY_TRIP: '#f5222d',
  OVERTIME: '#d48806',
  OTHER: '#d9d9d9',
}

type FilterKey = 'ALL' | ExceptionType

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: '全部' },
  { key: 'DELAY', label: '延误' },
  { key: 'VEHICLE_CHANGE', label: '换车' },
  { key: 'EMPTY_TRIP', label: '空驶' },
  { key: 'OVERTIME', label: '超时' },
  { key: 'OTHER', label: '其他' },
]

export default function Exception() {
  const navigate = useNavigate()
  const { exceptions, createException, resolveException } = useExceptionStore()
  const { schedules, getScheduleById } = useScheduleStore()
  const { settlements } = useSettlementStore()
  const { currentRole, hasPermission } = useRoleStore()

  const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL')
  const [newModalOpen, setNewModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedException, setSelectedException] = useState<ExceptionRecord | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    if (window.location.pathname === '/exception/new' && hasPermission('exception:create')) {
      setNewModalOpen(true)
      navigate('/exception', { replace: true })
    }
  }, [navigate, hasPermission])

  const filtered = activeFilter === 'ALL'
    ? exceptions
    : exceptions.filter((e) => e.type === activeFilter)

  const currentRoleLabel = ROLE_CONFIGS.find((c) => c.name === currentRole)?.label ?? ''

  const handleCreate = () => {
    form.validateFields().then((values) => {
      createException({
        scheduleId: values.scheduleId,
        type: values.type,
        description: values.description,
        reportedBy: currentRoleLabel,
      })
      message.success('异常记录已创建')
      setNewModalOpen(false)
      form.resetFields()
    })
  }

  const handleResolve = (id: string) => {
    resolveException(id)
    message.success('已标记为已处理')
  }

  const openDetail = (exc: ExceptionRecord) => {
    setSelectedException(exc)
    setDetailModalOpen(true)
  }

  const relatedSchedule = selectedException ? getScheduleById(selectedException.scheduleId) : undefined
  const relatedSettlement = selectedException
    ? settlements.find((s) => s.scheduleId === selectedException.scheduleId)
    : undefined

  const pendingCount = exceptions.filter((e) => e.status === 'pending').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className="text-orange-500" />
          <h1 className="text-lg font-bold text-[#1a2332] m-0">异常说明</h1>
          {pendingCount > 0 && (
            <Tag color="red">{pendingCount}条待处理</Tag>
          )}
        </div>
        {hasPermission('exception:create') && (
          <Button
            type="primary"
            icon={<Plus size={14} />}
            onClick={() => setNewModalOpen(true)}
          >
            新增异常
          </Button>
        )}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeFilter === tab.key
                ? 'bg-[#1a2332] text-white'
                : 'text-gray-500 bg-white border border-gray-200 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 p-12">
          <Empty description="暂无异常记录" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((exc) => {
            const schedule = getScheduleById(exc.scheduleId)
            const settlement = settlements.find((s) => s.scheduleId === exc.scheduleId)
            return (
              <div
                key={exc.id}
                className="bg-white rounded-lg border border-gray-100 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all"
                style={{ borderLeft: `4px solid ${SEVERITY_BORDER_MAP[exc.type]}` }}
                onClick={() => openDetail(exc)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Tag color={TYPE_COLOR_MAP[exc.type]}>
                        {EXCEPTION_TYPE_MAP[exc.type]}
                      </Tag>
                      <Tag color={exc.status === 'pending' ? 'red' : 'green'}>
                        {exc.status === 'pending' ? '待处理' : '已处理'}
                      </Tag>
                      {schedule?.isSupplement && (
                        <Tag color="amber">补录</Tag>
                      )}
                    </div>
                    {exc.status === 'pending' && hasPermission('exception:create') && (
                      <Button
                        size="small"
                        type="link"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleResolve(exc.id)
                        }}
                      >
                        标记已处理
                      </Button>
                    )}
                  </div>
                  <p className="text-gray-700 mb-3 text-sm">{exc.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-3">
                      <span>排班: {schedule?.tripNo ?? '-'}</span>
                      <span>{exc.reportedBy}</span>
                    </div>
                    <span>{dayjs(exc.reportedAt).format('MM-DD HH:mm')}</span>
                  </div>
                  {settlement && (
                    <div className="mt-2 pt-2 border-t border-gray-50 flex items-center gap-2 text-xs">
                      <Link2 size={12} className="text-gray-400" />
                      <span className="text-gray-400">关联结算：</span>
                      <Tag color={
                        settlement.status === 'APPROVED' ? 'green' :
                        settlement.status === 'REJECTED' ? 'red' : 'blue'
                      } className="text-xs">
                        {settlement.status === 'APPROVED' ? '已通过' :
                         settlement.status === 'REJECTED' ? '已驳回' : '待审核'}
                      </Tag>
                      <span className="text-gray-500">¥{settlement.totalFee.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        title="新增异常"
        open={newModalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setNewModalOpen(false)
          form.resetFields()
        }}
        okText="提交"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="scheduleId" label="关联排班" rules={[{ required: true, message: '请选择关联排班' }]}>
            <Select placeholder="请选择排班" showSearch optionFilterProp="children">
              {schedules.map((s) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.tripNo} - {s.driverName}
                  {s.isSupplement ? '（补录）' : ''}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="type" label="异常类型" rules={[{ required: true, message: '请选择异常类型' }]}>
            <Select placeholder="请选择异常类型">
              {(Object.entries(EXCEPTION_TYPE_MAP) as [ExceptionType, string][]).map(([key, label]) => (
                <Select.Option key={key} value={key}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="异常说明" rules={[{ required: true, message: '请输入异常说明' }]}>
            <Input.TextArea rows={4} placeholder="请描述异常情况" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="异常详情"
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false)
          setSelectedException(null)
        }}
        footer={null}
        width={600}
      >
        {selectedException && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag color={TYPE_COLOR_MAP[selectedException.type]}>
                  {EXCEPTION_TYPE_MAP[selectedException.type]}
                </Tag>
                <Tag color={selectedException.status === 'pending' ? 'red' : 'green'}>
                  {selectedException.status === 'pending' ? '待处理' : '已处理'}
                </Tag>
              </div>
              <p className="text-gray-700">{selectedException.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                <span>报告人: {selectedException.reportedBy}</span>
                <span>报告时间: {dayjs(selectedException.reportedAt).format('YYYY-MM-DD HH:mm')}</span>
              </div>
            </div>

            {relatedSchedule && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2 text-sm font-medium text-[#1a2332]">
                  <span className="w-1 h-4 bg-blue-400 rounded" />
                  关联排班
                  {relatedSchedule.isSupplement && <Tag color="amber" className="ml-1">补录</Tag>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">排班号</span>
                    <span className="font-medium">{relatedSchedule.tripNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">司机</span>
                    <span>{relatedSchedule.driverName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">导游</span>
                    <span>{relatedSchedule.guideName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">排班状态</span>
                    <span>{SCHEDULE_STATUS_MAP?.[relatedSchedule.status] ?? relatedSchedule.status}</span>
                  </div>
                </div>
              </div>
            )}

            {relatedSettlement && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2 text-sm font-medium text-[#1a2332]">
                  <span className="w-1 h-4 bg-emerald-400 rounded" />
                  关联结算
                  <button
                    onClick={() => navigate('/settlement')}
                    className="text-xs text-[#e67e22] hover:text-[#d35400] ml-auto"
                  >
                    查看结算详情 →
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">基础费用</span>
                    <span>¥{relatedSettlement.baseFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">总费用</span>
                    <span className="font-bold">¥{relatedSettlement.totalFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-gray-500">结算状态</span>
                    <Tag color={
                      relatedSettlement.status === 'APPROVED' ? 'green' :
                      relatedSettlement.status === 'REJECTED' ? 'red' : 'blue'
                    }>
                      {relatedSettlement.status === 'APPROVED' ? '已通过' :
                       relatedSettlement.status === 'REJECTED' ? '已驳回' : '待审核'}
                    </Tag>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

const SCHEDULE_STATUS_MAP: Record<string, string> = {
  PENDING: '待出车',
  DEPARTED: '已出车',
  RETURNED: '已回车',
  SETTLED: '已结算',
}
