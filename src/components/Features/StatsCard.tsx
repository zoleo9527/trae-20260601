import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color?: 'primary' | 'success' | 'warning' | 'info';
  suffix?: string;
  description?: string;
  className?: string;
}

const colorConfig = {
  primary: {
    bg: 'bg-primary-50',
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    textColor: 'text-primary-700',
    accent: 'bg-primary-500',
  },
  success: {
    bg: 'bg-success-50',
    iconBg: 'bg-success-100',
    iconColor: 'text-success-600',
    textColor: 'text-success-700',
    accent: 'bg-success-500',
  },
  warning: {
    bg: 'bg-warning-50',
    iconBg: 'bg-warning-100',
    iconColor: 'text-warning-600',
    textColor: 'text-warning-700',
    accent: 'bg-warning-500',
  },
  info: {
    bg: 'bg-info-50',
    iconBg: 'bg-info-100',
    iconColor: 'text-info-600',
    textColor: 'text-info-700',
    accent: 'bg-info-500',
  },
};

function AnimatedNumber({
  value,
  suffix = '',
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const spring = useSpring(0, {
    stiffness: 50,
    damping: 20,
    mass: 0.8,
  });

  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    display.on('change', (v) => setDisplayValue(v));
  }, [display]);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <span className={className}>
      {displayValue}
      {suffix}
    </span>
  );
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  color = 'info',
  suffix = '',
  description,
  className,
}: StatsCardProps) {
  const config = colorConfig[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'relative rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:shadow-soft-lg',
        config.bg,
        className
      )}
    >
      <div
        className={cn(
          'absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-30',
          config.iconBg
        )}
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              config.iconBg
            )}
          >
            <Icon className={cn('w-6 h-6', config.iconColor)} />
          </div>
        </div>

        <div className="mb-2">
          <AnimatedNumber
            value={value}
            suffix={suffix}
            className={cn(
              'text-4xl font-bold tracking-tight',
              config.textColor
            )}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', config.accent)} />
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        </div>

        {description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-3 text-xs text-gray-500"
          >
            {description}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
