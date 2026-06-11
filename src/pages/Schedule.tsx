import { useEffect, useState } from 'react'
import { Calendar, ChevronDown, ChevronUp, Send, CheckCircle2, FileEdit, ShieldCheck, type LucideIcon } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

interface ScheduleItem {
  id: number
  date: string
  shift: string
  guideId: number
  guideName: string
  guideAvatar: string
}

interface Schedule {
  id: number
  counterId: number
  counterName: string
  weekStart: string
  status: string
  createdBy: number
  createdByName: string
  items: ScheduleItem[]
}

const SHIFT_LABELS: Record<string, string> = {
  morning: '早班',
  afternoon: '晚班',
  full: '全天',
  off: '休息',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  submitted: { label: '已提交', color: 'badge-success', icon: CheckCircle2 },
  draft: { label: '草稿', color: 'badge-warning', icon: FileEdit },
  confirmed: { label: '已确认', color: 'badge-info', icon: ShieldCheck },
}

export default function Schedule() {
  const { schedules, loading, fetchSchedules, submitSchedule } = useDataStore()
  const user = useAuthStore((s) => s.user)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [submittingId, setSubmittingId] = useState<number | null>(null)

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const list = schedules as Schedule[]
  const submittedCount = list.filter((s) => s.status === 'submitted').length
  const draftCount = list.filter((s) => s.status === 'draft').length

  const handleSubmit = async (id: number) => {
    if (!user) return
    setSubmittingId(id)
    try {
      await submitSchedule(id, user.id)
      await fetchSchedules()
    } finally {
      setSubmittingId(null)
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const groupItemsByDate = (items: ScheduleItem[]) => {
    const map = new Map<string, ScheduleItem[]>()
    items.forEach((item) => {
      const group = map.get(item.date) || []
      group.push(item)
      map.set(item.date, group)
    })
    return Array.from(map.entries())
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return `${d.getMonth() + 1}/${d.getDate()} 周${weekdays[d.getDay()]}`
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="text-ops-accent" size={20} />
        <h2 className="text-lg font-bold">排班工作台</h2>
      </div>

      <div className="flex items-center gap-6 mb-5 px-4 py-3 bg-ops-card border border-ops-border rounded-lg">
        <span className="text-sm text-gray-400">
          已提交 <span className="text-ops-success font-bold font-mono">{submittedCount}</span>
        </span>
        <span className="text-sm text-gray-400">
          草稿 <span className="text-ops-accent font-bold font-mono">{draftCount}</span>
        </span>
        <span className="text-sm text-gray-400">
          共 <span className="text-gray-200 font-bold font-mono">{list.length}</span>
        </span>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">加载中...</div>
      ) : list.length === 0 ? (
        <div className="text-sm text-gray-500">暂无排班数据</div>
      ) : (
        <div className="space-y-3">
          {list.map((s) => {
            const statusCfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.draft
            const StatusIcon = statusCfg.icon
            const isExpanded = expandedId === s.id
            const isDraft = s.status === 'draft'

            return (
              <div
                key={s.id}
                className="bg-ops-card border border-ops-border rounded-lg overflow-hidden animate-fade-slide-in"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-ops-border/30 transition-colors"
                  onClick={() => toggleExpand(s.id)}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-100">{s.counterName}</p>
                      <p className="text-xs text-gray-500 mt-0.5 font-mono">周起始: {s.weekStart}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn('inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium', statusCfg.color)}>
                      <StatusIcon size={12} />
                      {statusCfg.label}
                    </span>
                    {isDraft && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSubmit(s.id)
                        }}
                        disabled={submittingId === s.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium bg-ops-accent/20 text-ops-accent hover:bg-ops-accent/30 transition-colors disabled:opacity-50"
                      >
                        <Send size={12} />
                        {submittingId === s.id ? '提交中...' : '提交'}
                      </button>
                    )}
                    {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                  </div>
                </div>

                {isExpanded && s.items && s.items.length > 0 && (
                  <div className="border-t border-ops-border px-4 py-3">
                    {groupItemsByDate(s.items).map(([date, items]) => (
                      <div key={date} className="mb-3 last:mb-0">
                        <p className="text-xs font-mono text-ops-accent mb-1.5">{formatDate(date)}</p>
                        <div className="space-y-1 pl-3">
                          {items.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 text-xs text-gray-300">
                              <span className={cn(
                                'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium',
                                item.shift === 'off' ? 'bg-gray-700 text-gray-400' : 'bg-ops-border text-gray-200'
                              )}>
                                {SHIFT_LABELS[item.shift] || item.shift}
                              </span>
                              <span className="w-5 h-5 rounded-full bg-ops-border flex items-center justify-center text-[10px] font-bold text-gray-300">
                                {item.guideAvatar || item.guideName?.[0]}
                              </span>
                              <span>{item.guideName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
