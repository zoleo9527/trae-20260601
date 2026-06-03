import { GroupBadge } from '@/components/StatusBadge'
import { useEventStore } from '@/store/useEventStore'
import { Check, CheckCheck, Search, Tag, X } from 'lucide-react'
import { useMemo, useState } from 'react'

export default function Bibs() {
  const participants = useEventStore(s => s.participants)
  const bibRecords = useEventStore(s => s.bibRecords)
  const issueBib = useEventStore(s => s.issueBib)
  const batchIssueBib = useEventStore(s => s.batchIssueBib)

  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'issued' | 'unissued'>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  const activeParticipants = useMemo(() => participants.filter(p => !p.isWaitlisted), [participants])

  const groups = useMemo(() => {
    const set = new Set(activeParticipants.map(p => p.group))
    return Array.from(set)
  }, [activeParticipants])

  const enriched = useMemo(() => {
    return activeParticipants.map(p => {
      const bib = bibRecords.find(b => b.participantId === p.id)
      return { ...p, issued: bib?.issued ?? false, issuedAt: bib?.issuedAt, issuedBy: bib?.issuedBy }
    })
  }, [activeParticipants, bibRecords])

  const filtered = useMemo(() => {
    return enriched.filter(p => {
      if (search) {
        const q = search.toLowerCase()
        if (!p.name.toLowerCase().includes(q) && !p.bibNumber.toLowerCase().includes(q)) return false
      }
      if (groupFilter !== 'all' && p.group !== groupFilter) return false
      if (statusFilter === 'issued' && !p.issued) return false
      if (statusFilter === 'unissued' && p.issued) return false
      return true
    })
  }, [enriched, search, groupFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)

  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const totalBibs = activeParticipants.length
  const issuedBibs = enriched.filter(p => p.issued).length
  const progressPct = totalBibs === 0 ? 0 : Math.round((issuedBibs / totalBibs) * 100)

  const allPageSelected = paged.length > 0 && paged.every(p => selectedIds.has(p.id))

  function toggleSelectAll() {
    setSelectedIds(prev => {
      const next = new Set(prev)
      for (const p of paged) {
        if (next.has(p.id)) next.delete(p.id)
        else next.add(p.id)
      }
      return next
    })
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleBatchIssue() {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    batchIssueBib(ids, '物料组')
    setSelectedIds(new Set())
  }

  function handleQuickIssue(id: string) {
    issueBib(id, '物料组')
  }

  return (
    <div className="flex flex-col gap-3 h-full p-4 text-xs">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <Tag className="w-4 h-4" />
          号码布发放
        </h1>
        <span className="text-zinc-400">
          已发放 <span className="text-zinc-100 font-medium">{issuedBibs}</span> / {totalBibs}
        </span>
      </div>

      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
        <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progressPct}%` }} />
      </div>
      <div className="text-zinc-500 text-right">{progressPct}%</div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            className="w-full bg-zinc-800 border border-zinc-700 rounded pl-7 pr-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500/50"
            placeholder="搜索姓名/号码..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
          />
        </div>
        <select
          className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-100 focus:border-orange-500/50"
          value={groupFilter}
          onChange={e => { setGroupFilter(e.target.value); setCurrentPage(1) }}
        >
          <option value="all">全部组别</option>
          {groups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <div className="flex rounded overflow-hidden border border-zinc-700">
          {(['all', 'issued', 'unissued'] as const).map(v => {
            const label = v === 'all' ? '全部' : v === 'issued' ? '已发放' : '未发放'
            const active = statusFilter === v
            return (
              <button
                key={v}
                className={`px-2.5 py-1.5 text-xs transition-colors ${active ? 'bg-zinc-600 text-zinc-100' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                onClick={() => { setStatusFilter(v); setCurrentPage(1) }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-zinc-300 cursor-pointer">
          <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAll} className="accent-zinc-400 w-3.5 h-3.5" />
          全选当前页
        </label>
        <button
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1 rounded transition-colors"
          disabled={selectedIds.size === 0}
          onClick={handleBatchIssue}
        >
          <CheckCheck className="w-3.5 h-3.5" />
          批量标记发放
        </button>
        {selectedIds.size > 0 && (
          <button className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors" onClick={() => setSelectedIds(new Set())}>
            <X className="w-3 h-3" />
            清除选择 ({selectedIds.size})
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto rounded border border-zinc-700">
        <table className="w-full text-xs">
          <thead className="bg-zinc-800/80 sticky top-0">
            <tr className="text-zinc-400 text-left">
              <th className="px-2 py-2 w-8"></th>
              <th className="px-2 py-2 min-w-[80px]">号码</th>
              <th className="px-2 py-2">姓名</th>
              <th className="px-2 py-2">组别</th>
              <th className="px-2 py-2">发放状态</th>
              <th className="px-2 py-2">发放时间</th>
              <th className="px-2 py-2">发放人</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(p => (
              <tr key={p.id} className="border-t border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                <td className="px-2 py-1.5">
                  <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} className="accent-zinc-400 w-3.5 h-3.5" />
                </td>
                <td className="px-2 py-1.5 font-mono text-orange-400 min-w-[80px]">{p.bibNumber || '-'}</td>
                <td className="px-2 py-1.5 text-zinc-200">{p.name}</td>
                <td className="px-2 py-1.5"><GroupBadge group={p.group} /></td>
                <td className="px-2 py-1.5">
                  {p.issued ? (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      已发放
                    </span>
                  ) : (
                    <button
                      className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      onClick={() => handleQuickIssue(p.id)}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      未发放
                      <Check className="w-3 h-3 opacity-50" />
                    </button>
                  )}
                </td>
                <td className="px-2 py-1.5 text-zinc-500">{p.issuedAt || '-'}</td>
                <td className="px-2 py-1.5 text-zinc-500">{p.issuedBy || '-'}</td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-zinc-600">无匹配数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-1">
          <button className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 disabled:opacity-30" disabled={safePage <= 1} onClick={() => setCurrentPage(p => p - 1)}>上一页</button>
          <span className="px-2 text-zinc-500">{safePage} / {totalPages}</span>
          <button className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 disabled:opacity-30" disabled={safePage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>下一页</button>
        </div>
      )}
    </div>
  )
}
