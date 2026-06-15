import React from 'react';

interface StatsCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: 'blue' | 'orange' | 'red' | 'purple';
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, count, icon, color }) => {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-200',
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
    },
  };

  const style = colorStyles[color];

  return (
    <div className={`bg-white rounded-lg border ${style.border} p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${style.text}`}>{count}</p>
        </div>
        <div className={`${style.bg} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
};