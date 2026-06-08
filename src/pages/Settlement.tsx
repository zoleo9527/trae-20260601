import { useState, useMemo } from 'react'
import { Receipt, AlertCircle, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import { Table, Button, Tag, Modal, Form, Input, InputNumber, Select, Descriptions, message, Timeline, Empty } from 'antd'
import dayjs from 'dayjs'
import { useSettlementStore } from '@/stores/settlementStore'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useExceptionStore } from '@/stores/exceptionStore'
import { useRoleStore } from '@/stores/roleStore'
import { useLogStore } from '@/stores/logStore'
import type { Settlement, SettlementStatus, RejectionCategory } from '@/types'
import { SETTLEMENT_STATUS_MAP, SCHEDULE_STATUS_MAP, EXCEPTION_TYPE_MAP, ROLE_CONFIGS, REJECTION_CATEGORY_MAP } from '@/types'

type FilterTab = 'ALL' | SettlementStatus

const FILTER_TABS: { key: FilterTab; label: string; color?: string }[] = [
  { key: 'ALL', label: '全部' },
  { key: 'PENDING_REVIEW', label: '待审核', color: '#1890ff' },
  { key: 'APPROVED', label: '已通过', color: '#52c41a' },
  { key: 'REJECTED', label: '已驳回', color: '#ff4d4f' },
]

const STATUS_TAG_COLOR: Record<SettlementStatus, string> = {
  PENDING_REVIEW: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
}

