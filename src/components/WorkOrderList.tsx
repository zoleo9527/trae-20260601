import type { WorkOrder, RemarkType } from '../types';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { useWorkOrderStore } from '../store/workOrderStore';
import { useAuthStore } from '../store/authStore';
import {
  getLatestRemark,
  getDispatchRound,
  isReturnedAwaitingDispatch,
} from '../lib/utils';
import {
  MapPin,
  Clock,
  User,
  Send,
  CheckCircle,
  MessageSquare,
  Repeat,
  AlertTriangle,
} from 'lucide-react';

interface WorkOrderListProps {
  workOrders: WorkOrder[];
}

const progressTypeStyles: Record<RemarkType, string> = {
  dispatch: 'bg-primary-100 text-primary-700 border-primary-200',
  onsite: 'bg-warning-100 text-warning-700 border-warning-200',
  return: 'bg-danger-100 text-danger-700 border-danger-200',
  complete: 'bg-success-100 text-success-700 border-success-200',
  supplement: 'bg-neutral-100 text-neutral-600 border-neutral-200',
};

const progressTypeLabels: Record<RemarkType, string> = {
  dispatch: '派工',
  onsite: '到场',
  return: '退回',
  complete: '完成',
  supplement: '备注',
};

export function WorkOrderList({ workOrders }: WorkOrderListProps) {
  const { openDetail, flashingWorkOrderId } = useWorkOrderStore();
  const { currentUser } = useAuthStore();

  const showDispatchButton = (wo: WorkOrder) => {
    if (!currentUser) return false;
    if (currentUser.role !== 'dispatcher') return false;
    return wo.status === 'pending_dispatch' || wo.status === 'returned';
  };

  const showOnSiteButton = (wo: WorkOrder) => {
    if (!currentUser) return false;
    if (currentUser.role !== 'electrician') return false;
    return wo.status === 'dispatched' && wo.electricianId === currentUser.id;
  };

  const showCompleteButton = (wo: WorkOrder) => {
    if (!currentUser) return false;
    if (currentUser.role !== 'electrician') return false;
    return (
      (wo.status === 'on_site' || wo.status === 'in_progress') &&
      wo.electricianId === currentUser.id
    );
  };

  const handleDispatch = (e: React.MouseEvent, wo: WorkOrder) => {
    e.stopPropagation();
    useWorkOrderStore.getState().selectWorkOrder(wo);
    useWorkOrderStore.getState().openDispatchModal();
  };

  const handleOnSite = (e: React.MouseEvent, wo: WorkOrder) => {
    e.stopPropagation();
    useWorkOrderStore.getState().selectWorkOrder(wo);
    useWorkOrderStore.getState().openOnSiteModal();
  };

  const handleComplete = (e: React.MouseEvent, wo: WorkOrder) => {
    e.stopPropagation();
    useWorkOrderStore.getState().selectWorkOrder(wo);
    useWorkOrderStore.getState().openCompleteModal();
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-neutral-50 border-b border-neutral-200">
            <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">
              工单编号
            </th>
            <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">
              灯杆位置
            </th>
            <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">
              故障类型
            </th>
            <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">
              状态
            </th>
            <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">
              优先级
            </th>
            <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">
              轮次
            </th>
            <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">
              负责人
            </th>
            <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">
              最新进展
            </th>
            <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 bg-white">
          {workOrders.map((wo) => {
            const latestRemark = getLatestRemark(wo);
            const isFlashing = flashingWorkOrderId === wo.id;
            const round = getDispatchRound(wo);
            const needDispatch = isReturnedAwaitingDispatch(wo);

            return (
              <tr
                key={wo.id}
                className={`hover:bg-neutral-50 cursor-pointer transition-colors duration-200 relative ${
                  isFlashing ? 'animate-pulse-bg' : ''
                } ${needDispatch ? 'bg-danger-50/30' : ''}`}
                onClick={() => openDetail(wo)}
              >
                {needDispatch && (
                  <td className="w-1 absolute left-0 top-0 bottom-0 bg-danger-500 animate-pulse" />
                )}
                <td className={`px-4 py-4 ${needDispatch ? 'pl-5' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-cn text-sm font-semibold text-primary-700">
                      {wo.orderNo}
                    </span>
                    {needDispatch && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-danger-100 text-danger-700 text-xs font-medium rounded border border-danger-200">
                        <AlertTriangle className="w-3 h-3" />
                        待调度
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <span className="text-sm text-neutral-800 max-w-[200px] truncate">
                      {wo.lampPost.location}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-neutral-800">{wo.faultType}</span>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={wo.status} />
                </td>
                <td className="px-4 py-4">
                  <PriorityBadge priority={wo.priority} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5">
                    <Repeat
                      className={`w-3.5 h-3.5 ${
                        round > 1 ? 'text-warning-500' : 'text-neutral-400'
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        round > 1 ? 'text-warning-700' : 'text-neutral-600'
                      }`}
                    >
                      第{round || 0}轮
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-neutral-700">
                      {wo.electricianName || '待分配'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {latestRemark ? (
                    <div className="max-w-[280px]">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <MessageSquare className="w-3.5 h-3.5 text-primary-500" />
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                            progressTypeStyles[latestRemark.type]
                          }`}
                        >
                          {progressTypeLabels[latestRemark.type]}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-700 line-clamp-2 mb-1">
                        {latestRemark.content}
                      </p>
                      <p className="text-xs text-neutral-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {latestRemark.timestamp}
                        <span className="mx-1">·</span>
                        {latestRemark.authorName}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                      <MessageSquare className="w-4 h-4" />
                      暂无进展
                    </div>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {showDispatchButton(wo) && (
                      <button
                        onClick={(e) => handleDispatch(e, wo)}
                        className="btn-primary btn-xs px-3 py-1.5 text-xs flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        派工
                      </button>
                    )}
                    {showOnSiteButton(wo) && (
                      <button
                        onClick={(e) => handleOnSite(e, wo)}
                        className="btn-warning btn-xs px-3 py-1.5 text-xs flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        到场反馈
                      </button>
                    )}
                    {showCompleteButton(wo) && (
                      <button
                        onClick={(e) => handleComplete(e, wo)}
                        className="btn-success btn-xs px-3 py-1.5 text-xs flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        完成
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
