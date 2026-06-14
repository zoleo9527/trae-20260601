import React from 'react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/utils/date';

interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  gender?: 'male' | 'female';
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const bgColors = [
  'bg-wine-100 text-wine-700',
  'bg-gold-100 text-gold-700',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
];

function getColorByName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length];
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', className, gender }) => {
  const colorClass = getColorByName(name);
  const initial = getInitials(name);

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium',
        'transition-all duration-200',
        sizeClasses[size],
        colorClass,
        className
      )}
    >
      {initial}
      {gender && (
        <span className="sr-only">{gender === 'female' ? '女' : '男'}</span>
      )}
    </div>
  );
};
