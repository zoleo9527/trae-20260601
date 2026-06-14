import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { STATUS_LABELS, DUE_DILIGENCE_STATUS_LABELS } from '../types';
import { api } from '../api';

export default function OperationManagerPage() {
  const { customers, dueDiligences } = useApp();
  const [showHandoff, setShowHandoff] = useState(false);

  const pendingCustomers = customers.filter(c => c.status === 'pending' || c.status === 'processing');
  const completedCustomers = customers.filter(c => c.status === 'completed');
  const rejectedCustomers = customers.filter(c => c.status === 'rejected');
  const pendingDueDiligences = dueDiligences.filter(d => d.status === 'pending' || d.status === 'processing');
  const submittedDueDiligences = dueDiligences.filter(d => d.status === 'submitted');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">运营主管工作台</h1>
        <p className="text-gray-500 mt-1">全局监控和跨流程协调</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">客户总数</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{customers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">待处理客户</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{pendingCustomers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">已完成客户</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{completedCustomers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">已驳回客户</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{rejectedCustomers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">待处理尽调</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{pendingDueDiligences.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">待审核尽调</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{submittedDueDiligences.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">快速操作</h2>
          <div className="space-y-3">
            <button
              onClick={() => setShowHandoff(true)}
              className="w-full bg-blue-600 text-white rounded-lg p-3 hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span>交班管理</span>
            </button>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-4 flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>异常监控</span>
          </h2>
          <div className="space-y-2">
            {rejectedCustomers.length > 0 && (
              <div className="bg-white rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-gray-700">被驳回的客户</span>
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">{rejectedCustomers.length}</span>
              </div>
            )}
            {pendingDueDiligences.length > 0 && (
              <div className="bg-white rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-gray-700">待处理的尽调</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm">{pendingDueDiligences.length}</span>
              </div>
            )}
            {rejectedCustomers.length === 0 && pendingDueDiligences.length === 0 && (
              <p className="text-sm text-gray-600 text-center py-4">暂无异常情况</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">所有客户</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {customers.slice(0, 10).map((customer) => (
              <div key={customer.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{customer.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {customer.business_type} · {customer.assigned_to_name || '未分配'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    customer.status === 'completed' ? 'bg-green-100 text-green-700' :
                    customer.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {STATUS_LABELS[customer.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">所有尽调补件</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {dueDiligences.slice(0, 10).map((dueDiligence) => (
              <div key={dueDiligence.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {dueDiligence.customer_name || `客户 #${dueDiligence.customer_id}`}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      #{dueDiligence.id} · {dueDiligence.assigned_to_name || '未分配'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    dueDiligence.status === 'completed' ? 'bg-green-100 text-green-700' :
                    dueDiligence.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    dueDiligence.status === 'submitted' ? 'bg-purple-100 text-purple-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {DUE_DILIGENCE_STATUS_LABELS[dueDiligence.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showHandoff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <HandoffModal onClose={() => setShowHandoff(false)} />
        </div>
      )}
    </div>
  );
}

function HandoffModal({ onClose }: { onClose: () => void }) {
  const { user } = useApp();
  const [pendingTasks, setPendingTasks] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [handoffs, setHandoffs] = useState<any[]>([]);
  const [selectedHandoff, setSelectedHandoff] = useState<any>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  React.useEffect(() => {
    loadPendingTasks();
    loadUsers();
    loadHandoffs();
  }, [activeTab]);

  const loadPendingTasks = async () => {
    const res = await api.handoffs.getPending();
    if (res.success && res.data) {
      setPendingTasks(res.data);
    }
  };

  const loadUsers = async () => {
    const res = await api.users.list();
    if (res.success && res.data) {
      setUsers(res.data.filter((u: any) => u.id !== user?.id));
    }
  };

  const loadHandoffs = async () => {
    const res = await api.handoffs.list();
    if (res.success && res.data) {
      setHandoffs(res.data);
    }
  };

  const handleConfirm = async () => {
    if (!user || !selectedUserId) return;
    setLoading(true);
    try {
      const tasks = [
        ...(pendingTasks?.customers || []).map((c: any) => ({
          task_type: 'customer',
          task_id: c.task_id,
          task_description: c.task_description,
        })),
        ...(pendingTasks?.dueDiligences || []).map((d: any) => ({
          task_type: 'due_diligence',
          task_id: d.task_id,
          task_description: d.task_description,
        })),
      ];

      await api.handoffs.create({
        type: 'shift',
        from_user: user.id,
        to_user: selectedUserId,
        tasks,
      });
      loadPendingTasks();
      loadHandoffs();
      setSelectedUserId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (handoffId: number) => {
    setLoading(true);
    try {
      await api.handoffs.confirm(handoffId);
      loadHandoffs();
      setShowReceiveModal(false);
      setSelectedHandoff(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">交班管理</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'create' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            创建交班
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            历史记录
          </button>
        </div>
      </div>

      {activeTab === 'create' && (
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              当前有 {pendingTasks?.customers?.length || 0} 个待处理客户和 {pendingTasks?.dueDiligences?.length || 0} 个待处理尽调补件
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">选择接班人</label>
            <select
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择接班人</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.display_name} ({u.role === 'lobby_manager' ? '大堂经理' : u.role === 'account_manager' ? '客户经理' : '运营主管'})</option>
              ))}
            </select>
          </div>

          {pendingTasks?.customers && pendingTasks.customers.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">待交接客户</h3>
              <div className="space-y-2">
                {pendingTasks.customers.map((task: any, index: number) => (
                  <div key={index} className="bg-white rounded-lg p-3">
                    <p className="text-sm text-gray-700">{task.task_description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingTasks?.dueDiligences && pendingTasks.dueDiligences.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">待交接尽调补件</h3>
              <div className="space-y-2">
                {pendingTasks.dueDiligences.map((task: any, index: number) => (
                  <div key={index} className="bg-white rounded-lg p-3">
                    <p className="text-sm text-gray-700">{task.task_description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!pendingTasks?.customers?.length && !pendingTasks?.dueDiligences?.length) && (
            <div className="text-center text-gray-500 py-12">
              <p>暂无待交接任务</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="p-6">
          {handoffs.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p>暂无交班记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {handoffs.map((handoff) => (
                <div
                  key={handoff.id}
                  className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    setSelectedHandoff(handoff);
                    if (handoff.status === 'pending') {
                      setShowReceiveModal(true);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-800">交班 #{handoff.id}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          handoff.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          handoff.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {handoff.status === 'confirmed' ? '已确认' : handoff.status === 'pending' ? '待接收' : '已取消'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {handoff.from_user_name} → {handoff.to_user_name} · {new Date(handoff.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
          <button
            onClick={handleConfirm}
            disabled={loading || !selectedUserId || (!pendingTasks?.customers?.length && !pendingTasks?.dueDiligences?.length)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            确认交班
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            关闭
          </button>
        </div>
      )}

      {showReceiveModal && selectedHandoff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">确认接收交班</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                确认接收来自 <span className="font-medium">{selectedHandoff.from_user_name}</span> 的交班任务吗？
              </p>
              {selectedHandoff.tasks && selectedHandoff.tasks.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4 max-h-40 overflow-y-auto">
                  <p className="text-sm font-medium text-gray-700 mb-2">包含任务：</p>
                  <div className="space-y-1">
                    {selectedHandoff.tasks.map((task: any) => (
                      <p key={task.id} className="text-sm text-gray-600">{task.task_description}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReceiveModal(false);
                  setSelectedHandoff(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={() => handleReceive(selectedHandoff.id)}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                确认接收
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
