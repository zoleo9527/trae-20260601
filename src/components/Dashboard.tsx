import { Cpu, CheckCircle, AlertCircle, Clock, FileText, Package, Edit3, Eye } from 'lucide-react';
import type { DashboardStats } from '@/types';

interface DashboardProps {
  stats: DashboardStats;
  onNavigate: (tab: string) => void;
}

export function Dashboard({ stats, onNavigate }: DashboardProps) {
  const statCards = [
    { label: '总订单', value: stats.totalMachines, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '待测试', value: stats.pendingTest, icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50' },
    { label: '测试中', value: stats.testing, icon: Cpu, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '补录中', value: stats.reRecording, icon: Edit3, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: '待复核', value: stats.pendingReview, icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: '待验收', value: stats.pendingApproval, icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: '验收通过', value: stats.approved, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '已交付', value: stats.completed, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index}
              className={`${stat.bg} rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => {
                if (stat.label === '待测试' || stat.label === '测试中') {
                  onNavigate('testing');
                } else if (stat.label === '待验收') {
                  onNavigate('approval');
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <Icon className={`h-8 w-8 ${stat.color} opacity-50`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">今日统计</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">今日烤机测试</p>
              <p className="text-2xl font-bold text-blue-600">{stats.todayTests}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">今日交付</p>
              <p className="text-2xl font-bold text-green-600">{stats.todayDeliveries}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">待处理异常</p>
              <p className="text-2xl font-bold text-red-600">{stats.exceptions}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">待验收订单</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingApproval}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">状态分布</h3>
          <div className="space-y-3">
            {[
              { label: '待测试', value: stats.pendingTest, color: 'bg-gray-400', percent: stats.totalMachines ? (stats.pendingTest / stats.totalMachines * 100).toFixed(1) : '0' },
              { label: '测试中', value: stats.testing, color: 'bg-blue-500', percent: stats.totalMachines ? (stats.testing / stats.totalMachines * 100).toFixed(1) : '0' },
              { label: '补录中', value: stats.reRecording, color: 'bg-cyan-500', percent: stats.totalMachines ? (stats.reRecording / stats.totalMachines * 100).toFixed(1) : '0' },
              { label: '待复核', value: stats.pendingReview, color: 'bg-indigo-500', percent: stats.totalMachines ? (stats.pendingReview / stats.totalMachines * 100).toFixed(1) : '0' },
              { label: '待验收', value: stats.pendingApproval, color: 'bg-yellow-500', percent: stats.totalMachines ? (stats.pendingApproval / stats.totalMachines * 100).toFixed(1) : '0' },
              { label: '验收通过', value: stats.approved, color: 'bg-green-500', percent: stats.totalMachines ? (stats.approved / stats.totalMachines * 100).toFixed(1) : '0' },
              { label: '验收驳回', value: stats.rejected, color: 'bg-orange-500', percent: stats.totalMachines ? (stats.rejected / stats.totalMachines * 100).toFixed(1) : '0' },
              { label: '已交付', value: stats.completed, color: 'bg-purple-500', percent: stats.totalMachines ? (stats.completed / stats.totalMachines * 100).toFixed(1) : '0' },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="w-20 text-sm text-gray-600">{item.label}</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color}`} 
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
                <span className="w-12 text-sm text-gray-500 text-right">{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
