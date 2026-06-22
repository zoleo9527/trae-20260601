import type { WorkOrder } from '../types';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { useWorkOrderStore } from '../store/workOrderStore';
import { useAuthStore } from '../store/authStore';
import { MapPin, Clock, User, Send, CheckCircle } from 'lucide-react';

interface WorkOrderListProps {
  workOrders: WorkOrder[];
}

export function WorkOrderList({ workOrders }: WorkOrderListProps) {
  const { openDetail, flashingWorkOrderId } = useWorkOrderStore();
  const { currentUser } = useAuthStore();

  const getLatestRemark = (wo: WorkOrder) => {
    if (wo.remarks.length === 0) return null;
    return wo.remarks[wo.remarks.length - 1];
  };

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
    const remark = prompt('请输入完成备注：', '维修完成，测试正常。');
    if (remark !== null) {
      useWorkOrderStore.getState().completeWorkOrder(wo.id, remark);
    }
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
              负责人
            </th>
            <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">
              最新备注
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

            return (
              <tr
                key={wo.id}
                className={`hover:bg-neutral-50 cursor-pointer transition-colors duration-200 ${
                  isFlashing ? 'animate-pulse-bg' : ''
                }`}
                onClick={() => openDetail(wo)}
              >
                <td className="px-4 py-4">
                  <span className="font-mono-cn text-sm font-semibold text-primary-700">
                    {wo.orderNo}
                  </span>
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
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-neutral-700">
                      {wo.electricianName || '待分配'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {latestRemark ? (
                    <div className="max-w-[250px]">
                      <p className="text-sm text-neutral-600 truncate">
                        {latestRemark.content}
                      </p>
                      <p className="text-xs text-neutral-400 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {latestRemark.timestamp}
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm text-neutral-400">暂无备注</span>
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
