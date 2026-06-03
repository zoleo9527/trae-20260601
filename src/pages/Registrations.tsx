import { GroupBadge, StatusBadge } from '@/components/StatusBadge'
import { useEventStore } from '@/store/useEventStore'
import type { GroupName, ParticipantStatus } from '@/types'
import { ChevronDown, ChevronUp, Filter, Search, User, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const groupOptions: { value: GroupName | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: '亲子组', label: '亲子组' },
  { value: '公开组', label: '公开组' },
  { value: '企业团体', label: '企业团体' },
]

const statusOptions: { value: ParticipantStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'registered', label: '已报名' },
  { value: 'checked_in', label: '已检录' },
  { value: 'withdrawn', label: '已退赛' },
]

export default function Registrations() {
  const { participants, bibRecords, checkInRecords, addWithdrawal, addAnomaly } = useEventStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState<GroupName | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<ParticipantStatus | 'all'>('all')
  const [showWaitlisted, setShowWaitlisted] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({})

  useEffect(() => {
    if (highlightId) {
      setExpandedId(highlightId)
      const timer = setTimeout(() => {
        const el = rowRefs.current[highlightId]
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [highlightId])

  const filtered = useMemo(() => {
    let list = [...participants]
    if (!showWaitlisted) {
      list = list.filter(p => !p.isWaitlisted)
    }
    if (groupFilter !== 'all') {
      list = list.filter(p => p.group === groupFilter)
    }
    if (statusFilter !== 'all') {
      list = list.filter(p => p.status === statusFilter)
    }
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.bibNumber.toLowerCase().includes(q) ||
        p.phone.includes(q)
      )
    }
    list.sort((a, b) => {
      if (a.isWaitlisted !== b.isWaitlisted) return a.isWaitlisted ? 1 : -1
      const bibA = a.bibNumber || 'ZZZ'
      const bibB = b.bibNumber || 'ZZZ'
      return bibA.localeCompare(bibB)
    })
    return list
  }, [participants, searchQuery, groupFilter, statusFilter, showWaitlisted])

  const toggleExpand = (id: string) => {
    setExpandedId(prev => {
      if (prev === id && highlightId) {
        setSearchParams({}, { replace: true })
      }
      return prev === id ? null : id
    })
  }

  const handleWithdraw = (participantId: string) => {
    const reason = prompt('请输入退赛原因：')
    if (reason) {
      addWithdrawal(participantId, reason, '当前操作员')
      setExpandedId(null)
    }
  }

  const handleAnomaly = (participantId: string) => {
    const description = prompt('请输入异常描述：')
    if (description) {
      addAnomaly(participantId, 'other', description, '当前操作员')
      setExpandedId(null)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0f0f1a] text-zinc-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-zinc-400" />
          <h1 className="text-sm font-semibold">报名名单</h1>
          <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
            {filtered.length} / {participants.length}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 flex-wrap">
        <div className="relative flex items-center">
          <Search className="absolute left-2 w-3 h-3 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="姓名/号码/手机"
            className="w-40 h-7 pl-7 pr-6 text-xs bg-[#1a1a2e] border border-zinc-700 rounded placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-1.5">
              <X className="w-3 h-3 text-zinc-500 hover:text-zinc-300" />
            </button>
          )}
        </div>

        <div className="relative">
          <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
          <select
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value as GroupName | 'all')}
            className="h-7 pl-7 pr-6 text-xs bg-[#1a1a2e] border border-zinc-700 rounded appearance-none cursor-pointer focus:outline-none focus:border-zinc-500"
          >
            {groupOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as ParticipantStatus | 'all')}
            className="h-7 pl-7 pr-6 text-xs bg-[#1a1a2e] border border-zinc-700 rounded appearance-none cursor-pointer focus:outline-none focus:border-zinc-500"
          >
            {statusOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-1 text-xs text-zinc-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showWaitlisted}
            onChange={e => setShowWaitlisted(e.target.checked)}
            className="w-3 h-3 accent-yellow-500"
          />
          候补
        </label>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-[#12122a] text-zinc-500 text-[10px] uppercase tracking-wider">
            <tr>
              <th className="text-left px-3 py-2 font-medium">号码</th>
              <th className="text-left px-3 py-2 font-medium">姓名</th>
              <th className="text-left px-3 py-2 font-medium">组别</th>
              <th className="text-left px-3 py-2 font-medium">队伍</th>
              <th className="text-left px-3 py-2 font-medium">性别</th>
              <th className="text-left px-3 py-2 font-medium">年龄</th>
              <th className="text-left px-3 py-2 font-medium">状态</th>
              <th className="text-left px-3 py-2 font-medium">手机</th>
              <th className="text-center px-3 py-2 font-medium w-8"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const isExpanded = expandedId === p.id
              const bibRec = bibRecords.find(b => b.participantId === p.id)
              const checkRec = checkInRecords.find(c => c.participantId === p.id)

              return (
                <tr key={p.id} ref={el => { rowRefs.current[p.id] = el }} className={`border-b border-zinc-800/50 ${highlightId === p.id ? 'ring-1 ring-orange-500/50' : ''}`}>
                  <td colSpan={9} className="p-0">
                    <div
                      onClick={() => toggleExpand(p.id)}
                      className={`flex items-center cursor-pointer hover:bg-zinc-700/30 ${isExpanded ? 'bg-zinc-800/50' : 'bg-[#1a1a2e]'} ${highlightId === p.id ? 'bg-orange-500/10' : ''}`}
                    >
                      <div className="flex-1 grid grid-cols-[5rem_5rem_5rem_6rem_2.5rem_2.5rem_5rem_7rem] items-center min-w-0">
                        <span className="px-3 py-2 font-mono truncate flex items-center gap-1">
                          {p.isWaitlisted && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                          )}
                          {p.bibNumber || '—'}
                        </span>
                        <span className="px-3 py-2 truncate flex items-center gap-1">
                          {p.name}
                          {p.isWaitlisted && (
                            <span className="text-[9px] text-yellow-400 bg-yellow-500/10 px-1 rounded">候补</span>
                          )}
                        </span>
                        <span className="px-3 py-2"><GroupBadge group={p.group} /></span>
                        <span className="px-3 py-2 truncate text-zinc-400">{p.group === '企业团体' ? (p.team || '—') : ''}</span>
                        <span className="px-3 py-2 text-zinc-400">{p.gender}</span>
                        <span className="px-3 py-2 text-zinc-400">{p.age}</span>
                        <span className="px-3 py-2"><StatusBadge status={p.status} /></span>
                        <span className="px-3 py-2 text-zinc-400 font-mono truncate">{p.phone}</span>
                      </div>
                      <div className="px-2 py-2 flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3 text-zinc-500" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-zinc-500" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="bg-[#141428] px-4 py-3 border-t border-zinc-800/50">
                        <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-xs mb-3">
                          <div>
                            <span className="text-zinc-500">证件号码</span>
                            <p className="font-mono text-zinc-300 mt-0.5">{p.idNumber}</p>
                          </div>
                          <div>
                            <span className="text-zinc-500">紧急联系人</span>
                            <p className="text-zinc-300 mt-0.5">{p.emergencyContact} ({p.emergencyPhone})</p>
                          </div>
                          <div>
                            <span className="text-zinc-500">报名时间</span>
                            <p className="text-zinc-300 mt-0.5">{p.registeredAt}</p>
                          </div>
                          <div>
                            <span className="text-zinc-500">号码布状态</span>
                            <p className="mt-0.5">
                              {bibRec ? (
                                bibRec.issued ? (
                                  <span className="text-emerald-400">已发放 {bibRec.issuedAt && `(${bibRec.issuedAt})`}</span>
                                ) : (
                                  <span className="text-zinc-400">未发放</span>
                                )
                              ) : (
                                <span className="text-zinc-500">无记录</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500">检录状态</span>
                            <p className="mt-0.5">
                              {checkRec ? (
                                checkRec.checkedIn ? (
                                  <span className="text-emerald-400">已检录 {checkRec.checkedInAt && `(${checkRec.checkedInAt})`}</span>
                                ) : (
                                  <span className="text-zinc-400">未检录</span>
                                )
                              ) : (
                                <span className="text-zinc-500">无记录</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/50">
                          {p.status !== 'withdrawn' && (
                            <button
                              onClick={() => handleWithdraw(p.id)}
                              className="px-2.5 py-1 text-[10px] font-medium bg-red-600/20 text-red-400 border border-red-500/30 rounded hover:bg-red-600/30"
                            >
                              标记退赛
                            </button>
                          )}
                          <button
                            onClick={() => handleAnomaly(p.id)}
                            className="px-2.5 py-1 text-[10px] font-medium bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded hover:bg-amber-600/30"
                          >
                            报告异常
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-16 text-zinc-600 text-xs">
            暂无匹配的报名记录
          </div>
        )}
      </div>
    </div>
  )
}
