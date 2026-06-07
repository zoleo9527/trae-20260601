import { useNavigate } from 'react-router-dom';
import { RefreshCw, Wallet, AlertTriangle, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { StatCard } from '@/components/StatCard';
import { AlertBanner } from '@/components/AlertBanner';
import { RoleSelector } from '@/components/RoleSelector';
import { StatusTag } from '@/components/StatusTag';
import { formatDate } from '@/lib/utils';

export default function Home() {
  const navigate = useNavigate();
  const { 
    bottleReturnRecords, 
    depositReconciliations, 
    getStuckItems, 
    getAlertsForRole,
    currentUser,
    acknowledgeAlert,
    resolveAlert,
  } = useAppStore();

  const stuckItems = getStuckItems();
  const alerts = currentUser ? getAlertsForRole(currentUser.role) : [];
  const activeAlerts = alerts.filter(a => a.status !== 'resolved');

  const bottleStats = {
    total: bottleReturnRecords.length,
    pending: bottleReturnRecords.filter(r => r.status === 'pending_collection').length,
    verified: bottleReturnRecords.filter(r => r.status === 'verified').length,
    stuck: stuckItems.bottles.length,
  };

  const depositStats = {
    total: depositReconciliations.length,
    matched: depositReconciliations.filter(r => r.status === 'matched').length,
    verified: depositReconciliations.filter(r => r.status === 'verified').length,
    stuck: stuckItems.deposits.length,
  };

  return (
    <div className="space-y-6">
      <RoleSelector />

      {activeAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-red-800">
              需要处理的异常提醒 ({activeAlerts.filter(a => a.status === 'active').length} 个待确认)
            </h3>
          </div>
          {activeAlerts.slice(0, 3).map(alert => (
            <AlertBanner
              key={alert.id}
              alert={alert}
              onAcknowledge={() => acknowledgeAlert(alert.id)}
              onResolve={() => resolveAlert(alert.id, '已处理')}
            />
          ))}
          {activeAlerts.length > 3 && (
            <button
              onClick={() => navigate('/alerts')}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              查看全部 {activeAlerts.length} 个提醒 →
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="空瓶回收总数"
          value={bottleStats.total}
          icon={<RefreshCw className="w-6 h-6 text-white" />}
          color="bg-blue-500"
          onClick={() => navigate('/bottles')}
        />
        <StatCard
          title="待回收"
          value={bottleStats.pending}
          icon={<Clock className="w-6 h-6 text-white" />}
          color="bg-yellow-500"
          onClick={() => navigate('/bottles')}
        />
        <StatCard
          title="已核验"
          value={bottleStats.verified}
          icon={<CheckCircle className="w-6 h-6 text-white" />}
          color="bg-green-500"
          onClick={() => navigate('/bottles')}
        />
        <StatCard
          title="卡住的单子"
          value={bottleStats.stuck}
          icon={<XCircle className="w-6 h-6 text-white" />}
          color="bg-red-500"
          onClick={() => navigate('/bottles')}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="押金核对总数"
          value={depositStats.total}
          icon={<Wallet className="w-6 h-6 text-white" />}
          color="bg-purple-500"
          onClick={() => navigate('/deposits')}
        />
        <StatCard
          title="核对一致"
          value={depositStats.matched}
          icon={<CheckCircle className="w-6 h-6 text-white" />}
          color="bg-emerald-500"
          onClick={() => navigate('/deposits')}
        />
        <StatCard
          title="已核验"
          value={depositStats.verified}
          icon={<CheckCircle className="w-6 h-6 text-white" />}
          color="bg-teal-500"
          onClick={() => navigate('/deposits')}
        />
        <StatCard
          title="卡住的单子"
          value={depositStats.stuck}
          icon={<XCircle className="w-6 h-6 text-white" />}
          color="bg-orange-500"
          onClick={() => navigate('/deposits')}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">最近空瓶回收</h3>
            <button
              onClick={() => navigate('/bottles')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              查看全部 →
            </button>
          </div>
          <div className="space-y-3">
            {bottleReturnRecords.slice(0, 4).map(record => (
              <div key={record.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{record.customer.name}</p>
                  <p className="text-xs text-gray-500">
                    预期 {record.expectedBottles} 个 / 实收 {record.returnedBottles} 个
                  </p>
                </div>
                <div className="text-right">
                  <StatusTag type="bottle" status={record.status} />
                  <p className="text-xs text-gray-400 mt-1">{formatDate(record.createdAt, 'MM-dd HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">最近押金核对</h3>
            <button
              onClick={() => navigate('/deposits')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              查看全部 →
            </button>
          </div>
          <div className="space-y-3">
            {depositReconciliations.slice(0, 4).map(record => (
              <div key={record.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{record.customer.name}</p>
                  <p className="text-xs text-gray-500">
                    预期 ¥{record.expectedDeposit} / 实收 ¥{record.actualDeposit}
                    {record.difference !== 0 && (
                      <span className={record.difference < 0 ? 'text-red-500 ml-1' : 'text-green-500 ml-1'}>
                        ({record.difference > 0 ? '+' : ''}{record.difference})
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <StatusTag type="deposit" status={record.status} />
                  <p className="text-xs text-gray-400 mt-1">{formatDate(record.createdAt, 'MM-dd HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
