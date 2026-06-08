import { useNavigate } from 'react-router-dom'
import {
  CalendarClock,
  Receipt,
  AlertTriangle,
  Clock,
  FileWarning,
  Truck,
  ArrowRight,
  X,
} from 'lucide-react'
import dayjs from 'dayjs'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useSettlementStore } from '@/stores/settlementStore'
import { useScheduleStore } from '@/stores/scheduleStore'
import { SCHEDULE_STATUS_MAP, SETTLEMENT_STATUS_MAP, EXCEPTION_TYPE_MAP, ActionType, REJECTION_CATEGORY_MAP } from '@/types'

const ACTION_LABEL_MAP: Record<ActionType, string> = {
  create: '创建',
  edit: '编辑',
  depart: '确认出车',
  return: '确认回车',
  settle: '标记结算',
  approve: '审核通过',
  reject: '驳回',
  resubmit: '重新提交',
  supplement: '补录排班',
  exception_mark: '标记异常',
}

const RISK_TYPE_LABEL: Record<string, string> = {
  settlement_anomaly: '结算异常',
  schedule_conflict: '排班冲突',
  overdue_settlement: '超时未结',
}

const SEVERITY_CONFIG: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  low: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { getTodoCounts, getRiskItems, getUnreadRiskItems, markRiskRead, getRecentChanges, getRejectedSettlements } = useDashboardStore()
  const { settlements } = useSettlementStore()
  const { schedules } = useScheduleStore()

  const todoCounts = getTodoCounts()
  const riskItems = getRiskItems()
  const unreadRiskCount = getUnreadRiskItems().length
  const recentChanges = getRecentChanges(10)
  const rejectedItems = getRejectedSettlements()

  const pendingSettlementTotal = settlements
    .filter((s) => s.status === 'PENDING_REVIEW')
    .reduce((sum, s) => sum + s.totalFee, 0)

  const todoCards = [
    {
      icon: CalendarClock,
      label: '待出车',
      count: todoCounts.pendingSchedules,
      link: '/schedule',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      ring: 'ring-blue-100',
    },
    {
      icon: Truck,
      label: '已出车',
      count: todoCounts.departedSchedules,
      link: '/schedule',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      ring: 'ring-orange-100',
    },
    {
      icon: Receipt,
      label: '待审核结算',
      count: todoCounts.pendingSettlements,
      link: '/settlement',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      ring: 'ring-emerald-100',
    },
    {
      icon: FileWarning,
      label: '已驳回',
      count: todoCounts.rejectedSettlements,
      link: '/settlement',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      ring: 'ring-red-100',
    },
    {
      icon: AlertTriangle,
      label: '待处理异常',
      count: todoCounts.pendingExceptions,
      link: '/exception',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      ring: 'ring-amber-100',
    },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-5 gap-3">
        {todoCards.map((card) => (
          <div
            key={card.label}
            onClick={() => navigate(card.link)}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all group"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-md ${card.bgColor} flex items-center justify-center`}>
                <card.icon size={16} className={card.color} />
              </div>
              <span className="text-xs text-gray-500">{card.label}</span>
            </div>
            <div className="text-2xl font-bold text-[#1a2332] mb-1">
              {card.count}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-[#e67e22] transition-colors">
              <span>查看</span>
              <ArrowRight size={12} />
            </div>
          </div>
        ))}
      </div>

      {todoCounts.pendingSettlements > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-emerald-600" />
            <span className="text-sm text-emerald-800">
              待审核结算合计 <span className="font-bold">¥{pendingSettlementTotal.toFixed(2)}</span>
              <span className="text-emerald-600 ml-1">（{todoCounts.pendingSettlements}笔）</span>
            </span>
          </div>
          <button
            onClick={() => navigate('/settlement')}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-medium"
          >
            去审核 →
          </button>
        </div>
      )}

      {rejectedItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-red-100">
          <div className="flex items-center justify-between px-4 py-3 border-b border-red-50">
            <div className="flex items-center gap-2">
              <FileWarning size={16} className="text-red-500" />
              <span className="font-semibold text-[#1a2332] text-sm">驳回待处理</span>
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                {rejectedItems.length}
              </span>
            </div>
            <button
              onClick={() => navigate('/settlement')}
              className="text-xs text-gray-400 hover:text-[#e67e22]"
            >
              查看全部 →
            </button>
          </div>
          <div className="divide-y divide-red-50">
            {rejectedItems.map(({ settlement, rejection, schedule }) => (
              <div
                key={settlement.id}
                className="px-4 py-3 hover:bg-red-50/30 cursor-pointer transition-colors"
                onClick={() => navigate('/settlement')}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#1a2332]">{settlement.id}</span>
                    {schedule && (
                      <span className="text-xs text-gray-400">{schedule.tripNo}</span>
                    )}
                    {schedule?.isSupplement && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">补录</span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-red-600">¥{settlement.totalFee.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-500 font-medium">驳回原因：</span>
                  <span className="text-xs text-gray-600">{rejection.reason}</span>
                  {rejection.category && (() => {
                    const catConfig = REJECTION_CATEGORY_MAP[rejection.category]
                    return catConfig ? (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${catConfig.color} ${catConfig.bgColor} border ${catConfig.borderColor}`}>
                        {catConfig.label}
                      </span>
                    ) : null
                  })()}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {rejection.rejectedBy} · {dayjs(rejection.rejectedAt).format('MM-DD HH:mm')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <span className="font-semibold text-[#1a2332] text-sm">风险提醒</span>
              {unreadRiskCount > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                  {unreadRiskCount}条未读
                </span>
              )}
            </div>
          </div>
          {riskItems.length === 0 ? (
            <div className="text-gray-400 text-sm py-8 text-center">暂无风险项</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {riskItems.map((item) => {
                const severity = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.low
                return (
                  <div
                    key={item.id}
                    className={`px-4 py-3 transition-colors ${item.read ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${severity.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${severity.bg} ${severity.text}`}>
                            {item.severity === 'high' ? '高' : item.severity === 'medium' ? '中' : '低'}
                          </span>
                          <span className="text-xs text-gray-400">{RISK_TYPE_LABEL[item.type] || item.type}</span>
                          {!item.read && (
                            <span className="text-xs text-blue-500">未读</span>
                          )}
                        </div>
                        <div className="text-sm text-[#1a2332] mb-1">{item.message}</div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              markRiskRead(item.id)
                              navigate(item.type === 'schedule_conflict' ? '/schedule' : '/settlement')
                            }}
                            className="text-xs text-[#e67e22] hover:text-[#d35400] font-medium"
                          >
                            去处理 →
                          </button>
                          {item.read && (
                            <button
                              onClick={() => markRiskRead(item.id)}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              已读
                            </button>
                          )}
                        </div>
                      </div>
                      {!item.read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markRiskRead(item.id) }}
                          className="text-gray-300 hover:text-gray-500 shrink-0"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-500" />
              <span className="font-semibold text-[#1a2332] text-sm">最近变更</span>
            </div>
            <button
              onClick={() => navigate('/logs')}
              className="text-xs text-gray-400 hover:text-[#e67e22]"
            >
              查看全部 →
            </button>
          </div>
          {recentChanges.length === 0 ? (
            <div className="text-gray-400 text-sm py-8 text-center">暂无变更记录</div>
          ) : (
            <div className="px-4 py-2">
              {recentChanges.map((log, idx) => (
                <div key={log.id} className="flex gap-3 py-2 last:border-b-0">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 mt-1 ${
                        idx === 0 ? 'bg-[#e67e22]' : 'bg-gray-300'
                      }`}
                    />
                    {idx < recentChanges.length - 1 && (
                      <div className="w-px flex-1 bg-gray-100 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#1a2332]">
                      <span className="font-medium">{log.operator}</span>
                      <span className="mx-1 text-gray-400">
                        {ACTION_LABEL_MAP[log.action] || log.action}
                      </span>
                      <span className="text-gray-500 text-xs">{log.entityId}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {dayjs(log.operatedAt).format('YYYY-MM-DD HH:mm')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '新增排班', link: '/schedule', icon: CalendarClock, desc: '创建新排班' },
          { label: '补录排班', link: '/schedule', icon: FileWarning, desc: '未提前排班' },
          { label: '查看结算', link: '/settlement', icon: Receipt, desc: '审核与结算' },
          { label: '异常录入', link: '/exception', icon: AlertTriangle, desc: '标记用车异常' },
        ].map((btn) => (
          <div
            key={btn.label}
            onClick={() => navigate(btn.link)}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#e67e22]/30 transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-md bg-gray-50 group-hover:bg-[#e67e22]/10 flex items-center justify-center mb-2 transition-colors">
              <btn.icon size={18} className="text-gray-500 group-hover:text-[#e67e22] transition-colors" />
            </div>
            <div className="text-sm font-medium text-[#1a2332]">{btn.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{btn.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
