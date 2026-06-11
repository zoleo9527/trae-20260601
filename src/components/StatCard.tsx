interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  variant?: 'default' | 'danger' | 'warning' | 'success';
  subtitle?: string;
  pulse?: boolean;
}

const variantStyles = {
  default: 'bg-white border-gray-200 text-gray-700',
  danger: 'bg-danger-50 border-danger-200 text-danger-700',
  warning: 'bg-warning-50 border-warning-200 text-warning-700',
  success: 'bg-success-50 border-success-200 text-success-700',
};

export default function StatCard({
  title,
  value,
  icon,
  variant = 'default',
  subtitle,
  pulse = false,
}: StatCardProps) {
  return (
    <div
      className={`p-4 rounded-xl border ${variantStyles[variant]} ${
        pulse ? 'animate-pulse-border' : ''
      } transition-all hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs mt-1 opacity-70">{subtitle}</p>
          )}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}
