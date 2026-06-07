import { CheckCircle, Clock, AlertTriangle, Edit3 } from 'lucide-react';
import { useState } from 'react';
import type { Discrepancy } from '@/types';

interface DiscrepancyCardProps {
  discrepancy: Discrepancy;
  onReview: (id: string, opinion: string) => void;
  disabled?: boolean;
}

const statusConfig = {
  pending: { label: '待处理', icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  reviewed: { label: '已复核', icon: AlertTriangle, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  confirmed: { label: '已确认', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  resolved: { label: '已解决', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
};

const typeColorMap: Record<string, string> = {
  cash: 'from-rose-500 to-rose-600',
  oil: 'from-amber-500 to-amber-600',
  member: 'from-blue-500 to-blue-600',
  invoice: 'from-emerald-500 to-emerald-600',
  nozzle: 'from-indigo-500 to-indigo-600',
};

export default function DiscrepancyCard({ discrepancy, onReview, disabled }: DiscrepancyCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [opinion, setOpinion] = useState(discrepancy.reviewOpinion || '');
  const status = statusConfig[discrepancy.status];
  const StatusIcon = status.icon;

  const diffValue = Number(discrepancy.difference);
  const hasValidDiff = !isNaN(diffValue);
  const hasDifference = hasValidDiff && diffValue !== 0;

  const formatValue = (value: number | string, type: string) => {
    const num = Number(value);
    if (isNaN(num)) return value;
    if (type === 'cash') return `¥${num.toFixed(2)}`;
    return num.toFixed(2);
  };

  const formatDiff = (value: number | string, type: string) => {
    const num = Number(value);
    if (isNaN(num)) return value;
    const sign = num > 0 ? '+' : '';
    if (type === 'cash') return `${sign}¥${num.toFixed(2)}`;
    return `${sign}${num.toFixed(2)}`;
  };

  const handleSubmit = () => {
    if (opinion.trim()) {
      onReview(discrepancy.id, opinion);
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${typeColorMap[discrepancy.type]}`}></div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-lg font-semibold text-gray-900">{discrepancy.title}</h4>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {status.label}
              </span>
            </div>
            <p className="text-gray-500 text-sm">{discrepancy.description}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">系统记录</p>
            <p className="text-lg font-bold text-gray-900">
              {formatValue(discrepancy.systemValue, discrepancy.type)}
              <span className="text-sm font-normal text-gray-500 ml-1">{discrepancy.unit}</span>
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">实际值</p>
            <p className="text-lg font-bold text-gray-900">
              {formatValue(discrepancy.actualValue, discrepancy.type)}
              <span className="text-sm font-normal text-gray-500 ml-1">{discrepancy.unit}</span>
            </p>
          </div>
          <div className={`rounded-lg p-3 ${hasDifference ? 'bg-rose-50' : hasValidDiff ? 'bg-emerald-50' : 'bg-gray-50'}`}>
            <p className="text-xs text-gray-500 mb-1">差异</p>
            <p className={`text-lg font-bold ${hasDifference ? 'text-rose-600' : hasValidDiff ? 'text-emerald-600' : 'text-gray-400'}`}>
              {formatDiff(discrepancy.difference, discrepancy.type)}
              <span className="text-sm font-normal text-gray-500 ml-1">{discrepancy.unit}</span>
            </p>
          </div>
        </div>

        {discrepancy.reviewOpinion && !isEditing && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Edit3 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">复核意见</span>
            </div>
            <p className="text-sm text-blue-800">{discrepancy.reviewOpinion}</p>
            {discrepancy.reviewer && discrepancy.reviewTime && (
              <p className="text-xs text-blue-600 mt-2">
                {discrepancy.reviewer} · {discrepancy.reviewTime}
              </p>
            )}
          </div>
        )}

        {isEditing && (
          <div className="mt-4 space-y-3">
            <textarea
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              placeholder="请输入复核意见..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                className="btn-primary text-sm"
              >
                确认提交
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setOpinion(discrepancy.reviewOpinion || '');
                }}
                className="btn-secondary text-sm"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {!disabled && discrepancy.status === 'pending' && !isEditing && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary text-sm w-full"
            >
              填写复核意见
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
