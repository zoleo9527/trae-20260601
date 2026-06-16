import React, { useState, useEffect } from 'react';
import { X, Users, Phone, Clock, Utensils, CheckCircle, XCircle, ArrowRight, Calendar, ClipboardCheck, CreditCard } from 'lucide-react';
import { Queue, Table, Assignment, SystemLog } from '../types';
import { queueApi, tableApi, assignmentApi, logApi } from '../api';
import { useStore } from '../store';

interface QueueDetailModalProps {
  queue: Queue | null;
  tables: Table[];
  onClose: () => void;
}

const statusConfig: Record<Queue['status'], { label: string; color: string; bgColor: string }> = {
  waiting: { label: '等待中', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  seated: { label: '已入座', color: 'text-green-600', bgColor: 'bg-green-100' },
  completed: { label: '已完成', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  cancelled: { label: '已取消', color: 'text-red-600', bgColor: 'bg-red-100' },
};

const roleActions: Record<string, { canAssign: boolean; canCheckout: boolean; canCancel: boolean }> = {
  manager: { canAssign: false, canCheckout: false, canCancel: true },
  chef: { canAssign: true, canCheckout: false, canCancel: false },
  cashier: { canAssign: false, canCheckout: true, canCancel: false },
  admin: { canAssign: true, canCheckout: true, canCancel: true },
};

export const QueueDetailModal: React.FC<QueueDetailModalProps> = ({ queue, tables, onClose }) => {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<Array<{
    id: string;
    type: 'create' | 'assign' | 'seat' | 'complete' | 'cancel' | 'log';
    title: string;
    description: string;
    operatorName: string;
    timestamp: string;
    icon: React.ReactNode;
    bgColor: string;
    iconColor: string;
  }>>([]);

  const user = useStore((state) => state.user);
  const updateQueue = useStore((state) => state.updateQueue);
  const updateTableState = useStore((state) => state.updateTable);

  const availableTables = tables.filter((t) => t.status === 'available');

  useEffect(() => {
    if (queue) {
      loadTimelineData();
    }
  }, [queue]);

  const loadTimelineData = async () => {
    if (!queue) return;
    
    try {
      const [assignmentsData, logsData] = await Promise.all([
        assignmentApi.getAssignments(queue.id),
        logApi.getLogs(),
      ]);
      setAssignments(assignmentsData);
      setLogs(logsData.filter(l => l.targetId === queue!.id));
      buildTimeline(assignmentsData, logsData.filter(l => l.targetId === queue!.id));
    } catch (err) {
      console.error('加载时间线数据失败:', err);
    }
  };

  const buildTimeline = (assignmentsData: Assignment[], queueLogs: SystemLog[]) => {
    if (!queue) return;

    const events: typeof timelineEvents = [];

    events.push({
      id: `create-${queue.id}`,
      type: 'create',
      title: '创建排号',
      description: `顾客: ${queue.customerName}, 人数: ${queue.partySize}人`,
      operatorName: queue.submittedByName,
      timestamp: queue.createdAt,
      icon: <ArrowRight className="w-4 h-4" />,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
    });

    queueLogs.forEach(log => {
      const icon = getLogIcon(log.action);
      events.push({
        id: `log-${log.id}`,
        type: 'log',
        title: log.action,
        description: log.details || '',
        operatorName: log.userName,
        timestamp: log.createdAt,
        icon: icon,
        bgColor: getLogBgColor(log.action),
        iconColor: getLogIconColor(log.action),
      });
    });

    assignmentsData.forEach(assignment => {
      events.push({
        id: `assign-${assignment.id}`,
        type: 'assign',
        title: '确认桌台分配',
        description: `桌台: ${tables.find(t => t.id === assignment.tableId)?.name || assignment.tableId}`,
        operatorName: assignment.assignedByName,
        timestamp: assignment.assignedAt,
        icon: <ClipboardCheck className="w-4 h-4" />,
        bgColor: 'bg-blue-100',
        iconColor: 'text-blue-600',
      });
    });

    if (queue.status === 'completed') {
      events.push({
        id: `complete-${queue.id}`,
        type: 'complete',
        title: '完成结账',
        description: '桌台已释放',
        operatorName: '-',
        timestamp: queue.updatedAt,
        icon: <CreditCard className="w-4 h-4" />,
        bgColor: 'bg-green-100',
        iconColor: 'text-green-600',
      });
    }

    if (queue.status === 'cancelled') {
      events.push({
        id: `cancel-${queue.id}`,
        type: 'cancel',
        title: '取消排号',
        description: '顾客取消等位',
        operatorName: '-',
        timestamp: queue.updatedAt,
        icon: <XCircle className="w-4 h-4" />,
        bgColor: 'bg-red-100',
        iconColor: 'text-red-600',
      });
    }

    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    setTimelineEvents(events);
  };

  const getLogIcon = (action: string) => {
    if (action.includes('创建')) return <ArrowRight className="w-4 h-4" />;
    if (action.includes('分配')) return <ClipboardCheck className="w-4 h-4" />;
    if (action.includes('更新')) return <CheckCircle className="w-4 h-4" />;
    if (action.includes('取消')) return <XCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const getLogBgColor = (action: string) => {
    if (action.includes('创建')) return 'bg-orange-100';
    if (action.includes('分配')) return 'bg-blue-100';
    if (action.includes('更新')) return 'bg-green-100';
    if (action.includes('取消')) return 'bg-red-100';
    return 'bg-gray-100';
  };

  const getLogIconColor = (action: string) => {
    if (action.includes('创建')) return 'text-orange-600';
    if (action.includes('分配')) return 'text-blue-600';
    if (action.includes('更新')) return 'text-green-600';
    if (action.includes('取消')) return 'text-red-600';
    return 'text-gray-600';
  };

  const handleAssignTable = async () => {
    if (!selectedTableId || !queue || !user) return;
    
    setProcessing(true);
    try {
      const updatedQueue = await queueApi.assignTable(queue.id, selectedTableId, user.id);
      updateQueue(updatedQueue);
      
      const table = await tableApi.updateTable(selectedTableId, 'occupied', undefined, undefined, undefined, user.id);
      updateTableState(table);

      await assignmentApi.createAssignment(queue.id, selectedTableId, user.id, user.name);
      
      setShowAssignModal(false);
      setSelectedTableId(null);
      
      loadTimelineData();
    } catch (err) {
      console.error('分配桌台失败:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateStatus = async (status: Queue['status']) => {
    if (!queue || !user) return;
    
    setProcessing(true);
    try {
      const updatedQueue = await queueApi.updateQueueStatus(queue.id, status, user.id);
      updateQueue(updatedQueue);
      
      if (status === 'completed' && queue.assignedTableId) {
        const table = await tableApi.updateTable(queue.assignedTableId, 'cleaning', undefined, undefined, undefined, user.id);
        updateTableState(table);
      }
      
      loadTimelineData();
    } catch (err) {
      console.error('更新状态失败:', err);
    } finally {
      setProcessing(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!queue) return null;

  const actions = user ? roleActions[user.role] : { canAssign: false, canCheckout: false, canCancel: false };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">排号详情</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-gray-800">{queue.customerName}</span>
              <span className={`ml-3 px-3 py-1 text-sm rounded-full ${statusConfig[queue.status].bgColor} ${statusConfig[queue.status].color}`}>
                {statusConfig[queue.status].label}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-gray-500 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">用餐人数</span>
              </div>
              <span className="text-lg font-bold text-gray-800">{queue.partySize}人</span>
            </div>
            
            {queue.phone && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-gray-500 mb-1">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">联系电话</span>
                </div>
                <span className="text-lg font-bold text-gray-800">{queue.phone}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-gray-500 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">创建时间</span>
              </div>
              <span className="text-sm text-gray-800">{formatDateTime(queue.createdAt)}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-gray-500 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">更新时间</span>
              </div>
              <span className="text-sm text-gray-800">{formatDateTime(queue.updatedAt)}</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-gray-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">提交人</span>
            </div>
            <span className="text-sm text-gray-800">{queue.submittedByName} (前厅经理)</span>
          </div>

          {queue.assignedTableId && (
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-orange-600 mb-1">
                <Utensils className="w-4 h-4" />
                <span className="text-sm">已分配桌台</span>
              </div>
              <span className="text-lg font-bold text-orange-600">{queue.assignedTableName}</span>
              {assignments.length > 0 && (
                <p className="text-xs text-orange-500 mt-1">
                  分配确认人: {assignments[0].assignedByName} (后厨主管)
                </p>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">完整时间线</h4>
              <span className="text-xs text-gray-400">责任追溯</span>
            </div>
            <div className="relative">
              <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-4">
                {timelineEvents.map((event, index) => (
                  <div key={event.id} className="relative pl-10">
                    <div className={`absolute left-0 w-10 h-10 rounded-full flex items-center justify-center ${event.bgColor} ${event.iconColor} z-10`}>
                      {event.icon}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800">{event.title}</p>
                        <span className="text-xs text-gray-400">{formatDateTime(event.timestamp)}</span>
                      </div>
                      {event.description && (
                        <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">操作人: {event.operatorName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-400 mb-3 text-center">
            导出、附件、通知为模拟实现
          </div>
          <div className="flex flex-wrap gap-2">
            {queue.status === 'waiting' && actions.canAssign && (
              <button
                onClick={() => setShowAssignModal(true)}
                disabled={availableTables.length === 0 || processing}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认桌台分配
              </button>
            )}
            {queue.status === 'waiting' && actions.canCancel && (
              <button
                onClick={() => handleUpdateStatus('cancelled')}
                disabled={processing}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50"
              >
                取消排号
              </button>
            )}
            {queue.status === 'seated' && actions.canCheckout && (
              <button
                onClick={() => handleUpdateStatus('completed')}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all disabled:opacity-50"
              >
                完成结账
              </button>
            )}
            {!actions.canAssign && !actions.canCheckout && !actions.canCancel && queue.status === 'waiting' && (
              <div className="flex-1 px-4 py-2 text-center text-gray-400 text-sm">
                当前角色无操作权限
              </div>
            )}
          </div>
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">选择桌台 (后厨主管确认)</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {availableTables.map((table) => (
                <div
                  key={table.id}
                  onClick={() => setSelectedTableId(table.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTableId === table.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-800">{table.name}</span>
                      <span className="ml-2 text-sm text-gray-500">{table.capacity}人桌</span>
                    </div>
                    {selectedTableId === table.id && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  {table.position && (
                    <p className="text-xs text-gray-400 mt-1">{table.position}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleAssignTable}
                disabled={!selectedTableId || processing}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50"
              >
                {processing ? '确认中...' : '确认分配'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
