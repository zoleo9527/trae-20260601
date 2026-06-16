import { Wrench, Clock, User, DollarSign, CheckCircle, AlertCircle, PlayCircle } from 'lucide-react';
import type { Adjustment } from '@/types';

interface AdjustmentPanelProps {
  adjustments: Adjustment[];
  onUpdateStatus: (adjustmentId: string, status: Adjustment['status']) => void;
}

const typeConfig = {
  free: { label: '免费修改', color: 'bg-mint-100 text-mint-700', icon: CheckCircle },
  paid: { label: '收费改款', color: 'bg-coral-100 text-coral-700', icon: DollarSign },
  'size-change': { label: '客户尺寸变化', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
};

const statusConfig = {
  pending: { label: '待处理', color: 'bg-gray-100 text-gray-600', icon: AlertCircle },
  'in-progress': { label: '处理中', color: 'bg-gold-100 text-gold-700', icon: PlayCircle },
  completed: { label: '已完成', color: 'bg-mint-100 text-mint-700', icon: CheckCircle },
};

export function AdjustmentPanel({ adjustments, onUpdateStatus }: AdjustmentPanelProps) {
  if (adjustments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="bg-navy-50 px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-navy-600" />
            <h3 className="font-semibold text-navy-900">售后调整</h3>
          </div>
        </div>
        <div className="p-8 text-center">
          <p className="text-gray-500">暂无调整记录</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="bg-navy-50 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-navy-600" />
          <h3 className="font-semibold text-navy-900">售后调整</h3>
          <span className="ml-auto text-xs text-gray-500">{adjustments.length} 条记录</span>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {adjustments.map((adjustment) => {
          const type = typeConfig[adjustment.type];
          const status = statusConfig[adjustment.status];
          const StatusIcon = status.icon;
          const TypeIcon = type.icon;

          return (
            <div key={adjustment.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${type.color}`}>
                    <TypeIcon className="w-3 h-3" />
                    {type.label}
                  </span>
                </div>
                <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </span>
              </div>
              
              <p className="text-sm text-gray-700 mb-3">{adjustment.description}</p>
              
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>负责人: {adjustment.responsible}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>目标日期: {adjustment.targetDate}</span>
                </div>
                {adjustment.cost > 0 && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    <span>费用: ¥{adjustment.cost}</span>
                  </div>
                )}
              </div>
              
              {adjustment.adjustedAt && adjustment.adjustedBy && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  <span>完成时间: {adjustment.adjustedAt}</span>
                  <span className="mx-2">|</span>
                  <span>完成人: {adjustment.adjustedBy}</span>
                </div>
              )}
              
              {adjustment.status !== 'completed' && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => onUpdateStatus(adjustment.id, 'in-progress')}
                    disabled={adjustment.status === 'in-progress'}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      adjustment.status === 'in-progress'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-navy-100 text-navy-700 hover:bg-navy-200'
                    }`}
                  >
                    开始处理
                  </button>
                  <button
                    onClick={() => onUpdateStatus(adjustment.id, 'completed')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-mint-100 text-mint-700 hover:bg-mint-200 transition-all"
                  >
                    完成调整
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
