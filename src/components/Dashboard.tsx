import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { statusLabels, statusColors, UserRole, RepairOrder, StatusHistory } from '@/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Activity,
  ChevronRight,
  RefreshCw,
  MessageSquare,
  Package,
  Timer,
  Wrench,
  User,
  Filter,
  Eye,
  FileText
} from 'lucide-react';

interface DashboardProps {
  role: UserRole;
  onViewOrder: (orderId: string) => void;
}

type ActivityFilter = 'all' | 'rework' | 'completion';
type PendingFilter = 'all' | 'rework';

export function Dashboard({ role, onViewOrder }: DashboardProps) {
  const { getOrdersForRole, getPendingCount, getRecentActivity, users, orders } = useStore();
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [pendingFilter, setPendingFilter] = useState<PendingFilter>('all');
  
  const roleOrders = getOrdersForRole(role);
  const pendingCount = getPendingCount(role);
  const allActivity = getRecentActivity(role);

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || '未知';
  };

  const getPendingCompletion = (order: RepairOrder) => {
    return order.completions.find(c => !c.confirmed);
  };

  const getLastConfirmedCompletion = (order: RepairOrder) => {
    return [...order.completions].reverse().find(c => c.confirmed);
  };

  const getLastRework = (order: RepairOrder) => {
    return order.reworks.length > 0 ? order.reworks[order.reworks.length - 1] : null;
  };

  const getReworkOriginalCompletion = (order: RepairOrder) => {
    const lastRework = getLastRework(order);
    if (!lastRework) return null;
    return order.completions.find(c => c.id === lastRework.originalCompletionId);
  };

  const pendingOrders = useMemo(() => {
    return roleOrders.filter(o => {
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
  }, [roleOrders, role]);

  const reworkPendingCount = pendingOrders.filter(o => 
    o.status.startsWith('rework') || o.reworks.length > 0
  ).length;

  const filteredPendingOrders = useMemo(() => {
    if (pendingFilter === 'rework') {
      return pendingOrders.filter(o => o.status.startsWith('rework') || o.reworks.length > 0);
    }
    return pendingOrders;
  }, [pendingOrders, pendingFilter]);

  const getActivityDetail = (activity: StatusHistory) => {
    const order = orders.find(o => o.id === activity.orderId);
    if (!order) return null;

    if (activity.status === 'rework_requested') {
      const rework = order.reworks.find(r => 
        r.requestedAt === activity.changedAt || 
        Math.abs(new Date(r.requestedAt).getTime() - new Date(activity.changedAt).getTime()) < 1000
      );
      return { type: 'rework_request', rework };
    }

    if (activity.status === 'completion_confirmed' || activity.status === 'rework_completion_confirmed') {
      const completion = order.completions.find(c => 
        c.confirmedAt === activity.changedAt ||
        (c.confirmedAt && Math.abs(new Date(c.confirmedAt).getTime() - new Date(activity.changedAt).getTime()) < 1000)
      );
      return { type: 'completion_confirm', completion };
    }

    if (activity.status === 'completion_submitted' || activity.status === 'rework_completion_submitted') {
      const completion = order.completions.find(c => 
        c.submittedAt === activity.changedAt ||
        Math.abs(new Date(c.submittedAt).getTime() - new Date(activity.changedAt).getTime()) < 1000
      );
      return { type: 'completion_submit', completion };
    }

    return null;
  };

  const filteredActivity = useMemo(() => {
    return allActivity.filter(activity => {
      if (activityFilter === 'rework') return activity.status.includes('rework');
      if (activityFilter === 'completion') return activity.status.includes('completion');
      return true;
    });
  }, [allActivity, activityFilter]);

  const totalReworkCount = orders.filter(o => o.reworks.length > 0).length;
  const hasConfirmRemarkCount = orders.reduce((sum, o) => 
    sum + o.completions.filter(c => c.confirmRemark).length, 0
  );

  const stats = [
    { label: '全部工单', value: roleOrders.length, icon: ClipboardList, color: 'bg-blue-500' },
    { label: '待处理', value: pendingCount, icon: Clock, color: 'bg-orange-500' },
    { label: '已完成', value: roleOrders.filter(o => o.status === 'completion_confirmed' || o.status === 'rework_completion_confirmed').length, icon: CheckCircle2, color: 'bg-green-500' },
    { label: '返修相关', value: totalReworkCount, icon: RefreshCw, color: 'bg-red-500' },
  ];

  const getActivityIcon = (status: string) => {
    if (status.includes('rework')) return <RefreshCw className="w-4 h-4" />;
    if (status.includes('completion')) return <CheckCircle2 className="w-4 h-4" />;
    if (status === 'in_progress') return <Wrench className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getActivityColor = (status: string) => {
    if (status.includes('rework')) return 'bg-red-100 text-red-600';
    if (status.includes('completion')) return 'bg-green-100 text-green-600';
    if (status === 'in_progress') return 'bg-yellow-100 text-yellow-600';
    return 'bg-blue-100 text-blue-600';
  };

  const renderOrderSummary = (order: RepairOrder) => {
    const pendingCompletion = getPendingCompletion(order);
    const lastRework = getLastRework(order);
    const originalCompletion = getReworkOriginalCompletion(order);
    const lastConfirmed = getLastConfirmedCompletion(order);

    const isReworkStatus = order.status.startsWith('rework');

    let displayCompletion = null;
    let displayType = '';

    if (pendingCompletion) {
      displayCompletion = pendingCompletion;
      displayType = pendingCompletion.isRework ? 'rework_pending_confirm' : 'pending_confirm';
    } else if (lastRework && originalCompletion) {
      displayCompletion = originalCompletion;
      displayType = 'rework_request';
    } else if (lastConfirmed) {
      displayCompletion = lastConfirmed;
      displayType = 'last_confirmed';
    }

    return (
      <div className="space-y-2 mt-2">
        {lastRework && (
          <div className="flex items-start space-x-1.5 bg-red-50 border border-red-100 rounded-md p-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-medium text-red-700">返修原因：</span>
              <span className="text-red-600">{lastRework.reason}</span>
            </div>
          </div>
        )}

        {displayType === 'rework_request' && displayCompletion && (
          <div className="bg-amber-50 border border-amber-100 rounded-md p-2">
            <p className="text-xs font-medium text-amber-700 mb-1.5 flex items-center">
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              关联的上次完工记录
            </p>
            <div className="text-xs space-y-1.5">
              <div className="text-amber-800">
                <span className="font-medium">维修说明：</span>
                {displayCompletion.description}
              </div>
              {displayCompletion.confirmRemark && (
                <div className="text-emerald-700 bg-emerald-50/50 rounded p-1.5">
                  <span className="font-medium">确认备注：</span>
                  {displayCompletion.confirmRemark}
                </div>
              )}
              <div className="flex items-center space-x-4 text-amber-600 pt-1">
                {displayCompletion.materialsUsed && (
                  <span className="flex items-center space-x-1">
                    <Package className="w-3 h-3" />
                    <span className="truncate max-w-24">{displayCompletion.materialsUsed}</span>
                  </span>
                )}
                {displayCompletion.laborHours !== undefined && (
                  <span className="flex items-center space-x-1">
                    <Timer className="w-3 h-3" />
                    <span>{displayCompletion.laborHours} 小时</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {displayType === 'pending_confirm' && displayCompletion && (
          <div className="bg-blue-50 border border-blue-100 rounded-md p-2">
            <p className="text-xs font-medium text-blue-700 mb-1.5 flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1" />
              待确认的完工内容
            </p>
            <div className="text-xs space-y-1.5">
              <div className="text-blue-800">
                <span className="font-medium">维修说明：</span>
                {displayCompletion.description}
              </div>
              <div className="flex items-center space-x-4 text-blue-600 pt-1">
                {displayCompletion.materialsUsed && (
                  <span className="flex items-center space-x-1">
                    <Package className="w-3 h-3" />
                    <span className="truncate max-w-24">{displayCompletion.materialsUsed}</span>
                  </span>
                )}
                {displayCompletion.laborHours !== undefined && (
                  <span className="flex items-center space-x-1">
                    <Timer className="w-3 h-3" />
                    <span>{displayCompletion.laborHours} 小时</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {displayType === 'rework_pending_confirm' && displayCompletion && (
          <div className="bg-purple-50 border border-purple-100 rounded-md p-2">
            <p className="text-xs font-medium text-purple-700 mb-1.5 flex items-center">
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              待确认的返修完工
            </p>
            <div className="text-xs space-y-1.5">
              <div className="text-purple-800">
                <span className="font-medium">返修说明：</span>
                {displayCompletion.description}
              </div>
              <div className="flex items-center space-x-4 text-purple-600 pt-1">
                {displayCompletion.materialsUsed && (
                  <span className="flex items-center space-x-1">
                    <Package className="w-3 h-3" />
                    <span className="truncate max-w-24">{displayCompletion.materialsUsed}</span>
                  </span>
                )}
                {displayCompletion.laborHours !== undefined && (
                  <span className="flex items-center space-x-1">
                    <Timer className="w-3 h-3" />
                    <span>{displayCompletion.laborHours} 小时</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {displayType === 'last_confirmed' && displayCompletion?.confirmRemark && !lastRework && (
          <div className="flex items-start space-x-1.5 bg-emerald-50 border border-emerald-100 rounded-md p-2">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-medium text-emerald-700">确认备注：</span>
              <span className="text-emerald-600 line-clamp-2">{displayCompletion.confirmRemark}</span>
            </div>
          </div>
        )}

        {displayType === 'last_confirmed' && displayCompletion && !lastRework && !displayCompletion.confirmRemark && (
          displayCompletion.materialsUsed || displayCompletion.laborHours !== undefined ? (
            <div className="flex items-center space-x-4 text-xs text-gray-500 bg-gray-50 rounded-md p-2">
              {displayCompletion.materialsUsed && (
                <span className="flex items-center space-x-1">
                  <Package className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate max-w-32">{displayCompletion.materialsUsed}</span>
                </span>
              )}
              {displayCompletion.laborHours !== undefined && (
                <span className="flex items-center space-x-1">
                  <Timer className="w-3.5 h-3.5 text-gray-400" />
                  <span>{displayCompletion.laborHours} 小时</span>
                </span>
              )}
            </div>
          ) : null
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">工作台</h2>
        <p className="text-sm text-gray-500">
          欢迎回来，以下是您的工作概览
          {hasConfirmRemarkCount > 0 && (
            <span className="ml-2 inline-flex items-center text-emerald-600">
              <MessageSquare className="w-3.5 h-3.5 mr-1" />
              {hasConfirmRemarkCount} 条确认备注可查
            </span>
          )}
        </p>
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
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
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
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPendingFilter('all')}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                    pendingFilter === 'all'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  全部 ({pendingOrders.length})
                </button>
                {reworkPendingCount > 0 && (
                  <button
                    onClick={() => setPendingFilter('rework')}
                    className={`px-3 py-1 text-xs rounded-full font-medium transition-colors flex items-center space-x-1 ${
                      pendingFilter === 'rework'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>返修相关 ({reworkPendingCount})</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto scrollbar-thin">
              {filteredPendingOrders.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {pendingFilter === 'rework' ? '暂无返修相关待处理工单' : '暂无待处理工单'}
                  </p>
                </div>
              ) : (
                filteredPendingOrders.slice(0, 8).map(order => {
                  const isRework = order.status.startsWith('rework') || order.reworks.length > 0;
                  
                  return (
                    <div 
                      key={order.id}
                      onClick={() => onViewOrder(order.id)}
                      className={`px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        isRework ? 'bg-red-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap gap-1.5">
                            <p className="font-medium text-gray-900">{order.title}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status]}`}>
                              {statusLabels[order.status]}
                            </span>
                            {order.status.startsWith('rework') && (
                              <span className="inline-flex items-center space-x-1 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                                <RefreshCw className="w-3 h-3" />
                                <span>返修流程</span>
                              </span>
                            )}
                            {order.reworks.length > 0 && !order.status.startsWith('rework') && (
                              <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                                <RefreshCw className="w-3 h-3" />
                                <span>有返修历史</span>
                              </span>
                            )}
                            {(getPendingCompletion(order)?.confirmRemark || getLastConfirmedCompletion(order)?.confirmRemark) && (
                              <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">
                                <MessageSquare className="w-3 h-3" />
                                <span>有备注</span>
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                            <span className="flex items-center space-x-1">
                              <User className="w-3.5 h-3.5" />
                              <span>{order.reporter}</span>
                            </span>
                            <span>{order.dormitory} {order.roomNumber}</span>
                            <span>{order.category}</span>
                          </div>
                          
                          <p className="text-xs text-gray-400 mt-0.5">
                            工单号：{order.orderNo}
                          </p>

                          {renderOrderSummary(order)}
                        </div>
                        <div className="flex items-center space-x-2 ml-3">
                          <Eye className="w-4 h-4 text-gray-400" />
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-primary-500" />
                  <span>最近动态</span>
                </h3>
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                {[
                  { key: 'all', label: '全部' },
                  { key: 'rework', label: '返修相关' },
                  { key: 'completion', label: '完工确认' }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setActivityFilter(filter.key as ActivityFilter)}
                    className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                      activityFilter === filter.key
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto scrollbar-thin">
              {filteredActivity.length === 0 ? (
                <div className="py-12 text-center">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    {activityFilter === 'rework' ? '暂无返修相关动态' : 
                     activityFilter === 'completion' ? '暂无完工确认动态' : '暂无动态'}
                  </p>
                </div>
              ) : (
                filteredActivity.slice(0, 15).map(activity => {
                  const isRework = activity.status.includes('rework');
                  const isCompletion = activity.status.includes('completion');
                  const order = orders.find(o => o.id === activity.orderId);
                  const orderNo = order?.orderNo || '';
                  const detail = getActivityDetail(activity);
                  
                  return (
                    <div 
                      key={activity.id} 
                      className={`px-5 py-3 ${
                        isRework ? 'bg-red-50/40' : isCompletion ? 'bg-green-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${getActivityColor(activity.status)}`}>
                          {getActivityIcon(activity.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">{getUserName(activity.changedBy)}</span>
                            </p>
                            {orderNo && (
                              <span className="text-xs text-gray-400">{orderNo}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mt-0.5">
                            {activity.remark || statusLabels[activity.status]}
                          </p>
                          
                          {detail && (
                            <div className="mt-1.5 text-xs space-y-1">
                              {detail.type === 'rework_request' && detail.rework && (
                                <div className="text-red-600 bg-red-50 rounded p-1.5">
                                  <span className="font-medium">返修原因：</span>
                                  {detail.rework.reason}
                                </div>
                              )}
                              {detail.type === 'completion_confirm' && detail.completion?.confirmRemark && (
                                <div className="text-emerald-700 bg-emerald-50 rounded p-1.5">
                                  <span className="font-medium">确认备注：</span>
                                  {detail.completion.confirmRemark}
                                </div>
                              )}
                              {detail.type === 'completion_submit' && detail.completion && (
                                <div className="text-blue-600 bg-blue-50 rounded p-1.5 space-y-1">
                                  <div>
                                    <span className="font-medium">维修说明：</span>
                                    {detail.completion.description}
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    {detail.completion.materialsUsed && (
                                      <span className="flex items-center space-x-1">
                                        <Package className="w-3 h-3" />
                                        <span>{detail.completion.materialsUsed}</span>
                                      </span>
                                    )}
                                    {detail.completion.laborHours !== undefined && (
                                      <span className="flex items-center space-x-1">
                                        <Timer className="w-3 h-3" />
                                        <span>{detail.completion.laborHours} 小时</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {activity.remark && order && !detail && (
                            <p className="text-xs text-gray-500 mt-1">
                              {order.title}
                            </p>
                          )}
                          
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(activity.changedAt), 'MM-dd HH:mm', { locale: zhCN })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
