import React, { useState, useEffect } from 'react';
import { X, Users, Phone, Clock, Utensils, CheckCircle, XCircle, ArrowRight, Calendar } from 'lucide-react';
import { Queue, Table } from '../types';
import { queueApi, tableApi } from '../api';
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

export const QueueDetailModal: React.FC<QueueDetailModalProps> = ({ queue, tables, onClose }) => {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const user = useStore((state) => state.user);
  const updateQueue = useStore((state) => state.updateQueue);
  const updateTableState = useStore((state) => state.updateTable);

  const availableTables = tables.filter((t) => t.status === 'available');

  const handleAssignTable = async () => {
    if (!selectedTableId || !queue || !user) return;
    
    setProcessing(true);
    try {
      const updatedQueue = await queueApi.assignTable(queue.id, selectedTableId, user.id);
      updateQueue(updatedQueue);
      
      const table = await tableApi.updateTable(selectedTableId, 'occupied', undefined, undefined, undefined, user.id);
      updateTableState(table);
      
      setShowAssignModal(false);
      setSelectedTableId(null);
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
            <span className="text-sm text-gray-800">{queue.submittedByName}</span>
          </div>

          {queue.assignedTableId && (
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-orange-600 mb-1">
                <Utensils className="w-4 h-4" />
                <span className="text-sm">已分配桌台</span>
              </div>
              <span className="text-lg font-bold text-orange-600">{queue.assignedTableName}</span>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">操作历史</h4>
            <div className="space-y-2">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">创建排号</p>
                  <p className="text-xs text-gray-500">{queue.submittedByName} - {formatDateTime(queue.createdAt)}</p>
                </div>
              </div>
              {queue.assignedTableId && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">已分配桌台 {queue.assignedTableName}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(queue.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {queue.status === 'waiting' && (
              <>
                <button
                  onClick={() => setShowAssignModal(true)}
                  disabled={availableTables.length === 0 || processing}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  分配桌台
                </button>
                <button
                  onClick={() => handleUpdateStatus('cancelled')}
                  disabled={processing}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50"
                >
                  取消排号
                </button>
              </>
            )}
            {queue.status === 'seated' && (
              <>
                <button
                  onClick={() => handleUpdateStatus('completed')}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all disabled:opacity-50"
                >
                  完成结账
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">选择桌台</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {availableTables.map((table) => (
                <div
                  key={table.id}
                  onClick={() => setSelectedTableId(table.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTableId === table.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-800">{table.name}</span>
                      <span className="ml-2 text-sm text-gray-500">{table.capacity}人桌</span>
                    </div>
                    {selectedTableId === table.id && (
                      <CheckCircle className="w-5 h-5 text-orange-500" />
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
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all disabled:opacity-50"
              >
                {processing ? '分配中...' : '确认分配'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
