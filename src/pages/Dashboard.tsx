import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Truck, AlertTriangle, ClipboardCheck, Package, MapPin, Search, DollarSign, Bell, ArrowRight, DoorOpen, Grid3x3, Clock, Receipt, AlertOctagon, FileWarning } from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/hooks/useStore'
import StatusBadge from '@/components/StatusBadge'
import type { Container, OverstayRecord, FeeRecord, InspectionPlan, DashboardStats } from '@/shared/types'

const roleKpiMap: Record<string, { key: keyof DashboardStats; label: string; icon: any; color: string }[]> = {
  gate_operator: [
    { key: 'totalContainers', label: '今日进闸数', icon: Truck, color: 'border-blue-500' },
    { key: 'misplacedCount', label: '错放箱待处理', icon: FileWarning, color: 'border-red-500' },
    { key: 'inspectingCount', label: '待处理异常', icon: ClipboardCheck, color: 'border-amber-500' },
  ],
  dispatcher: [
    { key: 'totalContainers', label: '在场箱数', icon: Package, color: 'border-blue-500' },
    { key: 'overstayCount', label: '超期箱数', icon: AlertTriangle, color: 'border-red-500' },
    { key: 'misplacedCount', label: '错放箱数', icon: MapPin, color: 'border-orange-500' },
    { key: 'inspectingCount', label: '查验中', icon: Search, color: 'border-amber-500' },
  ],
  customer_service: [
    { key: 'pendingFeeReviewCount', label: '待复核费用', icon: DollarSign, color: 'border-blue-500' },
    { key: 'disputedCount', label: '争议中', icon: AlertTriangle, color: 'border-purple-500' },
    { key: 'pendingNotifyCount', label: '待通知超期', icon: Bell, color: 'border-orange-500' },
    { key: 'missedNotificationCount', label: '漏通知查验', icon: ClipboardCheck, color: 'border-red-500' },
  ],
}

const roleActions: Record<string, { label: string; to: string; icon: any; desc: string }[]> = {
  gate_operator: [
    { label: '闸口登记', to: '/gate-records', icon: DoorOpen, desc: '登记进出闸记录' },
    { label: '标记异常', to: '/containers', icon: AlertTriangle, desc: '标记错放/异常箱' },
    { label: '错放箱查看', to: '/misplaced', icon: FileWarning, desc: '查看错放箱信息' },
  ],
  dispatcher: [
    { label: '堆位调度', to: '/yard-map', icon: Grid3x3, desc: '管理堆位和移位' },
    { label: '错放箱复位', to: '/misplaced', icon: MapPin, desc: '处理错放箱复位' },
    { label: '超期处理', to: '/overstay', icon: Clock, desc: '处理超期堆存' },
  ],
  customer_service: [
    { label: '费用复核', to: '/fee-review', icon: Receipt, desc: '审核超期费用' },
    { label: '超期通知', to: '/overstay', icon: Bell, desc: '发送超期通知' },
    { label: '错放箱工单', to: '/misplaced', icon: FileWarning, desc: '发起错放箱工单' },
  ],
}

const roleTodoMap: Record<string, (stats: DashboardStats) => { text: string; to: string; urgent: boolean }[]> = {
  gate_operator: (stats) => [
    ...(stats.misplacedCount > 0 ? [{ text: `${stats.misplacedCount} 个错放箱待处理`, to: '/misplaced', urgent: true }] : []),
    ...(stats.inspectingCount > 0 ? [{ text: `${stats.inspectingCount} 个箱号查验中`, to: '/containers', urgent: false }] : []),
  ],
  dispatcher: (stats) => [
    ...(stats.overstayCount > 0 ? [{ text: `${stats.overstayCount} 个超期箱待处理`, to: '/overstay', urgent: true }] : []),
    ...(stats.misplacedCount > 0 ? [{ text: `${stats.misplacedCount} 个错放箱需移位`, to: '/misplaced', urgent: true }] : []),
    ...(stats.missedNotificationCount > 0 ? [{ text: `${stats.missedNotificationCount} 个查验漏通知`, to: '/inspection', urgent: true }] : []),
  ],
  customer_service: (stats) => [
    ...(stats.pendingFeeReviewCount > 0 ? [{ text: `${stats.pendingFeeReviewCount} 笔费用待复核`, to: '/fee-review', urgent: true }] : []),
    ...(stats.disputedCount > 0 ? [{ text: `${stats.disputedCount} 笔费用争议中`, to: '/fee-review', urgent: true }] : []),
    ...(stats.pendingNotifyCount > 0 ? [{ text: `${stats.pendingNotifyCount} 个超期待通知`, to: '/overstay', urgent: true }] : []),
    ...(stats.missedNotificationCount > 0 ? [{ text: `${stats.missedNotificationCount} 个查验漏通知`, to: '/inspection', urgent: true }] : []),
  ],
}

