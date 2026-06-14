import React from 'react';
import { cn } from '@/lib/utils';

interface DataCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  accentColor?: 'wine' | 'gold' | 'emerald' | 'amber' | 'sky' | 'rose';
}

const accentColors = {
  wine: 'from-wine-50 to-wine-100/50 text-wine-700 border-wine-100',
  gold: 'from-gold-50 to-gold-100/50 text-gold-700 border-gold-100',
  emerald: 'from-emerald-50 to-emerald-100/50 text-emerald-700 border-emerald-100',
  amber: 'from-amber-50 to-amber-100/50 text-amber-700 border-amber-100',
  sky: 'from-sky-50 to-sky-100/50 text-sky-700 border-sky-100',
  rose: 'from-rose-50 to-rose-100/50 text-rose-700 border-rose-100',
};

export const DataCard: React.FC<DataCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  onClick,
  className,
  accentColor = 'wine',
}) => {
  return (
    <div
      className={cn(
        'card-base card-hover p-5 cursor-pointer',
        'bg-gradient-to-br',
        accentColors[accentColor],
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-ink-600">{title}</p>
          <p className="font-serif text-3xl font-semibold text-ink-900 mt-2">
            {value}
          </p>
        </div>
        {icon && (
          <div className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center',
            'bg-white/80 shadow-sm'
          )}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="mt-3 flex items-center gap-2">
        {trend && (
          <span className={cn(
            'inline-flex items-center gap-1 text-xs font-medium',
            trend.isPositive ? 'text-emerald-600' : 'text-wine-600'
          )}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}%
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-ink-500">{subtitle}</span>
        )}
      </div>
    </div>
  );
};
