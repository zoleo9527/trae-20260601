import { useEffect, useMemo, useState } from 'react';
import { User, Search, ShieldCheck, ClipboardList } from 'lucide-react';
import { useReminderStore } from '../store/reminder';
import { roleMap } from '../utils/format';
import type { UserRole } from '../../shared/types';

const roles: { value: UserRole; label: string; icon: typeof User }[] = [
  { value: 'enroller', label: '报名员', icon: ClipboardList },
  { value: 'coach', label: '场地教练', icon: User },
  { value: 'safety_officer', label: '安全员', icon: ShieldCheck },
];

export default function Header() {
  const { allReminders, currentRole, setCurrentRole, setKeyword, keyword, currentUserId, users } = useReminderStore();
  const [searchInput, setSearchInput] = useState(keyword);
  const [openRole, setOpenRole] = useState(false);

  const currentUser = useMemo(() => users.find((u) => u.id === currentUserId), [users, currentUserId]);

  useEffect(() => {
    const t = setTimeout(() => {
      setKeyword(searchInput);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const stats = useMemo(() => {
    return {
      total: allReminders.length,
      pending_schedule: allReminders.filter((r) => r.status === 'pending_schedule').length,
      pending_execute: allReminders.filter((r) => r.status === 'pending_execute').length,
      pending_confirm: allReminders.filter((r) => r.status === 'pending_confirm').length,
      disputed: allReminders.filter((r) => r.status === 'disputed').length,
    };
  }, [allReminders]);

  const currentRoleCfg = roles.find((r) => r.value === currentRole)!;
  const RoleIcon = currentRoleCfg.icon;

  return (
    <header className="navy-header text-white">
      <div className="relative z-10 px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-white/10 flex items-center justify-center border border-white/15">
              <ClipboardList size={20} className="text-accent" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-semibold tracking-wide leading-tight">
                摩托车驾培 · 补训安排与费用确认
              </h1>
              <p className="text-navy-200 text-xs mt-0.5">
                责任清晰 · 状态统一 · 全程可追溯
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden md:flex items-center gap-5 text-sm">
              <StatChip label="总记录" value={stats.total} tone="white" />
              <StatChip label="待安排" value={stats.pending_schedule} tone="amber" />
              <StatChip label="待执行" value={stats.pending_execute} tone="blue" />
              <StatChip label="待确认" value={stats.pending_confirm} tone="purple" />
              <StatChip label="有争议" value={stats.disputed} tone="red" />
            </div>

            <div className="relative">
              <div className="w-72">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300"
                  />
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="搜索学员姓名、科目、原因..."
                    className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/15 rounded-sm text-sm text-white placeholder:text-navy-300 focus:outline-none focus:bg-white/15 focus:border-accent/60 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setOpenRole((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/15 rounded-sm hover:bg-white/15 transition-colors"
              >
                <RoleIcon size={16} className="text-accent" />
                <span className="text-sm">
                  {currentUser?.name || roleMap[currentRole].label}
                </span>
                <span className="text-xs text-navy-200">
                  （{roleMap[currentRole].label}）
                </span>
              </button>
              {openRole && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setOpenRole(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-sm shadow-lg border border-slate-200 overflow-hidden z-20 animate-fade-in">
                    {roles.map((r) => {
                      const Ico = r.icon;
                      const active = r.value === currentRole;
                      return (
                        <button
                          key={r.value}
                          onClick={() => {
                            setCurrentRole(r.value);
                            setOpenRole(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                            active
                              ? 'bg-navy-50 text-navy-800 font-medium'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Ico size={14} className={active ? 'text-accent' : 'text-slate-400'} />
                          {r.label}视图
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'white' | 'amber' | 'blue' | 'purple' | 'red';
}) {
  const toneMap: Record<string, string> = {
    white: 'text-white',
    amber: 'text-amber-300',
    blue: 'text-blue-300',
    purple: 'text-purple-300',
    red: 'text-red-300',
  };
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`font-bold text-lg ${toneMap[tone]}`}>{value}</span>
      <span className="text-navy-200 text-xs">{label}</span>
    </div>
  );
}
