import { DashboardStats } from '../types';

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const statItems = [
    {
      label: '今日待处理',
      value: stats.todayPending,
      bgColor: 'bg-primary-50',
      textColor: 'text-primary-600',
      borderColor: 'border-primary-200',
    },
    {
      label: '超时未处理',
      value: stats.overdueCount,
      bgColor: 'bg-danger-50',
      textColor: 'text-danger-600',
      borderColor: 'border-danger-200',
    },
    {
      label: '刚退回',
      value: stats.returnedCount,
      bgColor: 'bg-warning-50',
      textColor: 'text-warning-600',
      borderColor: 'border-warning-200',
    },
    {
      label: '学生总数',
      value: stats.totalStudents,
      bgColor: 'bg-success-50',
      textColor: 'text-success-600',
      borderColor: 'border-success-200',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {statItems.map((item) => (
        <div
          key={item.label}
          className={`${item.bgColor} ${item.borderColor} border rounded-xl p-4`}
        >
          <div className="text-sm text-gray-500 mb-1">{item.label}</div>
          <div className={`text-2xl font-bold ${item.textColor}`}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}
