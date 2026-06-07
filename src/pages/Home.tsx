import { AlertBanner } from '@/components/AlertBanner';
import { RoleSelector } from '@/components/RoleSelector';
import { StatCard } from '@/components/StatCard';
import { StatusTag } from '@/components/StatusTag';
import { formatDate, getNearExpiryStatusColor, getNearExpiryStatusText, getReviewStatusColor, getReviewStatusText } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import { AlertTriangle, CheckCircle, Clock, FileCheck, RefreshCw, Tag, Wallet, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    nearExpiryRecords,
    offShelfReviews,
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

  const nearExpiryStats = {
    total: nearExpiryRecords.length,
    pending: nearExpiryRecords.filter(r => r.status === 'pending_process').length,
    inReview: nearExpiryRecords.filter(r => ['pending_review', 'review_rejected'].includes(r.status)).length,
    completed: nearExpiryRecords.filter(r => r.status === 'completed').length,
  };

  const reviewStats = {
    total: offShelfReviews.length,
    pending: offShelfReviews.filter(r => ['pending', 'under_review'].includes(r.status)).length,
    supplement: offShelfReviews.filter(r => ['supplement_requested', 'rejected'].includes(r.status)).length,
    approved: offShelfReviews.filter(r => r.status === 'approved').length,
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
              onResolve={(remark) => resolveAlert(alert.id, remark)}
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="临期商品总数"
          value={nearExpiryStats.total}
          icon={<Tag className="w-6 h-6 text-white" />}
          color="bg-cyan-500"
          onClick={() => navigate('/near-expiry')}
        />
        <StatCard
          title="临期待处理"
          value={nearExpiryStats.pending}
          icon={<Clock className="w-6 h-6 text-white" />}
          color="bg-amber-500"
          onClick={() => navigate('/near-expiry')}
        />
        <StatCard
          title="复核申请数"
          value={reviewStats.total}
          icon={<FileCheck className="w-6 h-6 text-white" />}
          color="bg-violet-500"
          onClick={() => navigate('/off-shelf-review')}
        />
        <StatCard
          title="复核待处理"
          value={reviewStats.pending}
          icon={<AlertTriangle className="w-6 h-6 text-white" />}
          color="bg-rose-500"
          onClick={() => navigate('/off-shelf-review')}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">最近临期商品</h3>
            <button
              onClick={() => navigate('/near-expiry')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              查看全部 →
            </button>
          </div>
          <div className="space-y-3">
            {nearExpiryRecords.slice(0, 4).map(record => (
              <div key={record.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{record.product.name}</p>
                  <p className="text-xs text-gray-500">
                    {record.store.name} · {record.quantity}{record.product.unit}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getNearExpiryStatusColor(record.status)}`}>
                    {getNearExpiryStatusText(record.status)}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(record.createdAt, 'MM-dd HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">最近下架复核</h3>
            <button
              onClick={() => navigate('/off-shelf-review')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              查看全部 →
            </button>
          </div>
          <div className="space-y-3">
            {offShelfReviews.slice(0, 4).map(review => (
              <div key={review.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{review.nearExpiryRecord.product.name}</p>
                  <p className="text-xs text-gray-500">
                    {review.store.name} · 提交人: {review.submittedBy}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getReviewStatusColor(review.status)}`}>
                    {getReviewStatusText(review.status)}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(review.createdAt, 'MM-dd HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
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
