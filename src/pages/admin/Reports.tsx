
import { BarChart3, CheckCircle, PhoneCall, AlertTriangle } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { StatsCard } from '../../components/common/StatsCard';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { useData } from '../../contexts/DataContext';
import { ADMIN_SIDEBAR } from '../../utils/constants';

export function AdminReports() {
  const { vehicles, reports, followups, distributions } = useData();

  const completedFollowups = followups.filter(f => f.status === '已完成');
  const successRate = followups.length > 0 
    ? ((completedFollowups.length / followups.length) * 100).toFixed(1)
    : '0';

  const satisfactionStats = {
    非常满意: completedFollowups.filter(f => f.result?.serviceSatisfaction === '非常满意').length,
    满意: completedFollowups.filter(f => f.result?.serviceSatisfaction === '满意').length,
    一般: completedFollowups.filter(f => f.result?.serviceSatisfaction === '一般').length,
    不满意: completedFollowups.filter(f => f.result?.serviceSatisfaction === '不满意').length,
  };

  const statusStats = {
    已完成: followups.filter(f => f.status === '已完成').length,
    待回访: followups.filter(f => f.status === '待回访').length,
    无法联系: followups.filter(f => f.status === '无法联系').length,
  };

  return (
    <AppLayout role="admin" sidebarItems={ADMIN_SIDEBAR}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">统计报表</h1>
          <p className="text-gray-500 mt-1">回访数据统计分析</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="总回访数"
            value={followups.length}
            icon={<PhoneCall className="w-6 h-6" />}
            color="blue"
          />
          
          <StatsCard
            title="已完成"
            value={completedFollowups.length}
            icon={<CheckCircle className="w-6 h-6" />}
            color="green"
          />
          
          <StatsCard
            title="无法联系"
            value={statusStats.无法联系}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="red"
          />
          
          <StatsCard
            title="完成率"
            value={`${successRate}%`}
            icon={<BarChart3 className="w-6 h-6" />}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">满意度分布</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(satisfactionStats).map(([level, count]) => {
                  const percentage = completedFollowups.length > 0
                    ? (count / completedFollowups.length * 100).toFixed(1)
                    : '0';
                  
                  const colorClass = level === '非常满意' || level === '满意'
                    ? 'bg-green-500'
                    : level === '一般'
                      ? 'bg-yellow-500'
                      : 'bg-red-500';
                  
                  return (
                    <div key={level} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 font-medium">{level}</span>
                        <span className="text-gray-500">
                          {count} 人 ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${colorClass} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">回访状态分布</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(statusStats).map(([status, count]) => {
                  const percentage = followups.length > 0
                    ? (count / followups.length * 100).toFixed(1)
                    : '0';
                  
                  const colorClass = status === '已完成'
                    ? 'bg-green-500'
                    : status === '无法联系'
                      ? 'bg-red-500'
                      : 'bg-yellow-500';
                  
                  return (
                    <div key={status} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 font-medium">{status}</span>
                        <span className="text-gray-500">
                          {count} 人 ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${colorClass} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">业务数据概览</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-900">{vehicles.length}</p>
                <p className="text-sm text-gray-500 mt-1">登记车辆</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-900">{reports.length}</p>
                <p className="text-sm text-gray-500 mt-1">检测报告</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-900">{distributions.length}</p>
                <p className="text-sm text-gray-500 mt-1">报告发放</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-900">{followups.length}</p>
                <p className="text-sm text-gray-500 mt-1">回访任务</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
