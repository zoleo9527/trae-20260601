import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Child, Severity } from '@/types';
import { useAppStore } from '@/store';
import { useMemo } from 'react';
import { isToday } from '@/lib/utils';

interface ChildCardProps {
  child: Child;
  onClick?: () => void;
  selected?: boolean;
}

export default function ChildCard({ child, onClick, selected }: ChildCardProps) {
  const messages = useAppStore((state) => state.messages);
  const records = useAppStore((state) => state.records);

  const unreadCount = useMemo(
    () => messages.filter((m) => m.childId === child.id && m.sender === 'parent' && !m.isRead).length,
    [messages, child.id]
  );

  const todayRecords = useMemo(() => {
    return records.filter((r) => r.childId === child.id && isToday(r.time));
  }, [records, child.id]);

  const getTodayStatus = (): { label: string; severity: Severity } => {
    if (todayRecords.length === 0) {
      return { label: '未入园', severity: 'normal' };
    }
    const hasWarning = todayRecords.some((r) => r.severity === 'warning');
    const hasDanger = todayRecords.some((r) => r.severity === 'danger');
    if (hasDanger) return { label: '紧急', severity: 'danger' };
    if (hasWarning) return { label: '需关注', severity: 'warning' };
    return { label: '正常', severity: 'normal' };
  };

  const status = getTodayStatus();

  const statusColors: globalThis.Record<Severity, string> = {
    normal: 'bg-success-100 text-success-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-warning-100 text-warning-700',
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center p-4 rounded-xl cursor-pointer transition-all duration-200',
        'bg-white border-2',
        selected
          ? 'border-primary-500 shadow-lg shadow-primary-100'
          : 'border-transparent shadow-sm hover:shadow-md'
      )}
    >
      {unreadCount > 0 && (
        <div className="absolute top-2 right-2 min-w-[20px] h-5 px-1.5 bg-warning-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}

      <div className="relative mb-3">
        <img
          src={child.avatar}
          alt={child.name}
          className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
        />
        <div
          className={cn(
            'absolute -bottom-1 -right-1 px-2 py-0.5 text-xs font-medium rounded-full',
            statusColors[status.severity]
          )}
        >
          {status.label}
        </div>
      </div>

      <h3 className="text-base font-semibold text-gray-900">{child.name}</h3>
      <p className="text-sm text-gray-500">{child.age}岁</p>
    </motion.div>
  );
}
