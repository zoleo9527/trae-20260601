import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  FileText,
  User,
  Phone,
  Calendar,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { Contract, ContractStatus, PaginatedResponse } from '@/lib/types'
import { CONTRACT_STATUS_LABELS } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'pending_review', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'returned', label: '已退回' },
  { value: 'in_archive', label: '建档中' },
  { value: 'closed', label: '已关闭' },
]

export default function ContractList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { currentUser } = useAppStore()
  const [data, setData] = useState<PaginatedResponse<Contract> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')

  const status = searchParams.get('status') || ''
  const page = parseInt(searchParams.get('page') || '1')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.contracts.list({ status: status || undefined, search: search || undefined, page, limit: 10 })
      setData(res)
    } catch {
      setData(null)
    }
    setLoading(false)
  }, [status, search, page])

  useEffect(() => { load() }, [load])

  const updateParams = (updates: Record<string, string>) => {
    const p = new URLSearchParams(searchParams)
    for (const [k, v] of Object.entries(updates)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    if (!updates.hasOwnProperty('page')) p.set('page', '1')
    setSearchParams(p)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">家庭签约列表</h2>
        <Link to="/contracts/new" className="btn-primary">
          <Plus size={14} />
          创建签约
        </Link>
      </div>

      <div className="card px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="搜索居民姓名或签约编号..."
              className="input-field pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') updateParams({ search }) }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-zinc-400" />
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => updateParams({ status: f.value })}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  status === f.value
                    ? 'bg-primary-700 text-white'
                    : 'text-zinc-500 hover:bg-zinc-100'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse p-4">
              <div className="h-5 w-48 rounded bg-zinc-200" />
            </div>
          ))}
        </div>
      ) : !data?.data.length ? (
        <div className="card flex flex-col items-center justify-center py-16 text-zinc-400">
          <FileText size={32} className="mb-3 opacity-30" />
          <p className="text-sm">暂无签约记录</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {data.data.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/contracts/${c.id}`)}
                className="card flex cursor-pointer items-center gap-4 p-4 transition-all hover:border-zinc-300 hover:shadow-md"
              >
                <div className={cn(
                  'h-1 w-1 shrink-0 rounded-full',
                  c.status === 'returned' ? 'bg-red-500' : c.status === 'pending_review' ? 'bg-amber-500' : 'bg-primary-500'
                )} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-800">{c.resident_name}</span>
                    <span className={cn('badge', `badge-${c.status}`)}>
                      {CONTRACT_STATUS_LABELS[c.status]}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <FileText size={10} />
                      {c.contract_no}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={10} />
                      {c.contract_type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone size={10} />
                      {c.resident_phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {c.service_package}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs text-zinc-500">{c.team_doctor}</div>
                  <div className="text-[10px] text-zinc-400">
                    {new Date(c.updated_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {data.total > 10 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-zinc-400">
                共 {data.total} 条，第 {page} 页
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => updateParams({ page: String(page - 1) })}
                  className="btn-ghost disabled:opacity-30"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={page * 10 >= data.total}
                  onClick={() => updateParams({ page: String(page + 1) })}
                  className="btn-ghost disabled:opacity-30"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
