import { useState } from 'react';
import { useAppStore } from '../store';
import type { Exception } from '../types';
import { AlertTriangle, Clock, CheckCircle, XCircle, AlertCircle, Zap, Plus, X, Search } from 'lucide-react';

const typeConfig: Record<string, { label: string; icon: typeof AlertTriangle; color: string }> = {
  late: { label: '车辆迟到', icon: Clock, color: 'text-orange-600 bg-orange-100' },
  damage: { label: '物品破损', icon: AlertTriangle, color: 'text-red-600 bg-red-100' },
  dispute: { label: '客户纠纷', icon: XCircle, color: 'text-purple-600 bg-purple-100' },
  unconfirmed: { label: '费用待确认', icon: AlertCircle, color: 'text-yellow-600 bg-yellow-100' },
};

const severityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  warning: { label: '警告', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  error: { label: '错误', color: 'text-red-600', bgColor: 'bg-red-100' },
  critical: { label: '紧急', color: 'text-red-700', bgColor: 'bg-red-200' },
};

export default function ExceptionPage() {
  const exceptions = useAppStore((state) => state.exceptions);
  const resolveException = useAppStore((state) => state.resolveException);
  const addNotification = useAppStore((state) => state.addNotification);
  const reportExceptionAction = useAppStore((state) => state.reportException);
  const orders = useAppStore((state) => state.orders);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newException, setNewException] = useState({
    type: 'late' as 'late' | 'damage' | 'dispute' | 'unconfirmed',
    orderId: '',
    message: '',
    severity: 'warning' as 'warning' | 'error' | 'critical',
  });

  const unresolvedExceptions = exceptions.filter((e) => !e.resolved);
  const filteredExceptions = unresolvedExceptions.filter((e) => {
    const order = orders.find((o) => o.id === e.orderId);
    return (
      e.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order?.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  const criticalCount = unresolvedExceptions.filter((e) => e.severity === 'critical').length;
  const errorCount = unresolvedExceptions.filter((e) => e.severity === 'error').length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diff < 1) return '刚刚';
    if (diff < 60) return `${diff}分钟前`;
    if (diff < 1440) return `${Math.floor(diff / 60)}小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  const handleResolve = (exception: Exception) => {
    resolveException(exception.id);
    addNotification(`异常已处理: ${exception.message}`);
  };

  const handleAddException = async () => {
    if (!newException.orderId || !newException.message.trim()) return;
    await reportExceptionAction(newException);
    setShowAddModal(false);
    setNewException({ type: 'late', orderId: '', message: '', severity: 'warning' });
    addNotification('异常已成功上报');
  };

  const isUrgent = (exception: Exception) => {
    const date = new Date(exception.createdAt);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    return diff > 30;
  };

  const getOrderInfo = (orderId: string) => {
    return orders.find((o) => o.id === orderId);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">异常处理中心</h2>
          <p className="text-sm text-gray-500 mt-1">实时监控和处理异常订单</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>上报异常</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{unresolvedExceptions.length}</div>
              <div className="text-sm text-gray-500">待处理异常</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-sm text-gray-500">错误级别</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{criticalCount}</div>
              <div className="text-sm text-gray-500">紧急级别</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索异常描述、订单号、客户..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
        {filteredExceptions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-gray-500">暂无待处理的异常</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredExceptions.map((exception) => {
              const type = typeConfig[exception.type] || { label: exception.type, icon: AlertCircle, color: 'text-gray-600 bg-gray-100' };
              const severity = severityConfig[exception.severity];
              const TypeIcon = type.icon;
              const urgent = isUrgent(exception);
              const order = getOrderInfo(exception.orderId);

              return (
                <div
                  key={exception.id}
                  className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    urgent ? 'bg-red-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${type.color} rounded-xl flex items-center justify-center`}>
                      <TypeIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{type.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severity.bgColor} ${severity.color}`}>
                          {severity.label}
                        </span>
                        {urgent && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            超时
                          </span>
                        )}
                      </div>
                      <div className="text-gray-600 mt-1">{exception.message}</div>
                      <div className="text-sm text-gray-400 mt-1">
                        订单号: {exception.orderId} {order && `· 客户: ${order.customerName}`} · {formatDate(exception.createdAt)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResolve(exception)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>标记已处理</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {unresolvedExceptions.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-yellow-800">处理提醒</div>
              <div className="text-sm text-yellow-700 mt-1">
                请及时处理以上异常，超时未处理的异常将自动升级提醒级别。
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">上报新异常</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">异常类型</label>
                <select
                  value={newException.type}
                  onChange={(e) => setNewException({ ...newException, type: e.target.value as 'late' | 'damage' | 'dispute' | 'unconfirmed' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="late">车辆迟到</option>
                  <option value="damage">物品破损</option>
                  <option value="dispute">客户纠纷</option>
                  <option value="unconfirmed">费用待确认</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">关联订单</label>
                <select
                  value={newException.orderId}
                  onChange={(e) => setNewException({ ...newException, orderId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">请选择订单</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.id} · {order.customerName} · {order.status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">严重程度</label>
                <select
                  value={newException.severity}
                  onChange={(e) => setNewException({ ...newException, severity: e.target.value as 'warning' | 'error' | 'critical' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="warning">警告</option>
                  <option value="error">错误</option>
                  <option value="critical">紧急</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">异常描述</label>
                <textarea
                  value={newException.message}
                  onChange={(e) => setNewException({ ...newException, message: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  rows={3}
                  placeholder="请详细描述异常情况..."
                />
              </div>
              <button
                onClick={handleAddException}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                确认上报
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
