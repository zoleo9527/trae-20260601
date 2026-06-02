import { Calendar, UserCheck, AlertTriangle, FileText, Clock, ChevronRight, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppointmentStore } from '../store/useAppointmentStore';
import { useTriageStore } from '../store/useTriageStore';
import { useRiskStore } from '../store/useRiskStore';
import { useScaleStore } from '../store/useScaleStore';
import { useUserStore } from '../store/useUserStore';
import { StatusBadge, TypeBadge } from '../components/StatusBadge';
import { mockTodoItems } from '../data/mockData';

const priorityStyles = {
  high: 'border-l-status-warning bg-red-50/50',
  medium: 'border-l-status-pending bg-amber-50/50',
  low: 'border-l-gray-300 bg-gray-50/50',
};

const todoTypeLabels: Record<string, string> = {
  reschedule: '改期',
  triage: '分诊',
  scale: '量表',
  risk: '风险',
};

const roleNavLinks: Record<string, Record<string, string>> = {
  reception: { '今日预约': '/appointments', '待分诊': '/triage', '量表待处理': '/scales' },
  counselor: { '今日来访': '/appointments', '量表待处理': '/scales' },
  supervisor: { '风险预警': '/risk' },
};

export function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { appointments, getTodayAppointments, getRescheduleRequests } = useAppointmentStore();
  const { getPendingTriage } = useTriageStore();
  const { getHighRiskCount, getPendingReview } = useRiskStore();
  const { getPendingScales, getRetestNeeded } = useScaleStore();

  const rescheduleRequests = getRescheduleRequests();
  const pendingTriage = getPendingTriage();
  const pendingScales = getPendingScales();
  const retestNeeded = getRetestNeeded();
  const highRiskCount = getHighRiskCount();
  const pendingRiskCases = getPendingReview();

  let todayAppointments = getTodayAppointments();
  if (currentUser.role === 'counselor' && currentUser.counselorId) {
    todayAppointments = todayAppointments.filter(
      (a) => a.counselorId === currentUser.counselorId
    );
  }

  const roleGreeting: Record<string, string> = {
    reception: '接待工作台',
    counselor: '咨询工作台',
    supervisor: '督导工作台',
  };

  const anonymize = (name: string) => name.replace(/\d+$/, '***');

  const statsByRole = {
    reception: [
      { label: '今日预约', value: getTodayAppointments().length, icon: Calendar, color: 'text-primary-600', bg: 'bg-primary-50', link: '/appointments' },
      { label: '待分诊', value: pendingTriage.length, icon: UserCheck, color: 'text-amber-600', bg: 'bg-amber-50', link: '/triage' },
      { label: '量表待处理', value: pendingScales.length + retestNeeded.length, icon: FileText, color: 'text-status-normal', bg: 'bg-emerald-50', link: '/scales' },
    ],
    counselor: [
      { label: '今日来访', value: todayAppointments.length, icon: Calendar, color: 'text-primary-600', bg: 'bg-primary-50', link: '/appointments' },
      { label: '量表待处理', value: pendingScales.length + retestNeeded.length, icon: FileText, color: 'text-status-normal', bg: 'bg-emerald-50', link: '/scales' },
    ],
    supervisor: [
      { label: '风险预警', value: highRiskCount, icon: AlertTriangle, color: 'text-status-warning', bg: 'bg-red-50', link: '/risk' },
    ],
  };

  const stats = statsByRole[currentUser.role] || [];

  const filteredTodos = mockTodoItems.filter((todo) => {
    if (currentUser.role === 'reception') {
      return ['reschedule', 'triage', 'scale'].includes(todo.type);
    }
    if (currentUser.role === 'counselor') {
      return ['scale'].includes(todo.type);
    }
    if (currentUser.role === 'supervisor') {
      return todo.type === 'risk';
    }
    return false;
  }).slice(0, 5);

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    return `${h}:${m}`;
  };

  const isSupervisor = currentUser.role === 'supervisor';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">{roleGreeting[currentUser.role]}</h1>
        <p className="muted-text mt-0.5">2026年6月2日 星期二</p>
      </div>

      <div className={`grid gap-5 grid-cols-${stats.length}`}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="stat-card cursor-pointer group"
              onClick={() => navigate(stat.link)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary">{stat.label}</p>
                  <p className="text-2xl font-semibold text-text-primary mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <Icon size={20} className={stat.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!isSupervisor && (
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 space-y-6">
            <div className="card p-0">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <h2 className="subsection-title">
                  {currentUser.role === 'counselor' ? '今日来访' : '今日安排'}
                </h2>
                {currentUser.role !== 'supervisor' && (
                  <button
                    onClick={() => navigate('/appointments')}
                    className="flex items-center gap-1 text-sm text-text-tertiary hover:text-primary-600 transition-colors"
                  >
                    查看全部 <ChevronRight size={14} />
                  </button>
                )}
              </div>
              <div>
                {todayAppointments.length === 0 ? (
                  <p className="text-text-tertiary text-center py-10 text-sm">今日暂无预约</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {todayAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-hover transition-colors cursor-pointer"
                        onClick={() => navigate('/appointments')}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 text-center">
                            <p className="text-sm font-medium text-text-primary">{formatTime(apt.time)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {currentUser.role === 'counselor' ? apt.clientName : apt.clientName}
                            </p>
                            <p className="text-2xs text-text-tertiary mt-0.5">
                              {currentUser.role === 'reception'
                                ? (apt.counselorName || '待分配')
                                : apt.type === 'initial' ? '初访' : '复访'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TypeBadge type={apt.type} />
                          <StatusBadge type="appointment" status={apt.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {rescheduleRequests.length > 0 && currentUser.role === 'reception' && (
              <div className="card p-0">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <h2 className="subsection-title">改期申请</h2>
                  <span className="badge badge-pending">{rescheduleRequests.length}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {rescheduleRequests.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-hover transition-colors cursor-pointer"
                      onClick={() => navigate('/appointments')}
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">{apt.clientName}</p>
                        <p className="text-2xs text-text-tertiary mt-0.5">
                          {apt.date} {apt.time} → {apt.rescheduleRequest?.requestedDate} {apt.rescheduleRequest?.requestedTime}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-2xs text-text-tertiary">{apt.rescheduleRequest?.reason}</p>
                        <ArrowRight size={14} className="text-text-tertiary" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="col-span-2">
            <div className="card p-0">
              <div className="px-5 py-4 border-b border-gray-50">
                <h2 className="subsection-title">待办</h2>
              </div>
              <div>
                {filteredTodos.length === 0 ? (
                  <p className="text-text-tertiary text-center py-10 text-sm">暂无待办</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {filteredTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className={`px-5 py-3 border-l-[3px] ${priorityStyles[todo.priority]} cursor-pointer hover:brightness-95 transition-all`}
                        onClick={() => {
                          if (todo.type === 'reschedule') navigate('/appointments');
                          if (todo.type === 'triage') navigate('/triage');
                          if (todo.type === 'scale') navigate('/scales');
                          if (todo.type === 'risk') navigate('/risk');
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="badge badge-completed text-text-tertiary">{todoTypeLabels[todo.type]}</span>
                          <p className="text-sm text-text-primary">{todo.title}</p>
                        </div>
                        {todo.description && (
                          <p className="text-2xs text-text-tertiary mt-1 ml-14">{todo.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isSupervisor && (
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3">
            <div className="card p-0">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <h2 className="subsection-title">待审核个案</h2>
                <button
                  onClick={() => navigate('/risk')}
                  className="flex items-center gap-1 text-sm text-text-tertiary hover:text-primary-600 transition-colors"
                >
                  查看全部 <ChevronRight size={14} />
                </button>
              </div>
              <div>
                {pendingRiskCases.length === 0 ? (
                  <p className="text-text-tertiary text-center py-10 text-sm">暂无待审核个案</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {pendingRiskCases.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-hover transition-colors cursor-pointer"
                        onClick={() => navigate('/risk')}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            c.riskLevel === 'critical' ? 'bg-red-50' : 'bg-amber-50'
                          }`}>
                            <AlertTriangle size={14} className={
                              c.riskLevel === 'critical' ? 'text-red-500' : 'text-amber-500'
                            } />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">{anonymize(c.clientName)}</p>
                            <p className="text-2xs text-text-tertiary mt-0.5">
                              {c.counselorName} 上报 · {c.reportedAt}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${c.riskLevel === 'critical' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                            {c.riskLevel === 'critical' ? '极高' : '高'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <div className="card p-0">
              <div className="px-5 py-4 border-b border-gray-50">
                <h2 className="subsection-title">待办</h2>
              </div>
              <div>
                {filteredTodos.length === 0 ? (
                  <p className="text-text-tertiary text-center py-10 text-sm">暂无待办</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {filteredTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className={`px-5 py-3 border-l-[3px] ${priorityStyles[todo.priority]} cursor-pointer hover:brightness-95 transition-all`}
                        onClick={() => navigate('/risk')}
                      >
                        <div className="flex items-center gap-2">
                          <span className="badge badge-completed text-text-tertiary">{todoTypeLabels[todo.type]}</span>
                          <p className="text-sm text-text-primary">{todo.title}</p>
                        </div>
                        {todo.description && (
                          <p className="text-2xs text-text-tertiary mt-1 ml-14">{todo.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
