import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from 'antd';

interface ContinuousHandlerProps {
  onHandleNext: () => void;
  hasNext: boolean;
  currentTaskId: string;
  taskListLength: number;
}

const ContinuousHandler: React.FC<ContinuousHandlerProps> = ({
  onHandleNext,
  hasNext,
  currentTaskId,
  taskListLength,
}) => {
  return (
    <div className="fixed bottom-0 left-60 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          当前任务ID: <span className="font-medium text-gray-800">{currentTaskId}</span>
          <span className="mx-2">|</span>
          剩余任务: <span className="font-medium text-gray-800">{taskListLength}</span>
        </div>
        {hasNext && (
          <Button
            type="primary"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={onHandleNext}
            className="flex items-center gap-2"
          >
            处理下一个
          </Button>
        )}
      </div>
    </div>
  );
};

export default ContinuousHandler;