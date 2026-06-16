import { ArrowLeft, Calendar, CheckCircle, Clock, Edit3, FileText, MessageSquare, Phone, Scissors, User } from 'lucide-react';
import React, { useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import { useStore } from '../store';
import { FABRIC_STATUS_MAP, ORDER_STATUS_MAP, OrderStatus, PATTERN_STATUS_MAP } from '../types';
import { formatDate, formatDateTime } from '../utils/helpers';

interface OrderDetailProps {
  orderId: string;
  onBack: () => void;
}

const OrderDetail: React.FC<OrderDetailProps> = ({ orderId, onBack }) => {
  const { getOrderById, getOrderHistory, getFabricByOrderId, getFabricHistory, getPatternTaskByOrderId, getPatternHistory, getReminders, updateOrderStatus, currentUser } = useStore();
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remarkText, setRemarkText] = useState('');
  const [nextStatus, setNextStatus] = useState<OrderStatus | null>(null);

  const order = getOrderById(orderId);
  const history = getOrderHistory(orderId);
  const fabric = getFabricByOrderId(orderId);
  const fabricHistory = fabric ? getFabricHistory(fabric.id) : [];
  const fabricReminders = fabric ? getReminders(fabric.id, 'fabric') : [];
  const patternTask = getPatternTaskByOrderId(orderId);
  const patternHistory = patternTask ? getPatternHistory(patternTask.id) : [];
  const patternReminders = patternTask ? getReminders(patternTask.id, 'pattern') : [];

  if (!order) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-gray-500">订单不存在</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  const getNextStatuses = (currentStatus: OrderStatus): { status: OrderStatus; label: string }[] => {
    const transitions: Record<OrderStatus, { status: OrderStatus; label: string }[]> = {
      pending: [{ status: 'measured', label: '量体完成' }],
      measured: [{ status: 'fabric_reserved', label: '面料预留' }],
      fabric_reserved: [{ status: 'pattern_in_progress', label: '开始打版' }],
      pattern_in_progress: [{ status: 'fitting', label: '安排试衣' }],
      fitting: [{ status: 'completed', label: '订单完成' }],
      completed: [],
    };
    return transitions[currentStatus];
  };

  const nextStatuses = getNextStatuses(order.status);

  const handleStatusChange = (status: OrderStatus) => {
    setNextStatus(status);
    setShowRemarkModal(true);
  };

  const confirmStatusChange = () => {
    if (!nextStatus) return;
    updateOrderStatus(orderId, nextStatus, currentUser.id, currentUser.name, remarkText);
    setShowRemarkModal(false);
    setRemarkText('');
    setNextStatus(null);
  };

  const getFabricStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-700',
      reserved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      supplement: 'bg-orange-100 text-orange-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPatternStatusColor = (status: string) => {
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
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>
        <h1 className="text-xl font-bold text-gray-800">订单详情</h1>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-500" />
                订单信息
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500">订单号</p>
                  <p className="font-medium text-gray-800 mt-1">{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">客户姓名</p>
                  <p className="font-medium text-gray-800 mt-1 flex items-center">
                    <User className="w-4 h-4 mr-1 text-gray-400" />
                    {order.customer_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">联系电话</p>
                  <p className="font-medium text-gray-800 mt-1 flex items-center">
                    <Phone className="w-4 h-4 mr-1 text-gray-400" />
                    {order.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">下单日期</p>
                  <p className="font-medium text-gray-800 mt-1 flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                    {formatDate(order.order_date)}
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">当前状态</span>
                  <StatusBadge status={order.status} label={ORDER_STATUS_MAP[order.status]} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-purple-500" />
                订单状态变更历史
              </h3>
            </div>
            <div className="p-6">
              <div className="relative">
                {history.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">暂无变更记录</p>
                ) : (
                  <div className="space-y-6">
                    {history.map((record, index) => (
                      <div key={record.id} className="relative pl-8">
                        <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 ${
                          index === 0 ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'
                        }`}></div>
                        <div className={`absolute left-2 top-5 w-0.5 h-full ${
                          index === history.length - 1 ? 'bg-transparent' : 'bg-gray-200'
                        }`}></div>
                        <div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              index === 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {ORDER_STATUS_MAP[record.status_to]}
                            </span>
                            {record.status_from && (
                              <span className="text-sm text-gray-400">
                                由 {ORDER_STATUS_MAP[record.status_from]} 变更
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {record.operator_name} | {formatDateTime(record.change_time)}
                          </p>
                          {record.remark && (
                            <p className="text-sm text-gray-600 mt-2 bg-gray-50 px-3 py-2 rounded">
                              {record.remark}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {fabric && (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <Edit3 className="w-5 h-5 mr-2 text-green-500" />
                  面料预留记录
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">面料名称</p>
                    <p className="font-medium text-gray-800 mt-1">{fabric.fabric_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">面料编号</p>
                    <p className="font-medium text-gray-800 mt-1">{fabric.fabric_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">用量</p>
                    <p className="font-medium text-gray-800 mt-1">{fabric.quantity}m</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">当前状态</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getFabricStatusColor(fabric.status)}`}>
                      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current"></span>
                      {FABRIC_STATUS_MAP[fabric.status]}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h4 className="font-medium text-gray-800 flex items-center mb-3">
                    <Clock className="w-4 h-4 mr-2 text-purple-500" />
                    面料状态变更历史
                  </h4>
                  {fabricHistory.length === 0 ? (
                    <p className="text-gray-500 text-sm">暂无变更记录</p>
                  ) : (
                    <div className="space-y-3">
                      {fabricHistory.map((record, index) => (
                        <div key={record.id} className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${index === 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getFabricStatusColor(record.status_to)}`}>
                                {FABRIC_STATUS_MAP[record.status_to]}
                              </span>
                              {record.status_from && (
                                <span className="text-sm text-gray-400">
                                  由 {FABRIC_STATUS_MAP[record.status_from]} 变更
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

                {fabricReminders.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="font-medium text-gray-800 flex items-center mb-3">
                      <MessageSquare className="w-4 h-4 mr-2 text-yellow-500" />
                      面料催单记录
                    </h4>
                    <div className="space-y-3">
                      {fabricReminders.map(reminder => (
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
          )}

          {patternTask && (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <Scissors className="w-5 h-5 mr-2 text-orange-500" />
                  打版任务记录
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">任务名称</p>
                    <p className="font-medium text-gray-800 mt-1">{patternTask.task_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">责任人</p>
                    <p className="font-medium text-gray-800 mt-1">{patternTask.assignee_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">排期日期</p>
                    <p className="font-medium text-gray-800 mt-1">{formatDate(patternTask.scheduled_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">当前状态</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getPatternStatusColor(patternTask.status)}`}>
                      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current"></span>
                      {PATTERN_STATUS_MAP[patternTask.status]}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h4 className="font-medium text-gray-800 flex items-center mb-3">
                    <Clock className="w-4 h-4 mr-2 text-purple-500" />
                    打版状态变更历史
                  </h4>
                  {patternHistory.length === 0 ? (
                    <p className="text-gray-500 text-sm">暂无变更记录</p>
                  ) : (
                    <div className="space-y-3">
                      {patternHistory.map((record, index) => (
                        <div key={record.id} className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${index === 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPatternStatusColor(record.status_to)}`}>
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

                {patternReminders.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="font-medium text-gray-800 flex items-center mb-3">
                      <MessageSquare className="w-4 h-4 mr-2 text-yellow-500" />
                      打版催单记录
                    </h4>
                    <div className="space-y-3">
                      {patternReminders.map(reminder => (
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
          )}
        </div>

        <div className="space-y-6">
          {nextStatuses.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-blue-500" />
                  下一步操作
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {nextStatuses.map(option => (
                    <button
                      key={option.status}
                      onClick={() => handleStatusChange(option.status)}
                      className="w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option.label}</span>
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">订单进度概览</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">待量体</span>
                    <span className={order.status !== 'pending' ? 'text-green-500' : 'text-gray-400'}>
                      {order.status !== 'pending' ? '已完成' : '未开始'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${order.status !== 'pending' ? 'bg-green-500' : 'bg-gray-300'}`} style={{ width: order.status !== 'pending' ? '100%' : '0%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">已量体</span>
                    <span className={order.status !== 'pending' && order.status !== 'measured' ? 'text-green-500' : 'text-gray-400'}>
                      {order.status !== 'pending' && order.status !== 'measured' ? '已完成' : order.status === 'measured' ? '进行中' : '未开始'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${order.status !== 'pending' && order.status !== 'measured' ? 'bg-green-500' : order.status === 'measured' ? 'bg-yellow-500' : 'bg-gray-300'}`} style={{ width: order.status !== 'pending' && order.status !== 'measured' ? '100%' : order.status === 'measured' ? '50%' : '0%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">面料预留</span>
                    <span className={order.status === 'fabric_reserved' || order.status === 'pattern_in_progress' || order.status === 'fitting' || order.status === 'completed' ? 'text-green-500' : 'text-gray-400'}>
                      {order.status === 'fabric_reserved' || order.status === 'pattern_in_progress' || order.status === 'fitting' || order.status === 'completed' ? '已完成' : order.status === 'measured' ? '待处理' : '未开始'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${order.status === 'fabric_reserved' || order.status === 'pattern_in_progress' || order.status === 'fitting' || order.status === 'completed' ? 'bg-green-500' : order.status === 'measured' ? 'bg-yellow-500' : 'bg-gray-300'}`} style={{ width: order.status === 'fabric_reserved' || order.status === 'pattern_in_progress' || order.status === 'fitting' || order.status === 'completed' ? '100%' : order.status === 'measured' ? '30%' : '0%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">打版制作</span>
                    <span className={order.status === 'pattern_in_progress' || order.status === 'fitting' || order.status === 'completed' ? 'text-green-500' : 'text-gray-400'}>
                      {order.status === 'pattern_in_progress' ? '进行中' : order.status === 'fitting' || order.status === 'completed' ? '已完成' : '未开始'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${order.status === 'pattern_in_progress' ? 'bg-yellow-500' : order.status === 'fitting' || order.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`} style={{ width: order.status === 'pattern_in_progress' ? '50%' : order.status === 'fitting' || order.status === 'completed' ? '100%' : '0%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">试衣完成</span>
                    <span className={order.status === 'fitting' || order.status === 'completed' ? 'text-green-500' : 'text-gray-400'}>
                      {order.status === 'fitting' ? '进行中' : order.status === 'completed' ? '已完成' : '未开始'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${order.status === 'fitting' ? 'bg-yellow-500' : order.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`} style={{ width: order.status === 'fitting' ? '50%' : order.status === 'completed' ? '100%' : '0%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRemarkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {nextStatus ? ORDER_STATUS_MAP[nextStatus] : ''}
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
                onClick={() => { setShowRemarkModal(false); setRemarkText(''); setNextStatus(null); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmStatusChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;