import { useSurgeryStore } from '@/store/useSurgeryStore';
import { Calendar, Clock, AlertTriangle, CheckCircle, ChevronRight, Eye, Package, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { statusLabels, statusColors, formatTime, roleLabels } from '@/utils/status';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { getStats, getTodos, surgeries, exceptions, selectSurgery, currentRole } = useSurgeryStore();
  const stats = getStats();
  const todos = getTodos();
  const navigate = useNavigate();

  const todoColors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    green: 'from-green-500 to-green-600',
  };

  const pendingSurgeries = surgeries.filter(
    (s) => s.status !== 'completed' && s.status !== 'scheduled'
  );

  const urgentExceptions = exceptions.filter((e) => e.status !== 'resolved');

  const getTodoIcon = (role: string) => {
    switch (role) {
      case 'doctor':
        return <Eye className="w-5 h-5" />;
      case 'followup':
        return <CheckCircle className="w-5 h-5" />;
      case 'nurse':
        return <Package className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const handleSurgeryClick = (id: string) => {
    selectSurgery(id);
    navigate(`/surgeries?id=${id}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
        <p className="text-gray-500 mt-1">欢迎回来，当前以 {roleLabels[currentRole]} 身份登录</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">今日手术</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalSurgeries}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">含各状态手术</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待确认晶体</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pendingLens}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">需医生确认</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待核销复核</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{stats.pendingVerification}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">需随访专员处理</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待处理异常</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.activeExceptions}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">需紧急处理</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">待办事项</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4">
                {todos.map((todo) => (
                  <div
                    key={todo.id}
                    className={cn(
                      'relative overflow-hidden rounded-xl p-5 text-white cursor-pointer transform hover:scale-[1.02] transition-all duration-200',
                      `bg-gradient-to-br ${todoColors[todo.color]}`
                    )}
                    onClick={() => {
                      if (todo.role === 'doctor') navigate('/surgeries');
                      else if (todo.role === 'followup') navigate('/surgeries');
                      else if (todo.role === 'admin') navigate('/exceptions');
                      else navigate('/surgeries');
                    }}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-3">
                        {getTodoIcon(todo.role)}
                        <span className="font-medium">{todo.title}</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-4xl font-bold">{todo.count}</span>
                        <span className="text-sm opacity-80">{roleLabels[todo.role]}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">进行中的手术</h2>
              <button
                onClick={() => navigate('/surgeries')}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {pendingSurgeries.slice(0, 4).map((surgery) => (
                <div
                  key={surgery.id}
                  onClick={() => handleSurgeryClick(surgery.id)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center',
                          surgery.status === 'exception' ? 'bg-red-100' : 'bg-blue-100'
                        )}
                      >
                        <span
                          className={cn(
                            'font-semibold text-sm',
                            surgery.status === 'exception' ? 'text-red-600' : 'text-blue-600'
                          )}
                        >
                          {surgery.patientName[0]}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{surgery.patientName}</span>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium border',
                              statusColors[surgery.status]
                            )}
                          >
                            {statusLabels[surgery.status]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{surgery.surgeryType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {formatTime(surgery.scheduledTime)}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{surgery.room}</p>
                    </div>
                  </div>
                </div>
              ))}
              {pendingSurgeries.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无进行中的手术</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">异常提醒</h2>
              <button
                onClick={() => navigate('/exceptions')}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                全部 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-auto">
              {urgentExceptions.length > 0 ? (
                urgentExceptions.map((exception) => {
                  const surgery = surgeries.find((s) => s.id === exception.surgeryId);
                  return (
                    <div
                      key={exception.id}
                      className="p-4 hover:bg-red-50 cursor-pointer transition-colors bg-red-50/50"
                      onClick={() => navigate(`/exceptions?id=${exception.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                            exception.level === 'critical'
                              ? 'bg-red-100'
                              : exception.level === 'high'
                              ? 'bg-orange-100'
                              : 'bg-amber-100'
                          )}
                        >
                          <AlertTriangle
                            className={cn(
                              'w-4 h-4',
                              exception.level === 'critical'
                                ? 'text-red-600'
                                : exception.level === 'high'
                                ? 'text-orange-600'
                                : 'text-amber-600'
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {exception.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {exception.description}
                          </p>
                          {surgery && (
                            <p className="text-xs text-gray-400 mt-1">
                              患者: {surgery.patientName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无待处理异常</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">状态分布</h2>
            </div>
            <div className="p-5 space-y-3">
              {Object.entries(statusLabels).map(([status, label]) => {
                const count = stats.statusBreakdown[status as keyof typeof stats.statusBreakdown] || 0;
                const total = stats.totalSurgeries || 1;
                const percentage = (count / total) * 100;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{label}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          status === 'exception'
                            ? 'bg-red-500'
                            : status === 'completed'
                            ? 'bg-emerald-500'
                            : status === 'lens_pending'
                            ? 'bg-amber-500'
                            : status === 'verifying'
                            ? 'bg-orange-500'
                            : 'bg-blue-500'
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
