import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  Search,
  Filter,
  Archive as ArchiveIcon,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { Archive, PaginatedResponse } from '@/lib/types'
import { ARCHIVE_STATUS_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'returned', label: '已退回' },
  { value: 'completed', label: '已完成' },
  { value: 'closed', label: '已关闭' },
]

export default function ArchiveList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState<PaginatedResponse<Archive> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [contractId, setContractId] = useState('')
  const [creating, setCreating] = useState(false)

  const status = searchParams.get('status') || ''
  const page = parseInt(searchParams.get('page') || '1')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.archives.list({ status: status || undefined, search: search || undefined, page, limit: 10 })
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

  const handleCreate = async () => {
    if (!contractId.trim() || creating) return
    setCreating(true)
    try {
      const archive = await api.archives.create(contractId.trim())
      setShowCreateModal(false)
      setContractId('')
      navigate(`/archives/${archive.id}`)
    } catch (e) {
      alert(e instanceof Error ? e.message : '创建失败')
    }
    setCreating(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">档案建档列表</h2>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <ArchiveIcon size={14} />
          从签约创建建档
        </button>
      </div>

      <div className="card px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="搜索居民姓名、签约编号或档案编号..."
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
          <ArchiveIcon size={32} className="mb-3 opacity-30" />
          <p className="text-sm">暂无建档记录</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {data.data.map((a) => (
              <div
                key={a.id}
                onClick={() => navigate(`/archives/${a.id}`)}
                className="card flex cursor-pointer items-center gap-4 p-4 transition-all hover:border-zinc-300 hover:shadow-md"
              >
                <div className={cn(
                  'h-1 w-1 shrink-0 rounded-full',
                  a.status === 'returned' ? 'bg-red-500' : a.status === 'pending' ? 'bg-amber-500' : a.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
                )} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-800">{a.resident_name || '未知'}</span>
                    <span className={cn('badge', `badge-${a.status}`)}>
                      {ARCHIVE_STATUS_LABELS[a.status]}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-xs text-zinc-400">
                    <span>档案编号: {a.archive_no}</span>
                    <span>签约编号: {a.contract_no}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {a.processed_by && <div className="text-xs text-zinc-500">{a.processed_by}</div>}
                  {a.return_reason && (
                    <div className="flex items-center gap-1 text-[10px] text-red-500">
                      <AlertTriangle size={8} />
                      {a.return_reason}
                    </div>
                  )}
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    {new Date(a.updated_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
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

      {showCreateModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowCreateModal(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-96 rounded-xl border border-zinc-200 bg-white p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-zinc-800 mb-1">从签约创建建档</h3>
            <p className="text-xs text-zinc-400 mb-4">输入签约ID或从签约列表进入</p>
            <input
              type="text"
              className="input-field mb-3"
              placeholder="请输入签约记录ID"
              value={contractId}
              onChange={(e) => setContractId(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary text-xs">取消</button>
              <button onClick={handleCreate} disabled={creating || !contractId.trim()} className="btn-primary text-xs">
                创建
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
