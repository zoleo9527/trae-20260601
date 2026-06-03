import { AnomalyStatusBadge, GroupBadge, StatusBadge } from '@/components/StatusBadge'
import { useEventStore } from '@/store/useEventStore'
import type { GroupName } from '@/types'
import { AlertTriangle, ArrowRightLeft, Check, CheckCircle2, Layers, UserPlus, Users, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const GROUP_KEYS: GroupName[] = ['亲子组', '公开组', '企业团体']

export default function Groups() {
  const participants = useEventStore(s => s.participants)
  const anomalies = useEventStore(s => s.anomalies)
  const changeGroup = useEventStore(s => s.changeGroup)
  const activateWaitlisted = useEventStore(s => s.activateWaitlisted)
  const resolveGroupConflict = useEventStore(s => s.resolveGroupConflict)
  const dismissGroupConflict = useEventStore(s => s.dismissGroupConflict)
  const navigate = useNavigate()
  const [selectedGroup, setSelectedGroup] = useState<GroupName | null>(null)
  const [conflictTab, setConflictTab] = useState<'pending' | 'handled'>('pending')

  const getGroupParticipants = (name: GroupName) =>
    participants.filter(p => p.group === name && !p.isWaitlisted)

  const waitlisted = participants.filter(p => p.isWaitlisted)

  const conflicts = useMemo(() => {
    const nameCount: Record<string, { id: string; bibNumber: string; group: string; team?: string; status: string }[]> = {}
    participants.filter(p => !p.isWaitlisted).forEach(p => {
      const key = p.idNumber
      if (!nameCount[key]) nameCount[key] = []
      nameCount[key].push({ id: p.id, bibNumber: p.bibNumber, group: p.group, team: p.team, status: p.status })
    })
    return Object.entries(nameCount)
      .filter(([, entries]) => {
        const groups = new Set(entries.map(e => e.group))
        return groups.size > 1
      })
      .map(([idNumber, entries]) => {
        const name = participants.find(p => p.idNumber === idNumber)?.name || ''
        const relatedAnomaly = anomalies.find(a =>
          entries.some(e => e.id === a.participantId) && (a.type === 'duplicate_entry' || a.type === 'group_conflict')
        )
        return {
          participantId: entries[0].id,
          name,
          idNumber,
          entries,
          groups: entries.map(e => e.group),
          anomalyStatus: relatedAnomaly ? relatedAnomaly.status : 'none' as const,
        }
      })
  }, [participants, anomalies])

  const pendingConflicts = conflicts.filter(c => c.anomalyStatus === 'pending' || c.anomalyStatus === 'none')
  const handledConflicts = conflicts.filter(c => c.anomalyStatus === 'resolved' || c.anomalyStatus === 'dismissed')

  const totalParticipants = participants.filter(p => !p.isWaitlisted).length

  const selectedList = selectedGroup ? getGroupParticipants(selectedGroup) : []

  function handleChangeGroup(participantId: string, newGroup: GroupName) {
    changeGroup(participantId, newGroup)
  }

  function handleActivate(participantId: string) {
    const bib = window.prompt('请输入分配的参赛号码：')
    if (bib) {
      activateWaitlisted(participantId, bib)
    }
  }

  return (
    <div className="p-4 space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          分组管理
        </h1>
        <span className="text-zinc-400">{GROUP_KEYS.length} 个分组 / {totalParticipants} 名选手</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          {GROUP_KEYS.map(name => {
            const list = getGroupParticipants(name)
            const isSelected = selectedGroup === name
            return (
              <div
                key={name}
                onClick={() => setSelectedGroup(name)}
                className={`bg-[#1a1a2e] rounded-lg p-3 cursor-pointer transition border ${isSelected ? 'border-orange-500/50' : 'border-transparent'} hover:border-orange-500/30`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-semibold">{name}</span>
                    <GroupBadge group={name} />
                  </div>
                  <span className="text-zinc-400">{list.length} 人</span>
                </div>
                <div className="space-y-1">
                  {list.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <span className="truncate">{p.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 font-mono">{p.bibNumber || '--'}</span>
                        <StatusBadge status={p.status} />
                      </div>
                    </div>
                  ))}
                  {list.length > 5 && (
                    <div className="text-zinc-500">...还有 {list.length - 5} 人</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div>
          {selectedGroup ? (
            <div className="bg-[#1a1a2e] rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold">{selectedGroup} 详情</h2>
                <span className="text-zinc-400">{selectedList.length} 人</span>
              </div>
              <div className="space-y-1.5 max-h-[60vh] overflow-y-auto scrollbar-thin">
                {selectedList.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-[#22223a] rounded px-2 py-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-orange-400">{p.bibNumber || '--'}</span>
                      <span className="font-medium">{p.name}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedGroup === '企业团体' && p.team && (
                        <span className="text-yellow-400/70">{p.team}</span>
                      )}
                      <select
                        value={p.group}
                        onChange={e => handleChangeGroup(p.id, e.target.value as GroupName)}
                        className="bg-[#1a1a2e] text-xs text-zinc-300 border border-zinc-700 rounded px-1 py-0.5"
                      >
                        {GROUP_KEYS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#1a1a2e] rounded-lg p-8 flex items-center justify-center text-zinc-500">
              点击左侧分组查看详情
            </div>
          )}
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="bg-[#1a1a2e] rounded-lg overflow-hidden">
          <div className="flex items-center border-b border-zinc-800">
            <button
              onClick={() => setConflictTab('pending')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors ${
                conflictTab === 'pending'
                  ? 'bg-red-500/10 text-red-400 border-b-2 border-red-500'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              待处理
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                conflictTab === 'pending' ? 'bg-red-500/20 text-red-400' : 'bg-zinc-700 text-zinc-400'
              }`}>
                {pendingConflicts.length}
              </span>
            </button>
            <div className="w-px h-6 bg-zinc-700" />
            <button
              onClick={() => setConflictTab('handled')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors ${
                conflictTab === 'handled'
                  ? 'bg-zinc-500/10 text-zinc-300 border-b-2 border-zinc-500'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              已处理
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                conflictTab === 'handled' ? 'bg-zinc-600 text-zinc-300' : 'bg-zinc-700 text-zinc-400'
              }`}>
                {handledConflicts.length}
              </span>
            </button>
          </div>

          <div className="p-3 space-y-3 max-h-[50vh] overflow-y-auto scrollbar-thin">
            {conflictTab === 'pending' && pendingConflicts.length === 0 && (
              <div className="text-center py-8 text-zinc-500 text-xs">
                待处理冲突已全部处理完毕
              </div>
            )}

            {conflictTab === 'pending' && pendingConflicts.map((c, i) => (
              <div key={i} className="bg-red-900/15 rounded-lg p-3 space-y-2 border border-red-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-red-300">{c.name}</span>
                    <span className="text-zinc-500 font-mono text-[10px]">证件尾号 {c.idNumber.slice(-4)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.anomalyStatus === 'pending' && <AnomalyStatusBadge status="pending" />}
                    {c.anomalyStatus === 'none' && <span className="text-[10px] text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">未登记</span>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.groups.map((g, gi) => (
                    <GroupBadge key={gi} group={g} />
                  ))}
                </div>
                <div className="space-y-1">
                  {c.entries.map(e => (
                    <div
                      key={e.id}
                      onClick={() => navigate(`/registrations?highlight=${e.id}`)}
                      className="flex items-center justify-between text-xs bg-[#1a1a2e] rounded px-2 py-1.5 cursor-pointer hover:bg-[#22223a] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-orange-400">{e.bibNumber || '--'}</span>
                        <GroupBadge group={e.group} />
                        {e.team && <span className="text-yellow-400/70">{e.team}</span>}
                      </div>
                      <StatusBadge status={e.status as 'registered' | 'checked_in' | 'withdrawn' | 'disqualified'} />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-red-500/20">
                  <button
                    onClick={() => resolveGroupConflict(c.entries.map(e => e.id))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-600/30 transition-colors"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    已解决
                  </button>
                  <button
                    onClick={() => dismissGroupConflict(c.entries.map(e => e.id))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium bg-zinc-600/20 text-zinc-400 border border-zinc-500/30 rounded hover:bg-zinc-600/30 transition-colors"
                  >
                    <XCircle className="w-3 h-3" />
                    忽略
                  </button>
                </div>
              </div>
            ))}

            {conflictTab === 'handled' && handledConflicts.length === 0 && (
              <div className="text-center py-8 text-zinc-500 text-xs">
                暂无已处理的冲突记录
              </div>
            )}

            {conflictTab === 'handled' && handledConflicts.map((c, i) => (
              <div key={i} className="bg-zinc-800/40 rounded-lg p-3 space-y-2 border border-zinc-700/50 opacity-80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-300">{c.name}</span>
                    <span className="text-zinc-500 font-mono text-[10px]">证件尾号 {c.idNumber.slice(-4)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.anomalyStatus === 'resolved' && <AnomalyStatusBadge status="resolved" />}
                    {c.anomalyStatus === 'dismissed' && <AnomalyStatusBadge status="dismissed" />}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.groups.map((g, gi) => (
                    <GroupBadge key={gi} group={g} />
                  ))}
                </div>
                <div className="space-y-1">
                  {c.entries.map(e => (
                    <div
                      key={e.id}
                      onClick={() => navigate(`/registrations?highlight=${e.id}`)}
                      className="flex items-center justify-between text-xs bg-[#1a1a2e] rounded px-2 py-1.5 cursor-pointer hover:bg-[#22223a] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-zinc-400">{e.bibNumber || '--'}</span>
                        <GroupBadge group={e.group} />
                        {e.team && <span className="text-yellow-400/50">{e.team}</span>}
                      </div>
                      <StatusBadge status={e.status as 'registered' | 'checked_in' | 'withdrawn' | 'disqualified'} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {conflicts.length === 0 && (
        <div className="bg-[#1a1a2e] rounded-lg p-3 border-l-4 border-emerald-500">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-emerald-400">无组别冲突</h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">所有选手的组别归属唯一，未发现重复报名或跨组冲突</p>
        </div>
      )}

      {waitlisted.length > 0 && (
        <div className="bg-[#1a1a2e] rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold">候补选手</h2>
            <span className="text-zinc-400">{waitlisted.length} 人</span>
          </div>
          {waitlisted.map(p => (
            <div key={p.id} className="flex items-center justify-between text-xs bg-[#22223a] rounded px-2 py-1.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="font-medium">{p.name}</span>
                <GroupBadge group={p.group} />
                <span className="text-amber-400/70">候补</span>
              </div>
              <button
                onClick={() => handleActivate(p.id)}
                className="flex items-center gap-1 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded px-2 py-0.5 transition"
              >
                <Check className="w-3 h-3" />
                转正
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
