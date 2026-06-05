import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Coffee, MessageSquareWarning, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { useStore, RiskItem, RecentChange } from '@/store';

function StatCard({ icon: Icon, label, count, linkTo, color }: {
  icon: typeof Flame;
  label: string;
  count: number;
  linkTo: string;
  color: string;
}) {
  return (
    <Link to={linkTo} className="card hover:shadow-md transition-shadow duration-200 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className="text-2xl font-display font-bold text-roast-text">{count}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </Link>
  );
}

function RiskAlertCard({ item, onClick }: { item: RiskItem; onClick?: () => void }) {
  const severityColor = item.severity === 'high' ? 'border-risk-red bg-red-50' : item.severity === 'medium' ? 'border-pending-amber bg-amber-50' : 'border-gray-300 bg-gray-50';
  return (
    <div
      className={`border-l-4 ${severityColor} rounded-r-lg p-4 cursor-pointer hover:shadow-sm transition-shadow ${onClick ? '' : 'cursor-default'}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className={`w-4 h-4 ${item.severity === 'high' ? 'text-risk-red' : item.severity === 'medium' ? 'text-pending-amber' : 'text-gray-500'}`} />
            <span className="font-medium text-sm text-roast-text">{item.title}</span>
          </div>
          <p className="text-xs text-gray-500">{item.description}</p>
        </div>
        {onClick && <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5" />}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-gray-200" />
        <div className="space-y-2">
          <div className="h-6 w-8 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { dashboard, loading, fetchDashboard } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRiskClick = (item: RiskItem) => {
    if (item.linkTo) {
      navigate(item.linkTo);
    }
  };

  const getChangeLink = (change: RecentChange): string | null => {
    const targetMatch = change.target.match(/(\w+)#(\d+)/);
    if (!targetMatch) {
      if (change.module === 'roast_curve') return '/roast-curves';
      if (change.module === 'cupping_score') return '/cupping-scores';
      if (change.module === 'complaint' || change.module === 'inventory_batch') return '/complaints-inventory';
      return null;
    }
    const [, targetType, targetId] = targetMatch;
    if (targetType === 'roast_curve') return `/roast-curves/${targetId}`;
    if (targetType === 'cupping_score') return `/cupping-scores/${targetId}`;
    if (targetType === 'complaint' || targetType === 'inventory_batch') return '/complaints-inventory';
    return null;
  };

  const handleChangeClick = (change: RecentChange) => {
    const link = getChangeLink(change);
    if (link) navigate(link);
  };

  if (loading.dashboard && !dashboard) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-display font-bold text-roast-text mb-6">仪表盘</h1>
        <div className="grid grid-cols-3 gap-5 mb-8">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-display font-bold text-roast-text mb-6">仪表盘</h1>

      <div className="grid grid-cols-3 gap-5 mb-8">
        <StatCard
          icon={Flame}
          label="待处理曲线"
          count={dashboard.pendingCounts.curves}
          linkTo="/roast-curves"
          color="bg-roast-orange"
        />
        <StatCard
          icon={Coffee}
          label="待审核杯测"
          count={dashboard.pendingCounts.cuppingScores}
          linkTo="/cupping-scores"
          color="bg-roast-brown"
        />
        <StatCard
          icon={MessageSquareWarning}
          label="未处理客诉"
          count={dashboard.pendingCounts.complaints}
          linkTo="/complaints-inventory"
          color="bg-risk-red"
        />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <h2 className="text-lg font-display font-semibold text-roast-text mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-risk-red" />
            风险预警
          </h2>
          {dashboard.riskItems.length === 0 ? (
            <div className="card text-center text-gray-400 py-8">暂无风险项</div>
          ) : (
            <div className="space-y-3">
              {dashboard.riskItems.map((item) => (
                <RiskAlertCard key={item.id} item={item} onClick={() => handleRiskClick(item)} />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-display font-semibold text-roast-text mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-roast-orange" />
            近期变更
          </h2>
          {dashboard.recentChanges.length === 0 ? (
            <div className="card text-center text-gray-400 py-8">暂无近期变更</div>
          ) : (
            <div className="card space-y-0">
              {dashboard.recentChanges.map((change, idx) => {
                const hasLink = !!getChangeLink(change);
                return (
                  <div
                    key={change.id}
                    className={`flex items-start gap-3 py-3 ${idx > 0 ? 'border-t border-gray-50' : ''} ${hasLink ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
                    onClick={() => hasLink && handleChangeClick(change)}
                  >
                    <div className="w-2 h-2 rounded-full bg-roast-orange mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-roast-text">
                        <span className="font-medium">{change.operator}</span>
                        <span className="text-gray-400 mx-1">在</span>
                        <span className="text-roast-orange">{change.module}</span>
                        <span className="text-gray-400 mx-1">执行了</span>
                        <span>{change.action}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{change.target} · {new Date(change.timestamp).toLocaleString('zh-CN')}</div>
                    </div>
                    {hasLink && <ChevronRight className="w-4 h-4 text-gray-300 mt-1" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
