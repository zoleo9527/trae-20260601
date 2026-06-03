import { useEffect, useState } from 'react';
import { Bell, Check, AlertTriangle, Clock, Filter, ChefHat, Utensils, Building } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ChangeTypeBadge, PriorityBadge, ImpactScopeBadge } from '@/components/Badges';
import { getChangeTypeLabel, getPriorityLabel, getImpactScopeLabel } from '@/utils/compareUtils';
import { Link } from 'react-router-dom';
import type { Alert, ImpactScope, Priority } from '@shared/types';

export default function AlertsCenter() {
  const { alerts, fetchAlerts, acknowledgeAlert, loading, currentRole } = useAppStore();
  const isKitchenRole = currentRole === 'kitchen_manager';
  const [scopeFilter, setScopeFilter] = useState<string>(isKitchenRole ? 'all' : 'all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [acknowledgedFilter, setAcknowledgedFilter] = useState<string>('all');

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    if (currentRole === 'kitchen_manager' && scopeFilter === 'hall') {
      setScopeFilter('all');
    }
  }, [currentRole, scopeFilter]);

  const handleFilterChange = () => {
    fetchAlerts({
      scope: scopeFilter,
      priority: priorityFilter,
      acknowledged: acknowledgedFilter,
    });
  };

  useEffect(() => {
    handleFilterChange();
  }, [scopeFilter, priorityFilter, acknowledgedFilter]);

  const handleAcknowledge = async (alertId: string) => {
    const confirmer = currentRole === 'hall_manager' ? '厅面主管' : currentRole === 'kitchen_manager' ? '后厨主管' : '销售经理';
    await acknowledgeAlert(alertId, confirmer);
  };

  const unreadCount = alerts.filter(a => !a.acknowledged).length;
  const urgentCount = alerts.filter(a => (a.priority === 'urgent' || a.priority === 'high') && !a.acknowledged).length;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    return '刚刚';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-12 h-12 border-4 border-champagne-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const scopeOptions = isKitchenRole
    ? [
        { value: 'all', label: '全部备餐相关', icon: Building },
        { value: 'kitchen', label: '仅后厨', icon: ChefHat },
      ]
    : [
        { value: 'all', label: '全部范围', icon: Building },
        { value: 'hall', label: '仅厅面', icon: Utensils },
        { value: 'kitchen', label: '仅后厨', icon: ChefHat },
      ];

  const priorityOptions = [
    { value: 'all', label: '全部优先级' },
    { value: 'urgent', label: '紧急' },
    { value: 'high', label: '高' },
    { value: 'medium', label: '中' },
    { value: 'low', label: '低' },
  ];

  const ackOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'false', label: '待处理' },
    { value: 'true', label: '已处理' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-wine-800 via-wine-700 to-wine-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
              <Bell size={28} />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">变更提醒中心</h2>
              <p className="text-champagne-200/90">实时追踪所有重要变更，确保各部门信息同步</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20 text-center">
              <div className="text-2xl font-bold">{alerts.length}</div>
              <div className="text-xs text-champagne-200">{isKitchenRole ? '备餐相关' : '总'}提醒数</div>
            </div>
            <div className="bg-amber-500/20 backdrop-blur-sm rounded-xl px-5 py-3 border border-amber-400/30 text-center">
              <div className="text-2xl font-bold text-amber-300">{unreadCount}</div>
              <div className="text-xs text-amber-200/80">待处理</div>
            </div>
            {urgentCount > 0 && (
              <div className="bg-red-500/20 backdrop-blur-sm rounded-xl px-5 py-3 border border-red-400/30 text-center animate-pulse-slow">
                <div className="text-2xl font-bold text-red-300">{urgentCount}</div>
                <div className="text-xs text-red-200/80">紧急</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 border border-champagne-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">筛选：</span>
          </div>
          
          <div className="flex items-center gap-2">
            {scopeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setScopeFilter(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  scopeFilter === opt.value
                    ? 'bg-wine-700 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <opt.icon size={14} />
                {opt.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-gray-200"></div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-champagne-500/50 bg-white"
          >
            {priorityOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={acknowledgedFilter}
            onChange={(e) => setAcknowledgedFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-champagne-500/50 bg-white"
          >
            {ackOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-champagne-100">
          <div className="text-6xl mb-4">🔔</div>
          <h3 className="font-display text-xl font-semibold text-gray-700 mb-2">{isKitchenRole ? '暂无备餐相关提醒' : '暂无变更提醒'}</h3>
          <p className="text-gray-500">当前筛选条件下没有提醒记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              index={index}
              onAcknowledge={handleAcknowledge}
              formatTime={formatTime}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface AlertItemProps {
  alert: Alert;
  index: number;
  onAcknowledge: (id: string) => void;
  formatTime: (date: string) => string;
}

function AlertItem({ alert, index, onAcknowledge, formatTime }: AlertItemProps) {
  const priorityStyles: Record<string, string> = {
    urgent: 'border-l-4 border-l-red-500 bg-red-50/80',
    high: 'border-l-4 border-l-amber-500 bg-amber-50/80',
    medium: 'border-l-4 border-l-blue-500 bg-blue-50/80',
    low: 'border-l-4 border-l-gray-400 bg-gray-50/80',
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-champagne-100 overflow-hidden transition-all duration-300 hover:shadow-md stagger-item ${
        alert.acknowledged ? 'opacity-70' : priorityStyles[alert.priority] || ''
      }`}
      style={{ animationDelay: `${index * 0.05}s`, transform: 'translateY(20px)' }}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            alert.acknowledged ? 'bg-gray-100' :
            alert.priority === 'urgent' ? 'bg-red-100' :
            alert.priority === 'high' ? 'bg-amber-100' :
            alert.priority === 'medium' ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            {alert.acknowledged ? (
              <Check size={20} className="text-gray-500" />
            ) : (
              <AlertTriangle size={20} className={
                alert.priority === 'urgent' ? 'text-red-600' :
                alert.priority === 'high' ? 'text-amber-600' :
                alert.priority === 'medium' ? 'text-blue-600' : 'text-gray-500'
              } />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <ChangeTypeBadge type={alert.type} />
              <ImpactScopeBadge scope={alert.scope} />
              <PriorityBadge priority={alert.priority} />
            </div>

            <Link
              to={`/banquet/${alert.banquetId}`}
              className="font-semibold text-gray-800 hover:text-wine-700 transition-colors block mb-1"
            >
              {alert.banquetName}
            </Link>
            
            <p className="text-gray-600 text-sm">{alert.description}</p>

            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>{formatTime(alert.createdAt)}</span>
              </div>
              <span>v{alert.fromVersion} → v{alert.toVersion}</span>
              {alert.acknowledgedAt && (
                <span className="text-forest-600">
                  {alert.acknowledgedBy} 于 {formatTime(alert.acknowledgedAt)} 确认
                </span>
              )}
            </div>
          </div>

          {!alert.acknowledged && (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-wine-700 text-white rounded-lg hover:bg-wine-800 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
            >
              <Check size={14} />
              确认收到
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
