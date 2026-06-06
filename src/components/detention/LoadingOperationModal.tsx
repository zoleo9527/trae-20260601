import { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { useStore } from '@/store/useStore';
import { Play, Square, AlertTriangle } from 'lucide-react';
import { formatDateTime } from '@/utils/format';

interface LoadingOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  detentionId: string;
  onComplete?: () => void;
}

type OperationType = 'start' | 'end' | 'exception';

export const LoadingOperationModal = ({ isOpen, onClose, detentionId, onComplete }: LoadingOperationModalProps) => {
  const [operationType, setOperationType] = useState<OperationType>('start');
  const [remark, setRemark] = useState('');
  const [exceptionRemark, setExceptionRemark] = useState('');

  const { getDetentionById, currentUser, recordLoadingStart, recordLoadingEnd, recordLoadingException, getNextLoadingTask } = useStore();

  const detention = getDetentionById(detentionId);
  const nextTask = getNextLoadingTask(detentionId);

  useEffect(() => {
    if (isOpen && detention) {
      setRemark('');
      setExceptionRemark('');
      if (detention.startLoadingTime && !detention.endLoadingTime) {
        setOperationType('end');
      } else if (detention.endLoadingTime) {
        setOperationType('exception');
      } else {
        setOperationType('start');
      }
    }
  }, [isOpen, detentionId, detention]);

  const handleSubmit = () => {
    if (!detention) return;

    switch (operationType) {
      case 'start':
        recordLoadingStart(detentionId, currentUser.name, currentUser.role, remark || undefined);
        break;
      case 'end':
        recordLoadingEnd(detentionId, currentUser.name, currentUser.role, remark || undefined);
        break;
      case 'exception':
        if (!exceptionRemark.trim()) return;
        recordLoadingException(detentionId, currentUser.name, currentUser.role, exceptionRemark);
        break;
    }

    onClose();
    onComplete?.();
  };

  const canSubmit = () => {
    if (operationType === 'exception' && !exceptionRemark.trim()) return false;
    return true;
  };

  const operationConfig = {
    start: {
      title: '记录开始装卸',
      icon: <Play className="w-5 h-5" />,
      btnText: '确认开始',
      btnColor: 'bg-green-600 hover:bg-green-700',
      desc: '记录车辆开始装卸作业的时间',
    },
    end: {
      title: '记录结束装卸',
      icon: <Square className="w-5 h-5" />,
      btnText: '确认结束',
      btnColor: 'bg-blue-600 hover:bg-blue-700',
      desc: '记录车辆结束装卸作业的时间，系统将自动计算超时',
    },
    exception: {
      title: '记录异常情况',
      icon: <AlertTriangle className="w-5 h-5" />,
      btnText: '提交异常',
      btnColor: 'bg-orange-600 hover:bg-orange-700',
      desc: '记录装卸过程中的异常情况',
    },
  };

  const config = operationConfig[operationType];

  if (!detention) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          {nextTask && operationType !== 'exception' && (
            <span className="text-xs text-gray-500">
              还有 {nextTask ? 1 : 0} 个待处理装卸任务
            </span>
          )}
          <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit()}
                className={`px-4 py-2 text-sm text-white rounded transition-colors ${config.btnColor} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {config.btnText}
              </button>
            </div>
          </div>
      }
    >
      <div className="space-y-5">
        <div className="flex gap-3 mb-4">
          {(['start', 'end', 'exception'] as OperationType[]).map((type) => {
            const opConfig = operationConfig[type];
            const disabled =
              (type === 'start' && !!detention.startLoadingTime) ||
              (type === 'end' && (!detention.startLoadingTime || !!detention.endLoadingTime));
            return (
              <button
                key={type}
                onClick={() => !disabled && setOperationType(type)}
                disabled={disabled}
                className={`flex-1 p-3 border rounded-lg flex flex-col items-center gap-2 transition-all ${
                  operationType === type
                    ? 'border-blue-500 bg-blue-50'
                    : disabled
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={operationType === type ? 'text-blue-600' : 'text-gray-500'}>
                  {opConfig.icon}
                </div>
                <span className={`text-sm font-medium ${operationType === type ? 'text-blue-700' : 'text-gray-700'}`}>
                  {opConfig.title.replace('记录', '')}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">订单号：</span>
              <span className="text-gray-900 font-medium">{detention.orderNo}</span>
            </div>
            <div>
              <span className="text-gray-500">车牌号：</span>
              <span className="text-gray-900 font-medium">{detention.plateNumber}</span>
            </div>
            <div>
              <span className="text-gray-500">司机：</span>
              <span className="text-gray-900 font-medium">{detention.driverName}</span>
            </div>
            <div>
              <span className="text-gray-500">月台：</span>
              <span className="text-gray-900 font-medium">{detention.platformNo}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">开始装卸：</span>
                <span className="text-gray-900">
                  {detention.startLoadingTime ? formatDateTime(detention.startLoadingTime) : '未开始'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">结束装卸：</span>
                <span className="text-gray-900">
                  {detention.endLoadingTime ? formatDateTime(detention.endLoadingTime) : '未结束'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500">{config.desc}</p>

        {operationType !== 'exception' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">备注（可选）</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={2}
              placeholder="填写备注信息，如装卸内容、特殊情况等"
              className="w-full px-3 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">异常说明</label>
            <textarea
              value={exceptionRemark}
              onChange={(e) => setExceptionRemark(e.target.value)}
              rows={3}
              placeholder="请详细描述异常情况，该记录将同步到状态日志并通知相关人员复核"
              className="w-full px-3 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};
