import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  ArrowRight,
  RefreshCw,
  Car,
  UserCheck,
  HardHat,
  Headphones,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { StatusBadge, PriorityBadge, DotStatus } from '../../components/StatusBadge';
import { Timeline } from '../../components/Timeline';
import { useRecent } from '../../hooks/useRecent';
import { timeAgo, formatDateTime } from '../../utils/date';
import {
  getOperatorRoleLabel,
  getExceptionTypeLabel,
} from '../../data/mockData';
import type { TodoItem, RiskItem } from '../../data/types';
import { cn } from '../../lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { addRecentVisit } = useRecent();
  const {
    todos,
    risks,
    activities,
    operators,
    audits,
    dispatches,
    exceptions,
  } = useStore();

  const pendingTodos = todos.filter(t => t.status === 'pending');
  const processingTodos = todos.filter(t => t.status === 'processing');

  const handleTodoClick = (todo: TodoItem) => {
    addRecentVisit({
      type: todo.type === 'audit' ? 'audit' : todo.type === 'dispatch_retry' ? 'dispatch' : 'exception',
      title: todo.title,
      subtitle: todo.subtitle,
      path: todo.path,
    });
    navigate(todo.path);
  };

  const handleRiskClick = (risk: RiskItem) => {
    const pathMap = {
      audit: `/audit/${risk.relatedId}`,
      dispatch: `/dispatch/${risk.relatedId}`,
      exception: `/exception/${risk.relatedId}`,
    };
    const path = pathMap[risk.relatedType];
    addRecentVisit({
      type: risk.relatedType,
      title: risk.title,
      subtitle: risk.description,
      path,
    });
    navigate(path);
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'border-l-red-500',
      medium: 'border-l-amber-500',
      low: 'border-l-slate-300',
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  const getRoleIcon = (role: string) => {
    const icons = {
      operation: UserCheck,
      service: Headphones,
      maintenance: HardHat,
    };
    return icons[role as keyof typeof icons] || UserCheck;
  };

  const stats = [
    {
      label: '待处理审核',
      value: audits.filter(a => a.nodes.some(n => n.status === 'pending' || n.status === 'stuck')).length,
      icon: Car,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      path: '/audit',
    },
    {
      label: '下发失败',
      value: dispatches.filter(d => d.status === 'failed').length,
      icon: RefreshCw,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      path: '/dispatch',
    },
    {
      label: '未处理异常',
      value: exceptions.filter(e => e.status === 'pending' || e.status === 'processing' || e.status === 'transferred').length,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      path: '/exception',
    },
    {
      label: '今日完成',
      value: activities.filter(a => a.type === 'audit_pass' || a.type === 'dispatch_success' || a.type === 'exception_fix').length,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      path: '#',
    },
  ];

  return (
    <div className="p-6 space-y-6 min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">运营工作台</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            按一线处理优先级排序 · 道闸故障 → 权限失效 → 无牌争议 → 新申请
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock className="w-4 h-4" />
          <span>数据更新于 {formatDateTime(new Date().toISOString())}</span>
        </div>
      </div>

      {risks.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 animate-pulse-alert">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-red-800">
                发现 {risks.length} 项高优先级风险
              </div>
              <div className="text-xs text-red-600">
                请优先处理，避免影响运营
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {risks.slice(0, 4).map((risk) => (
              <button
                key={risk.id}
                onClick={() => handleRiskClick(risk)}
                className="flex items-start gap-3 p-3 bg-white/80 rounded-lg hover:bg-white transition-all text-left border border-red-100 hover:border-red-300 hover:shadow-sm"
              >
                <PriorityBadge priority={risk.priority} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-800 truncate">
                    {risk.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {risk.description}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] text-red-600 font-mono">
                    持续 {risk.duration}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-auto mt-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.label}
              onClick={() => stat.path !== '#' && navigate(stat.path)}
              className="bg-white rounded-xl p-4 border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-800 font-mono">
                  {stat.value}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {stat.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {pendingTodos.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <h2 className="font-bold text-slate-800">待处理事项</h2>
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded">
                    {pendingTodos.length}
                  </span>
                </div>
                <button
                  onClick={() => navigate('/audit')}
                  className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
                >
                  查看全部 <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {pendingTodos.map((todo) => (
                  <button
                    key={todo.id}
                    onClick={() => handleTodoClick(todo)}
                    className={cn(
                      'w-full text-left p-4 hover:bg-slate-50 transition-colors border-l-4',
                      getPriorityColor(todo.priority)
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-slate-800">
                            {todo.title}
                          </span>
                          <PriorityBadge priority={todo.priority} />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {todo.subtitle}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {(todo.handlerRole || []).map((role) => {
                            const Icon = getRoleIcon(role);
                            return (
                              <span
                                key={role}
                                className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                              >
                                <Icon className="w-3 h-3" />
                                {getOperatorRoleLabel(role)}
                              </span>
                            );
                          })}
                          <span className="text-[10px] text-slate-400">
                            · {timeAgo(todo.createdAt)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {processingTodos.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <h2 className="font-bold text-slate-800">处理中事项</h2>
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-xs font-bold rounded">
                    {processingTodos.length}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {processingTodos.map((todo) => {
                  const handler = operators.find(
                    (op) => todo.subtitle.includes(op.name)
                  );
                  return (
                    <button
                      key={todo.id}
                      onClick={() => handleTodoClick(todo)}
                      className={cn(
                        'w-full text-left p-4 hover:bg-slate-50 transition-colors border-l-4',
                        getPriorityColor(todo.priority)
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {handler && (
                          <div className="relative flex-shrink-0">
                            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                              {handler.avatar}
                            </div>
                            <DotStatus
                              status={handler.status}
                              className="absolute -bottom-0.5 -right-0.5 ring-2 ring-white"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-slate-800">
                              {todo.title}
                            </span>
                            <StatusBadge status="processing" />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {todo.subtitle}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">最近变更</h2>
              <span className="text-xs text-slate-400">30分钟内</span>
            </div>
            <div className="p-2">
              <Timeline items={activities} maxItems={6} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">处理人在岗</h2>
            </div>
            <div className="p-3 space-y-2">
              {['operation', 'service', 'maintenance'].map((role) => {
                const roleOps = operators.filter((op) => op.role === role);
                const onlineOps = roleOps.filter((op) => op.status === 'online' || op.status === 'busy');
                const RoleIcon = getRoleIcon(role);
                return (
                  <div key={role} className="p-2 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-2 mb-2">
                      <RoleIcon className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-medium text-slate-600">
                        {getOperatorRoleLabel(role)}
                      </span>
                      <span className="text-xs text-slate-400 ml-auto">
                        {onlineOps.length}/{roleOps.length} 在岗
                      </span>
                    </div>
                    <div className="flex -space-x-2">
                      {roleOps.slice(0, 4).map((op) => (
                        <div
                          key={op.id}
                          className="relative group"
                          title={`${op.name} - ${op.status === 'online' ? '在岗' : op.status === 'busy' ? '忙碌' : '离线'}`}
                        >
                          <div className="w-7 h-7 bg-slate-300 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600 ring-2 ring-slate-50">
                            {op.avatar}
                          </div>
                          <DotStatus
                            status={op.status}
                            className="absolute -bottom-0.5 -right-0.5 w-2 h-2 ring-2 ring-slate-50"
                          />
                          {op.currentTaskCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-slate-50">
                              {op.currentTaskCount}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-slate-400">一线处理顺序</span>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-red-500 rounded flex items-center justify-center text-[10px] font-bold">1</span>
                <span className="text-slate-300">道闸故障 → 设备维护员优先</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center text-[10px] font-bold">2</span>
                <span className="text-slate-300">权限失效 → 客服/运营协同</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-amber-500 rounded flex items-center justify-center text-[10px] font-bold">3</span>
                <span className="text-slate-300">无牌争议 → 客服优先</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-500 rounded flex items-center justify-center text-[10px] font-bold">4</span>
                <span className="text-slate-300">新申请 → 运营按序处理</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
