import { Search, Filter, Timer, Bell } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { STATUS_LABELS } from '../types';
import type { TourGroupStatus, StuckDurationThreshold } from '../types';

const statusOptions: { value: TourGroupStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({
    value: value as TourGroupStatus,
    label,
  })),
];

const stuckDurationOptions: { value: StuckDurationThreshold; label: string }[] = [
  { value: '', label: '卡住时长：不限' },
  { value: 'over12h', label: '超12小时' },
  { value: 'over24h', label: '超24小时' },
];

export default function FilterBar() {
  const { filterKeyword, filterStatus, filterGuideName, filterStuckDuration, filterNeedsFollowUp, setFilterKeyword, setFilterStatus, setFilterGuideName, setFilterStuckDuration, setFilterNeedsFollowUp } =
    useAppStore();

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[220px] max-w-[360px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="搜索团号或行程名称…"
          value={filterKeyword}
          onChange={(e) => setFilterKeyword(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition"
        />
      </div>
      <div className="relative">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as TourGroupStatus | '')}
          className="pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] appearance-none cursor-pointer transition"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="relative flex-1 min-w-[160px] max-w-[240px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="导游姓名…"
          value={filterGuideName}
          onChange={(e) => setFilterGuideName(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition"
        />
      </div>
      <div className="relative">
        <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <select
          value={filterStuckDuration}
          onChange={(e) => setFilterStuckDuration(e.target.value as StuckDurationThreshold)}
          className="pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] appearance-none cursor-pointer transition"
        >
          {stuckDurationOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition">
        <input
          type="checkbox"
          checked={filterNeedsFollowUp}
          onChange={(e) => setFilterNeedsFollowUp(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-[#1e3a5f] focus:ring-[#1e3a5f]/20"
        />
        <Bell className="w-4 h-4 text-slate-400" />
        <span className={filterNeedsFollowUp ? 'text-[#1e3a5f] font-medium' : 'text-slate-600'}>仅看待跟进</span>
      </label>
    </div>
  );
}
