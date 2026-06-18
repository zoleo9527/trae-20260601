import React from 'react';
import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color?: 'blue' | 'yellow' | 'green' | 'red';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'blue',
  trend,
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div
          className={clsx('w-12 h-12 rounded-lg flex items-center justify-center', colorClasses[color])}
        >
          {icon}
        </div>
        {trend && (
          <span className="text-sm font-medium text-success flex items-center gap-1">
            {trend}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-3xl font-bold text-text-main">{value}</p>
        <p className="text-sm text-text-muted">{title}</p>
      </div>
    </div>
  );
};
