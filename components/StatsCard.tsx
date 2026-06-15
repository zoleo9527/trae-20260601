import { TodoStats } from '@/data/types';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface StatsCardProps {
  stats: TodoStats;
}

export default function StatsCard({ stats }: StatsCardProps) {
  const statItems = [
    {
      label: '待处理',
      value: stats.pendingCount,
      icon: Clock,
      color: 'bg-warning-100 text-warning-600',
      bgColor: 'bg-warning-50',
      borderColor: 'border-warning-200',
    },
    {
      label: '异常工单',
      value: stats.abnormalCount,
      icon: AlertTriangle,
      color: 'bg-danger-100 text-danger-600',
      bgColor: 'bg-danger-50',
      borderColor: 'border-danger-200',
    },
    {
      label: '已完成',
      value: stats.completedCount,
      icon: CheckCircle,
      color: 'bg-success-100 text-success-600',
      bgColor: 'bg-success-50',
      borderColor: 'border-success-200',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {statItems.map(({ label, value, icon: Icon, color, bgColor, borderColor }) => (
        <div
          key={label}
          className={`${bgColor} ${borderColor} border rounded-xl p-4 transition-transform hover:scale-105`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className="text-sm text-gray-600 mt-1">{label}</p>
            </div>
            <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
