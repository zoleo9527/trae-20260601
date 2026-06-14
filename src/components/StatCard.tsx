import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  trend?: {
    value: number;
    isUp: boolean;
  };
}

const colorClasses: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  amber: 'bg-amber-100 text-amber-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
};

export default function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}% 较昨日
            </p>
          )}
        </div>
        <div className={clsx('p-3 rounded-xl', colorClasses[color])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
