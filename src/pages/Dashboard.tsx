import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/endpoints';
import type { DashboardData, TaskItem, RiskItem, OperationLog } from '../../shared/types.js';
import { StatusBadge } from '../components/StatusBadge';
import {
  Package,
  Truck,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Flower2,
  ClipboardList,
  AlertCircle,
  ChevronRight,
  History,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToastMessage } = useAppStore();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const result = await dashboardApi.getDashboard();
      setData(result);
    } catch (error) {
      showToastMessage('加载数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const statCards = data ? [
    {
      label: '订单总数',
      value: data.stats.totalOrders,
      icon: ClipboardList,
      color: 'from-forest-500 to-forest-700',
      bgColor: 'bg-forest-50',
      textColor: 'text-forest-700',
    },
    {
      label: '待质检',
      value: data.stats.pendingInspection,
      icon: Package,
      color: 'from-amber-400 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
    },
    {
      label: '待装车复核',
      value: data.stats.pendingLoading,
      icon: Truck,
      color: 'from-blue-500 to-blue-700',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      label: '破损率',
      value: `${data.stats.damageRate}%`,
      icon: AlertTriangle,
      color: data.stats.damageRate > 5 ? 'from-red-500 to-red-700' : 'from-green-500 to-green-700',
      bgColor: data.stats.damageRate > 5 ? 'bg-red-50' : 'bg-green-50',
      textColor: data.stats.damageRate > 5 ? 'text-red-700' : 'text-green-700',
    },
  ] : [];

  const getPriorityColor = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'amber';
      case 'low': return 'default';
    }
  };

  const getRiskColor = (level: RiskItem['level']) => {
    switch (level) {
      case 'high': return 'danger';
      case 'medium': return 'amber';
      case 'low': return 'info';
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (hours < 1) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  const handleTaskClick = (task: TaskItem) => {
    if (task.type === 'inspection') {
      navigate('/packaging');
    } else if (task.type === 'loading') {
      navigate('/loading');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-forest-100 rounded w-48"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-forest-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-forest-900">工作台</h1>
        <p className="text-forest-600 mt-1 text-sm">欢迎回来，以下是今日工作概览</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, index) => (
          <div
            key={stat.label}
            className="card p-5 card-hover animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-forest-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-forest-900 font-serif">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="text-lg font-semibold text-forest-900">待处理任务</h2>
              </div>
              <button
                onClick={() => navigate('/packaging')}
                className="text-sm text-forest-600 hover:text-forest-800 flex items-center gap-1 transition-colors"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {data?.tasks.slice(0, 5).map((task, index) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-forest-50 cursor-pointer transition-colors group animate-slide-up"
                  style={{ animationDelay: `${(index + 4) * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      task.type === 'inspection' ? 'bg-amber-100' :
                      task.type === 'loading' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {task.type === 'inspection' && <Package className="w-5 h-5 text-amber-600" />}
                      {task.type === 'loading' && <Truck className="w-5 h-5 text-blue-600" />}
                      {task.type === 'patrol' && <Flower2 className="w-5 h-5 text-green-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-forest-900 group-hover:text-forest-700">{task.title}</p>
                      <p className="text-xs text-forest-500">{task.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={task.priorityText} variant={getPriorityColor(task.priority)} />
                    {task.dueTime && (
                      <div className="flex items-center gap-1 text-xs text-forest-500">
                        <Clock className="w-3 h-3" />
                        {task.dueTime}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
                <h2 className="text-lg font-semibold text-forest-900">风险项</h2>
              </div>
              <span className="text-xs text-forest-500">需重点关注</span>
            </div>

            <div className="space-y-3">
              {data?.risks.map((risk, index) => (
                <div
                  key={risk.id}
                  className={`p-4 rounded-xl border-l-4 animate-slide-up ${
                    risk.level === 'high'
                      ? 'bg-red-50 border-red-400'
                      : risk.level === 'medium'
                      ? 'bg-amber-50 border-amber-400'
                      : 'bg-blue-50 border-blue-400'
                  }`}
                  style={{ animationDelay: `${(index + 6) * 50}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                        risk.level === 'high' ? 'text-red-500 animate-pulse-soft' :
                        risk.level === 'medium' ? 'text-amber-500' : 'text-blue-500'
                      }`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-forest-900">{risk.title}</p>
                          <StatusBadge status={risk.levelText} variant={getRiskColor(risk.level)} />
                        </div>
                        <p className="text-sm text-forest-600 mt-1">{risk.description}</p>
                      </div>
                    </div>
                    <span className="text-xs text-forest-500 whitespace-nowrap">
                      {formatTime(risk.detectedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5 h-fit">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-forest-100 rounded-lg flex items-center justify-center">
                <History className="w-4 h-4 text-forest-600" />
              </div>
              <h2 className="text-lg font-semibold text-forest-900">最近变更</h2>
            </div>
            <button
              onClick={() => navigate('/logs')}
              className="text-sm text-forest-600 hover:text-forest-800 flex items-center gap-1 transition-colors"
            >
              全部 <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-2 bottom-2 w-px bg-forest-200"></div>
            <div className="space-y-4">
              {data?.recentChanges.slice(0, 6).map((log, index) => (
                <TimelineItem key={log.id} log={log} index={index} formatTime={formatTime} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ log, index, formatTime }: { log: OperationLog; index: number; formatTime: (s: string) => string }) {
  const roleColors: Record<string, string> = {
    grower: 'bg-green-500',
    sales: 'bg-blue-500',
    packaging: 'bg-amber-500',
  };

  return (
    <div
      className="relative pl-8 animate-slide-up"
      style={{ animationDelay: `${(index + 4) * 50}ms` }}
    >
      <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full ${roleColors[log.operatorRole] || 'bg-gray-400'} ring-4 ring-white`}></div>
      <div className="py-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-forest-900">{log.operator}</span>
          <span className="text-xs text-forest-500">{log.operatorRoleText}</span>
        </div>
        <p className="text-sm text-forest-600 mt-0.5">{log.description}</p>
        <p className="text-xs text-forest-400 mt-1">{formatTime(log.timestamp)}</p>
      </div>
    </div>
  );
}
