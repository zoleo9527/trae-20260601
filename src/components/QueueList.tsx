import React, { useState } from 'react';
import { Clock, Users, Phone, ChevronRight, Plus, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { Queue } from '../types';
import { queueApi } from '../api';
import { useStore } from '../store';

interface QueueListProps {
  queues: Queue[];
  onSelectQueue: (queueId: string) => void;
}

const statusConfig: Record<Queue['status'], { label: string; color: string; bgColor: string }> = {
  waiting: { label: '等待中', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  seated: { label: '已入座', color: 'text-green-600', bgColor: 'bg-green-100' },
  completed: { label: '已完成', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  cancelled: { label: '已取消', color: 'text-red-600', bgColor: 'bg-red-100' },
};

const roleLabels: Record<string, string> = {
  manager: '前厅经理',
  chef: '后厨主管',
  cashier: '收银员',
  admin: '管理员',
};

const rolePermissions: Record<string, string> = {
  manager: '可创建排号、取消排号',
  chef: '可确认桌台分配',
  cashier: '可完成结账释放桌台',
  admin: '所有权限',
};

export const QueueList: React.FC<QueueListProps> = ({ queues, onSelectQueue }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState(1);
  const [adding, setAdding] = useState(false);
  
  const user = useStore((state) => state.user);
  const addQueue = useStore((state) => state.addQueue);

  const handleAddQueue = async () => {
    if (!customerName || !user) return;
    
    setAdding(true);
    try {
      const queue = await queueApi.createQueue(customerName, phone, partySize, user.id);
      addQueue(queue);
      setCustomerName('');
      setPhone('');
      setPartySize(1);
      setShowAddModal(false);
    } catch (err) {
      console.error('创建排号失败:', err);
    } finally {
      setAdding(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const waitingQueues = queues.filter((q) => q.status === 'waiting');
  const seatedQueues = queues.filter((q) => q.status === 'seated');
  const completedQueues = queues.filter((q) => q.status === 'completed' || q.status === 'cancelled');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-bold text-gray-800">等位排号</h2>
            <p className="text-sm text-gray-500">当前等待人数: {waitingQueues.length}</p>
          </div>
          {(user?.role === 'manager' || user?.role === 'admin') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">新增排号</span>
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">
            {roleLabels[user?.role || 'admin']}
          </span>
          <span>{rolePermissions[user?.role || 'admin']}</span>
        </div>
      </div>

      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
        {waitingQueues.length > 0 && (
          <div>
            <div className="px-4 py-2 bg-yellow-50">
              <span className="text-sm font-medium text-yellow-700">等待中 ({waitingQueues.length})</span>
            </div>
            {waitingQueues.map((queue) => (
              <div
                key={queue.id}
                onClick={() => onSelectQueue(queue.id)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-800">{queue.customerName}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${statusConfig[queue.status].bgColor} ${statusConfig[queue.status].color}`}>
                        {statusConfig[queue.status].label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{queue.partySize}人</span>
                      </span>
                      {queue.phone && (
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{queue.phone}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(queue.createdAt)}</span>
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">提交人: {queue.submittedByName}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
              </div>
            ))}
          </div>
        )}

        {seatedQueues.length > 0 && (
          <div>
            <div className="px-4 py-2 bg-green-50">
              <span className="text-sm font-medium text-green-700">已入座 ({seatedQueues.length})</span>
            </div>
            {seatedQueues.map((queue) => (
              <div
                key={queue.id}
                onClick={() => onSelectQueue(queue.id)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-800">{queue.customerName}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${statusConfig[queue.status].bgColor} ${statusConfig[queue.status].color}`}>
                        {statusConfig[queue.status].label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{queue.partySize}人</span>
                      </span>
                      <span className="text-orange-600">桌台: {queue.assignedTableName}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
              </div>
            ))}
          </div>
        )}

        {completedQueues.length > 0 && (
          <div>
            <div className="px-4 py-2 bg-gray-50">
              <span className="text-sm font-medium text-gray-600">已完成 ({completedQueues.length})</span>
            </div>
            {completedQueues.map((queue) => (
              <div
                key={queue.id}
                onClick={() => onSelectQueue(queue.id)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-all flex items-center justify-between group opacity-70"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${queue.status === 'cancelled' ? 'bg-red-100' : 'bg-gray-100'}`}>
                    {queue.status === 'cancelled' ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600 line-through">{queue.customerName}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${statusConfig[queue.status].bgColor} ${statusConfig[queue.status].color}`}>
                        {statusConfig[queue.status].label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                      <span>{queue.partySize}人</span>
                      {queue.assignedTableName && <span>桌台: {queue.assignedTableName}</span>}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
              </div>
            ))}
          </div>
        )}

        {queues.length === 0 && (
          <div className="p-8 text-center">
            <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无排号记录</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all text-sm"
            >
              创建第一个排号
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">新增排号</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">顾客姓名 *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="请输入顾客姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="请输入联系电话"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用餐人数 *</label>
                <select
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>{num}人</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleAddQueue}
                disabled={!customerName || adding}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all disabled:opacity-50"
              >
                {adding ? '添加中...' : '确认添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
