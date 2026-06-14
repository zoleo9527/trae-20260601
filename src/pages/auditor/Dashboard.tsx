
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { StatsCard } from '../../components/common/StatsCard';
import { Card, CardContent } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { useData } from '../../contexts/DataContext';
import { AUDITOR_SIDEBAR } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

export function AuditorDashboard() {
  const navigate = useNavigate();
  const { vehicles, reports, distributions, followups } = useData();

  const pendingReports = reports.filter(r => r.status === '待审核');
  const passedReports = reports.filter(r => r.status === '已通过');
  const pendingDistribution = distributions.filter(d => d.status === '待发放' || d.status === '发放中');
  const todayFollowups = followups.filter(f => f.status === '待回访' || f.status === '回访中');

  const getVehicle = (vehicleId: string) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  return (
    <AppLayout role="auditor" sidebarItems={AUDITOR_SIDEBAR}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">审核员工作台</h1>
          <p className="text-gray-500 mt-1">审核检测报告并管理发放</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="待审核"
            value={pendingReports.length}
            icon={<ClipboardList className="w-6 h-6" />}
            color="orange"
          />
          
          <StatsCard
            title="已通过"
            value={passedReports.length}
            icon={<CheckCircle className="w-6 h-6" />}
            color="green"
          />
          
          <StatsCard
            title="待发放"
            value={pendingDistribution.length}
            icon={<Send className="w-6 h-6" />}
            color="blue"
          />
          
          <StatsCard
            title="待回访"
            value={todayFollowups.length}
            icon={<AlertCircle className="w-6 h-6" />}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">待审核报告</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/auditor/reports')}
                >
                  查看全部
                </Button>
              </div>
              
              <div className="space-y-3">
                {pendingReports.length > 0 ? (
                  pendingReports.slice(0, 5).map(report => {
                    const vehicle = getVehicle(report.vehicleId);
                    return (
                      <div
                        key={report.id}
                        className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {vehicle?.plateNumber}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {vehicle?.ownerName} · {report.conclusion}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              提交时间：{formatDate(report.submittedAt || '')}
                            </p>
                          </div>
                          <StatusBadge status="待审核" size="sm" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-400 text-center py-8">暂无待审核报告</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">待发放报告</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/auditor/distribution')}
                >
                  查看全部
                </Button>
              </div>
              
              <div className="space-y-3">
                {pendingDistribution.length > 0 ? (
                  pendingDistribution.slice(0, 5).map(dist => {
                    const report = reports.find(r => r.id === dist.reportId);
                    const vehicle = report ? getVehicle(report.vehicleId) : null;
                    return (
                      <div
                        key={dist.id}
                        className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {vehicle?.plateNumber}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {vehicle?.ownerName}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              审核通过：{formatDate(report?.auditedAt || '')}
                            </p>
                          </div>
                          <StatusBadge status={dist.status} size="sm" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-400 text-center py-8">暂无待发放报告</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
