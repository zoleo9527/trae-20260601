import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  MapPin,
  CheckCircle,
  Send,
  RotateCcw,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useWorkOrderStore } from '../store/workOrderStore';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { WorkOrderList } from '../components/WorkOrderList';
import { WorkOrderDetail } from '../components/WorkOrderDetail';
import { DispatchModal } from '../components/DispatchModal';
import { OnSiteFeedbackModal } from '../components/OnSiteFeedbackModal';
import { EmptyState } from '../components/EmptyState';
import { roleLabels } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuthStore();
  const {
    workOrders,
    getTodoByRole,
    isDetailOpen,
    isDispatchModalOpen,
    isOnSiteModalOpen,
  } = useWorkOrderStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const todoList = useMemo(() => {
    if (!currentUser) return [];
    return getTodoByRole(currentUser);
  }, [currentUser, getTodoByRole, workOrders]);

  const stats = useMemo(() => {
    const pendingDispatch = workOrders.filter((wo) => wo.status === 'pending_dispatch').length;
    const inProgress = workOrders.filter(
      (wo) => wo.status === 'dispatched' || wo.status === 'on_site' || wo.status === 'in_progress'
    ).length;
    const returned = workOrders.filter((wo) => wo.status === 'returned').length;
    const completed = workOrders.filter((wo) => wo.status === 'completed').length;

    return [
      {
        title: '待派工',
        value: pendingDispatch,
        icon: <Clock className="w-6 h-6" />,
        color: 'neutral' as const,
        trend: { value: 12, isUp: false },
      },
      {
        title: '处理中',
        value: inProgress,
        icon: <AlertTriangle className="w-6 h-6" />,
        color: 'primary' as const,
        trend: { value: 8, isUp: true },
      },
      {
        title: '已退回',
        value: returned,
        icon: <RotateCcw className="w-6 h-6" />,
        color: 'danger' as const,
        trend: { value: 3, isUp: false },
      },
      {
        title: '已完成',
        value: completed,
        icon: <CheckCircle className="w-6 h-6" />,
        color: 'success' as const,
        trend: { value: 15, isUp: true },
      },
    ];
  }, [workOrders]);

  const getSubtitle = () => {
    if (!currentUser) return '';
    const roleName = roleLabels[currentUser.role];
    const count = todoList.length;
    return `当前${roleName} · 共有 ${count} 条待办事项`;
  };

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          title="待办看板"
          subtitle={getSubtitle()}
          showFilters={true}
        />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {stats.map((stat, index) => (
              <StatCard
                key={stat.title}
                {...stat}
              />
            ))}
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-neutral-800">
                  {currentUser.role === 'supervisor' ? '全部工单' : '我的待办'}
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  共 {todoList.length} 条记录
                </p>
              </div>
              {currentUser.role === 'dispatcher' && (
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <span className="inline-flex items-center gap-1">
                    <Send className="w-3 h-3" />
                    点击派工按钮分配工单
                  </span>
                </div>
              )}
              {currentUser.role === 'electrician' && (
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    点击到场反馈提交现场信息
                  </span>
                </div>
              )}
            </div>

            {todoList.length === 0 ? (
              <EmptyState
                type="todos"
                action={
                  <button className="btn-primary" onClick={() => {}}>
                    刷新列表
                  </button>
                }
              />
            ) : (
              <WorkOrderList workOrders={todoList} />
            )}
          </div>
        </main>
      </div>

      {isDetailOpen && <WorkOrderDetail />}
      {isDispatchModalOpen && <DispatchModal />}
      {isOnSiteModalOpen && <OnSiteFeedbackModal />}
    </div>
  );
}
