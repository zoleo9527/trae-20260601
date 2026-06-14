import { useNavigate } from 'react-router-dom';
import { PhoneCall, CheckCircle, AlertTriangle, History, BarChart3 } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { StatsCard } from '../../components/common/StatsCard';
import { Card, CardContent } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { useData } from '../../contexts/DataContext';
import { ADMIN_SIDEBAR } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { vehicles, reports, followups } = useData();

  const pendingFollowups = followups.filter(f => f.status === '待回访');
  const completedFollowups = followups.filter(f => f.status === '已完成');
  const failedFollowups = followups.filter(f => f.status === '无法联系');

  const recentFollowups = [...followups]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getVehicle = (vehicleId: string) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  const _getReport = (reportId: string) => {
    return reports.find(r => r.id === reportId);
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  return (
    <AppLayout role="admin" sidebarItems={ADMIN_SIDEBAR}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">全局概览</h1>
          <p className="text-gray-500 mt-1">管理所有车辆的回访工作</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="待回访"
            value={pendingFollowups.length}
            icon={<PhoneCall className="w-6 h-6" />}
            color="orange"
          />
          
          <StatsCard
            title="已完成"
            value={completedFollowups.length}
            icon={<CheckCircle className="w-6 h-6" />}
            color="green"
          />
          
          <StatsCard
            title="无法联系"
            value={failedFollowups.length}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="red"
          />
          
          <StatsCard
            title="总车辆数"
            value={vehicles.length}
            icon={<BarChart3 className="w-6 h-6" />}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">待回访任务</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/followup')}
                >
                  查看全部
                </Button>
              </div>
              
              <div className="space-y-3">
                {pendingFollowups.length > 0 ? (
                  pendingFollowups.map(followup => {
                    const vehicle = getVehicle(followup.vehicleId);
                    const overdue = isOverdue(followup.deadline);
                    return (
                      <div
                        key={followup.id}
                        className={`p-4 rounded-lg transition-colors ${
                          overdue ? 'bg-red-50 hover:bg-red-100' : 'bg-orange-50 hover:bg-orange-100'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {vehicle?.plateNumber}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {followup.ownerName} · {followup.ownerPhone}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {overdue ? (
                                <span className="text-red-600">已逾期 · 截止：{formatDate(followup.deadline)}</span>
                              ) : (
                                <>截止：{formatDate(followup.deadline)}</>
                              )}
                            </p>
                          </div>
                          <StatusBadge status={overdue ? '发放异常' : '待回访'} size="sm" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-400 text-center py-8">暂无待回访任务</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">最近回访记录</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/history')}
                >
                  <History className="w-4 h-4 mr-1" />
                  查看全部
                </Button>
              </div>
              
              <div className="space-y-3">
                {recentFollowups.length > 0 ? (
                  recentFollowups.slice(0, 5).map(followup => {
                    const vehicle = getVehicle(followup.vehicleId);
                    _getReport(followup.reportId);
                    return (
                      <div
                        key={followup.id}
                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {vehicle?.plateNumber}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {followup.ownerName}
                            </p>
                            {followup.result && (
                              <p className="text-xs text-green-600 mt-1">
                                满意度：{followup.result.serviceSatisfaction}
                              </p>
                            )}
                          </div>
                          <StatusBadge status={followup.status} size="sm" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-400 text-center py-8">暂无回访记录</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
