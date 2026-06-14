import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, CheckCircle, AlertTriangle } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { StatsCard } from '../../components/common/StatsCard';
import { Card, CardContent } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { useData } from '../../contexts/DataContext';
import { INSPECTOR_SIDEBAR } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

export function InspectorDashboard() {
  const navigate = useNavigate();
  const { vehicles, tasks, reports } = useData();

  const pendingTasks = tasks.filter(t => t.status === '待执行');
  const inProgressTasks = tasks.filter(t => t.status === '进行中');
  const completedTasks = tasks.filter(t => t.status === '已完成');
  const rejectedReports = reports.filter(r => r.status === '已驳回');

  const getVehicleInfo = (vehicleId: string) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  return (
    <AppLayout role="inspector" sidebarItems={INSPECTOR_SIDEBAR}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">检测员工作台</h1>
            <p className="text-gray-500 mt-1">开始今天的车辆检测工作</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="待执行任务"
            value={pendingTasks.length}
            icon={<ClipboardCheck className="w-6 h-6" />}
            color="orange"
          />
          
          <StatsCard
            title="进行中"
            value={inProgressTasks.length}
            icon={<ClipboardCheck className="w-6 h-6" />}
            color="blue"
          />
          
          <StatsCard
            title="已完成"
            value={completedTasks.length}
            icon={<CheckCircle className="w-6 h-6" />}
            color="green"
          />
          
          <StatsCard
            title="被驳回"
            value={rejectedReports.length}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="red"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">待执行任务</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/inspector/tasks')}
                >
                  查看全部
                </Button>
              </div>
              
              <div className="space-y-3">
                {pendingTasks.length > 0 ? (
                  pendingTasks.slice(0, 5).map(task => {
                    const vehicle = getVehicleInfo(task.vehicleId);
                    return (
                      <div
                        key={task.id}
                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {vehicle?.plateNumber}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {vehicle?.ownerName} · {vehicle?.brand} {vehicle?.model}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              登记时间：{formatDate(task.createdAt)}
                            </p>
                          </div>
                          <StatusBadge status="待执行" size="sm" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-400 text-center py-8">暂无待执行任务</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">驳回报告</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/inspector/reports')}
                >
                  查看全部
                </Button>
              </div>
              
              <div className="space-y-3">
                {rejectedReports.length > 0 ? (
                  rejectedReports.slice(0, 5).map(report => {
                    const vehicle = getVehicleInfo(report.vehicleId);
                    return (
                      <div
                        key={report.id}
                        className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {vehicle?.plateNumber}
                            </p>
                            <p className="text-sm text-red-600 mt-1">
                              驳回原因：{report.rejectReason}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              审核员：{report.auditorName}
                            </p>
                          </div>
                          <StatusBadge status="已驳回" size="sm" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-400 text-center py-8">暂无驳回报告</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
