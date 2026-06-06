import { Drawer } from '@/components/common/Drawer';
import { StatusTag } from '@/components/common/StatusTag';
import { Timeline } from '@/components/common/Timeline';
import { AppealRecord } from '@/types';
import { formatCurrency, formatDateTime, formatDuration, userRoleMap } from '@/utils/format';
import { useStore } from '@/store/useStore';
import { Clock, User, Phone, FileText, CheckCircle, XCircle, Bell, ArrowRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AppealDetailProps {
  isOpen: boolean;
  onClose: () => void;
  appeal: AppealRecord | null;
  onProcess: () => void;
  onNext?: () => void;
  hasNext?: boolean;
}

export const AppealDetail = ({ isOpen, onClose, appeal, onProcess, onNext, hasNext }: AppealDetailProps) => {
  const { currentUser, getRolePermissions, setSelectedDetentionId } = useStore();
  const navigate = useNavigate();
  const permissions = getRolePermissions(currentUser.role);

  if (!appeal) return null;

  const detention = appeal.detention;
  const canProcess = permissions.canProcessAppeal && (appeal.status === 'pending' || appeal.status === 'processing');

  const handleViewDetention = () => {
    if (detention) {
      setSelectedDetentionId(detention.id);
      navigate('/detention');
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="申诉详情" size="xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">申诉 #{appeal.id}</h4>
            <p className="text-sm text-gray-500 mt-1">提交于 {formatDateTime(appeal.submittedAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            {appeal.hasFeeUpdate && (
              <div className="flex items-center gap-1 px-2 py-1 bg-cyan-50 border border-cyan-200 rounded">
                <Bell className="w-3 h-3 text-cyan-600" />
                <span className="text-xs text-cyan-700 font-medium">费用已更新</span>
              </div>
            )}
            <StatusTag status={appeal.status} type="appeal" />
          </div>
        </div>

        {appeal.hasFeeUpdate && appeal.feeUpdatedAt && (
          <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-cyan-800">费用变更提醒</p>
              <p className="text-xs text-cyan-600 mt-0.5">
                关联滞留单的费用已于 {formatDateTime(appeal.feeUpdatedAt)} 调整，请注意查看最新费用信息
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded">
              <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                司机信息
              </h5>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">姓名</span>
                  <span className="text-gray-900 font-medium">{appeal.driverName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">联系电话</span>
                  <span className="text-gray-900">{appeal.driverPhone}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded">
              <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                申诉内容
              </h5>
              <p className="text-sm text-gray-700 leading-relaxed">{appeal.appealReason}</p>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">申请减免金额</span>
                  <span className="text-orange-600 font-medium">{formatCurrency(appeal.requestedAdjustment)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded">
              <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                申诉提交人
              </h5>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">提交人</span>
                <span className="text-gray-900">{appeal.submittedBy}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {detention && (
              <div className="p-4 bg-gray-50 rounded">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    关联滞留单
                  </h5>
                  <button
                    onClick={handleViewDetention}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    查看详情 <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">订单号</span>
                    <span className="text-gray-900 font-medium">{detention.orderNo}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">车牌号</span>
                    <span className="text-gray-900">{detention.plateNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">月台</span>
                    <span className="text-gray-900">{detention.platformNo}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">滞留时长</span>
                    <span className="text-gray-900">{detention.detentionHours}小时</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">预计时长</span>
                    <span className="text-gray-900">{formatDuration(detention.expectedDurationMin)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">实际时长</span>
                    <span className="text-gray-900">{formatDuration(detention.actualDurationMin)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                    <span className="text-gray-500">当前费用</span>
                    <span className="text-gray-900 font-semibold">{formatCurrency(detention.feeAmount)}</span>
                  </div>
                  {detention.feeAmount !== detention.originalFee && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">原始费用</span>
                      <span className="text-gray-400 line-through">{formatCurrency(detention.originalFee)}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-white rounded">
                      <p className="text-xs text-gray-500">到达</p>
                      <p className="text-xs text-gray-700 mt-0.5">{formatDateTime(detention.arrivalTime).split(' ')[1]}</p>
                    </div>
                    <div className="p-2 bg-white rounded">
                      <p className="text-xs text-gray-500">开始</p>
                      <p className="text-xs text-gray-700 mt-0.5">{formatDateTime(detention.startLoadingTime).split(' ')[1]}</p>
                    </div>
                    <div className="p-2 bg-white rounded">
                      <p className="text-xs text-gray-500">结束</p>
                      <p className="text-xs text-gray-700 mt-0.5">{formatDateTime(detention.endLoadingTime).split(' ')[1]}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>创建人</span>
                    <span>{detention.createdBy} ({userRoleMap[detention.createdByRole]})</span>
                  </div>
                  {detention.confirmedBy && (
                    <div className="flex justify-between mt-1">
                      <span>确认人</span>
                      <span>{detention.confirmedBy}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {(appeal.processResult || appeal.processRemark) && (
          <div className="border-t border-gray-100 pt-4">
            <h5 className="text-sm font-medium text-gray-900 mb-3">处理结果</h5>
            <div className={`p-4 rounded ${
              appeal.status === 'approved' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {appeal.status === 'approved' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  appeal.status === 'approved' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {appeal.processResult}
                </span>
              </div>
              {appeal.processRemark && (
                <p className="text-sm text-gray-700">{appeal.processRemark}</p>
              )}
              {appeal.processedBy && (
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                  <span>处理人: {appeal.processedBy}</span>
                  <span>{appeal.processedAt && formatDateTime(appeal.processedAt)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 pt-4">
          <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            申诉状态变更历史
          </h5>
          <Timeline logs={appeal.statusLogs} type="appeal" />
        </div>

        {detention && (
          <div className="border-t border-gray-100 pt-4">
            <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              滞留单状态变更历史
            </h5>
            <Timeline logs={detention.statusLogs} type="detention" />
          </div>
        )}

        <div className="border-t border-gray-100 pt-4 flex gap-3">
          {canProcess && (
            <button
              onClick={onProcess}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
            >
              处理申诉
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
