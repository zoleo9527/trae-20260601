import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-text-main hover:bg-gray-200',
    success: 'bg-success text-white hover:bg-green-700',
    danger: 'bg-danger text-white hover:bg-red-700',
    ghost: 'bg-transparent text-text-main hover:bg-gray-100',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={clsx(
        'rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        icon && <span className="flex items-center">{icon}</span>
      )}
      {children}
    </button>
  );
};
