import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: 'primary' | 'warning' | 'success' | 'danger' | 'neutral';
  trend?: {
    value: number;
    isUp: boolean;
  };
}

export function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  const colorStyles = {
    primary: 'bg-primary-50 text-primary-600',
    warning: 'bg-warning-50 text-warning-500',
    success: 'bg-success-50 text-success-600',
    danger: 'bg-danger-50 text-danger-600',
    neutral: 'bg-neutral-100 text-neutral-600',
  };

  const bgColorStyles = {
    primary: 'bg-primary-700',
    warning: 'bg-warning-500',
    success: 'bg-success-500',
    danger: 'bg-danger-500',
    neutral: 'bg-neutral-600',
  };

  return (
    <div className="card p-5 hover:shadow-cardHover transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-neutral-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-neutral-800 font-mono-cn">{value}</p>
          {trend && (
            <p
              className={`text-xs mt-1 flex items-center gap-1 ${
                trend.isUp ? 'text-success-600' : 'text-danger-600'
              }`}
            >
              {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}% 较昨日
            </p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorStyles[color]} group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
      </div>
      <div className={`h-1 w-full rounded-full mt-4 ${bgColorStyles[color]} opacity-20`} />
    </div>
  );
}
