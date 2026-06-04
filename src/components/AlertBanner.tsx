import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '../utils/cn';

interface AlertBannerProps {
  type: 'danger' | 'warning' | 'success' | 'info';
  title: string;
  message?: string;
  className?: string;
}

const iconMap = {
  danger: AlertTriangle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
};

export function AlertBanner({ type, title, message, className }: AlertBannerProps) {
  const Icon = iconMap[type];

  return (
    <div className={cn('alert', `alert-${type}`, className)}>
      <div className="flex items-start">
        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="ml-3">
          <h3 className="text-sm font-medium">{title}</h3>
          {message && <div className="mt-1 text-sm opacity-80">{message}</div>}
        </div>
      </div>
    </div>
  );
}
