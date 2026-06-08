import { Search, Filter } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { STATUS_LABELS } from '../types';
import type { TourGroupStatus } from '../types';

const statusOptions: { value: TourGroupStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({
    value: value as TourGroupStatus,
    label,
  })),
];

export default function FilterBar() {
  const { filterKeyword, filterStatus, filterGuideName, setFilterKeyword, setFilterStatus, setFilterGuideName } =
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
    </div>
  );
}
