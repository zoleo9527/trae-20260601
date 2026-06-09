import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardList, Warehouse, Headphones, Crown,
  ChevronRight, AlertTriangle, Clock, Package, FileCheck, ShoppingCart,
  ArrowRight, Plus,
} from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useStore, roleConfig } from '@/store'
import type { Role } from '@/types'

interface WorkspaceItem {
  id: string
  title: string
  subtitle: string
  status: string
  statusLabel: string
  path: string
  urgent?: boolean
}

interface WorkspaceEntry {
  key: string
  label: string
  description: string
  path: string
  count: number
  items: WorkspaceItem[]
}

interface WorkspaceData {
  role: Role
  roleName: string
  greeting: string
  entries: WorkspaceEntry[]
}

const roleIcons: Record<Role, React.ReactNode> = {
  sales_clerk: <ClipboardList className="h-6 w-6" />,
  warehouse: <Warehouse className="h-6 w-6" />,
  after_sales: <Headphones className="h-6 w-6" />,
  director: <Crown className="h-6 w-6" />,
}

const roleBgColors: Record<Role, string> = {
  sales_clerk: 'from-blue-600 to-blue-700',
  warehouse: 'from-teal-600 to-teal-700',
  after_sales: 'from-indigo-600 to-indigo-700',
  director: 'from-amber-600 to-amber-700',
}

const roleIconBgColors: Record<Role, string> = {
  sales_clerk: 'bg-blue-500/30',
  warehouse: 'bg-teal-500/30',
  after_sales: 'bg-indigo-500/30',
  director: 'bg-amber-500/30',
}

const entryIconMap: Record<string, React.ReactNode> = {
  pending_quals: <FileCheck className="h-4 w-4" />,
  draft_purchases: <ShoppingCart className="h-4 w-4" />,
  pending_purchases: <Clock className="h-4 w-4" />,
  rejected_purchases: <AlertTriangle className="h-4 w-4" />,
  to_confirm_out: <Package className="h-4 w-4" />,
  to_ship: <ShoppingCart className="h-4 w-4" />,
  to_complete: <ClipboardList className="h-4 w-4" />,
  qual_expiring: <AlertTriangle className="h-4 w-4" />,
  expiring_quals: <AlertTriangle className="h-4 w-4" />,
  qual_expiring_purchases: <AlertTriangle className="h-4 w-4" />,
}

const statusColorMap: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expiring_soon: 'bg-amber-100 text-amber-700',
  expired: 'bg-red-100 text-red-700',
  draft: 'bg-gray-100 text-gray-600',
  pending_review: 'bg-blue-100 text-blue-700',
  confirmed_out: 'bg-teal-100 text-teal-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-emerald-100 text-emerald-700',
}

export default function Home() {
  const navigate = useNavigate()
  const { session } = useStore()
  const [data, setData] = useState<WorkspaceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<WorkspaceData>('/workspace')
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (!session) return null

  const role = session.role

  return (
    <div className="space-y-6">
      <div className={cn('relative overflow-hidden rounded-xl bg-gradient-to-r p-6 text-white', roleBgColors[role])}>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', roleIconBgColors[role])}>
              {roleIcons[role]}
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {session.name}，你好
              </h1>
              <p className="mt-0.5 text-sm text-white/80">{data?.greeting || roleConfig[role].description}</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-4 -right-10 h-24 w-24 rounded-full bg-white/5" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : !data || data.entries.length === 0 ? (
        <div className="rounded-xl bg-white py-16 text-center shadow-sm">
          <FileCheck className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm text-gray-400">暂无待处理事项</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data.entries.map((entry) => (
            <div key={entry.key} className="flex flex-col rounded-xl bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg',
                    entry.count > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400',
                  )}>
                    {entryIconMap[entry.key] || <ClipboardList className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{entry.label}</span>
                      {entry.count > 0 && (
                        <span className={cn(
                          'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold',
                          entry.items.some(i => i.urgent) ? 'bg-red-500 text-white' : 'bg-amber-500 text-white',
                        )}>
                          {entry.count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{entry.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(entry.path)}
                  className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-600"
                >
                  查看全部
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              <div className="flex-1 divide-y divide-gray-50">
                {entry.items.length === 0 ? (
                  <div className="px-5 py-6 text-center text-xs text-gray-300">暂无</div>
                ) : (
                  entry.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.path)}
                      className={cn(
                        'flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-gray-50',
                        item.urgent && 'bg-red-50/40 hover:bg-red-50/70',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-gray-900">{item.title}</span>
                          <span className={cn(
                            'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium',
                            statusColorMap[item.status] || 'bg-gray-100 text-gray-600',
                          )}>
                            {item.statusLabel}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-gray-400">{item.subtitle}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {role === 'sales_clerk' && (
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/qualifications', { state: { showForm: true } })}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            新建客户资质
          </button>
          <button
            onClick={() => navigate('/purchases', { state: { showCreate: true } })}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            新建采购申请
          </button>
        </div>
      )}
    </div>
  )
}
