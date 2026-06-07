import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Wrench, Monitor, Bell, AlertTriangle, CheckCircle, Clock, ChevronRight, Plus } from 'lucide-react';
import { inspectionAPI, repairAPI, notificationAPI } from '../services/api';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>({ inspections: [], repairs: [], notifications: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      inspectionAPI.list(),
      repairAPI.list(),
      notificationAPI.list({ userId: user.id, read: false })
    ]).then(([inspections, repairs, notifications]) => {
      setStats({ inspections, repairs, notifications });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;
  }

  const pendingInspections = stats.inspections.filter((i: any) => 
    ['PENDING', 'IN_PROGRESS', 'RETURNED', 'SUPPLEMENTED'].includes(i.status)
  );
  const pendingRepairs = stats.repairs.filter((r: any) => 
    ['PENDING_APPROVAL', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'RETURNED', 'REOPENED'].includes(r.status)
  );
  const myTasks = stats.repairs.filter((r: any) => 
    user?.role === 'TECHNICIAN' && r.assignedToId === user.id && ['ASSIGNED', 'IN_PROGRESS', 'RETURNED', 'REOPENED'].includes(r.status)
  );
  const needsReview = {
    inspections: stats.inspections.filter((i: any) => ['COMPLETED', 'SUPPLEMENTED'].includes(i.status)).length,
    pendingApprovalRepairs: stats.repairs.filter((r: any) => r.status === 'PENDING_APPROVAL').length,
    completedRepairs: stats.repairs.filter((r: any) => r.status === 'COMPLETED').length
  };

  const getRoleShortcuts = () => {
    switch (user?.role) {
      case 'NETWORK_ADMIN':
        return [
          { label: '新建巡检', icon: ClipboardCheck, action: () => navigate('/inspections/new'), color: 'bg-blue-500' },
          { label: '发起维修', icon: Wrench, action: () => navigate('/repairs/new'), color: 'bg-amber-500' },
          { label: '查看设备', icon: Monitor, action: () => navigate('/machines'), color: 'bg-green-500' }
        ];
      case 'EVENT_OPERATOR':
        return [
          { label: '赛事设备报修', icon: Wrench, action: () => navigate('/repairs/new'), color: 'bg-amber-500' },
          { label: '查看设备状态', icon: Monitor, action: () => navigate('/machines'), color: 'bg-green-500' }
        ];
      case 'STORE_MANAGER':
        return [
          { label: '待复核巡检', icon: ClipboardCheck, action: () => navigate('/inspections?filter=COMPLETED,SUPPLEMENTED'), color: 'bg-purple-500', badge: needsReview.inspections },
          { label: '待审批工单', icon: Wrench, action: () => navigate('/repairs?filter=PENDING_APPROVAL&title=待审批工单'), color: 'bg-amber-500', badge: needsReview.pendingApprovalRepairs },
          { label: '待复核工单', icon: CheckCircle, action: () => navigate('/repairs?filter=COMPLETED&title=待复核工单'), color: 'bg-cyan-500', badge: needsReview.completedRepairs },
          { label: '设备总览', icon: Monitor, action: () => navigate('/machines'), color: 'bg-green-500' }
        ];
      case 'TECHNICIAN':
        return [
          { label: '我的维修任务', icon: Wrench, action: () => navigate(`/repairs?assignedToId=${user.id}&filter=ASSIGNED,IN_PROGRESS,RETURNED,REOPENED`), color: 'bg-amber-500', badge: myTasks.length },
          { label: '待处理巡检', icon: ClipboardCheck, action: () => navigate('/inspections'), color: 'bg-blue-500' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">欢迎回来，{user?.name}</h2>
            <p className="text-primary-100 mt-1">
              {user?.role === 'NETWORK_ADMIN' && '今日巡检任务已就绪，确保设备正常运行'}
              {user?.role === 'EVENT_OPERATOR' && '赛事设备状态一目了然，活动顺利进行'}
              {user?.role === 'STORE_MANAGER' && '待处理事项已汇总，高效管理店铺运营'}
              {user?.role === 'TECHNICIAN' && '维修任务实时更新，快速响应报修'}
            </p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Bell size={32} />
          </div>
        </div>
      </div>

      {/* Role-specific shortcuts */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">常用操作</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {getRoleShortcuts().map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={item.action}
                className="card hover:shadow-lg transition-shadow text-left flex items-center gap-4 group"
              >
                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center text-white`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 group-hover:text-primary-600 transition-colors">{item.label}</p>
                  {item.badge !== undefined && item.badge > 0 && (
                    <p className="text-sm text-red-500 font-medium">待处理 {item.badge} 项</p>
                  )}
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-primary-600 transition-colors" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待处理巡检</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{pendingInspections.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="text-blue-600" size={20} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">进行中维修</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{pendingRepairs.length}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Wrench className="text-amber-600" size={20} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">设备总数</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.inspections.length > 0 ? '5' : '0'}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Monitor className="text-green-600" size={20} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">未读通知</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.notifications.length}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Bell className="text-red-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">最近巡检</h3>
            <button onClick={() => navigate('/inspections')} className="text-sm text-primary-600 hover:underline">
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {stats.inspections.slice(0, 4).map((item: any) => (
              <div key={item.id} onClick={() => navigate(`/inspections/${item.id}`)} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <div className={`w-2 h-2 rounded-full ${
                  item.status === 'REVIEWED' ? 'bg-green-500' :
                  item.status === 'RETURNED' ? 'bg-red-500' :
                  item.status === 'COMPLETED' ? 'bg-blue-500' : 'bg-amber-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.machine?.machineNo} - {item.machine?.name}</p>
                  <p className="text-xs text-gray-500">巡检人：{item.inspector?.name}</p>
                </div>
                <span className={`status-badge ${
                  item.status === 'REVIEWED' ? 'bg-green-100 text-green-800' :
                  item.status === 'RETURNED' ? 'bg-red-100 text-red-800' :
                  item.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                  item.status === 'SUPPLEMENTED' ? 'bg-purple-100 text-purple-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {item.status === 'PENDING' && '待处理'}
                  {item.status === 'IN_PROGRESS' && '进行中'}
                  {item.status === 'COMPLETED' && '待复核'}
                  {item.status === 'RETURNED' && '已退回'}
                  {item.status === 'SUPPLEMENTED' && '已补录'}
                  {item.status === 'REVIEWED' && '已复核'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">最近维修工单</h3>
            <button onClick={() => navigate('/repairs')} className="text-sm text-primary-600 hover:underline">
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {stats.repairs.slice(0, 4).map((item: any) => (
              <div key={item.id} onClick={() => navigate(`/repairs/${item.id}`)} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <div className={`w-2 h-2 rounded-full ${
                  item.status === 'REVIEWED' ? 'bg-green-500' :
                  item.status === 'COMPLETED' ? 'bg-blue-500' :
                  ['ASSIGNED', 'IN_PROGRESS'].includes(item.status) ? 'bg-amber-500' : 'bg-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.machine?.machineNo} · {item.creator?.name}</p>
                </div>
                <span className={`status-badge ${
                  item.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                  item.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                  item.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.priority === 'CRITICAL' && '紧急'}
                  {item.priority === 'HIGH' && '高'}
                  {item.priority === 'MEDIUM' && '中'}
                  {item.priority === 'LOW' && '低'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
