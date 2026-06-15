import { FileWarning, Clock, AlertTriangle, CheckCircle, TrendingUp, Archive, FileCheck } from 'lucide-react';
import { useClaimStore } from '../store/claimStore';
import { ClaimCard } from '../components/ClaimCard';
import { CLAIM_STATUS_CONFIG, ClaimStatus } from '../constants/statusConfig';

export function Dashboard() {
  const { claims } = useClaimStore();

  const statusIcons: Record<ClaimStatus, typeof Clock> = {
    pending: Clock,
    processing: TrendingUp,
    review: FileWarning,
    approved: FileCheck,
    paid: CheckCircle,
    archived: Archive,
    exception: AlertTriangle,
  };

  const statCards = Object.entries(CLAIM_STATUS_CONFIG).map(([status, config]) => {
    const statusKey = status as ClaimStatus;
    const count = claims.filter((c) => c.status === statusKey).length;
    const Icon = statusIcons[statusKey];
    
    let statColor = config.color;
    if (statColor.includes('bg-yellow-100')) statColor = 'bg-yellow-50 text-yellow-600 border-yellow-200';
    if (statColor.includes('bg-blue-100')) statColor = 'bg-blue-50 text-blue-600 border-blue-200';
    if (statColor.includes('bg-purple-100')) statColor = 'bg-purple-50 text-purple-600 border-purple-200';
    if (statColor.includes('bg-indigo-100')) statColor = 'bg-indigo-50 text-indigo-600 border-indigo-200';
    if (statColor.includes('bg-green-100')) statColor = 'bg-green-50 text-green-600 border-green-200';
    if (statColor.includes('bg-gray-100')) statColor = 'bg-gray-50 text-gray-600 border-gray-200';
    if (statColor.includes('bg-red-100')) statColor = 'bg-red-50 text-red-600 border-red-200';

    return {
      status: statusKey,
      label: config.label,
      value: count,
      icon: Icon,
      color: statColor,
    };
  });

  const recentClaims = [...claims].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">工作台</h2>
          <p className="text-sm text-gray-500 mt-1">欢迎回来，今天有 {statCards.find((s) => s.status === 'pending')?.value || 0} 个待处理工单</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`bg-white rounded-xl border ${stat.color} p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-80">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">最近工单</h3>
          <span className="text-sm text-primary-600 hover:text-primary-700 cursor-pointer">查看全部</span>
        </div>
        <div className="grid gap-4">
          {recentClaims.length > 0 ? (
            recentClaims.map((claim) => <ClaimCard key={claim.id} claim={claim} />)
          ) : (
            <div className="text-center py-12 text-gray-400">
              <FileWarning className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无工单</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 text-white">
        <h3 className="font-semibold text-lg mb-2">处理流程指引</h3>
        <div className="flex flex-wrap gap-6 mt-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">1</span>
            <span className="text-sm">客户报修</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">2</span>
            <span className="text-sm">创建申诉</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">3</span>
            <span className="text-sm">责任判定</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">4</span>
            <span className="text-sm">赔付审核</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">5</span>
            <span className="text-sm">完成赔付</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">6</span>
            <span className="text-sm">工单归档</span>
          </div>
        </div>
      </div>
    </div>
  );
}
