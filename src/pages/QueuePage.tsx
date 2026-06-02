import { ReservationBadge } from '@/components/StatusBadge';
import { DEMO_USERS } from '@/data/seed';
import { useStore } from '@/store/useStore';
import type { ReservationStatus } from '@/types';
import { fmtDateTime, getHourRange } from '@/utils/time';
import { Ban, Check, ChevronDown, ChevronRight, Search, Users, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';

const TABS: { label: string; value: ReservationStatus | null }[] = [
  { label: '全部', value: null },
  { label: '待审批', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
  { label: '顺延中', value: 'postponed' },
  { label: '已取消', value: 'cancelled' },
];

export default function QueuePage() {
  const {
    reservations,
    instruments,
    currentRole,
    approveReservation,
    rejectReservation,
    cancelReservation,
    addReservation,
    currentUserId,
  } = useStore();

  const [statusFilter, setStatusFilter] = useState<ReservationStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const [newInstrumentId, setNewInstrumentId] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newReason, setNewReason] = useState('');

  const isAdmin = currentRole === 'admin';
  const isStudent = currentRole === 'student';
  const isLeader = currentRole === 'leader';

  const currentUser = DEMO_USERS.find((u) => u.id === currentUserId);
  const leaderGroup = isLeader ? currentUser?.group : null;

  const instMap = new Map(instruments.map((i) => [i.id, i.name]));

  const groupStats = useMemo(() => {
    if (!isLeader || !leaderGroup) return null;
    const stats: Record<string, { approved: number; pending: number; totalHours: number }> = {};
    for (const inst of instruments) {
      stats[inst.id] = { approved: 0, pending: 0, totalHours: 0 };
    }
    for (const r of reservations) {
      if (r.userGroup !== leaderGroup || r.status === 'cancelled' || r.status === 'rejected') continue;
      const s = stats[r.instrumentId];
      if (!s) continue;
      if (r.status === 'approved') s.approved++;
      if (r.status === 'pending') s.pending++;
      const hours =
        (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / (1000 * 60 * 60);
      s.totalHours += hours;
    }
    return stats;
  }, [isLeader, leaderGroup, instruments, reservations]);

  const filtered = reservations
    .filter((r) => {
      if (isLeader && leaderGroup && r.userGroup !== leaderGroup) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const instName = instMap.get(r.instrumentId) || '';
        if (!r.userName.toLowerCase().includes(q) && !instName.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleNewSubmit = () => {
    if (!newInstrumentId || !newStartTime || !newEndTime || !newReason.trim()) return;
    const user = DEMO_USERS.find((u) => u.id === currentUserId);
    addReservation({
      instrumentId: newInstrumentId,
      userId: currentUserId,
      userName: user?.name || '当前用户',
      userGroup: user?.group || '默认课题组',
      startTime: new Date(newStartTime).toISOString(),
      endTime: new Date(newEndTime).toISOString(),
      reason: newReason.trim(),
    });
    setShowNewModal(false);
    setNewInstrumentId('');
    setNewStartTime('');
    setNewEndTime('');
    setNewReason('');
  };

  const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n) + '…' : s);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {isLeader && leaderGroup && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-950/30 border border-blue-800/30 rounded">
              <Users size={12} className="text-blue-400" />
              <span className="text-xs text-blue-300">
                {leaderGroup} 预约队列
              </span>
            </div>
          )}
          <div className="flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.label}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  statusFilter === tab.value
                    ? 'bg-indigo-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索申请人或仪器"
              className="pl-8 pr-3 py-1.5 rounded bg-[#0f0f1a] border border-[#1e1e3a] text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 w-52"
            />
          </div>

          {(isStudent || isLeader) && (
            <button
              onClick={() => setShowNewModal(true)}
              className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
            >
              新建预约
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded border border-[#1e1e3a]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0a0a18] text-zinc-500 text-xs">
              <th className="w-8 px-2 py-2 text-left" />
              <th className="px-3 py-2 text-left font-medium">仪器</th>
              <th className="px-3 py-2 text-left font-medium">申请人</th>
              <th className="px-3 py-2 text-left font-medium">课题组</th>
              <th className="px-3 py-2 text-left font-medium">时段</th>
              <th className="px-3 py-2 text-left font-medium">状态</th>
              <th className="px-3 py-2 text-left font-medium">申请理由</th>
              <th className="px-3 py-2 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, idx) => {
              const isPending = r.status === 'pending';
              const isExpanded = expandedId === r.id;
              const rowBg = idx % 2 === 0 ? 'bg-[#0f0f1a]' : 'bg-[#12122a]';

              return (
                <React.Fragment key={r.id}>
                  <tr
                    className={`${rowBg} hover:bg-white/[0.03] transition-colors cursor-pointer ${
                      isPending ? 'border-l-2 border-l-amber-500' : 'border-l-2 border-l-transparent'
                    }`}
                    onClick={() => toggleExpand(r.id)}
                  >
                    <td className="px-2 py-2.5 text-zinc-500">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-200">
                      {instMap.get(r.instrumentId) || r.instrumentId}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-300">{r.userName}</td>
                    <td className="px-3 py-2.5 text-zinc-400">{r.userGroup}</td>
                    <td className="px-3 py-2.5 text-zinc-300 whitespace-nowrap">
                      {fmtDateTime(r.startTime)} {getHourRange(r.startTime, r.endTime)}
                    </td>
                    <td className="px-3 py-2.5">
                      <ReservationBadge status={r.status} />
                    </td>
                    <td className="px-3 py-2.5 text-zinc-400 max-w-[180px]">
                      <span className="block truncate">{truncate(r.reason, 30)}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {isAdmin && isPending && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                approveReservation(r.id);
                              }}
                              className="w-7 h-7 rounded flex items-center justify-center bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                              title="通过"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                rejectReservation(r.id);
                              }}
                              className="w-7 h-7 rounded flex items-center justify-center bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                              title="驳回"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {isAdmin && r.status === 'approved' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelReservation(r.id);
                            }}
                            className="w-7 h-7 rounded flex items-center justify-center bg-zinc-500/15 text-zinc-400 hover:bg-zinc-500/25 transition-colors"
                            title="取消"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className={`${rowBg} border-l-2 ${isPending ? 'border-l-amber-500' : 'border-l-transparent'}`}>
                      <td colSpan={8} className="px-8 py-3 text-zinc-400 text-xs leading-relaxed border-t border-[#1e1e3a]">
                        <span className="text-zinc-500 font-medium mr-2">申请理由：</span>
                        {r.reason}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 text-zinc-600 text-sm">
                  暂无预约记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#12122a] border border-[#1e1e3a] rounded-lg w-[420px] p-5">
            <h3 className="text-sm font-medium text-zinc-200 mb-4">新建预约</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">仪器</label>
                <select
                  value={newInstrumentId}
                  onChange={(e) => setNewInstrumentId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-[#0f0f1a] border border-[#1e1e3a] text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="">选择仪器</option>
                  {instruments.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">开始时间</label>
                <input
                  type="datetime-local"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-[#0f0f1a] border border-[#1e1e3a] text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">结束时间</label>
                <input
                  type="datetime-local"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-[#0f0f1a] border border-[#1e1e3a] text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">申请理由</label>
                <textarea
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-1.5 rounded bg-[#0f0f1a] border border-[#1e1e3a] text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => {
                  setShowNewModal(false);
                  setNewInstrumentId('');
                  setNewStartTime('');
                  setNewEndTime('');
                  setNewReason('');
                }}
                className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleNewSubmit}
                className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
              >
                提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
