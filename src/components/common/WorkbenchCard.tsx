import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface WorkbenchCardProps {
  title: string;
  count?: number;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  action?: ReactNode;
}

export const WorkbenchCard = ({ title, count, icon, children, className, onClick, action }: WorkbenchCardProps) => {
  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-lg overflow-hidden',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
      onClick={onClick}
    >
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-500">{icon}</span>}
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          {count !== undefined && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
              {count}
            </span>
          )}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
};