export default function SettlementPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<RejectionCategory | 'ALL'>('ALL')
  const [overdueFilter, setOverdueFilter] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [approveVisible, setApproveVisible] = useState(false)
  const [rejectVisible, setRejectVisible] = useState(false)
  const [resubmitVisible, setResubmitVisible] = useState(false)
  const [currentSettlement, setCurrentSettlement] = useState<Settlement | null>(null)
  const [rejectForm] = Form.useForm()
  const [resubmitForm] = Form.useForm()

  const { settlements, rejections, approveSettlement, rejectSettlement, resubmitSettlement, getRejectionsBySettlementId, getRejectionCategoryStats, getOverdueRejections, getOverdueRejectionCount } = useSettlementStore()
  const { schedules, getScheduleById, getVehicleById } = useScheduleStore()
  const { getExceptionsByScheduleId } = useExceptionStore()
  const { currentRole, hasPermission } = useRoleStore()
  const { getLogsByEntityId } = useLogStore()

  const currentRoleLabel = ROLE_CONFIGS.find((c) => c.name === currentRole)?.label ?? ''

  const filteredSettlements = useMemo(() => {
    let result = settlements
    if (activeTab !== 'ALL') {
      result = result.filter((s) => s.status === activeTab)
    }
    if (categoryFilter !== 'ALL') {
      const settlementIds = rejections
        .filter((r) => r.category === categoryFilter)
        .map((r) => r.settlementId)
      result = result.filter((s) => settlementIds.includes(s.id))
    }
    if (overdueFilter) {
      const overdueSettlementIds = getOverdueRejections()
        .filter((o) => o.overdue)
        .map((o) => o.rejection.settlementId)
      result = result.filter((s) => overdueSettlementIds.includes(s.id))
    }
    return result
  }, [settlements, rejections, activeTab, categoryFilter, overdueFilter])

  const categoryStats = useMemo(() => getRejectionCategoryStats(30), [rejections, settlements])
  const overdueCount = useMemo(() => getOverdueRejectionCount(), [rejections])

  const pendingCount = settlements.filter((s) => s.status === 'PENDING_REVIEW').length
  const rejectedCount = settlements.filter((s) => s.status === 'REJECTED').length

  const openDetail = (record: Settlement) => {
    setCurrentSettlement(record)
    setDetailVisible(true)
  }

  const openApprove = (record: Settlement) => {
    setCurrentSettlement(record)
    setApproveVisible(true)
  }

  const openReject = (record: Settlement) => {
    setCurrentSettlement(record)
    rejectForm.resetFields()
    setRejectVisible(true)
  }

  const openResubmit = (record: Settlement) => {
    setCurrentSettlement(record)
    resubmitForm.setFieldsValue({
      baseFee: record.baseFee,
      overtimeFee: record.overtimeFee,
      tollFee: record.tollFee,
      parkingFee: record.parkingFee,
    })
    setResubmitVisible(true)
  }

  const handleApprove = () => {
    if (!currentSettlement) return
    approveSettlement(currentSettlement.id, currentRoleLabel, currentRole)
    message.success('审核通过')
    setApproveVisible(false)
  }

  const handleReject = async () => {
    try {
      const values = await rejectForm.validateFields()
      if (!currentSettlement) return
      rejectSettlement(currentSettlement.id, values.category, values.reason, currentRoleLabel, currentRole)
      message.success('已驳回，驳回记录已保存')
      setRejectVisible(false)
    } catch {}
  }

  const handleResubmit = async () => {
    try {
      const values = await resubmitForm.validateFields()
      if (!currentSettlement) return
      const totalFee = values.baseFee + values.overtimeFee + values.tollFee + values.parkingFee
      resubmitSettlement(
        currentSettlement.id,
        {
          baseFee: values.baseFee,
          overtimeFee: values.overtimeFee,
          tollFee: values.tollFee,
          parkingFee: values.parkingFee,
          totalFee,
        },
        currentRoleLabel,
        currentRole,
      )
      message.success('已重新提交，等待审核')
      setResubmitVisible(false)
    } catch {}
  }

  const getRejectionReason = (settlementId: string): string | undefined => {
    const rej = rejections.find((r) => r.settlementId === settlementId && r.status === 'PENDING')
    return rej?.reason
  }

  const getRejectionCategory = (settlementId: string): RejectionCategory | undefined => {
    const rej = rejections.find((r) => r.settlementId === settlementId && r.status === 'PENDING')
    return rej?.category
  }

  const columns = [
    {
      title: '结算单号',
      dataIndex: 'id',
      key: 'id',
      width: 110,
      render: (id: string, record: Settlement) => (
        <div>
          <div className="font-medium text-[#1a2332]">{id}</div>
          {(() => {
            const schedule = getScheduleById(record.scheduleId)
            return schedule?.isSupplement ? (
              <Tag color="amber" className="text-xs mt-0.5">补录</Tag>
            ) : null
          })()}
        </div>
      ),
    },
    {
      title: '关联排班',
      dataIndex: 'scheduleId',
      key: 'scheduleId',
      width: 130,
      render: (scheduleId: string) => {
        const schedule = getScheduleById(scheduleId)
        return schedule ? (
          <span className="text-[#1a2332]">{schedule.tripNo}</span>
        ) : (
          <span className="text-gray-400">{scheduleId}</span>
        )
      },
    },
    {
      title: '司机/导游',
      key: 'driverGuide',
      width: 100,
      render: (_: unknown, record: Settlement) => {
        const schedule = getScheduleById(record.scheduleId)
        return schedule ? (
          <div className="text-sm">
            <div>{schedule.driverName}</div>
            <div className="text-gray-400 text-xs">{schedule.guideName}</div>
          </div>
        ) : '-'
      },
    },
    {
      title: '基础车费',
      dataIndex: 'baseFee',
      key: 'baseFee',
      width: 90,
      render: (v: number) => `¥${v}`,
    },
    {
      title: '路桥费',
      dataIndex: 'tollFee',
      key: 'tollFee',
      width: 80,
      render: (v: number) => `¥${v}`,
    },
    {
      title: '合计',
      dataIndex: 'totalFee',
      key: 'totalFee',
      width: 100,
      render: (v: number) => <span className="font-bold text-[#1a2332]">¥{v.toFixed(2)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: SettlementStatus, record: Settlement) => (
        <div>
          <Tag color={STATUS_TAG_COLOR[status]}>{SETTLEMENT_STATUS_MAP[status]}</Tag>
          {status === 'REJECTED' && (() => {
            const cat = getRejectionCategory(record.id)
            const catConfig = cat ? REJECTION_CATEGORY_MAP[cat] : null
            return catConfig ? (
              <span className={`inline-block text-xs px-1.5 py-0.5 rounded mt-1 ${catConfig.color} ${catConfig.bgColor} border ${catConfig.borderColor}`}>
                {catConfig.label}
              </span>
            ) : null
          })()}
          {status === 'REJECTED' && (() => {
            const rej = rejections.find((r) => r.settlementId === record.id && r.status === 'PENDING')
            if (!rej) return null
            const pendingDays = dayjs().diff(dayjs(rej.rejectedAt), 'day')
            return pendingDays > 3 ? (
              <span className="inline-block text-xs px-1.5 py-0.5 rounded mt-1 bg-red-600 text-white font-medium">
                已逾期{pendingDays}天
              </span>
            ) : null
          })()}
          {status === 'REJECTED' && (
            <div className="text-xs text-red-500 mt-1 max-w-[120px] truncate" title={getRejectionReason(record.id)}>
              {getRejectionReason(record.id)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: Settlement) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {record.status === 'PENDING_REVIEW' && hasPermission('settlement:approve') && (
            <Button type="primary" size="small" onClick={() => openApprove(record)}>
              通过
            </Button>
          )}
          {record.status === 'PENDING_REVIEW' && hasPermission('settlement:reject') && (
            <Button danger size="small" onClick={() => openReject(record)}>
              驳回
            </Button>
          )}
          {record.status === 'REJECTED' && hasPermission('settlement:resubmit') && (
            <Button size="small" type="primary" icon={<RotateCcw size={12} />} onClick={() => openResubmit(record)}>
              重新提交
            </Button>
          )}
          <Button type="link" size="small" onClick={() => openDetail(record)}>
            详情
          </Button>
        </div>
      ),
    },
  ]

  const detailSchedule = currentSettlement ? getScheduleById(currentSettlement.scheduleId) : null
  const detailVehicle = detailSchedule ? getVehicleById(detailSchedule.vehicleId) : null
  const detailExceptions = currentSettlement
    ? getExceptionsByScheduleId(currentSettlement.scheduleId)
    : []
  const detailRejections = currentSettlement
    ? getRejectionsBySettlementId(currentSettlement.id)
    : []
  const detailLogs = currentSettlement ? getLogsByEntityId(currentSettlement.id) : []

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <Receipt size={18} className="text-[#1a2332]" />
            <h1 className="text-lg font-semibold text-[#1a2332] m-0">用车结算</h1>
            {pendingCount > 0 && (
              <Tag color="blue">{pendingCount}笔待审核</Tag>
            )}
            {rejectedCount > 0 && (
              <Tag color="red">{rejectedCount}笔已驳回</Tag>
            )}
          </div>
          <div className="flex items-center gap-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setCategoryFilter('ALL'); setOverdueFilter(false) }}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeTab === tab.key && categoryFilter === 'ALL'
                    ? 'bg-[#1a2332] text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                {tab.key === 'PENDING_REVIEW' && pendingCount > 0 && (
                  <span className="ml-1 text-xs opacity-80">({pendingCount})</span>
                )}
                {tab.key === 'REJECTED' && rejectedCount > 0 && (
                  <span className="ml-1 text-xs opacity-80">({rejectedCount})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {categoryStats.length > 0 && (
          <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500 font-medium">近30天驳回分类</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setActiveTab('REJECTED'); setCategoryFilter('ALL'); setOverdueFilter(false) }}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                  activeTab === 'REJECTED' && categoryFilter === 'ALL' && !overdueFilter
                    ? 'bg-[#1a2332] text-white border-[#1a2332]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                全部驳回
              </button>
              {categoryStats.map((stat) => {
                const catConfig = REJECTION_CATEGORY_MAP[stat.category]
                return (
                  <button
                    key={stat.category}
                    onClick={() => { setActiveTab('REJECTED'); setCategoryFilter(stat.category); setOverdueFilter(false) }}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                      activeTab === 'REJECTED' && categoryFilter === stat.category
                        ? `${catConfig.bgColor} ${catConfig.color} ${catConfig.borderColor} font-medium`
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {catConfig.label}
                    <span className="ml-1 opacity-80">{stat.count}笔</span>
                    <span className="ml-1 opacity-60">¥{stat.totalAmount.toFixed(0)}</span>
                  </button>
                )
              })}
              {overdueCount > 0 && (
                <button
                  onClick={() => { setActiveTab('REJECTED'); setCategoryFilter('ALL'); setOverdueFilter(true) }}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                    overdueFilter
                      ? 'bg-red-600 text-white border-red-600 font-medium'
                      : 'bg-white text-red-600 border-red-200 hover:border-red-300'
                  }`}
                >
                  仅看逾期
                  <span className="ml-1">{overdueCount}笔</span>
                </button>
              )}
            </div>
          </div>
        )}

        <Table
          columns={columns}
          dataSource={filteredSettlements}
          rowKey="id"
          bordered
          size="middle"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          rowClassName={(record) => {
            if (record.status !== 'REJECTED') return ''
            const rej = rejections.find((r) => r.settlementId === record.id && r.status === 'PENDING')
            if (!rej) return 'bg-red-50/30'
            const isOverdue = dayjs().diff(dayjs(rej.rejectedAt), 'day') > 3
            return isOverdue ? 'bg-red-50/50' : 'bg-red-50/30'
          }}
        />
      </div>

      <Modal
        title="结算详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={760}
      >
        {currentSettlement && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-[#1a2332] m-0">{currentSettlement.id}</h3>
              <Tag color={STATUS_TAG_COLOR[currentSettlement.status]}>
                {SETTLEMENT_STATUS_MAP[currentSettlement.status]}
              </Tag>
              {detailSchedule?.isSupplement && <Tag color="amber">补录</Tag>}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-[#1a2332] mb-2">结算信息</h4>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">基础车费</span>
                    <span>¥{currentSettlement.baseFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">超时费</span>
                    <span>¥{currentSettlement.overtimeFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">路桥费</span>
                    <span>¥{currentSettlement.tollFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">停车费</span>
                    <span>¥{currentSettlement.parkingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                    <span className="font-medium">合计</span>
                    <span className="text-base font-bold text-[#1a2332]">¥{currentSettlement.totalFee.toFixed(2)}</span>
                  </div>
                  {currentSettlement.reviewedBy && (
                    <div className="text-xs text-gray-400 pt-1">
                      审核人：{currentSettlement.reviewedBy} · {currentSettlement.reviewedAt ? dayjs(currentSettlement.reviewedAt).format('YYYY-MM-DD HH:mm') : '-'}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#1a2332] mb-2">关联排班</h4>
                {detailSchedule ? (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">排班号</span>
                      <span className="font-medium">{detailSchedule.tripNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">司机</span>
                      <span>{detailSchedule.driverName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">车辆</span>
                      <span>{detailVehicle ? `${detailVehicle.plateNo}（${detailVehicle.type}）` : detailSchedule.vehicleId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">出车时间</span>
                      <span>{dayjs(detailSchedule.departTime).format('YYYY-MM-DD HH:mm')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">排班状态</span>
                      <Tag color={
                        detailSchedule.status === 'SETTLED' ? 'green' :
                        detailSchedule.status === 'RETURNED' ? 'blue' :
                        detailSchedule.status === 'DEPARTED' ? 'orange' : 'default'
                      }>
                        {SCHEDULE_STATUS_MAP[detailSchedule.status]}
                      </Tag>
                    </div>
                  </div>
                ) : (
                  <Empty description="未找到关联排班" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </div>
            </div>

            {detailExceptions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[#1a2332] mb-2 flex items-center gap-1.5">
                  <span className="w-1 h-4 bg-amber-400 rounded" />
                  关联异常
                </h4>
                <div className="space-y-2">
                  {detailExceptions.map((exc) => (
                    <div key={exc.id} className="flex items-center gap-2 bg-amber-50 rounded px-3 py-2 text-sm">
                      <Tag color="orange">{EXCEPTION_TYPE_MAP[exc.type]}</Tag>
                      <span className="text-gray-700 flex-1">{exc.description}</span>
                      <span className="text-xs text-gray-400">
                        {exc.reportedBy} · {dayjs(exc.reportedAt).format('MM-DD HH:mm')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailRejections.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[#1a2332] mb-2 flex items-center gap-1.5">
                  <span className="w-1 h-4 bg-red-400 rounded" />
                  驳回记录
                  <span className="text-xs text-gray-400 font-normal ml-1">共{detailRejections.length}次驳回</span>
                </h4>
                <Timeline
                  items={detailRejections.map((rej) => {
                    const rejPendingDays = dayjs(rej.resubmittedAt || undefined).diff(dayjs(rej.rejectedAt), 'day')
                    const rejOverdue = rejPendingDays > 3
                    const processingHours = rej.status === 'RESOLVED' && rej.resubmittedAt
                      ? Math.round(dayjs(rej.resubmittedAt).diff(dayjs(rej.rejectedAt), 'minute') / 60 * 10) / 10
                      : 0
                    const currentPendingDays = rej.status === 'PENDING'
                      ? dayjs().diff(dayjs(rej.rejectedAt), 'day')
                      : 0
                    return {
                    color: rej.status === 'PENDING' ? 'red' : 'green',
                    children: (
                      <div className={`rounded-lg p-3 text-sm ${rej.status === 'PENDING' ? (currentPendingDays > 3 ? 'bg-red-50 border border-red-200' : 'bg-red-50 border border-red-100') : 'bg-green-50 border border-green-100'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {rej.status === 'PENDING' ? (
                            <Tag color="red" icon={<XCircle size={12} />}>待处理</Tag>
                          ) : (
                            <Tag color="green" icon={<CheckCircle2 size={12} />}>已处理</Tag>
                          )}
                          {rej.category && (() => {
                            const catConfig = REJECTION_CATEGORY_MAP[rej.category]
                            return catConfig ? (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${catConfig.color} ${catConfig.bgColor} border ${catConfig.borderColor}`}>
                                {catConfig.label}
                              </span>
                            ) : null
                          })()}
                          {rej.status === 'PENDING' && currentPendingDays > 3 && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-600 text-white font-medium">
                              已逾期{currentPendingDays}天
                            </span>
                          )}
                          {rej.status === 'PENDING' && currentPendingDays <= 3 && (
                            <span className="text-xs text-gray-400">
                              待处理{currentPendingDays}天
                            </span>
                          )}
                          <span className="text-gray-500 text-xs">{rej.rejectedBy} · {dayjs(rej.rejectedAt).format('YYYY-MM-DD HH:mm')}</span>
                        </div>
                        <div className="text-[#1a2332]">
                          <span className="text-red-500 font-medium">驳回说明：</span>
                          {rej.reason}
                        </div>
                        {rej.status === 'RESOLVED' && rej.resubmittedBy && (
                          <div className="mt-1.5 flex items-center gap-3">
                            <span className="text-xs text-green-600">
                              已重新提交：{rej.resubmittedBy} · {dayjs(rej.resubmittedAt).format('YYYY-MM-DD HH:mm')}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${rejOverdue ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                              处理耗时 {processingHours}小时
                            </span>
                          </div>
                        )}
                      </div>
                    ),
                  }
                  })}
                />
              </div>
            )}

            {detailLogs.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[#1a2332] mb-2 flex items-center gap-1.5">
                  <span className="w-1 h-4 bg-blue-400 rounded" />
                  操作记录
                </h4>
                <div className="space-y-1">
                  {detailLogs
                    .sort((a, b) => b.operatedAt.localeCompare(a.operatedAt))
                    .map((log) => (
                      <div key={log.id} className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="text-gray-300">{dayjs(log.operatedAt).format('MM-DD HH:mm')}</span>
                        <span className="font-medium text-gray-700">{log.operator}</span>
                        <Tag color={
                          log.action === 'approve' ? 'green' :
                          log.action === 'reject' ? 'red' :
                          log.action === 'resubmit' ? 'blue' : 'default'
                        } className="text-xs">
                          {log.action === 'create' ? '创建' : log.action === 'approve' ? '审核通过' : log.action === 'reject' ? '驳回' : log.action === 'resubmit' ? '重新提交' : log.action}
                        </Tag>
                        {log.action === 'resubmit' && log.afterValue?.processingHours != null && (
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            Number(log.afterValue.processingHours) > 72 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                          }`}>
                            处理耗时 {String(log.afterValue.processingHours)}小时
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="审核确认"
        open={approveVisible}
        onOk={handleApprove}
        onCancel={() => setApproveVisible(false)}
        okText="确认通过"
        cancelText="取消"
      >
        <p className="text-sm">确认审核通过此结算单？通过后将不可撤销。</p>
        {currentSettlement && (
          <div className="bg-green-50 rounded p-3 mt-2 text-sm">
            <div>结算单号：{currentSettlement.id}</div>
            <div>合计金额：<span className="font-bold">¥{currentSettlement.totalFee.toFixed(2)}</span></div>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <XCircle size={16} className="text-red-500" />
            <span>驳回结算</span>
          </div>
        }
        open={rejectVisible}
        onOk={handleReject}
        onCancel={() => setRejectVisible(false)}
        okText="确认驳回"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <div className="bg-red-50 border border-red-100 rounded p-3 mb-4 text-xs text-red-700">
          驳回后，调度员可在待办中看到驳回原因并修改后重新提交。驳回记录将永久保留，可追溯。
        </div>
        {currentSettlement && (
          <div className="bg-gray-50 rounded p-3 mb-3 text-sm">
            <div>结算单号：{currentSettlement.id}</div>
            <div>合计金额：¥{currentSettlement.totalFee.toFixed(2)}</div>
          </div>
        )}
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="category"
            label="驳回分类"
            rules={[{ required: true, message: '请选择驳回分类' }]}
          >
            <Select placeholder="请选择驳回分类">
              {Object.entries(REJECTION_CATEGORY_MAP).map(([key, config]) => (
                <Select.Option key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${config.bgColor} ${config.borderColor} border`} />
                    {config.label}
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="reason"
            label="补充说明"
            rules={[{ required: true, message: '请输入驳回补充说明' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入驳回补充说明，便于调度员修改" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <RotateCcw size={16} className="text-blue-500" />
            <span>重新提交</span>
          </div>
        }
        open={resubmitVisible}
        onOk={handleResubmit}
        onCancel={() => setResubmitVisible(false)}
        okText="提交"
        cancelText="取消"
      >
        {currentSettlement && (() => {
          const latestRejection = detailRejections.find((r) => r.status === 'PENDING')
          if (!latestRejection) return null
          const pendingDays = dayjs().diff(dayjs(latestRejection.rejectedAt), 'day')
          const isOverdue = pendingDays > 3
          return (
            <div className={`rounded p-3 mb-4 text-sm ${isOverdue ? 'bg-red-100 border border-red-200' : 'bg-red-50 border border-red-100'}`}>
              <div className="font-medium text-red-700 mb-1">上次驳回：</div>
              {isOverdue && (
                <span className="inline-block text-xs px-1.5 py-0.5 rounded bg-red-600 text-white font-medium mb-2">
                  已逾期{pendingDays}天，请尽快处理
                </span>
              )}
              {latestRejection.category && (() => {
                const catConfig = REJECTION_CATEGORY_MAP[latestRejection.category]
                return catConfig ? (
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded mb-2 ${catConfig.bgColor} ${catConfig.color} border ${catConfig.borderColor}`}>
                    <span className="font-medium">{catConfig.label}</span>
                  </div>
                ) : null
              })()}
              <div className="text-red-600">{latestRejection.reason}</div>
              <div className="text-xs text-gray-400 mt-1">
                {latestRejection.rejectedBy} · {dayjs(latestRejection.rejectedAt).format('YYYY-MM-DD HH:mm')}
              </div>
            </div>
          )
        })()}
        <Form form={resubmitForm} layout="vertical">
          <Form.Item name="baseFee" label="基础车费" rules={[{ required: true, message: '请输入基础车费' }]}>
            <InputNumber min={0} precision={2} className="w-full" addonAfter="元" />
          </Form.Item>
          <Form.Item name="overtimeFee" label="超时费" rules={[{ required: true, message: '请输入超时费' }]}>
            <InputNumber min={0} precision={2} className="w-full" addonAfter="元" />
          </Form.Item>
          <Form.Item name="tollFee" label="路桥费" rules={[{ required: true, message: '请输入路桥费' }]}>
            <InputNumber min={0} precision={2} className="w-full" addonAfter="元" />
          </Form.Item>
          <Form.Item name="parkingFee" label="停车费" rules={[{ required: true, message: '请输入停车费' }]}>
            <InputNumber min={0} precision={2} className="w-full" addonAfter="元" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
