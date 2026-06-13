import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Timeline } from './Timeline';
import { StatusBadge } from './StatusBadge';
import { format } from 'date-fns';
import { X, Building2, Users, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { TrainingNeedStatus } from '@/types';

interface TrainingNeedDetailProps {
  needId: string;
  onClose: () => void;
  onActionComplete?: () => void;
}

export function TrainingNeedDetail({ needId, onClose, onActionComplete }: TrainingNeedDetailProps) {
  const { trainingNeeds, timelineLogs, actions } = useAppStore();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const need = trainingNeeds.find((n) => n.id === needId);

  if (!need) {
    return (
      <div className="p-6 text-center text-gray-500">
        培训需求不存在
      </div>
    );
  }

  const needLogs = timelineLogs.filter(
    (log) => log.entityType === 'training_need' && log.entityId === need.id
  );

  const handleApprove = () => {
    actions.approveTrainingNeed(need.id);
    onActionComplete?.();
    onClose();
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert('请输入退回原因');
      return;
    }
    actions.rejectTrainingNeed(need.id, rejectReason);
    onActionComplete?.();
    onClose();
  };

  const canReview = need.status === TrainingNeedStatus.PENDING_REVIEW;

  return (
    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">培训需求详情</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {need.title}
            </h3>
            <StatusBadge status={need.status} />
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">需求描述</h4>
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
            {need.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Building2 className="w-4 h-4" />
              <span className="text-sm">发起部门</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">{need.departmentName}</p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-green-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">截止日期</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {format(new Date(need.deadline), 'yyyy-MM-dd')}
            </p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-lg p-4 border border-gray-100 col-span-2">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">参与部门</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {need.participantDepartments.length}个部门
            </p>
          </div>
        </div>

        {need.rejectedReason && need.status === TrainingNeedStatus.REJECTED && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-white border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <span className="font-semibold">退回原因：</span>
              {need.rejectedReason}
            </p>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">状态时间线</h4>
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-100">
            <Timeline logs={needLogs} />
          </div>
        </div>
      </div>

      {canReview && (
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleApprove}
            className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            审核通过
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            退回
          </button>
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
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleReject}
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
