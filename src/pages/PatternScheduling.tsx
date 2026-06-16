import React, { useState } from 'react';
import { Search, Filter, Check, X, Play, RefreshCw, User, Clock, MessageSquare, Eye, AlertTriangle, Clock8 } from 'lucide-react';
import { useStore } from '../store';
import { PATTERN_STATUS_MAP, PatternStatus, UserRole } from '../types';
import { formatDate, formatDateTime } from '../utils/helpers';
import StatusBadge from '../components/StatusBadge';

interface PatternSchedulingProps {
  onViewOrder: (orderId: string) => void;
}

type QuickFilterType = 'all' | 'my_pending' | 'my_rejected';

const PatternScheduling: React.FC<PatternSchedulingProps> = ({ onViewOrder }) => {
  const { patternTasks, users, currentUser, assignPatternTask, updatePatternStatus, addReminder, getPatternHistory, getReminders } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PatternStatus | 'all'>('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [remarkModal, setRemarkModal] = useState<{ taskId: string; action: string } | null>(null);
  const [remarkText, setRemarkText] = useState('');
  const [reminderModal, setReminderModal] = useState<string | null>(null);
  const [reminderText, setReminderText] = useState('');
  const [detailModal, setDetailModal] = useState<string | null>(null);

  const patternMakers = users.filter(u => u.role === 'pattern_maker');

  const getLatestRejectReason = (taskId: string) => {
    const history = getPatternHistory(taskId);
    const rejectRecords = history.filter(h => h.status_to === 'rejected');
    return rejectRecords.length > 0 ? rejectRecords[0].remark : null;
  };

  const getLatestReminderTime = (taskId: string) => {
    const reminders = getReminders(taskId, 'pattern');
    return reminders.length > 0 ? reminders[0].reminder_time : null;
  };

  const getUrgencyLevel = (task: typeof patternTasks[0]) => {
    const hasReject = getLatestRejectReason(task.id) !== null;
    const hasReminder = getLatestReminderTime(task.id) !== null;
    const isInProgress = task.status === 'in_progress';
    const isRejected = task.status === 'rejected';
    
    if (isRejected && hasReject) return 5;
    if (isInProgress && hasReject) return 4;
    if (isRejected) return 3;
    if (isInProgress && hasReminder) return 2;
    if (hasReminder) return 1;
    return 0;
  };

  const myPendingCount = patternTasks.filter(t => 
    t.assignee_id === currentUser.id && t.status === 'in_progress'
  ).length;

  const myRejectedCount = patternTasks.filter(t => 
    t.assignee_id === currentUser.id && t.status === 'rejected'
  ).length;

  const filteredTasks = patternTasks.filter(task => {
    const matchesSearch = task.customer_name.includes(searchTerm) ||
      task.task_name.includes(searchTerm) ||
      task.order_id.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    
    let matchesQuickFilter = true;
    if (quickFilter === 'my_pending') {
      matchesQuickFilter = task.assignee_id === currentUser.id && task.status === 'in_progress';
    } else if (quickFilter === 'my_rejected') {
      matchesQuickFilter = task.assignee_id === currentUser.id && task.status === 'rejected';
    }
    
    return matchesSearch && matchesStatus && matchesQuickFilter;
  }).sort((a, b) => {
    const urgencyA = getUrgencyLevel(a);
    const urgencyB = getUrgencyLevel(b);
    return urgencyB - urgencyA;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredTasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTasks.map(task => task.id));
    }
  };

  const handleAssign = (taskId: string) => {
    const task = patternTasks.find(t => t.id === taskId);
    if (task) {
      setSelectedAssignee(task.assignee_id || '');
    }
    setAssignModal(taskId);
  };

  const confirmAssign = () => {
    if (!assignModal || !selectedAssignee) return;
    const assignee = users.find(u => u.id === selectedAssignee);
    if (assignee) {
      assignPatternTask(assignModal, selectedAssignee, assignee.name);
    }
    setAssignModal(null);
    setSelectedAssignee('');
  };

  const handleAction = (taskId: string, action: 'start' | 'complete' | 'reject') => {
    setRemarkModal({ taskId, action });
  };

  const confirmAction = () => {
    if (!remarkModal) return;
    const newStatus: PatternStatus = remarkModal.action === 'start' ? 'in_progress' :
      remarkModal.action === 'complete' ? 'completed' : 'rejected';
    updatePatternStatus(remarkModal.taskId, newStatus, remarkText);
    setRemarkModal(null);
    setRemarkText('');
  };

  const handleReminder = (taskId: string) => {
    setReminderModal(taskId);
  };

  const confirmReminder = () => {
    if (!reminderModal) return;
    addReminder(reminderModal, 'pattern', reminderText);
    setReminderModal(null);
    setReminderText('');
  };

  const batchAssign = () => {
    if (!selectedAssignee) return;
    const assignee = users.find(u => u.id === selectedAssignee);
    if (assignee) {
      selectedIds.forEach(id => {
        assignPatternTask(id, selectedAssignee, assignee.name);
      });
    }
    setSelectedIds([]);
  };

  const batchReminder = () => {
    if (!reminderText.trim()) return;
    selectedIds.forEach(id => {
      addReminder(id, 'pattern', reminderText);
    });
    setSelectedIds([]);
    setReminderText('');
  };

  const statusOptions: { value: PatternStatus | 'all'; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待分配' },
    { value: 'in_progress', label: '打版中' },
    { value: 'completed', label: '已完成' },
    { value: 'rejected', label: '已退回' },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="font-semibold text-gray-800">打版排期管理</h3>
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setQuickFilter('all')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    quickFilter === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setQuickFilter('my_pending')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center ${
                    quickFilter === 'my_pending' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Clock8 className="w-4 h-4 mr-1" />
                  我的待处理
                  <span className={`ml-1.5 px-2 py-0.5 text-xs rounded-full ${
                    myPendingCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {myPendingCount}
                  </span>
                </button>
                <button
                  onClick={() => setQuickFilter('my_rejected')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center ${
                    quickFilter === 'my_rejected' ? 'bg-white shadow-sm text-red-600' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  我的已退回
                  <span className={`ml-1.5 px-2 py-0.5 text-xs rounded-full ${
                    myRejectedCount > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {myRejectedCount}
                  </span>
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索客户、任务名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as PatternStatus | 'all')}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <span className="text-sm text-blue-700">已选择 {selectedIds.length} 条记录</span>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择版师</option>
                  {patternMakers.map(maker => (
                    <option key={maker.id} value={maker.id}>
                      {maker.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={batchAssign}
                  disabled={!selectedAssignee}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  批量分配
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="批量催单备注..."
                  value={reminderText}
                  onChange={(e) => setReminderText(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={batchReminder}
                  disabled={!reminderText.trim()}
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  催单
                </button>
              </div>
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消选择
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredTasks.length && filteredTasks.length > 0}
                    onChange={selectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单信息</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">任务名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">责任人</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">排期日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最近退回原因</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最近催单时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTasks.map(task => {
                const history = getPatternHistory(task.id);
                const reminders = getReminders(task.id, 'pattern');
                return (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(task.id)}
                        onChange={() => toggleSelect(task.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => onViewOrder(task.order_id)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {task.order_id}
                      </button>
                      <p className="text-sm text-gray-500 mt-1">{task.customer_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{task.task_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={task.status} label={PATTERN_STATUS_MAP[task.status]} />
                    </td>
                    <td className="px-6 py-4">
                      {task.assignee_name ? (
                        <span className="text-sm text-gray-600">{task.assignee_name}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(task.scheduled_date)}</td>
                    <td className="px-6 py-4 max-w-xs">
                      {(() => {
                        const rejectReason = getLatestRejectReason(task.id);
                        if (rejectReason) {
                          return (
                            <div className="flex items-center">
                              <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />
                              <p className="text-sm text-red-600 truncate" title={rejectReason}>
                                {rejectReason}
                              </p>
                            </div>
                          );
                        }
                        return <span className="text-sm text-gray-400">-</span>;
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const latestReminder = getLatestReminderTime(task.id);
                        if (latestReminder) {
                          return (
                            <div className="flex items-center">
                              <Clock8 className="w-4 h-4 mr-1 text-yellow-500" />
                              <span className="text-sm text-yellow-700">{formatDateTime(latestReminder)}</span>
                            </div>
                          );
                        }
                        return <span className="text-sm text-gray-400">-</span>;
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setDetailModal(task.id)}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition-colors flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          详情
                        </button>
                        {task.status === 'pending' && (
                          <button
                            onClick={() => handleAssign(task.id)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                          >
                            <User className="w-4 h-4 mr-1" />
                            分配
                          </button>
                        )}
                        {task.status === 'in_progress' && (
                          <>
                            <button
                              onClick={() => handleAction(task.id, 'complete')}
                              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              完成
                            </button>
                            <button
                              onClick={() => handleAction(task.id, 'reject')}
                              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center"
                            >
                              <X className="w-4 h-4 mr-1" />
                              退回
                            </button>
                            <button
                              onClick={() => handleReminder(task.id)}
                              className="px-3 py-1.5 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors flex items-center"
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              催单
                            </button>
                          </>
                        )}
                        {task.status === 'rejected' && (
                          <button
                            onClick={() => handleAction(task.id, 'start')}
                            className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors flex items-center"
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            重新打版
                          </button>
                        )}
                        {task.status === 'completed' && (
                          <>
                            <span className="text-sm text-gray-400">已完成</span>
                            <button
                              onClick={() => handleReminder(task.id)}
                              className="px-3 py-1.5 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors flex items-center"
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              催单
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {assignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">分配打版任务</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">选择版师</label>
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择版师</option>
                {patternMakers.map(maker => (
                  <option key={maker.id} value={maker.id}>
                    {maker.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => { setAssignModal(null); setSelectedAssignee(''); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmAssign}
                disabled={!selectedAssignee}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认分配
              </button>
            </div>
          </div>
        </div>
      )}

      {remarkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {remarkModal.action === 'start' ? '开始打版' : 
               remarkModal.action === 'complete' ? '完成打版' : '退回打版'}
            </h3>
            <textarea
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              placeholder="请输入备注..."
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
            />
            <div className="flex items-center justify-end space-x-3 mt-4">
              <button
                onClick={() => { setRemarkModal(null); setRemarkText(''); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmAction}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  remarkModal.action === 'complete' ? 'bg-green-600 hover:bg-green-700' :
                  remarkModal.action === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {reminderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">发送催单提醒</h3>
            <textarea
              value={reminderText}
              onChange={(e) => setReminderText(e.target.value)}
              placeholder="请输入催单内容..."
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
            />
            <div className="flex items-center justify-end space-x-3 mt-4">
              <button
                onClick={() => { setReminderModal(null); setReminderText(''); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmReminder}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                发送催单
              </button>
            </div>
          </div>
        </div>
      )}

      {detailModal && (() => {
        const task = patternTasks.find(t => t.id === detailModal);
        if (!task) return null;
        const history = getPatternHistory(task.id);
        const reminders = getReminders(task.id, 'pattern');
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-[500px] max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">打版任务详情</h3>
                <button
                  onClick={() => setDetailModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">订单号</p>
                    <p className="font-medium text-gray-800 mt-1">{task.order_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">客户姓名</p>
                    <p className="font-medium text-gray-800 mt-1">{task.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">任务名称</p>
                    <p className="font-medium text-gray-800 mt-1">{task.task_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">状态</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(task.status)}`}>
                      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current"></span>
                      {PATTERN_STATUS_MAP[task.status]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">责任人</p>
                    <p className="font-medium text-gray-800 mt-1">{task.assignee_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">排期日期</p>
                    <p className="font-medium text-gray-800 mt-1">{formatDate(task.scheduled_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">创建时间</p>
                    <p className="font-medium text-gray-800 mt-1">{formatDateTime(task.created_at)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {(() => {
                    const rejectReason = getLatestRejectReason(task.id);
                    if (rejectReason) {
                      return (
                        <div className="bg-red-50 rounded-lg p-3">
                          <p className="text-sm text-red-600 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            最近退回原因
                          </p>
                          <p className="text-sm text-red-700 mt-1">{rejectReason}</p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {(() => {
                    const latestReminder = getLatestReminderTime(task.id);
                    if (latestReminder) {
                      return (
                        <div className="bg-yellow-50 rounded-lg p-3">
                          <p className="text-sm text-yellow-600 flex items-center">
                            <Clock8 className="w-4 h-4 mr-2" />
                            最近催单时间
                          </p>
                          <p className="text-sm text-yellow-700 mt-1">{formatDateTime(latestReminder)}</p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                
                {task.remark && (
                  <div>
                    <p className="text-sm text-gray-500">备注</p>
                    <p className="text-gray-600 mt-1">{task.remark}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100">
                  <h4 className="font-medium text-gray-800 flex items-center mb-3">
                    <Clock className="w-4 h-4 mr-2 text-purple-500" />
                    状态变更历史
                  </h4>
                  {history.length === 0 ? (
                    <p className="text-gray-500 text-sm">暂无变更记录</p>
                  ) : (
                    <div className="space-y-3">
                      {history.map((record, index) => (
                        <div key={record.id} className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${index === 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(record.status_to)}`}>
                                {PATTERN_STATUS_MAP[record.status_to]}
                              </span>
                              {record.status_from && (
                                <span className="text-sm text-gray-400">
                                  由 {PATTERN_STATUS_MAP[record.status_from]} 变更
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {record.operator_name} | {formatDateTime(record.change_time)}
                            </p>
                            {record.remark && (
                              <p className="text-sm text-gray-600 mt-1 bg-gray-50 px-3 py-2 rounded">
                                {record.remark}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {reminders.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="font-medium text-gray-800 flex items-center mb-3">
                      <MessageSquare className="w-4 h-4 mr-2 text-yellow-500" />
                      催单记录
                    </h4>
                    <div className="space-y-3">
                      {reminders.map(reminder => (
                        <div key={reminder.id} className="bg-yellow-50 p-3 rounded-lg">
                          <p className="text-sm text-yellow-800">{reminder.remark}</p>
                          <p className="text-xs text-yellow-600 mt-1">
                            {reminder.operator_name} | {formatDateTime(reminder.reminder_time)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default PatternScheduling;