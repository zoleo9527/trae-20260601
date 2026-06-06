import { Drawer } from '@/components/common/Drawer';
import { Timeline } from '@/components/common/Timeline';
import { StatusTag } from '@/components/common/StatusTag';
import { DetentionRecord } from '@/types';
import { formatCurrency, formatDateTime, formatDuration, userRoleMap } from '@/utils/format';
import { useStore } from '@/store/useStore';
import { Edit3, CheckCircle, FileText, ArrowRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DetentionDetailProps {
  isOpen: boolean;
  onClose: () => void;
  detention: DetentionRecord | null;
  onAdjustFee: () => void;
  onConfirm: () => void;
  onNext?: () => void;
  hasNext?: boolean;
}

export const DetentionDetail = ({
  isOpen,
  onClose,
  detention,
  onAdjustFee,
  onConfirm,
  onNext,
  hasNext,
}: DetentionDetailProps) => {
  const { currentUser, getRolePermissions, appeals, setSelectedAppealId } = useStore();
  const navigate = useNavigate();
  const permissions = getRolePermissions(currentUser.role);

  if (!detention) return null;

  const canConfirm = permissions.canConfirmDetention && detention.status === 'pending';
  const canAdjust = permissions.canAdjustFee && detention.status !== 'closed';

  const relatedAppeals = appeals.filter((a) => a.detentionId === detention.id);

  const handleViewAppeal = (appealId: string) => {
    setSelectedAppealId(appealId);
    navigate('/appeal');
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="滞留费用详情" size="lg">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">{detention.orderNo}</h4>
            <p className="text-sm text-gray-500 mt-1">创建于 {formatDateTime(detention.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusTag status={detention.status} type="detention" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-500 mb-1">车牌号</p>
            <p className="text-sm font-medium text-gray-900">{detention.plateNumber}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-500 mb-1">司机</p>
            <p className="text-sm font-medium text-gray-900">{detention.driverName}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-500 mb-1">月台号</p>
            <p className="text-sm font-medium text-gray-900">{detention.platformNo}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-500 mb-1">联系电话</p>
            <p className="text-sm font-medium text-gray-900">{detention.driverPhone}</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h5 className="text-sm font-medium text-gray-900 mb-3">时间线</h5>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500 mb-1">到达时间</p>
              <p className="text-sm font-medium text-gray-900">{formatDateTime(detention.arrivalTime)}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500 mb-1">开始装卸</p>
              <p className="text-sm font-medium text-gray-900">{formatDateTime(detention.startLoadingTime)}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500 mb-1">结束装卸</p>
              <p className="text-sm font-medium text-gray-900">{formatDateTime(detention.endLoadingTime)}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h5 className="text-sm font-medium text-gray-900 mb-3">费用计算</h5>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">预计时长</span>
              <span className="text-sm text-gray-900">{formatDuration(detention.expectedDurationMin)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">实际时长</span>
              <span className="text-sm text-gray-900">{formatDuration(detention.actualDurationMin)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">滞留时长</span>
              <span className="text-sm font-medium text-orange-600">{detention.detentionHours}小时</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-900">滞留费用</span>
              <div className="text-right">
                <span className="text-xl font-bold text-gray-900">{formatCurrency(detention.feeAmount)}</span>
                {detention.feeAmount !== detention.originalFee && (
                  <p className="text-xs text-gray-400 line-through">{formatCurrency(detention.originalFee)}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {relatedAppeals.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              关联申诉 ({relatedAppeals.length})
            </h5>
            <div className="space-y-2">
              {relatedAppeals.map((appeal) => (
                <div
                  key={appeal.id}
                  className="p-3 bg-purple-50 rounded-lg border border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors"
                  onClick={() => handleViewAppeal(appeal.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">申诉 #{appeal.id}</span>
                    <StatusTag status={appeal.status} type="appeal" />
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-1">{appeal.appealReason}</p>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-orange-600">申请减免 {formatCurrency(appeal.requestedAdjustment)}</span>
                    <span className="text-gray-500">{formatDateTime(appeal.submittedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {detention.remark && (
          <div className="border-t border-gray-100 pt-4">
            <h5 className="text-sm font-medium text-gray-900 mb-2">备注</h5>
            <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded">{detention.remark}</p>
          </div>
        )}

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-gray-900">责任人</h5>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">创建人</span>
              <span className="text-gray-900">
                {detention.createdBy}
                <span className="text-gray-400 ml-1">({userRoleMap[detention.createdByRole]})</span>
              </span>
            </div>
            {detention.confirmedBy && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">确认人</span>
                <span className="text-gray-900">{detention.confirmedBy}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            状态变更历史
          </h5>
          <Timeline logs={detention.statusLogs} type="detention" />
        </div>

        <div className="border-t border-gray-100 pt-4 flex gap-3">
          {canConfirm && (
            <button
              onClick={onConfirm}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              确认费用
            </button>
          )}
          {canAdjust && (
            <button
              onClick={onAdjustFee}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              调整费用
            </button>
          )}
          {hasNext && onNext && (
            <button
              onClick={onNext}
              className="flex items-center justify-center gap-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
            >
              下一条
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Drawer>
  );
};
