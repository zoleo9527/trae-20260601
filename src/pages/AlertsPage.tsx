import { useState } from 'react';
import { AlertTriangle, Check, Clock, Bell, CheckCircle, XCircle } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Alert } from '@/types';
import { formatDate, getAlertTypeText, getAlertPriorityColor, getRoleText, cn } from '@/lib/utils';

interface AlertCardProps {
  alert: Alert;
  onAcknowledge: () => void;
  onResolve: () => void;
}

function AlertCard({ alert, onAcknowledge, onResolve }: AlertCardProps) {
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveRemark, setResolveRemark] = useState('');
  const priorityColor = getAlertPriorityColor(alert.priority);

  const statusConfig = {
    active: { label: '待处理', color: 'bg-red-100 text-red-700' },
    acknowledged: { label: '已确认', color: 'bg-yellow-100 text-yellow-700' },
    resolved: { label: '已解决', color: 'bg-green-100 text-green-700' },
  };

  const status = statusConfig[alert.status];

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-red-500">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className={cn('w-3 h-3 rounded-full mt-1.5 flex-shrink-0', priorityColor)} />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h4 className="font-medium text-gray-900">{alert.title}</h4>
              <span className={cn('text-xs px-2 py-0.5 rounded-full', status.color)}>
                {status.label}
              </span>
              {alert.assignedRole && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {getRoleText(alert.assignedRole)}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">{alert.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                创建时间: {formatDate(alert.createdAt)}
              </span>
              <span>类型: {getAlertTypeText(alert.type)}</span>
              {alert.acknowledgedAt && (
                <span>确认时间: {formatDate(alert.acknowledgedAt)}</span>
              )}
              {alert.resolvedAt && (
                <span>解决时间: {formatDate(alert.resolvedAt)}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {alert.status === 'active' && (
            <button
              onClick={onAcknowledge}
              className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
            >
              <Check className="w-4 h-4" /> 确认
            </button>
          )}
          {alert.status !== 'resolved' && (
            <button
              onClick={() => setShowResolveModal(true)}
              className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"
            >
              <CheckCircle className="w-4 h-4" /> 解决
            </button>
          )}
        </div>
      </div>

      {showResolveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">标记为已解决</h3>
            <textarea
              value={resolveRemark}
              onChange={(e) => setResolveRemark(e.target.value)}
              placeholder="请输入解决说明..."
              className="w-full h-24 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowResolveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  onResolve();
                  setResolveRemark('');
                  setShowResolveModal(false);
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                确认解决
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AlertsPage() {
  const { alerts, getAlertsForRole, currentUser, acknowledgeAlert, resolveAlert } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('all');
  const [myAlertsOnly, setMyAlertsOnly] = useState(false);

  const roleAlerts = currentUser ? getAlertsForRole(currentUser.role) : alerts;
  const displayAlerts = myAlertsOnly ? roleAlerts : alerts;

  const filteredAlerts = displayAlerts.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    active: alerts.filter(a => a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">异常提醒</h2>
        <p className="text-sm text-gray-500 mt-1">
          共 {filteredAlerts.length} 条提醒
          {stats.active > 0 && <span className="text-red-500 ml-2">({stats.active} 条待处理)</span>}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-sm text-gray-500">待处理</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.acknowledged}</p>
              <p className="text-sm text-gray-500">处理中</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
              <p className="text-sm text-gray-500">已解决</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setMyAlertsOnly(!myAlertsOnly)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
              myAlertsOnly
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            <AlertTriangle className="w-4 h-4" />
            只看我的角色 ({roleAlerts.filter(a => a.status !== 'resolved').length})
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">全部状态</option>
            <option value="active">待处理</option>
            <option value="acknowledged">处理中</option>
            <option value="resolved">已解决</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAlerts.map(alert => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onAcknowledge={() => acknowledgeAlert(alert.id)}
            onResolve={() => resolveAlert(alert.id, '已处理')}
          />
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无异常提醒</p>
          <p className="text-sm text-gray-400 mt-1">所有流程运行正常</p>
        </div>
      )}
    </div>
  );
}
