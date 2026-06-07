import { cn } from '@/lib/utils';
import { getBottleReturnStatusText, getBottleReturnStatusColor, getDepositStatusText, getDepositStatusColor } from '@/lib/utils';

interface StatusTagProps {
  type: 'bottle' | 'deposit';
  status: string;
  className?: string;
}

export function StatusTag({ type, status, className }: StatusTagProps) {
  const text = type === 'bottle' ? getBottleReturnStatusText(status) : getDepositStatusText(status);
  const color = type === 'bottle' ? getBottleReturnStatusColor(status) : getDepositStatusColor(status);

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      color,
      className
    )}>
      {text}
    </span>
  );
}
