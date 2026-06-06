import { DetentionStatus, AppealStatus } from '@/types';
import { detentionStatusMap, appealStatusMap } from '@/utils/format';
import { cn } from '@/lib/utils';

interface StatusTagProps {
  status: DetentionStatus | AppealStatus;
  type?: 'detention' | 'appeal';
  className?: string;
}

export const StatusTag = ({ status, type = 'detention', className }: StatusTagProps) => {
  const config = type === 'detention' ? detentionStatusMap[status as DetentionStatus] : appealStatusMap[status as AppealStatus];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 text-xs font-medium rounded border',
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
};
