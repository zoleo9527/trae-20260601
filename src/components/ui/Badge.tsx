import React from 'react';
import { cn } from '@/lib/utils';

type Tone =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'slate';

const toneClasses: Record<Tone, string> = {
  default: 'bg-slate-100 text-slate-700',
  primary: 'bg-bank-100 text-bank-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-sky-100 text-sky-700',
  purple: 'bg-violet-100 text-violet-700',
  slate: 'bg-slate-50 text-slate-600 border border-slate-200',
};

export const Badge: React.FC<{
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}> = ({ children, tone = 'default', className, dot }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
      toneClasses[tone],
      className,
    )}
  >
    {dot && (
      <span className={cn('h-1.5 w-1.5 rounded-full', dotColor(tone))} />
    )}
    {children}
  </span>
);

function dotColor(tone: Tone): string {
  switch (tone) {
    case 'success':
      return 'bg-emerald-500';
    case 'warning':
      return 'bg-amber-500';
    case 'danger':
      return 'bg-red-500';
    case 'primary':
      return 'bg-bank-500';
    case 'info':
      return 'bg-sky-500';
    case 'purple':
      return 'bg-violet-500';
    default:
      return 'bg-slate-400';
  }
}
