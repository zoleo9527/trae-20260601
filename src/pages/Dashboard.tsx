import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  MessageSquare, 
  AlertTriangle, 
  TrendingUp,
  ArrowRight,
  Clock,
  User
} from 'lucide-react';
import { useRenewalStore } from '../store';
import { useCommunicationStore } from '../store';
import { fetchRenewals, fetchCommunications } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';

export function Dashboard() {
  const { renewals, setRenewals } = useRenewalStore();
  const { communications, setCommunications } = useCommunicationStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [renewalData, communicationData] = await Promise.all([
        fetchRenewals(),
        fetchCommunications()
      ]);
      setRenewals(renewalData);
      setCommunications(communicationData);
      setLoading(false);
    }
    loadData();
  }, [setRenewals, setCommunications]);

  const stats = {
    pendingRenewals: renewals.filter(r => r.status === 'pending').length,
    riskRenewals: renewals.filter(r => r.status === 'risk').length,
    pendingCommunications: communications.filter(c => c.status === 'pending').length,
    highPriorityCommunications: communications.filter(c => c.priority === 'high').length,
  };

  const recentChanges = [
    ...renewals.slice(0, 3).map(r => ({
      id: r.id,
      type: 'renewal',
      title: `${r.studentName} - ${r.packageName}`,
      status: r.status,
      time: r.updatedAt,
    })),
    ...communications.slice(0, 3).map(c => ({
      id: c.id,
      type: 'communication',
      title: `${c.studentName} - ${c.subject}`,
      status: c.status,
      time: c.lastContactAt || c.updatedAt,
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">仪表盘</h1>
        <p className="text-gray-500 mt-1">概览课包续费与家长沟通状态</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">待处理续费</p>
              <p className="text-3xl font-bold text-gray-800">{stats.pendingRenewals}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <Link to="/renewals?status=pending" className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 mt-4">
            查看详情 <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">风险预警</p>
              <p className="text-3xl font-bold text-red-600">{stats.riskRenewals}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <Link to="/renewals?status=risk" className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 mt-4">
            查看详情 <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">待沟通任务</p>
              <p className="text-3xl font-bold text-gray-800">{stats.pendingCommunications}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <Link to="/communications?status=pending" className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 mt-4">
            查看详情 <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">高优先级</p>
              <p className="text-3xl font-bold text-orange-600">{stats.highPriorityCommunications}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <Link to="/communications?priority=high" className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 mt-4">
            查看详情 <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">待处理续费</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ) : renewals.filter(r => r.status === 'pending').length === 0 ? (
              <div className="p-8 text-center text-gray-500">暂无待处理续费</div>
            ) : (
              renewals.filter(r => r.status === 'pending').slice(0, 4).map(renewal => (
                <Link 
                  key={renewal.id} 
                  to={`/renewals/${renewal.id}`}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center gap-4"
                >
                  <img 
                    src={renewal.studentAvatar} 
                    alt={renewal.studentName}
                    className="w-12 h-12 rounded-full bg-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{renewal.studentName}</p>
                    <p className="text-sm text-gray-500 truncate">{renewal.packageName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">到期 {renewal.expireDate}</p>
                    <StatusBadge status={renewal.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">最近变更</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-gray-300 mt-2"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              recentChanges.map((change) => (
                <div key={change.id} className="px-6 py-4 flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    change.status === 'risk' ? 'bg-red-500' :
                    change.status === 'pending' ? 'bg-amber-500' :
                    'bg-green-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {change.type === 'renewal' ? (
                        <CreditCard className="w-4 h-4 text-gray-400" />
                      ) : (
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                      )}
                      <p className="text-sm font-medium text-gray-800 truncate">{change.title}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={change.status} />
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {change.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">风险预警</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ) : renewals.filter(r => r.status === 'risk').length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无风险预警</div>
          ) : (
            renewals.filter(r => r.status === 'risk').map(renewal => (
              <Link 
                key={renewal.id} 
                to={`/renewals/${renewal.id}`}
                className="px-6 py-4 hover:bg-red-50 transition-colors flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-gray-800">{renewal.studentName}</p>
                  </div>
                  <p className="text-sm text-gray-500">{renewal.packageName}</p>
                  {renewal.notes && (
                    <p className="text-sm text-red-600 mt-1">{renewal.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">到期 {renewal.expireDate}</p>
                  <StatusBadge status="risk" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
