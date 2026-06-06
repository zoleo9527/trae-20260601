import { useStore } from '@/store';
import { statusLabels, statusColors, UserRole } from '@/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Activity,
  ChevronRight
} from 'lucide-react';

interface DashboardProps {
  role: UserRole;
  onViewOrder: (orderId: string) => void;
}

export function Dashboard({ role, onViewOrder }: DashboardProps) {
  const { getOrdersForRole, getPendingCount, getRecentActivity, users } = useStore();
  const orders = getOrdersForRole(role);
  const pendingCount = getPendingCount(role);
  const recentActivity = getRecentActivity();

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || '未知';
  };

  const pendingOrders = orders.filter(o => {
    if (role === 'dorm_manager') {
      return o.status === 'completion_submitted' || o.status === 'rework_completion_submitted';
    }
    if (role === 'repair_worker') {
      return o.status === 'assigned' || o.status === 'rework_requested';
    }
    if (role === 'logistics_supervisor') {
      return o.status === 'pending';
    }
    return false;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const stats = [
    { label: '全部工单', value: orders.length, icon: ClipboardList, color: 'bg-blue-500' },
    { label: '待处理', value: pendingCount, icon: Clock, color: 'bg-orange-500' },
    { label: '已完成', value: orders.filter(o => o.status === 'completion_confirmed' || o.status === 'rework_completion_confirmed').length, icon: CheckCircle2, color: 'bg-green-500' },
    { label: '返修中', value: orders.filter(o => o.status.startsWith('rework')).length, icon: AlertTriangle, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">工作台</h2>
        <p className="text-sm text-gray-500">欢迎回来，以下是您的工作概览</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <span>待处理工单</span>
                {pendingCount > 0 && (
                  <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {pendingOrders.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-gray-500">暂无待处理工单</p>
                </div>
              ) : (
                pendingOrders.slice(0, 5).map(order => (
                  <div 
                    key={order.id}
                    onClick={() => onViewOrder(order.id)}
                    className="px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">{order.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status]}`}>
                            {statusLabels[order.status]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {order.dormitory} {order.roomNumber} · {order.category}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          工单号：{order.orderNo}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-primary-500" />
                <span>最近动态</span>
              </h3>
            </div>
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto scrollbar-thin">
              {recentActivity.length === 0 ? (
                <div className="py-12 text-center">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">暂无动态</p>
                </div>
              ) : (
                recentActivity.slice(0, 10).map(activity => (
                  <div key={activity.id} className="px-5 py-3">
                    <div className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        activity.status.includes('rework') ? 'bg-red-500' :
                        activity.status.includes('completion') ? 'bg-green-500' :
                        activity.status === 'in_progress' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{getUserName(activity.changedBy)}</span>
                          <span className="text-gray-600"> {activity.remark || statusLabels[activity.status]}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {format(new Date(activity.changedAt), 'MM-dd HH:mm', { locale: zhCN })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
