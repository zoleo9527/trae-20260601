import { useMemo } from 'react';
import { useReminderStore } from '../store/reminder';
import type { ReminderStatus } from '../../shared/types';
import { statusMap } from '../utils/format';

interface Tab {
  value: string;
  label: string;
  count: number;
}

export default function StatusTabs() {
  const { allReminders, filterStatus, setFilterStatus, currentUserId } = useReminderStore();

  const tabs: Tab[] = useMemo(() => {
    const base = [
      { value: 'all', label: '全部' },
      { value: 'pending_schedule' as ReminderStatus, label: statusMap['pending_schedule'].label },
      { value: 'pending_execute' as ReminderStatus, label: statusMap['pending_execute'].label },
      { value: 'pending_confirm' as ReminderStatus, label: statusMap['pending_confirm'].label },
      { value: 'completed' as ReminderStatus, label: statusMap['completed'].label },
      { value: 'disputed' as ReminderStatus, label: statusMap['disputed'].label },
    ];
    return base.map((t) => ({
      ...t,
      count: t.value === 'all' ? allReminders.length : allReminders.filter((r) => r.status === t.value).length,
    }));
  }, [allReminders]);

  const myCount = useMemo(() => {
    return allReminders.filter(
      (r) => r.currentOwnerId === currentUserId && r.status !== 'completed'
    ).length;
  }, [allReminders, currentUserId]);

  return (
    <div className="bg-white border-b border-slate-200 px-6">
      <div className="flex items-center gap-1">
        {myCount > 0 && (
          <button
            onClick={() => setFilterStatus('mine')}
            className={`relative px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              filterStatus === 'mine'
                ? 'border-accent text-accent-dark'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            我的待办
            <span className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-xs font-semibold ${
              filterStatus === 'mine' ? 'bg-accent text-white' : 'bg-accent/15 text-accent-dark'
            }`}>
              {myCount}
            </span>
          </button>
        )}
        {tabs.map((tab) => {
          const active = filterStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setFilterStatus(tab.value)}
              className={`relative px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-navy-700 text-navy-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-xs font-semibold ${
                    active ? 'bg-navy-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
