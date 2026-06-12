import { AlertTriangle, CheckCircle, Clock, FileText, MapPin, RotateCcw, Send, User, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { useWorkOrderStore } from '../store/workOrderStore';
import { formatFullDate, getPriorityName, getRoleName, getStatusName } from '../utils/format';
import { SatisfactionModal } from './SatisfactionModal';

export const Sidebar = () => {
  const { selectedOrder, selectOrder, updateOrderStatus, addOperation, reassignOrder } = useWorkOrderStore();
  const [showSatisfaction, setShowSatisfaction] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [newAssignee, setNewAssignee] = useState('');

  if (!selectedOrder) {
    return (
      <div className="w-96 bg-gray-50 border-l border-gray-200 flex flex-col items-center justify-center text-gray-400">
        <FileText className="w-16 h-16 mb-4" />
        <p className="text-center">选择工单查看详情</p>
      </div>
    );
  }

  const handleConfirm = () => {
    if (selectedOrder.status === 'processing') {
      updateOrderStatus(selectedOrder.id, 'completed');
      addOperation(selectedOrder.id, {
        id: `H${Date.now()}`,
        operator: '张主管',
        operatorRole: 'admin',
        action: '确认完成',
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleReject = () => {
    updateOrderStatus(selectedOrder.id, 'rejected');
    addOperation(selectedOrder.id, {
      id: `H${Date.now()}`,
      operator: '张主管',
      operatorRole: 'admin',
      action: '退回工单',
      timestamp: new Date().toISOString(),
    });
  };

  const handleProcess = () => {
    updateOrderStatus(selectedOrder.id, 'processing');
    addOperation(selectedOrder.id, {
      id: `H${Date.now()}`,
      operator: selectedOrder.assignee || '维修师傅',
      operatorRole: 'repairman',
      action: '开始处理',
      timestamp: new Date().toISOString(),
    });
  };

  const handleContinueProcess = () => {
    updateOrderStatus(selectedOrder.id, 'processing');
    addOperation(selectedOrder.id, {
      id: `H${Date.now()}`,
      operator: selectedOrder.assignee || '维修师傅',
      operatorRole: 'repairman',
      action: '继续处理',
      timestamp: new Date().toISOString(),
    });
  };

  const handleReassignSubmit = () => {
    if (newAssignee.trim()) {
      reassignOrder(selectedOrder.id, newAssignee.trim(), '张主管');
      setShowReassign(false);
      setNewAssignee('');
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600',
    processing: 'bg-blue-100 text-blue-600',
    completed: 'bg-green-100 text-green-600',
    overdue: 'bg-red-100 text-red-600',
    rejected: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">工单详情</h2>
        <button
          onClick={() => selectOrder(null)}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-start justify-between mb-4">
          <span className="text-sm text-gray-500 font-mono">{selectedOrder.id}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedOrder.status]}`}>
            {getStatusName(selectedOrder.status)}
          </span>
        </div>

        <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedOrder.title}</h3>

        {selectedOrder.responsibilityUnclear && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-amber-800">责任不清：超时工单与满意度回访之间的责任边界需要确认</span>
          </div>
        )}

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700">{selectedOrder.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700">
              提交人：{selectedOrder.submitter} ({getRoleName(selectedOrder.submitterRole)})
            </span>
          </div>
          {selectedOrder.assignee && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">
                处理人：{selectedOrder.assignee} ({getRoleName(selectedOrder.assigneeRole || 'repairman')})
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700">创建时间：{formatFullDate(selectedOrder.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700">截止时间：{formatFullDate(selectedOrder.dueTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              selectedOrder.priority === 'high' ? 'bg-red-100 text-red-600' :
              selectedOrder.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
              'bg-gray-100 text-gray-600'
            }`}>
              {getPriorityName(selectedOrder.priority)}优先级
            </span>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">问题描述</h4>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedOrder.description}</p>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">处理历史</h4>
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
            {selectedOrder.history.map((record) => (
              <div key={record.id} className="relative pl-8 pb-4">
                <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-primary border-2 border-white" />
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-900">{record.operator}</span>
                    <span className="text-gray-500">({getRoleName(record.operatorRole)})</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{record.action}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatFullDate(record.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedOrder.satisfaction && (
          <div className="mb-4 p-4 bg-green-50 rounded-lg">
            <h4 className="text-sm font-medium text-green-800 mb-2">满意度评价</h4>
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < (selectedOrder.satisfaction?.score ?? 0) ? 'text-yellow-500' : 'text-gray-300'}>
                  ★
                </span>
              ))}
              <span className="text-sm text-gray-600 ml-2">{selectedOrder.satisfaction.score}分</span>
            </div>
            <p className="text-sm text-gray-600">{selectedOrder.satisfaction.comment}</p>
            <p className="text-xs text-gray-400 mt-1">
              评价人：{selectedOrder.satisfaction.operator} · {formatFullDate(selectedOrder.satisfaction.createdAt)}
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          {selectedOrder.status === 'pending' && (
            <button
              onClick={handleProcess}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <CheckCircle size={16} />
              开始处理
            </button>
          )}
          {selectedOrder.status === 'processing' && (
            <>
              <button
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <CheckCircle size={16} />
                确认完成
              </button>
              <button
                onClick={handleReject}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <RotateCcw size={16} />
                退回
              </button>
            </>
          )}
          {selectedOrder.status === 'completed' && !selectedOrder.satisfaction && (
            <button
              onClick={() => setShowSatisfaction(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Send size={16} />
              发起回访
            </button>
          )}
          {selectedOrder.status === 'rejected' && (
            <button
              onClick={handleProcess}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <RotateCcw size={16} />
              重新提交
            </button>
          )}
          {selectedOrder.status === 'overdue' && (
            <>
              <button
                onClick={handleContinueProcess}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <CheckCircle size={16} />
                继续处理
              </button>
              <button
                onClick={() => setShowReassign(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <UserPlus size={16} />
                重新派单
              </button>
            </>
          )}
        </div>
      </div>

      {showSatisfaction && (
        <SatisfactionModal
          orderId={selectedOrder.id}
          onClose={() => setShowSatisfaction(false)}
        />
      )}

      {showReassign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">重新派单</h3>
              <button
                onClick={() => {
                  setShowReassign(false);
                  setNewAssignee('');
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">派单人</label>
              <input
                type="text"
                value="张主管"
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">处理人</label>
              <input
                type="text"
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                placeholder="请输入处理人姓名"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReassign(false);
                  setNewAssignee('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReassignSubmit}
                disabled={!newAssignee.trim()}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  newAssignee.trim()
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                确认派单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
