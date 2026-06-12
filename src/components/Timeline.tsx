import { formatDate } from '../lib/utils';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

interface TimelineItem {
  id: string;
  operationType: string;
  operatorName: string;
  operatorRole: string;
  previousStatus?: string;
  newStatus?: string;
  note?: string;
  createdAt: string;
}

interface TimelineProps {
  items: TimelineItem[];
}

const operationLabels: Record<string, string> = {
  create: '创建记录',
  update_status: '更新状态',
  reject: '退回',
  approve: '通过',
  assign: '分配',
  clarify: '创建澄清',
  batch_approve: '批量通过',
  batch_reject: '批量退回',
};

export default function Timeline({ items }: TimelineProps) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              index === 0 ? 'bg-blue-100' : 'bg-gray-100'
            )}>
              {index === 0 ? (
                <CheckCircle className="w-5 h-5 text-blue-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
            </div>
            {index < items.length - 1 && (
              <div className="w-0.5 h-full bg-gray-200 mt-2" />
            )}
          </div>
          
          <div className="flex-1 pb-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">
                  {operationLabels[item.operationType] || item.operationType}
                </h4>
                <span className="text-sm text-gray-500">
                  {formatDate(item.createdAt)}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">操作人:</span>
                  <span className="font-medium text-gray-900">{item.operatorName}</span>
                  <span className="text-gray-500">({item.operatorRole})</span>
                </div>
                
                {item.previousStatus && item.newStatus && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">状态变化:</span>
                    <span className="text-gray-900">{item.previousStatus}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-medium text-gray-900">{item.newStatus}</span>
                  </div>
                )}
                
                {item.note && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-600">备注:</span>
                    <span className="text-gray-900">{item.note}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}