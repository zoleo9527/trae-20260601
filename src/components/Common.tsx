import React from 'react';
import { AlertTriangle, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface BadgeProps {
  variant: 'default' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant, children, className }) => {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const statusConfig: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    scheduled: { variant: 'default', label: '待确认' },
    coach_confirmed: { variant: 'info', label: '教练已确认' },
    hours_recorded: { variant: 'info', label: '学时已录' },
    student_confirmed: { variant: 'info', label: '学员已确认' },
    completed: { variant: 'success', label: '已完成' },
    cancelled: { variant: 'warning', label: '已取消' },
    exception: { variant: 'error', label: '异常' },
    pending: { variant: 'default', label: '待处理' },
    confirmed: { variant: 'info', label: '已确认' },
    paid: { variant: 'info', label: '已支付' },
    settled: { variant: 'success', label: '已结算' },
    refund_pending: { variant: 'warning', label: '退款待审' },
    refunded: { variant: 'success', label: '已退款' },
    booked: { variant: 'success', label: '已预约' },
    scored: { variant: 'info', label: '成绩已录' },
    absent: { variant: 'warning', label: '缺考' },
    retest: { variant: 'error', label: '需补考' },
  };

  const config = statusConfig[status] || { variant: 'default', label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};

interface PriorityBadgeProps {
  priority: 'normal' | 'urgent';
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className }) => {
  if (priority === 'urgent') {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200',
          className
        )}
      >
        <AlertTriangle className="w-3 h-3" />
        紧急
      </span>
    );
  }

  return null;
};

export const LoadingSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('flex items-center justify-center', className)}>
    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
  </div>
);

export const EmptyState: React.FC<{ message: string; icon?: React.ReactNode }> = ({
  message,
  icon,
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
    {icon || <CheckCircle className="w-12 h-12 mb-4" />}
    <p>{message}</p>
  </div>
);

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-red-500">
    <XCircle className="w-12 h-12 mb-4" />
    <p className="mb-4">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg">
        重试
      </button>
    )}
  </div>
);

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className, onClick }) => (
  <div
    className={clsx(
      'bg-white rounded-lg shadow-sm border border-gray-200',
      onClick && 'cursor-pointer hover:shadow-md transition-shadow',
      className
    )}
    onClick={onClick}
  >
    {children}
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className,
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `¥${num.toFixed(2)}`;
};