function SkeletonCard() {
  return <div className="card p-5 animate-pulse"><div className="h-4 bg-gray-200 rounded w-20 mb-3" /><div className="h-8 bg-gray-200 rounded w-12" /></div>
}

export default function Dashboard() {
  const currentRole = useAppStore((s) => s.currentRole)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [overstays, setOverstays] = useState<OverstayRecord[]>([])
  const [fees, setFees] = useState<FeeRecord[]>([])
  const [inspections, setInspections] = useState<InspectionPlan[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsData, overstayList, feeList, inspectionList] = await Promise.all([
        api.containers.stats(),
        api.overstay.list(),
        api.fees.list(),
        api.inspections.list(),
      ])
      setStats(statsData as DashboardStats)
      setOverstays(overstayList.sort((a: any, b: any) => b.overstay_days - a.overstay_days).slice(0, 5))
      setFees(feeList as FeeRecord[])
      setInspections(inspectionList as InspectionPlan[])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const kpis = roleKpiMap[currentRole] || []
  const actions = roleActions[currentRole] || []
  const gridCols = currentRole === 'dispatcher' ? 'grid-cols-4' : 'grid-cols-3'

  const todos = stats ? (roleTodoMap[currentRole] || (() => []))(stats) : []

  const roleSpecificItems = (() => {
    if (currentRole === 'customer_service' && fees.length > 0) {
      return { title: '费用复核待办', items: fees.filter(f => f.review_status === 'pending' || f.review_status === 'reviewing').slice(0, 5), link: '/fee-review', linkLabel: '查看全部费用', render: (f: FeeRecord) => (
        <div key={f.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-port-navy">{f.container_no}</span>
            <StatusBadge status={f.review_status} type="fee" />
          </div>
          <span className="text-sm font-semibold text-port-orange">¥{f.total_fee.toLocaleString()}</span>
        </div>
      )}
    }
    if (currentRole === 'dispatcher' && inspections.length > 0) {
      const missed = inspections.filter(i => i.notified_status === 'not_notified')
      return { title: '查验漏通知预警', items: missed.slice(0, 5), link: '/inspection', linkLabel: '查看查验计划', render: (i: InspectionPlan) => (
        <div key={i.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-port-navy">{i.container_no}</span>
            <StatusBadge status={i.status} type="container" />
          </div>
          <span className="text-xs text-red-500 flex items-center gap-1"><AlertOctagon className="w-3 h-3" />未通知</span>
        </div>
      )}
    }
    return null
  })()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className={`grid ${gridCols} gap-4`}>
          {Array.from({ length: kpis.length || 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="card p-5 animate-pulse"><div className="h-6 bg-gray-200 rounded w-32 mb-4" /><div className="h-10 bg-gray-200 rounded w-48" /></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className={`grid ${gridCols} gap-4`}>
        {kpis.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className={`card p-5 border-l-4 ${color}`}>
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-500">{label}</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-port-navy">{stats?.[key] ?? 0}</div>
          </div>
        ))}
      </div>

      {todos.length > 0 && (
        <div className="card p-5 border-l-4 border-port-orange">
          <h3 className="text-sm font-medium text-port-orange mb-3">待办事项</h3>
          <div className="space-y-2">
            {todos.map((t, i) => (
              <Link key={i} to={t.to} className="flex items-center gap-2 py-1 group">
                {t.urgent && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                <span className={`text-sm ${t.urgent ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>{t.text}</span>
                <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-port-orange transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="card p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-3">处理入口</h3>
        <div className="grid grid-cols-3 gap-3">
          {actions.map((a) => {
            const Icon = a.icon
            return (
              <Link key={a.label} to={a.to} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-port-orange/30 hover:bg-port-orange/5 transition-all group">
                <div className="w-9 h-9 rounded-lg bg-port-orange/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-port-orange" />
                </div>
                <div>
                  <div className="text-sm font-medium text-port-navy group-hover:text-port-orange transition-colors">{a.label}</div>
                  <div className="text-xs text-gray-400">{a.desc}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {roleSpecificItems && roleSpecificItems.items.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">{roleSpecificItems.title}</h3>
            <Link to={roleSpecificItems.link} className="text-sm text-port-orange hover:underline">{roleSpecificItems.linkLabel}</Link>
          </div>
          <div>
            {roleSpecificItems.items.map((item: any) => roleSpecificItems.render(item))}
          </div>
        </div>
      )}

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500">超期预警</h3>
          <Link to="/overstay" className="text-sm text-port-orange hover:underline">查看全部</Link>
        </div>
        {overstays.length === 0 ? (
          <p className="text-sm text-gray-400">暂无超期记录</p>
        ) : (
          <div className="space-y-2">
            {overstays.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <Link to={`/containers/${o.container_id}`} className="text-sm font-medium text-port-navy hover:text-port-orange">
                    {o.container_no}
                  </Link>
                  <span className="text-xs text-gray-400">{(o as any).customer_name || ''}</span>
                </div>
                <span className="text-sm font-semibold text-red-600">{o.overstay_days} 天</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
