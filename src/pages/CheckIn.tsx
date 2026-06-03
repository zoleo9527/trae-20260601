import { GroupBadge, StatusBadge } from '@/components/StatusBadge'
import { useEventStore } from '@/store/useEventStore'
import type { Participant } from '@/types'
import { AlertTriangle, CheckCircle2, Search, User, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

const OPERATOR = '检录台'

function maskIdNumber(id: string) {
  if (id.length <= 6) return id
  return id.slice(0, 3) + '****' + id.slice(-3)
}

function maskPhone(phone: string) {
  if (phone.length <= 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

function formatNow() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function CheckIn() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Participant[]>([])
  const [selected, setSelected] = useState<Participant | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [recentCheckIns, setRecentCheckIns] = useState<{ name: string; bib: string; time: string }[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const searchParticipants = useEventStore(s => s.searchParticipants)
  const checkIn = useEventStore(s => s.checkIn)
  const uncheckIn = useEventStore(s => s.uncheckIn)
  const addAnomaly = useEventStore(s => s.addAnomaly)
  const addWithdrawal = useEventStore(s => s.addWithdrawal)
  const getCheckInRecord = useEventStore(s => s.getCheckInRecord)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (query.trim()) {
      setResults(searchParticipants(query.trim()))
      setActiveIndex(-1)
    } else {
      setResults([])
      setActiveIndex(-1)
    }
  }, [query, searchParticipants])

  const clearSearch = useCallback(() => {
    setQuery('')
    setSelected(null)
    setResults([])
    setActiveIndex(-1)
    inputRef.current?.focus()
  }, [])

  const handleSelect = useCallback((p: Participant) => {
    setSelected(p)
    setQuery('')
    setResults([])
    setActiveIndex(-1)
  }, [])

  const handleCheckIn = useCallback(() => {
    if (!selected) return
    checkIn(selected.id, OPERATOR)
    setRecentCheckIns(prev => [
      { name: selected.name, bib: selected.bibNumber, time: formatNow() },
      ...prev.slice(0, 4),
    ])
    clearSearch()
  }, [selected, checkIn, clearSearch])

  const handleUncheckIn = useCallback(() => {
    if (!selected) return
    uncheckIn(selected.id)
    clearSearch()
  }, [selected, uncheckIn, clearSearch])

  const handleAnomalyIdMismatch = useCallback(() => {
    if (!selected) return
    const desc = window.prompt('请输入证件不符的详细说明：')
    if (desc !== null) addAnomaly(selected.id, 'id_mismatch', desc, OPERATOR)
  }, [selected, addAnomaly])

  const handleAnomalyDuplicate = useCallback(() => {
    if (!selected) return
    addAnomaly(selected.id, 'duplicate_entry', '疑似重复报名', OPERATOR)
  }, [selected, addAnomaly])

  const handleWithdrawal = useCallback(() => {
    if (!selected) return
    const reason = window.prompt('请输入退赛原因：')
    if (reason !== null) {
      addWithdrawal(selected.id, reason, OPERATOR)
      clearSearch()
    }
  }, [selected, addWithdrawal, clearSearch])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      clearSearch()
      return
    }
    if (selected) {
      if (e.key === 'Enter' && selected.status === 'registered') {
        handleCheckIn()
      }
      return
    }
    if (results.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(prev => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault()
        handleSelect(results[activeIndex])
      }
    }
  }, [selected, results, activeIndex, clearSearch, handleCheckIn, handleSelect])

  const checkInRecord = selected ? getCheckInRecord(selected.id) : undefined

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-zinc-100 p-4 md:p-6" onKeyDown={handleKeyDown}>
      <div className="max-w-3xl mx-auto">
        {/* Search */}
        <div className="mt-8 mb-3">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="输入号码或姓名，回车检录"
              className="w-full text-lg font-mono bg-[#1a1a2e] border border-zinc-700/50 rounded-xl py-4 pl-12 pr-10 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition"
              autoFocus
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="max-w-xl mx-auto mt-2 flex items-center justify-center gap-4 text-xs text-zinc-600">
            <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[10px]">Enter</kbd> 确认检录</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[10px]">↑↓</kbd> 选择</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[10px]">Esc</kbd> 清空</span>
          </div>
        </div>

        {/* Search Results */}
        {results.length > 0 && !selected && (
          <div className="max-w-xl mx-auto space-y-2 mb-6">
            {results.slice(0, 4).map((p, i) => (
              <button
                key={p.id}
                onClick={() => handleSelect(p)}
                className={`w-full text-left bg-[#1a1a2e] rounded-lg p-3 flex items-center gap-3 transition hover:bg-[#222240] ${
                  i === activeIndex ? 'ring-1 ring-emerald-500/50 bg-[#222240]' : ''
                }`}
              >
                <span className="text-xl font-mono font-bold text-emerald-400 min-w-[4rem]">{p.bibNumber}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{p.name}</span>
                    <GroupBadge group={p.group} />
                  </div>
                  <div className="text-xs text-zinc-500 truncate">{p.team || '-'}</div>
                </div>
                <StatusBadge status={p.status} />
              </button>
            ))}
            {results.length > 4 && (
              <div className="text-center text-xs text-zinc-600 py-1">
                还有 {results.length - 4} 个结果，请缩小搜索范围
              </div>
            )}
          </div>
        )}

        {/* Detail Panel */}
        {selected && (
          <div className="max-w-xl mx-auto bg-[#1a1a2e] rounded-xl p-5 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-3xl font-mono font-bold text-emerald-400">{selected.bibNumber}</span>
                  <StatusBadge status={selected.status} />
                </div>
                <h2 className="text-xl font-semibold">{selected.name}</h2>
              </div>
              <button
                onClick={clearSearch}
                className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-5">
              <div><span className="text-zinc-500">组别</span><div className="mt-0.5"><GroupBadge group={selected.group} /></div></div>
              <div><span className="text-zinc-500">性别</span><div className="mt-0.5">{selected.gender}</div></div>
              <div><span className="text-zinc-500">年龄</span><div className="mt-0.5">{selected.age}</div></div>
              <div><span className="text-zinc-500">队伍</span><div className="mt-0.5">{selected.team || '-'}</div></div>
              <div><span className="text-zinc-500">证件号</span><div className="mt-0.5 font-mono text-xs">{maskIdNumber(selected.idNumber)}</div></div>
              <div><span className="text-zinc-500">手机</span><div className="mt-0.5 font-mono text-xs">{maskPhone(selected.phone)}</div></div>
            </div>

            {/* Status Actions */}
            <div className="mb-4">
              {selected.status === 'registered' && (
                <button
                  onClick={handleCheckIn}
                  className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-lg font-bold transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  确认检录
                </button>
              )}
              {selected.status === 'checked_in' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold">已检录</span>
                    {checkInRecord?.checkedInAt && (
                      <span className="text-sm text-emerald-500">{checkInRecord.checkedInAt}</span>
                    )}
                  </div>
                  <button
                    onClick={handleUncheckIn}
                    className="w-full py-2.5 rounded-lg border border-zinc-600 text-zinc-400 hover:bg-zinc-800 text-sm transition"
                  >
                    撤销检录
                  </button>
                </div>
              )}
              {selected.status === 'withdrawn' && (
                <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">已退赛</span>
                </div>
              )}
            </div>

            {/* Anomaly Quick Actions */}
            {selected.status !== 'withdrawn' && (
              <div>
                <div className="text-xs text-zinc-500 mb-2">异常操作</div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAnomalyIdMismatch}
                    className="flex-1 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/20 transition flex items-center justify-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    证件不符
                  </button>
                  <button
                    onClick={handleWithdrawal}
                    className="flex-1 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/20 transition flex items-center justify-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5" />
                    临时退赛
                  </button>
                  <button
                    onClick={handleAnomalyDuplicate}
                    className="flex-1 py-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm hover:bg-purple-500/20 transition flex items-center justify-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    重复报名
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Check-ins */}
        {recentCheckIns.length > 0 && (
          <div className="max-w-xl mx-auto">
            <div className="text-xs text-zinc-600 mb-2">最近检录</div>
            <div className="space-y-1">
              {recentCheckIns.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 text-sm bg-[#1a1a2e]/50 rounded-lg px-3 py-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="font-mono text-emerald-400">{r.bib}</span>
                  <span className="text-zinc-300 truncate">{r.name}</span>
                  <span className="ml-auto text-xs text-zinc-600 shrink-0">{r.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!query && !selected && results.length === 0 && (
          <div className="text-center mt-20 text-zinc-700">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">输入号码或姓名开始检录</p>
          </div>
        )}
      </div>
    </div>
  )
}
