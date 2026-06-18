import React from 'react';
import { MaterialStatus } from '@/types';
import clsx from 'clsx';
import { Check } from 'lucide-react';

interface MaterialStatusFlowProps {
  currentStatus: MaterialStatus;
}

export const MaterialStatusFlow: React.FC<MaterialStatusFlowProps> = ({
  currentStatus,
}) => {
  const statusOrder: MaterialStatus[] = [
    'NOT_STARTED',
    'IN_PROGRESS',
    'READY',
    'IN_USE',
    'RETURNED',
  ];

  const statusLabels: Record<MaterialStatus, string> = {
    NOT_STARTED: '未开始',
    IN_PROGRESS: '准备中',
    BLOCKED: '受阻',
    READY: '已就绪',
    IN_USE: '使用中',
    RETURNED: '已归还',
  };

  const currentIndex = statusOrder.indexOf(currentStatus);

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-4">物料状态流转</h4>
      <div className="flex items-center justify-between">
        {statusOrder.map((status, index) => {
          const isActive = status === currentStatus;
          const isPast = index < currentIndex;

          return (
            <React.Fragment key={status}>
              <div className="flex flex-col items-center">
                <div
                  className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                    isActive && 'border-blue-500 bg-blue-500 text-white scale-110',
                    isPast && 'border-green-500 bg-green-500 text-white',
                    !isActive && !isPast && 'border-gray-300 bg-white text-gray-400'
                  )}
                >
                  {(isActive || isPast) && <Check className="w-4 h-4" />}
                </div>
                <span
                  className={clsx(
                    'text-xs mt-2 text-center max-w-[60px]',
                    isActive && 'font-medium text-blue-600',
                    isPast && 'text-green-600',
                    !isActive && !isPast && 'text-gray-400'
                  )}
                >
                  {statusLabels[status]}
                </span>
              </div>

              {index < statusOrder.length - 1 && (
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

      {currentStatus === 'BLOCKED' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            ⚠️ 物料准备受阻，请检查并解决问题
          </p>
        </div>
      )}
    </div>
  );
};
