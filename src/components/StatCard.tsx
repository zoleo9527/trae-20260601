import { cn } from '../lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color?: 'blue' | 'amber' | 'emerald' | 'navy';
  onClick?: () => void;
  active?: boolean;
}

const colorStyles = {
  blue: {
    bg: 'bg-blue-50/80',
    text: 'text-blue-600',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-500',
    border: 'border-blue-100',
    activeBorder: 'border-blue-300',
    activeRing: 'ring-blue-200',
    dot: 'bg-blue-500',
  },
  amber: {
    bg: 'bg-amber-50/80',
    text: 'text-amber-600',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-500',
    border: 'border-amber-100',
    activeBorder: 'border-amber-300',
    activeRing: 'ring-amber-200',
    dot: 'bg-amber-500',
  },
  emerald: {
    bg: 'bg-emerald-50/80',
    text: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-500',
    border: 'border-emerald-100',
    activeBorder: 'border-emerald-300',
    activeRing: 'ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  navy: {
    bg: 'bg-navy-50',
    text: 'text-navy-700',
    iconBg: 'bg-navy-100',
    iconText: 'text-navy-500',
    border: 'border-navy-100',
    activeBorder: 'border-navy-300',
    activeRing: 'ring-navy-200',
    dot: 'bg-navy-600',
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  color = 'blue',
  onClick,
  active = false,
}: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-4 p-4 rounded-xl border bg-white transition-all duration-200 text-left',
        active ? `${styles.activeBorder} ring-2 ${styles.activeRing}` : styles.border,
        onClick ? 'hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer' : ''
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-11 h-11 rounded-lg',
          styles.iconBg
        )}
      >
        <Icon className={cn('w-5 h-5', styles.iconText)} />
      </div>
      <div className="flex flex-col items-start min-w-0">
        <span className="text-2xl font-bold text-slate-800 leading-tight">{value}</span>
        <span className="text-xs text-slate-500 mt-0.5">{label}</span>
      </div>
      {active && (
        <div className={cn('absolute top-3 right-3 w-2 h-2 rounded-full', styles.dot)} />
      )}
    </button>
  );
}
