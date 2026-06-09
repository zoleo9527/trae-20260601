import { useParcelStore } from '@/store/parcelStore'
import { ROLE_LABELS, STATUS_LABELS, type ParcelStatus } from '@shared/types'
import { AlertCircle, Clock, LayoutDashboard, Loader2, RefreshCw, User } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

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

function formatDuration(arrivedAt: string): string {
  const now = new Date()
  const arrived = new Date(arrivedAt.replace(' ', 'T'))
  const diffMs = now.getTime() - arrived.getTime()
  if (diffMs < 0) return '刚刚'
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时${minutes % 60}分钟`
  const days = Math.floor(hours / 24)
  return `${days}天${hours % 24}小时`
}

export default function WorkspacePage() {
  const {
    parcels, staff, loading, error, workspaceSummary,
    fetchParcels, fetchStaff, fetchWorkspaceSummary,
  } = useParcelStore()

  const [selectedStaffId, setSelectedStaffId] = useState<number | ''>('')
  const [selectedRole, setSelectedRole] = useState<string>('')

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

  const activeParcels = useMemo(() => {
    return parcels.filter((p: any) =>
      GROUP_ORDER.includes(p.status as ParcelStatus)
    )
  }, [parcels])

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
    return map
  }, [activeParcels])

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

          {activeParcels.length === 0 ? (
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
                          {items.map((parcel: any) => (
                            <tr key={parcel.id} className="border-b last:border-0 hover:bg-slate-50">
                              <td className="px-6 py-3 font-mono text-slate-800">{parcel.tracking_no}</td>
                              <td className="px-6 py-3 text-slate-600">{parcel.arrived_at ?? parcel.created_at}</td>
                              <td className="px-6 py-3">
                                <span className="inline-flex items-center gap-1 text-slate-600">
                                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                                  {parcel.arrived_at ? formatDuration(parcel.arrived_at) : '-'}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-slate-600">{parcel.updated_at}</td>
                              <td className="px-6 py-3 text-slate-600">{parcel.assignee_name ?? '-'}</td>
                            </tr>
                          ))}
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
    </div>
  )
}
