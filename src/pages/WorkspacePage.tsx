import { useParcelStore } from '@/store/parcelStore'
import { ROLE_LABELS, STATUS_LABELS, type ParcelStatus } from '@shared/types'
import { AlertCircle, AlertTriangle, Clock, Filter, History, LayoutDashboard, Loader2, RefreshCw, User, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const TIMEOUT_THRESHOLDS_MS: Record<string, number> = {
  arrived_pending: 2 * 60 * 60 * 1000,
  dispatched_pending: 4 * 60 * 60 * 1000,
}

const GROUP_ORDER: ParcelStatus[] = [
  'arrived_pending',
  'dispatched_pending',
  'delivering',
  'problem_pending',
]

const STATUS_ICONS: Record<string, string> = {
  arrived_pending: '📥',
  dispatched_pending: '📤',
  delivering: '🚚',
  problem_pending: '⚠️',
}

function getArrivalMs(arrivedAt: string | null | undefined): number {
  if (!arrivedAt) return 0
  const arrived = new Date(arrivedAt.replace(' ', 'T'))
  return Date.now() - arrived.getTime()
}

function formatDuration(arrivedAt: string): string {
  const diffMs = getArrivalMs(arrivedAt)
  if (diffMs < 0) return '刚刚'
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时${minutes % 60}分钟`
  const days = Math.floor(hours / 24)
  return `${days}天${hours % 24}小时`
}

function isOverdue(parcel: any): boolean {
  const threshold = TIMEOUT_THRESHOLDS_MS[parcel.status]
  if (!threshold) return false
  return getArrivalMs(parcel.arrived_at) > threshold
}

export default function WorkspacePage() {
  const {
    parcels, staff, loading, error, workspaceSummary, auditLogs,
    fetchParcels, fetchStaff, fetchWorkspaceSummary, fetchAuditLog,
  } = useParcelStore()

  const [selectedStaffId, setSelectedStaffId] = useState<number | ''>('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [onlyOverdue, setOnlyOverdue] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerParcelId, setDrawerParcelId] = useState<number | null>(null)
  const [drawerTrackingNo, setDrawerTrackingNo] = useState('')
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [drawerError, setDrawerError] = useState<string | null>(null)

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  useEffect(() => {
    const filters: Record<string, any> = { pageSize: 200 }
    if (selectedStaffId) {
      filters.responsibleId = selectedStaffId
    } else if (selectedRole) {
      filters.responsibleType = selectedRole
    } else {
      return
    }
    fetchParcels(filters)
    fetchWorkspaceSummary(
      selectedStaffId ? Number(selectedStaffId) : undefined,
      selectedRole || undefined
    )
  }, [selectedStaffId, selectedRole])

  const handleStaffChange = (id: string) => {
    if (id) {
      setSelectedStaffId(Number(id))
      setSelectedRole('')
    } else {
      setSelectedStaffId('')
    }
  }

  const handleRoleChange = (role: string) => {
    setSelectedRole(role)
    setSelectedStaffId('')
  }

  const openDrawer = (parcelId: number, trackingNo: string) => {
    setDrawerParcelId(parcelId)
    setDrawerTrackingNo(trackingNo)
    setDrawerOpen(true)
    setDrawerLoading(true)
    setDrawerError(null)
    fetchAuditLog(parcelId)
      .then(() => setDrawerLoading(false))
      .catch(() => {
        setDrawerError('加载日志失败')
        setDrawerLoading(false)
      })
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setDrawerParcelId(null)
    setDrawerTrackingNo('')
    setDrawerError(null)
  }

  const retryDrawer = () => {
    if (!drawerParcelId) return
    setDrawerLoading(true)
    setDrawerError(null)
    fetchAuditLog(drawerParcelId)
      .then(() => setDrawerLoading(false))
      .catch(() => {
        setDrawerError('加载日志失败')
        setDrawerLoading(false)
      })
  }

  const activeParcels = useMemo(() => {
    return parcels.filter((p: any) =>
      GROUP_ORDER.includes(p.status as ParcelStatus)
    )
  }, [parcels])

  const overdueStats = useMemo(() => {
    const stats: Record<string, { count: number; maxMs: number }> = {}
    for (const status of Object.keys(TIMEOUT_THRESHOLDS_MS)) {
      stats[status] = { count: 0, maxMs: 0 }
    }
    for (const p of activeParcels) {
      const threshold = TIMEOUT_THRESHOLDS_MS[p.status]
      if (!threshold) continue
      const ms = getArrivalMs(p.arrived_at)
      if (ms > threshold) {
        stats[p.status].count++
        if (ms > stats[p.status].maxMs) {
          stats[p.status].maxMs = ms
        }
      }
    }
    return stats
  }, [activeParcels])

  const overdueTotalCount = Object.values(overdueStats).reduce((s, v) => s + v.count, 0)

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const status of GROUP_ORDER) {
      map[status] = []
    }
    for (const p of activeParcels) {
      if (map[p.status]) {
        map[p.status].push(p)
      }
    }
    for (const status of GROUP_ORDER) {
      let items = map[status]
      if (onlyOverdue) {
        items = items.filter((p: any) => isOverdue(p))
      }
      items.sort((a: any, b: any) => {
        return getArrivalMs(b.arrived_at) - getArrivalMs(a.arrived_at)
      })
      map[status] = items
    }
    return map
  }, [activeParcels, onlyOverdue])

  const selectedLabel = useMemo(() => {
    if (selectedStaffId) {
      const s = staff.find((s: any) => s.id === selectedStaffId)
      return s ? `${s.name}（${ROLE_LABELS[s.role] ?? s.role}）` : ''
    }
    if (selectedRole) {
      return ROLE_LABELS[selectedRole] ?? selectedRole
    }
    return ''
  }, [selectedStaffId, selectedRole, staff])

  const summaryTotal = workspaceSummary
    ? GROUP_ORDER.reduce((sum, s) => sum + (workspaceSummary[s] || 0), 0)
    : 0

  const hasAnyVisibleItem = GROUP_ORDER.some((s) => grouped[s]?.length > 0)

  function formatMs(ms: number): string {
    if (ms <= 0) return '-'
    const minutes = Math.floor(ms / 60000)
    if (minutes < 60) return `${minutes}分钟`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}小时${minutes % 60}分钟`
    const days = Math.floor(hours / 24)
    return `${days}天${hours % 24}小时`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="h-6 w-6 text-orange-500" />
        <h1 className="text-xl font-semibold text-slate-800">我的工作台</h1>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <label className="mb-1.5 block text-sm font-medium text-slate-600">按员工筛选</label>
            <select
              value={selectedStaffId}
              onChange={(e) => handleStaffChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            >
              <option value="">请选择员工</option>
              {staff.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}（{ROLE_LABELS[s.role] ?? s.role}）
                </option>
              ))}
            </select>
          </div>

          <span className="text-sm text-slate-400 py-2">或</span>

          <div className="min-w-[160px]">
            <label className="mb-1.5 block text-sm font-medium text-slate-600">按角色筛选</label>
            <select
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            >
              <option value="">请选择角色</option>
              <option value="customer_service">客服</option>
              <option value="courier">派件员</option>
              <option value="station_manager">驿站负责人</option>
            </select>
          </div>

          {selectedLabel && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1.5 text-sm font-medium text-orange-700">
              <User className="h-3.5 w-3.5" />
              {selectedLabel}
              <button
                onClick={() => { setSelectedStaffId(''); setSelectedRole('') }}
                className="ml-1 text-orange-400 hover:text-orange-600"
              >
                ✕
              </button>
            </span>
          )}
        </div>
      </div>

      {!selectedStaffId && !selectedRole && (
        <div className="flex flex-col items-center justify-center rounded-lg bg-white py-20 shadow-sm">
          <User className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm text-slate-400">请选择员工或角色查看负责快件</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center rounded-lg bg-white py-20 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="mt-4 text-sm text-slate-400">加载中...</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 py-12 shadow-sm">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
          <button
            onClick={() => {
              const filters: Record<string, any> = { pageSize: 200 }
              if (selectedStaffId) filters.responsibleId = selectedStaffId
              else if (selectedRole) filters.responsibleType = selectedRole
              fetchParcels(filters)
            }}
            className="mt-3 inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            重试
          </button>
        </div>
      )}

      {!loading && !error && (selectedStaffId || selectedRole) && (
        <>
          {workspaceSummary && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {GROUP_ORDER.map((status) => (
                <div
                  key={status}
                  className="rounded-lg border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{STATUS_ICONS[status]}</span>
                    <span className="text-xs font-medium text-slate-500">
                      {STATUS_LABELS[status]}
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-800">
                    {workspaceSummary[status] || 0}
                  </div>
                </div>
              ))}
              <div className="col-span-2 rounded-lg border border-orange-200 bg-orange-50 p-4 sm:col-span-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-orange-700">活跃件合计</span>
                  <span className="text-2xl font-bold text-orange-600">{summaryTotal}</span>
                </div>
              </div>
            </div>
          )}

          {overdueTotalCount > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Object.entries(TIMEOUT_THRESHOLDS_MS).map(([status, threshold]) => {
                const stat = overdueStats[status]
                if (!stat || stat.count === 0) return null
                return (
                  <div
                    key={status}
                    className="rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-xs font-medium text-red-600">
                        {STATUS_LABELS[status as ParcelStatus]}超时
                      </span>
                      <span className="text-xs text-red-400">
                        （阈值 {formatMs(threshold)}）
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-3">
                      <span className="text-3xl font-bold text-red-600">{stat.count}</span>
                      <span className="text-xs text-red-400">件</span>
                    </div>
                    <div className="mt-1 text-xs text-red-500">
                      最长停留：{stat.maxMs > 0 ? formatMs(stat.maxMs) : '-'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex items-center gap-3 rounded-lg bg-white px-5 py-3 shadow-sm">
            <button
              onClick={() => setOnlyOverdue(!onlyOverdue)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                onlyOverdue
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Filter className="h-4 w-4" />
              只看超时
              {onlyOverdue && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">
                  {overdueTotalCount}
                </span>
              )}
            </button>
            <span className="text-xs text-slate-400">
              显示触发超时阈值的快件（arrived_pending &gt; 2h, dispatched_pending &gt; 4h）
            </span>
          </div>

          {!hasAnyVisibleItem && onlyOverdue ? (
            <div className="flex flex-col items-center justify-center rounded-lg bg-white py-16 shadow-sm">
              <AlertTriangle className="h-10 w-10 text-slate-300" />
              <p className="mt-4 text-sm text-slate-400">当前筛选下没有超时快件</p>
              <button
                onClick={() => setOnlyOverdue(false)}
                className="mt-3 text-sm font-medium text-orange-500 hover:text-orange-600"
              >
                查看全部快件
              </button>
            </div>
          ) : activeParcels.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg bg-white py-16 shadow-sm">
              <Clock className="h-10 w-10 text-slate-300" />
              <p className="mt-4 text-sm text-slate-400">该责任人当前没有活跃快件</p>
            </div>
          ) : (
            <div className="space-y-5">
              {GROUP_ORDER.map((status) => {
                const items = grouped[status]
                if (!items || items.length === 0) return null
                return (
                  <div key={status} className="rounded-lg bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span>{STATUS_ICONS[status]}</span>
                        <h2 className="font-medium text-slate-700">
                          {STATUS_LABELS[status]}
                        </h2>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {items.length}
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-slate-50 text-left text-slate-500">
                            <th className="px-6 py-2.5 font-medium">运单号</th>
                            <th className="px-6 py-2.5 font-medium">到件时间</th>
                            <th className="px-6 py-2.5 font-medium">到件时长</th>
                            <th className="px-6 py-2.5 font-medium">最近变更</th>
                            <th className="px-6 py-2.5 font-medium">分配对象</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((parcel: any) => {
                            const overdue = isOverdue(parcel)
                            return (
                              <tr
                                key={parcel.id}
                                onClick={() => openDrawer(parcel.id, parcel.tracking_no)}
                                className={`cursor-pointer border-b last:border-0 hover:bg-slate-50 ${overdue ? 'bg-red-50/40' : ''}`}
                              >
                                <td className="px-6 py-3">
                                  <span className="font-mono text-slate-800">{parcel.tracking_no}</span>
                                  {overdue && (
                                    <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                                      超时
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-3 text-slate-600">{parcel.arrived_at ?? parcel.created_at}</td>
                                <td className="px-6 py-3">
                                  <span className={`inline-flex items-center gap-1 ${overdue ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                                    <Clock className={`h-3.5 w-3.5 ${overdue ? 'text-red-500' : 'text-slate-400'}`} />
                                    {parcel.arrived_at ? formatDuration(parcel.arrived_at) : '-'}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-slate-600">{parcel.updated_at}</td>
                                <td className="px-6 py-3 text-slate-600">{parcel.assignee_name ?? '-'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={closeDrawer} />
          <div className="relative w-full max-w-md bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-slate-800">状态变更历史</h2>
              </div>
              <button onClick={closeDrawer} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="border-b px-4 py-2">
              <span className="text-xs text-slate-400">运单号</span>
              <p className="font-mono text-sm font-medium text-slate-700">{drawerTrackingNo}</p>
            </div>
            <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 120px)' }}>
              {drawerLoading && (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                  <p className="mt-4 text-sm text-slate-400">加载中...</p>
                </div>
              )}

              {drawerError && !drawerLoading && (
                <div className="flex flex-col items-center justify-center py-16">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                  <p className="mt-3 text-sm font-medium text-red-600">{drawerError}</p>
                  <button
                    onClick={retryDrawer}
                    className="mt-3 inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    重试
                  </button>
                </div>
              )}

              {!drawerLoading && !drawerError && auditLogs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <History className="h-8 w-8 text-slate-300" />
                  <p className="mt-4 text-sm text-slate-400">暂无操作记录</p>
                </div>
              )}

              {!drawerLoading && !drawerError && auditLogs.length > 0 && (
                <div className="relative ml-3">
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200" />
                  {auditLogs.map((log: any, idx: number) => (
                    <div key={idx} className="relative pb-6 pl-6">
                      <div className="absolute left-0 top-1 h-2.5 w-2.5 -translate-x-[4.5px] rounded-full bg-orange-400" />
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-slate-800">
                          {STATUS_LABELS[log.from_status as ParcelStatus] ?? log.from_status ?? '—'} → {STATUS_LABELS[log.to_status as ParcelStatus] ?? log.to_status}
                        </div>
                        <div className="text-xs text-slate-500">
                          操作人：{log.operator_name}（{ROLE_LABELS[log.operator_role] ?? log.operator_role}）
                        </div>
                        <div className="text-xs text-slate-500">
                          责任人：{log.responsible_name}（{ROLE_LABELS[log.responsible_type] ?? log.responsible_type}）
                        </div>
                        <div className="text-xs text-slate-400">{log.created_at}</div>
                        {log.note && (
                          <div className="text-xs text-slate-500 italic">备注：{log.note}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
