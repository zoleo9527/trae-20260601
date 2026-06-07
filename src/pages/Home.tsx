import { AlertBanner } from '@/components/AlertBanner';
import { RoleSelector } from '@/components/RoleSelector';
import { StatCard } from '@/components/StatCard';
import { formatDate, getNearExpiryStatusColor, getNearExpiryStatusText, getReviewStatusColor, getReviewStatusText, getRoleText } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import { AlertTriangle, CheckCircle, Clock, FileCheck, Tag, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const { 
    getAlertsForRole,
    currentUser,
    acknowledgeAlert,
    resolveAlert,
    nearExpiryRecords,
    offShelfReviews,
    users,
  } = useAppStore();

  const alerts = currentUser ? getAlertsForRole(currentUser.role) : [];
  const activeAlerts = alerts.filter(a => a.status !== 'resolved');

  const nearExpiryStats = {
    total: nearExpiryRecords.length,
    pending: nearExpiryRecords.filter(r => r.status === 'pending_process').length,
    inReview: nearExpiryRecords.filter(r => ['pending_review', 'review_rejected', 'supplement_requested'].includes(r.status)).length,
    completed: nearExpiryRecords.filter(r => r.status === 'completed').length,
  };

  const reviewStats = {
    total: offShelfReviews.length,
    pending: offShelfReviews.filter(r => ['pending', 'under_review'].includes(r.status)).length,
    supplement: offShelfReviews.filter(r => ['supplement_requested', 'rejected'].includes(r.status)).length,
    approved: offShelfReviews.filter(r => r.status === 'approved').length,
  };

  const getUserName = (userId?: string) => {
    if (!userId) return '-';
    const user = users.find(u => u.id === userId);
    return user ? user.name : '-';
  };

  const quickEntries = [
    { role: 'store_manager' as const, title: '店长工作台', desc: '临期商品处理、提交下架复核', icon: Tag, color: 'bg-cyan-500', path: '/near-expiry' },
    { role: 'supervisor' as const, title: '督导工作台', desc: '下架复核初审、门店巡检', icon: FileCheck, color: 'bg-blue-500', path: '/off-shelf-review' },
    { role: 'product_specialist' as const, title: '商品专员工作台', desc: '下架复核终审、商品管理', icon: CheckCircle, color: 'bg-violet-500', path: '/off-shelf-review' },
  ];

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

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷工作台入口</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickEntries.map(entry => (
            <div
              key={entry.role}
              className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer border border-gray-100 hover:border-gray-200"
              onClick={() => navigate(entry.path)}
            >
              <div className="flex items-center gap-4">
                <div className={`${entry.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                  <entry.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{entry.title}</h3>
                  <p className="text-sm text-gray-500">{entry.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
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

      {reviewStats.supplement > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-orange-800">
                有 {reviewStats.supplement} 条复核记录需要注意
              </p>
              <p className="text-sm text-orange-700">
                包含待补录和已驳回的申请，请及时处理
              </p>
            </div>
            <button
              onClick={() => navigate('/off-shelf-review')}
              className="ml-auto px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              去处理
            </button>
          </div>
        </div>
      )}

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
                    {review.store.name} · 提交人: {getUserName(review.submittedBy)}
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

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4">团队成员</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {users.filter(u => ['store_manager', 'supervisor', 'product_specialist'].includes(u.role)).map(user => (
            <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{getRoleText(user.role)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
