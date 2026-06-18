import React from 'react';
import { ScheduleStatusFlow } from '@/constants';
import { ScheduleStatus } from '@/types';
import clsx from 'clsx';
import { Check } from 'lucide-react';

interface ScheduleStatusFlowProps {
  currentStatus: ScheduleStatus;
}

export const ScheduleStatusFlow: React.FC<ScheduleStatusFlowProps> = ({
  currentStatus,
}) => {
  const currentIndex = ScheduleStatusFlow.findIndex(s => s.status === currentStatus);

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-4">状态流转</h4>
      <div className="flex items-center justify-between">
        {ScheduleStatusFlow.map((item, index) => {
          const isActive = index === currentIndex;
          const isPast = index < currentIndex;
          const isChanged = currentStatus === 'CHANGED' && item.status === 'PUBLISHED';

          return (
            <React.Fragment key={item.status}>
              <div className="flex flex-col items-center">
                <div
                  className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                    isActive && 'border-museum-primary bg-museum-primary text-white scale-110',
                    isPast && 'border-green-500 bg-green-500 text-white',
                    !isActive && !isPast && 'border-gray-300 bg-white text-gray-400'
                  )}
                >
                  {(isActive || isPast) && <Check className="w-4 h-4" />}
                </div>
                <span
                  className={clsx(
                    'text-xs mt-2 text-center',
                    isActive && 'font-medium text-museum-primary',
                    isPast && 'text-green-600',
                    !isActive && !isPast && 'text-gray-400'
                  )}
                >
                  {item.label}
                </span>
              </div>

              {index < ScheduleStatusFlow.length - 1 && (
                <div
                  className={clsx(
                    'flex-1 h-0.5 mx-2',
                    index < currentIndex ? 'bg-green-500' : 'bg-gray-300'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
