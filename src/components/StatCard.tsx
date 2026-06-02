import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'gold' | 'red' | 'green';
}

const colorConfig = {
  gold: {
    bg: 'bg-champagne-50',
    border: 'border-champagne-200',
    iconBg: 'bg-champagne-100',
    iconColor: 'text-champagne-600',
    valueColor: 'text-champagne-700',
  },
  red: {
    bg: 'bg-coral-50',
    border: 'border-coral-200',
    iconBg: 'bg-coral-100',
    iconColor: 'text-coral-600',
    valueColor: 'text-coral-600',
  },
  green: {
    bg: 'bg-jade-50',
    border: 'border-jade-200',
    iconBg: 'bg-jade-100',
    iconColor: 'text-jade-600',
    valueColor: 'text-jade-600',
  },
};

export default function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const config = colorConfig[color];

  return (
    <div className={`card p-5 ${config.bg} ${config.border} border-l-4 animate-fade-in`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-charcoal-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${config.valueColor}`}>
            {value}
          </p>
        </div>
        <div className={`${config.iconBg} p-3 rounded-luxury`}>
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>
      </div>
    </div>
  );
}
