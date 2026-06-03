import { AnomalyStatusBadge, AnomalyTypeBadge, GroupBadge } from '@/components/StatusBadge'
import { useEventStore } from '@/store/useEventStore'
import { AlertTriangle, CheckCircle2, ClipboardCheck, Clock, FileX, Tag, Users, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const {
    participants,
    bibRecords,
    anomalies,
    resolveAnomaly,
    dismissAnomaly,
    getParticipantsByGroup,
  } = useEventStore()

  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const activeParticipants = participants.filter(p => !p.isWaitlisted)
  const checkedIn = activeParticipants.filter(p => p.status === 'checked_in')
  const notCheckedIn = activeParticipants.filter(p => p.status === 'registered')
  const withdrawn = activeParticipants.filter(p => p.status === 'withdrawn')
  const notIssuedBib = activeParticipants.filter(p => {
    const bib = bibRecords.find(b => b.participantId === p.id)
    return bib && !bib.issued
  })

  const pendingAnomalies = anomalies.filter(a => a.status === 'pending')

  const groups: Array<{ name: string; color: string }> = [
    { name: '亲子组', color: 'bg-cyan-500' },
    { name: '公开组', color: 'bg-blue-500' },
    { name: '企业团体', color: 'bg-violet-500' },
  ]

  const groupCounts = groups.map(g => ({
    ...g,
    count: getParticipantsByGroup(g.name as never).length,
  }))
  const maxGroupCount = Math.max(...groupCounts.map(g => g.count), 1)

  const issuedCount = activeParticipants.filter(p => {
    const bib = bibRecords.find(b => b.participantId === p.id)
    return bib && bib.issued
  }).length
  const totalBib = activeParticipants.length
  const issuedPct = totalBib > 0 ? Math.round((issuedCount / totalBib) * 100) : 0

  const stats = [
    { label: '报名总数', value: activeParticipants.length, icon: Users, border: 'border-orange-500', text: 'text-orange-400' },
    { label: '已检录', value: checkedIn.length, icon: ClipboardCheck, border: 'border-emerald-500', text: 'text-emerald-400' },
    { label: '待检录', value: notCheckedIn.length, icon: Clock, border: 'border-amber-500', text: 'text-amber-400' },
    { label: '已退赛', value: withdrawn.length, icon: FileX, border: 'border-red-500', text: 'text-red-400' },
    { label: '号码布待发放', value: notIssuedBib.length, icon: Tag, border: 'border-violet-500', text: 'text-violet-400' },
  ]

  return (
    <div className="bg-[#0f0f1a] min-h-screen p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-zinc-100 tracking-tight">赛事总览</h1>
        <span className="text-[10px] text-zinc-500 font-mono">
          {now.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {stats.map(s => (
          <div key={s.label} className={`bg-[#1a1a2e] rounded-lg p-4 border-l-2 ${s.border}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-400">{s.label}</span>
              <s.icon className="w-3.5 h-3.5 text-zinc-600" />
            </div>
            <div className={`text-2xl font-mono font-bold ${s.text}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#1a1a2e] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <h2 className="text-xs font-semibold text-zinc-200">待处理异常</h2>
          <span className="text-[10px] text-zinc-500">{pendingAnomalies.length} 条</span>
        </div>
        {pendingAnomalies.length === 0 ? (
          <div className="text-xs text-zinc-500 py-4 text-center">暂无待处理异常</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="text-left py-2 pr-3 font-medium">类型</th>
                  <th className="text-left py-2 pr-3 font-medium">描述</th>
                  <th className="text-left py-2 pr-3 font-medium">状态</th>
                  <th className="text-left py-2 pr-3 font-medium">报告人</th>
                  <th className="text-right py-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {pendingAnomalies.map(a => (
                  <tr key={a.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-2 pr-3"><AnomalyTypeBadge type={a.type} /></td>
                    <td className="py-2 pr-3 text-zinc-300 max-w-[200px] truncate">{a.description}</td>
                    <td className="py-2 pr-3"><AnomalyStatusBadge status={a.status} /></td>
                    <td className="py-2 pr-3 text-zinc-400">{a.reportedBy}</td>
                    <td className="py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => resolveAnomaly(a.id)}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[10px]"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          解决
                        </button>
                        <button
                          onClick={() => dismissAnomaly(a.id)}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20 text-[10px]"
                        >
                          <XCircle className="w-3 h-3" />
                          忽略
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-[#1a1a2e] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-3.5 h-3.5 text-blue-400" />
          <h2 className="text-xs font-semibold text-zinc-200">组别分布</h2>
        </div>
        <div className="space-y-2.5">
          {groupCounts.map(g => (
            <div key={g.name} className="flex items-center gap-2">
              <div className="w-16 flex-shrink-0">
                <GroupBadge group={g.name} />
              </div>
              <div className="flex-1 h-5 bg-zinc-800/50 rounded overflow-hidden">
                <div
                  className={`h-full ${g.color} rounded transition-all duration-500`}
                  style={{ width: `${(g.count / maxGroupCount) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-400 font-mono w-8 text-right">{g.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#1a1a2e] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-3.5 h-3.5 text-violet-400" />
          <h2 className="text-xs font-semibold text-zinc-200">号码布发放进度</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-4 bg-zinc-800/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${issuedPct}%` }}
            />
          </div>
          <span className="text-xs font-mono text-zinc-300 w-10 text-right">{issuedPct}%</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-zinc-500">已发放 {issuedCount}</span>
          <span className="text-[10px] text-zinc-500">未发放 {totalBib - issuedCount} / 共 {totalBib}</span>
        </div>
      </div>
    </div>
  )
}
