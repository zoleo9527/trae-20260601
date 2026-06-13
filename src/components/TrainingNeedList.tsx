import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from './StatusBadge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { TrainingNeedStatus } from '@/types';

interface TrainingNeedListProps {
  onViewDetail?: (id: string) => void;
}

export function TrainingNeedList({ onViewDetail }: TrainingNeedListProps) {
  const { trainingNeeds, actions } = useAppStore();
  const [showApproveModal, setShowApproveModal] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const pendingNeeds = trainingNeeds.filter(
    (need) => need.status === TrainingNeedStatus.PENDING_REVIEW
  );

  const handleApprove = (id: string) => {
    actions.approveTrainingNeed(id);
    setShowApproveModal(null);
  };

  const handleReject = (id: string) => {
    if (!rejectReason.trim()) {
      alert('请输入退回原因');
      return;
    }
    actions.rejectTrainingNeed(id, rejectReason);
    setShowRejectModal(null);
    setRejectReason('');
  };

  if (pendingNeeds.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">暂无待审核的培训需求</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">待审核培训需求</h3>
          <p className="text-xs text-gray-500 mt-0.5">共 {pendingNeeds.length} 项</p>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {pendingNeeds.map((need) => (
          <div key={need.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  {need.title}
                </h4>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {need.description}
                </p>
              </div>
              <StatusBadge status={need.status} className="ml-3" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-3">
              <div>
                <span className="font-medium">发起部门:</span>
                <span className="ml-1">{need.departmentName}</span>
              </div>
              <div>
                <span className="font-medium">截止日期:</span>
                <span className="ml-1">
                  {format(new Date(need.deadline), 'MM-dd')}
                </span>
              </div>
              <div>
                <span className="font-medium">参与部门:</span>
                <span className="ml-1">{need.participantDepartments.length}个</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewDetail?.(need.id)}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
              >
                <Eye className="w-3 h-3" />
                查看详情
              </button>
              <button
                onClick={() => setShowApproveModal(need.id)}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
              >
                <CheckCircle className="w-3 h-3" />
                审核通过
              </button>
              <button
                onClick={() => setShowRejectModal(need.id)}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
              >
                <XCircle className="w-3 h-3" />
                退回
              </button>
            </div>
          </div>
        ))}
      </div>

      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">审核通过</h3>
            <p className="text-sm text-gray-600 mb-4">
              确认后，此培训需求将进入待排期状态。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowApproveModal(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={() => handleApprove(showApproveModal)}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
              >
                确认通过
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">退回需求</h3>
            <p className="text-sm text-gray-600 mb-4">
              请输入退回原因，部门负责人将收到退回通知。
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入退回原因..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
              >
                确认退回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
