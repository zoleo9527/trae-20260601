import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'amber' | 'green' | 'orange' | 'blue' | 'red';
  delay?: number;
}

export function StatCard({ title, value, icon, trend, trendValue, color = 'amber', delay = 0 }: StatCardProps) {
  const colorClasses = {
    amber: 'from-amber-50 to-amber-100 text-amber-900',
    green: 'from-hop-50 to-green-100 text-hop-green',
    orange: 'from-warning-50 to-orange-100 text-warning-orange',
    blue: 'from-info-50 to-blue-100 text-info-blue',
    red: 'from-red-50 to-red-100 text-red-600',
  };

  const iconBgColors = {
    amber: 'bg-amber-900',
    green: 'bg-hop-green',
    orange: 'bg-warning-orange',
    blue: 'bg-info-blue',
    red: 'bg-red-600',
  };

  const trendColors = {
    up: 'text-hop-green',
    down: 'text-red-600',
    neutral: 'text-neutral-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`bg-gradient-to-br ${colorClasses[color]} p-5 rounded-xl shadow-sm`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-600 mb-1">{title}</p>
          <motion.p
            className="text-3xl font-bold"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: delay + 0.2 }}
          >
            {value}
          </motion.p>
          {trend && trendValue && (
            <p className={`text-sm mt-2 ${trendColors[trend]}`}>
              {trend === 'up' && '↑ '}
              {trend === 'down' && '↓ '}
              {trendValue}
            </p>
          )}
        </div>
        <div className={`${iconBgColors[color]} p-3 rounded-lg text-white shadow-md`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
