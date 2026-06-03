import { GroupBadge, StatusBadge } from '@/components/StatusBadge'
import { useEventStore } from '@/store/useEventStore'
import { FileX, Plus, User } from 'lucide-react'
import { useMemo, useState } from 'react'

export default function Withdrawals() {
  const participants = useEventStore(s => s.participants)
  const withdrawals = useEventStore(s => s.withdrawals)
  const addWithdrawal = useEventStore(s => s.addWithdrawal)
  const getParticipantById = useEventStore(s => s.getParticipantById)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [reason, setReason] = useState('')
  const [recordedBy] = useState('管理员')

  const registeredParticipants = useMemo(
    () => participants.filter(p => p.status === 'registered' && !p.isWaitlisted),
    [participants]
  )

  const filteredParticipants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return registeredParticipants.filter(
      p => p.name.toLowerCase().includes(q) || p.bibNumber.toLowerCase().includes(q)
    )
  }, [searchQuery, registeredParticipants])

  const totalWithdrawals = withdrawals.length
  const groupBreakdown = useMemo(() => {
    const counts: Record<string, number> = { '亲子组': 0, '公开组': 0, '企业团体': 0 }
    withdrawals.forEach(w => {
      const p = getParticipantById(w.participantId)
      if (p && counts[p.group] !== undefined) counts[p.group]++
    })
    return counts
  }, [withdrawals, getParticipantById])

  const reasonDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    withdrawals.forEach(w => {
      counts[w.reason] = (counts[w.reason] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [withdrawals])

  const handleSubmit = () => {
    if (!selectedId || !reason.trim()) return
    addWithdrawal(selectedId, reason.trim(), recordedBy)
    setSearchQuery('')
    setSelectedId('')
    setReason('')
  }

  const selectedParticipant = selectedId ? getParticipantById(selectedId) : null

  return (
    <div className="min-h-screen bg-[#0f0f23] text-white p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileX className="w-5 h-5 text-red-400" />
          <h1 className="text-lg font-bold">退赛记录</h1>
          <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
            {totalWithdrawals}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="bg-[#1a1a2e] rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-red-400">{totalWithdrawals}</div>
          <div className="text-xs text-zinc-400 mt-1">总退赛</div>
        </div>
        <div className="bg-[#1a1a2e] rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-cyan-400">{groupBreakdown['亲子组']}</div>
          <div className="text-xs text-zinc-400 mt-1">亲子组退赛</div>
        </div>
        <div className="bg-[#1a1a2e] rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{groupBreakdown['公开组']}</div>
          <div className="text-xs text-zinc-400 mt-1">公开组退赛</div>
        </div>
        <div className="bg-[#1a1a2e] rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-violet-400">{groupBreakdown['企业团体']}</div>
          <div className="text-xs text-zinc-400 mt-1">企业团体退赛</div>
        </div>
      </div>

      <div className="bg-[#1a1a2e] rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-semibold">登记退赛</h2>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="搜索参赛者姓名或号码布..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              setSelectedId('')
            }}
            className="w-full bg-[#16213e] border border-zinc-700 rounded px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50"
          />
          {filteredParticipants.length > 0 && !selectedId && (
            <div className="absolute z-10 mt-1 w-full bg-[#16213e] border border-zinc-700 rounded shadow-lg max-h-40 overflow-y-auto">
              {filteredParticipants.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedId(p.id)
                    setSearchQuery(p.name)
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-700/50 flex items-center justify-between"
                >
                  <span>
                    <span className="text-white">{p.name}</span>
                    <span className="text-zinc-400 ml-2">{p.bibNumber}</span>
                  </span>
                  <GroupBadge group={p.group} />
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedParticipant && (
          <div className="flex items-center gap-2 bg-[#16213e] rounded px-3 py-2">
            <User className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs text-white">{selectedParticipant.name}</span>
            <span className="text-xs text-zinc-400">{selectedParticipant.bibNumber}</span>
            <GroupBadge group={selectedParticipant.group} />
            <StatusBadge status={selectedParticipant.status} />
            <button
              onClick={() => { setSelectedId(''); setSearchQuery('') }}
              className="ml-auto text-xs text-zinc-500 hover:text-red-400"
            >
              ✕
            </button>
          </div>
        )}

        <textarea
          placeholder="退赛原因..."
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={2}
          className="w-full bg-[#16213e] border border-zinc-700 rounded px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 resize-none"
        />

        <button
          onClick={handleSubmit}
          disabled={!selectedId || !reason.trim()}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium px-4 py-2 rounded transition-colors"
        >
          确认退赛
        </button>
      </div>

      <div className="bg-[#1a1a2e] rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-700/50">
              <th className="text-left px-3 py-2 text-zinc-400 font-medium">参赛者</th>
              <th className="text-left px-3 py-2 text-zinc-400 font-medium">组别</th>
              <th className="text-left px-3 py-2 text-zinc-400 font-medium">退赛原因</th>
              <th className="text-left px-3 py-2 text-zinc-400 font-medium">退赛时间</th>
              <th className="text-left px-3 py-2 text-zinc-400 font-medium">登记人</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map(w => {
              const p = getParticipantById(w.participantId)
              return (
                <tr key={w.id} className="border-b border-zinc-800/50 hover:bg-[#16213e]/50">
                  <td className="px-3 py-2">
                    <span className="text-white">{p?.name || '未知'}</span>
                    <span className="text-zinc-500 ml-1.5">{p?.bibNumber || ''}</span>
                  </td>
                  <td className="px-3 py-2">{p ? <GroupBadge group={p.group} /> : '-'}</td>
                  <td className="px-3 py-2 text-zinc-300">{w.reason}</td>
                  <td className="px-3 py-2 text-zinc-400">{w.withdrewAt}</td>
                  <td className="px-3 py-2 text-zinc-400">{w.recordedBy}</td>
                </tr>
              )
            })}
            {withdrawals.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-zinc-500">
                  暂无退赛记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-[#1a1a2e] rounded-lg p-4">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <FileX className="w-4 h-4 text-zinc-400" />
          退赛统计
        </h2>
        {reasonDistribution.length > 0 ? (
          <ul className="space-y-2">
            {reasonDistribution.map(([r, count]) => (
              <li key={r} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">{r}</span>
                <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{count} 人</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-zinc-500">暂无统计数据</p>
        )}
      </div>
    </div>
  )
}
