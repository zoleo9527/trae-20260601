import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Calendar, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore, type Role } from '@/stores/appStore'
import StatusBadge from '@/components/StatusBadge'

type MissedStatus = 'pending' | 'reminded' | 'confirmed' | 'completed' | 'closed'

const statusTabs: { value: MissedStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'reminded', label: '已提醒' },
  { value: 'confirmed', label: '待补检' },
  { value: 'completed', label: '已补检' },
  { value: 'closed', label: '已关闭' },
]

interface MissedItem {
  id: string
  examNo: string
  patientName: string
  itemName: string
  requiredDept: string
  status: MissedStatus
}

interface MissedStats {
  pending: number
  reminded: number
  confirmed: number
  completed: number
  closed: number
}

export default function MissedList() {
  const navigate = useNavigate()
  const { currentRole } = useAppStore()
  const [items, setItems] = useState<MissedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<MissedStatus | 'all'>('all')
  const [deptFilter, setDeptFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState<MissedStats | null>(null)

  useEffect(() => {
    const params = new URLSearchParams()
    if (activeTab !== 'all') params.set('status', activeTab)
    if (deptFilter) params.set('dept', deptFilter)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo + 'T23:59:59.999Z')
    setLoading(true)
    fetch(`/api/missed-items?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        let items = Array.isArray(json) ? json : []
        if (search) {
          const kw = search.toLowerCase()
          items = items.filter((i: MissedItem) =>
            i.patientName.toLowerCase().includes(kw) ||
            i.examNo.toLowerCase().includes(kw)
          )
        }
        setItems(items)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [activeTab, deptFilter, dateFrom, dateTo, search])

  useEffect(() => {
    fetch('/api/missed-items/stats')
      .then((res) => res.json())
      .then((json) => setStats(json.data ?? json))
      .catch(() => {})
  }, [])

  const handleQuickAction = async (itemId: string, action: string) => {
    try {
      const roleMap: Record<string, string> = {
        front_desk: '前台导检员',
        doctor: '科室医生',
        reviewer: '报告审核员',
      }
      const operatorName = roleMap[currentRole] || '未知操作员'
      const res = await fetch(`/api/missed-items/${itemId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorName }),
      })
      if (res.ok) {
        const params = new URLSearchParams()
        if (activeTab !== 'all') params.set('status', activeTab)
        if (deptFilter) params.set('dept', deptFilter)
        if (dateFrom) params.set('dateFrom', dateFrom)
        if (dateTo) params.set('dateTo', dateTo + 'T23:59:59.999Z')
        const refreshed = await fetch(`/api/missed-items?${params.toString()}`).then((r) => r.json())
        setItems(Array.isArray(refreshed) ? refreshed : [])
      }
    } catch {}
  }

  const quickDates = [
    { label: '今日', days: 0 },
    { label: '近3天', days: -2 },
    { label: '近7天', days: -6 },
    { label: '本月', days: -30 },
  ]

  const setQuickDate = (days: number) => {
    const today = new Date('2026-06-04')
    const to = today.toISOString().split('T')[0]
    const from = new Date(today)
    from.setDate(from.getDate() + days)
    setDateFrom(from.toISOString().split('T')[0])
    setDateTo(to)
  }

  const getActionButtons = (item: MissedItem) => {
    const buttons: { label: string; action: string; variant: 'primary' | 'outline' }[] = []
    if (currentRole === 'front_desk' && item.status === 'pending') {
      buttons.push({ label: '提醒', action: 'remind', variant: 'primary' })
    }
    if (currentRole === 'doctor' && item.status === 'reminded') {
      buttons.push({ label: '确认', action: 'confirm', variant: 'primary' })
    }
    if (currentRole === 'doctor' && item.status === 'confirmed') {
      buttons.push({ label: '完成', action: 'complete', variant: 'primary' })
    }
    if (currentRole === 'reviewer' && item.status === 'completed') {
      buttons.push({ label: '关闭', action: 'close', variant: 'outline' })
    }
    return buttons
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-4">
        <h1 className="text-xl font-bold text-gray-800">漏项提醒</h1>

        <div className="flex items-center gap-4">
          <div className="flex gap-1 bg-white rounded-lg border border-warm-300 p-1">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  activeTab === tab.value
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-warm-100'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索体检编号或姓名"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-warm-300 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">快捷日期：</span>
            {quickDates.map((qd) => (
              <button
                key={qd.label}
                onClick={() => setQuickDate(qd.days)}
                className={cn(
                  'px-3 py-1 rounded text-xs font-medium transition-colors',
                  dateFrom && dateTo && dateTo === '2026-06-04' && new Date(dateFrom).getTime() === new Date('2026-06-04').getTime() + qd.days * 86400000
                    ? 'bg-primary text-white'
                    : 'bg-white border border-warm-300 text-gray-600 hover:bg-warm-50'
                )}
              >
                {qd.label}
              </button>
            ))}
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo('') }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                清除
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-warm-300 text-sm focus:outline-none focus:border-primary bg-white"
              >
                <option value="">全部科室</option>
                <option value="超声科">超声科</option>
                <option value="检验科">检验科</option>
                <option value="放射科">放射科</option>
                <option value="心内科">心内科</option>
                <option value="妇科">妇科</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 rounded-lg border border-warm-300 text-sm focus:outline-none focus:border-primary"
              />
              <span className="text-gray-400">至</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 rounded-lg border border-warm-300 text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">暂无漏项数据</div>
        ) : (
          <div className="bg-white rounded-lg border border-warm-300 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-warm-50 border-b border-warm-300">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">体检编号</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">姓名</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">漏检项目</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">应检科室</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const actionButtons = getActionButtons(item)
                  return (
                    <tr key={item.id} className="border-b border-warm-200 last:border-0 hover:bg-warm-50">
                      <td className="px-4 py-3 font-medium text-primary">{item.examNo}</td>
                      <td className="px-4 py-3 text-gray-700">{item.patientName}</td>
                      <td className="px-4 py-3 text-gray-700">{item.itemName}</td>
                      <td className="px-4 py-3 text-gray-600">{item.requiredDept}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} type="missed" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/missed/${item.id}`)}
                            className="text-xs text-primary hover:underline font-medium"
                          >
                            查看
                          </button>
                          {actionButtons.map((btn) => (
                            <button
                              key={btn.action}
                              onClick={() => handleQuickAction(item.id, btn.action)}
                              className={cn(
                                'text-xs px-2.5 py-1 rounded font-medium transition-colors',
                                btn.variant === 'primary'
                                  ? 'bg-primary text-white hover:bg-primary-light'
                                  : 'border border-warm-300 text-gray-600 hover:bg-warm-100'
                              )}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="w-72 shrink-0">
        <div className="bg-white rounded-lg border border-warm-300 p-5 sticky top-0">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-gray-700">漏项回看</h3>
          </div>
          {stats ? (
            <div className="space-y-3">
              <StatRow label="待处理" value={stats.pending} color="bg-accent" />
              <StatRow label="已提醒" value={stats.reminded} color="bg-blue-500" />
              <StatRow label="待补检" value={stats.confirmed} color="bg-purple-500" />
              <StatRow label="已补检" value={stats.completed} color="bg-emerald-500" />
              <StatRow label="已关闭" value={stats.closed} color="bg-gray-400" />
            </div>
          ) : (
            <div className="text-center text-gray-400 text-sm py-4">加载中...</div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={cn('w-2 h-2 rounded-full', color)} />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
  )
}
