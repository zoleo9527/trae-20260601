import { AnomalyStatusBadge, GroupBadge, StatusBadge } from '@/components/StatusBadge'
import { useEventStore } from '@/store/useEventStore'
import type { GroupName } from '@/types'
import { AlertTriangle, ArrowRightLeft, Check, Layers, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'

const GROUP_KEYS: GroupName[] = ['亲子组', '公开组', '企业团体']

export default function Groups() {
  const participants = useEventStore(s => s.participants)
  const changeGroup = useEventStore(s => s.changeGroup)
  const activateWaitlisted = useEventStore(s => s.activateWaitlisted)
  const getGroupConflicts = useEventStore(s => s.getGroupConflicts)
  const [selectedGroup, setSelectedGroup] = useState<GroupName | null>(null)

  const getGroupParticipants = (name: GroupName) =>
    participants.filter(p => p.group === name && !p.isWaitlisted)

  const waitlisted = participants.filter(p => p.isWaitlisted)
  const conflicts = getGroupConflicts()

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
        <div className="bg-[#1a1a2e] rounded-lg p-3 border-l-4 border-red-500">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-semibold text-red-400">组别冲突</h2>
            <span className="text-zinc-500">{conflicts.length} 人</span>
          </div>
          <div className="space-y-3">
            {conflicts.map((c, i) => (
              <div key={i} className="bg-red-900/15 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-red-300">{c.name}</span>
                    <span className="text-zinc-500 font-mono text-[10px]">证件尾号 {c.idNumber.slice(-4)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500">异常状态</span>
                    {c.anomalyStatus === 'pending' && <AnomalyStatusBadge status="pending" />}
                    {c.anomalyStatus === 'resolved' && <AnomalyStatusBadge status="resolved" />}
                    {c.anomalyStatus === 'dismissed' && <AnomalyStatusBadge status="dismissed" />}
                    {c.anomalyStatus === 'none' && <span className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">未登记</span>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.groups.map((g, gi) => (
                    <GroupBadge key={gi} group={g} />
                  ))}
                </div>
                <div className="space-y-1">
                  {c.entries.map(e => (
                    <div key={e.id} className="flex items-center justify-between text-xs bg-[#1a1a2e] rounded px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-orange-400">{e.bibNumber || '--'}</span>
                        <GroupBadge group={e.group} />
                        {e.team && <span className="text-yellow-400/70">{e.team}</span>}
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
