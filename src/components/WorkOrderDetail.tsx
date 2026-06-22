import { useState, useMemo } from 'react';
import {
  X,
  MapPin,
  Lamp,
  Calendar,
  FileText,
  MessageSquare,
  Send,
  CheckCircle,
  Clock,
  User,
  AlertTriangle,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { useWorkOrderStore } from '../store/workOrderStore';
import { useAuthStore } from '../store/authStore';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { Timeline } from './Timeline';
import { RemarkBubble } from './RemarkBubble';
import type { WorkOrder } from '../types';
import { statusLabels, priorityLabels, roleLabels } from '../types';

export function WorkOrderDetail() {
  const {
    selectedWorkOrder,
    isDetailOpen,
    closeDetail,
    openDispatchModal,
    openOnSiteModal,
    openCompleteModal,
    completeWorkOrder,
    addRemark,
  } = useWorkOrderStore();
  const { currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'timeline' | 'info' | 'remarks'>('timeline');
  const [supplementRemark, setSupplementRemark] = useState('');

  if (!selectedWorkOrder || !isDetailOpen) return null;

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

  const handleAddRemark = () => {
    if (!supplementRemark.trim() || !selectedWorkOrder || !currentUser) return;

    addRemark(selectedWorkOrder.id, {
      workOrderId: selectedWorkOrder.id,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      content: supplementRemark,
      type: 'supplement',
    });
    setSupplementRemark('');
  };

  const handleComplete = () => {
    openCompleteModal();
  };

  const latestRemark = useMemo(() => {
    if (selectedWorkOrder.remarks.length === 0) return null;
    return selectedWorkOrder.remarks[selectedWorkOrder.remarks.length - 1];
  }, [selectedWorkOrder.remarks]);

  const getStatusDescription = (wo: WorkOrder) => {
    switch (wo.status) {
      case 'pending_dispatch':
        return '等待调度员分配维修人员';
      case 'dispatched':
        return `已派工给 ${wo.electricianName}，待到场处理`;
      case 'on_site':
        return `${wo.electricianName} 已到达现场，正在处理`;
      case 'in_progress':
        return `${wo.electricianName} 正在维修中`;
      case 'returned':
        return '工单已退回，等待二次处理';
      case 'completed':
        return '维修已完成，工单已闭环';
      default:
        return '';
    }
  };

  const tabs = [
    { id: 'timeline', label: '全流程时间线', icon: Clock },
    { id: 'info', label: '灯杆台账', icon: Lamp },
    { id: 'remarks', label: '历史备注', icon: MessageSquare },
  ];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40 animate-fade-in"
        onClick={closeDetail}
      />
      <aside className="fixed right-0 top-0 h-full w-[560px] bg-white shadow-sidebar z-50 animate-slide-in-right flex flex-col">
        <header className="border-b border-neutral-200 p-5 flex items-start justify-between flex-shrink-0 bg-gradient-to-r from-primary-50 to-white">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono-cn text-lg font-bold text-neutral-800">
                {selectedWorkOrder.orderNo}
              </span>
              <StatusBadge status={selectedWorkOrder.status} />
              <PriorityBadge priority={selectedWorkOrder.priority} />
            </div>
            <p className="text-sm text-neutral-600 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {selectedWorkOrder.lampPost.location}
            </p>
          </div>
          <button
            onClick={closeDetail}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-white/80 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="border-b border-neutral-200 bg-neutral-50 px-5 py-3 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold text-neutral-800">
                  {selectedWorkOrder.faultType}
                </span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {getStatusDescription(selectedWorkOrder)}
              </p>
            </div>
          </div>
        </div>

        {latestRemark && activeTab === 'timeline' && (
          <div className="bg-warning-50 border-b border-warning-100 px-5 py-3 flex-shrink-0">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-warning-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-warning-700">最新动态</span>
                  <span className="text-xs text-warning-500">
                    {latestRemark.timestamp}
                  </span>
                </div>
                <p className="text-sm text-warning-800 line-clamp-2">
                  {latestRemark.content}
                </p>
                <p className="text-xs text-warning-600 mt-1">
                  — {latestRemark.authorName} ({roleLabels[latestRemark.authorRole]})
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="border-b border-neutral-200 flex-shrink-0">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-primary-600'
                      : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'remarks' && selectedWorkOrder.remarks.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-neutral-100 text-neutral-600 rounded-full">
                      {selectedWorkOrder.remarks.length}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {activeTab === 'timeline' && (
            <div className="p-5">
              <Timeline workOrder={selectedWorkOrder} />
            </div>
          )}

          {activeTab === 'info' && (
            <div className="p-5 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                  <Lamp className="w-4 h-4" />
                  灯杆台账
                </h3>
                <div className="card p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-500">灯杆编号</span>
                    <span className="text-sm font-mono-cn text-neutral-800">
                      {selectedWorkOrder.lampPost.lampNo}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-500">所在位置</span>
                    <span className="text-sm text-neutral-800 text-right max-w-[250px]">
                      {selectedWorkOrder.lampPost.location}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-500">灯杆型号</span>
                    <span className="text-sm text-neutral-800">
                      {selectedWorkOrder.lampPost.model}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-500">安装日期</span>
                    <span className="text-sm text-neutral-800 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {selectedWorkOrder.lampPost.installDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-500">上次维护</span>
                    <span className="text-sm text-neutral-800 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {selectedWorkOrder.lampPost.lastMaintenanceDate || '暂无记录'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  历史维修记录
                </h3>
                <div className="space-y-2">
                  {selectedWorkOrder.lampPost.historyRecords.map((record, index) => (
                    <div
                      key={index}
                      className="card p-3 text-sm text-neutral-600 border-l-4 border-l-primary-400"
                    >
                      {record}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  夜巡记录
                </h3>
                <div className="card p-4">
                  <p className="text-sm text-neutral-600 mb-3 leading-relaxed">
                    {selectedWorkOrder.patrolRecord.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      上报人：{selectedWorkOrder.patrolRecord.inspectorName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      上报时间：{selectedWorkOrder.patrolRecord.reportTime}
                    </span>
                  </div>
                </div>
              </div>

              {(selectedWorkOrder.electricianName || selectedWorkOrder.dispatchTime) && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    派工信息
                  </h3>
                  <div className="card p-4 space-y-2">
                    {selectedWorkOrder.electricianName && (
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-500">维修电工</span>
                        <span className="text-sm text-neutral-800">
                          {selectedWorkOrder.electricianName}
                        </span>
                      </div>
                    )}
                    {selectedWorkOrder.dispatchTime && (
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-500">派工时间</span>
                        <span className="text-sm text-neutral-800">
                          {selectedWorkOrder.dispatchTime}
                        </span>
                      </div>
                    )}
                    {selectedWorkOrder.dispatchRemark && (
                      <div className="mt-2 pt-2 border-t border-neutral-100">
                        <span className="text-xs text-neutral-500 mb-1 block">派工备注</span>
                        <p className="text-sm text-neutral-700 bg-primary-50 p-2 rounded">
                          {selectedWorkOrder.dispatchRemark}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'remarks' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  历史备注
                </h3>
                <span className="text-xs text-neutral-500">
                  共 {selectedWorkOrder.remarks.length} 条
                </span>
              </div>
              {selectedWorkOrder.remarks.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">暂无备注记录</p>
                  <p className="text-xs mt-1">派工、到场反馈等操作会自动生成备注</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...selectedWorkOrder.remarks].reverse().map((remark) => (
                    <RemarkBubble key={remark.id} remark={remark} />
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-neutral-200">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  补充备注
                </label>
                <textarea
                  value={supplementRemark}
                  onChange={(e) => setSupplementRemark(e.target.value)}
                  placeholder="输入补充备注信息，所有相关人员都可见..."
                  className="textarea h-20 mb-3"
                />
                <button
                  onClick={handleAddRemark}
                  disabled={!supplementRemark.trim()}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  添加备注
                </button>
              </div>
            </div>
          )}
        </div>

        <footer className="border-t border-neutral-200 p-4 bg-neutral-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            {showDispatchButton(selectedWorkOrder) && (
              <button
                onClick={openDispatchModal}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5"
              >
                <Send className="w-4 h-4" />
                {selectedWorkOrder.status === 'returned' ? '二次派工' : '维修派工'}
              </button>
            )}
            {showOnSiteButton(selectedWorkOrder) && (
              <button
                onClick={openOnSiteModal}
                className="btn-warning flex-1 flex items-center justify-center gap-2 py-2.5"
              >
                <MapPin className="w-4 h-4" />
                到场反馈
              </button>
            )}
            {showCompleteButton(selectedWorkOrder) && (
              <button
                onClick={handleComplete}
                className="btn-success flex-1 flex items-center justify-center gap-2 py-2.5"
              >
                <CheckCircle className="w-4 h-4" />
                完成维修
              </button>
            )}
            {!showDispatchButton(selectedWorkOrder) &&
              !showOnSiteButton(selectedWorkOrder) &&
              !showCompleteButton(selectedWorkOrder) && (
                <div className="flex-1 text-center text-sm text-neutral-500 py-2">
                  {currentUser?.role === 'supervisor'
                    ? '主管视角：仅查看，不参与操作'
                    : '当前状态无需操作'}
                </div>
              )}
            <button
              onClick={closeDetail}
              className="btn-secondary px-6 py-2.5"
            >
              关闭
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
}
