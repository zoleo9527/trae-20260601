import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { RoleSelector } from '@/components/RoleSelector';
import { StatCard } from '@/components/StatCard';
import { formatDate, getReviewStatusText, getReviewStatusColor, getProcessMethodText, getRoleText, getOperationTypeText } from '@/lib/utils';
import { FileCheck, Clock, CheckCircle, XCircle, AlertTriangle, ChevronRight, User, Calendar, MessageSquare, X, History, ArrowRight } from 'lucide-react';
import type { OffShelfReview } from '@/types';

export default function OffShelfReviewPage() {
  const {
    currentUser,
    offShelfReviews,
    getFilteredReviews,
    reviewOffShelf,
    users,
    getRelatedLogsByReviewId,
    completeNearExpiry,
  } = useAppStore();

  const [selectedReview, setSelectedReview] = useState<OffShelfReview | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'request_supplement'>('approve');
  const [remark, setRemark] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'reviewing' | 'supplement' | 'done'>('all');
  const [showHistory, setShowHistory] = useState(false);

  const filteredReviews = getFilteredReviews();

  const tabFilters: Record<string, OffShelfReview[]> = {
    all: filteredReviews,
    pending: filteredReviews.filter(r => r.status === 'pending'),
    reviewing: filteredReviews.filter(r => r.status === 'under_review'),
    supplement: filteredReviews.filter(r => r.status === 'supplement_requested' || r.status === 'rejected'),
    done: filteredReviews.filter(r => r.status === 'approved'),
  };

  const displayReviews = tabFilters[activeTab];

  const stats = {
    total: offShelfReviews.length,
    pending: offShelfReviews.filter(r => r.status === 'pending' || r.status === 'under_review').length,
    supplement: offShelfReviews.filter(r => r.status === 'supplement_requested' || r.status === 'rejected').length,
    approved: offShelfReviews.filter(r => r.status === 'approved').length,
  };

  const getUserName = (userId?: string) => {
    if (!userId) return '-';
    const user = users.find(u => u.id === userId);
    return user ? user.name : '-';
  };

  const handleAction = () => {
    if (!selectedReview) return;
    reviewOffShelf(selectedReview.id, actionType, remark || '审核意见');
    setShowActionModal(false);
    setSelectedReview(null);
    setRemark('');
  };

  const handleComplete = () => {
    if (!selectedReview) return;
    completeNearExpiry(selectedReview.nearExpiryId, '商品专员确认完成');
    setSelectedReview(null);
  };

  const EmptyState = ({ message, icon: Icon }: { message: string; icon: any }) => (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <Icon className="w-16 h-16 mb-4" />
      <p className="text-lg">{message}</p>
    </div>
  );

  const canHandle = (review: OffShelfReview) => {
    if (!currentUser) return false;
    if (currentUser.role === 'supervisor') {
      return review.currentHandlerRole === 'supervisor' && (review.status === 'pending' || review.status === 'supplement_requested');
    }
    if (currentUser.role === 'product_specialist') {
      return review.currentHandlerRole === 'product_specialist' && review.status === 'under_review';
    }
    return false;
  };

  const getActionButtonText = () => {
    if (currentUser?.role === 'supervisor') {
      return '督导审核';
    }
    if (currentUser?.role === 'product_specialist') {
      return '商品专员复核';
    }
    return '审核';
  };

  return (
    <div className="space-y-6">
      <RoleSelector />

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">下架复核工作台</h2>
        <p className="text-sm text-gray-500">
          {currentUser?.role === 'supervisor' ? '督导工作台 - 下架复核初审' : 
           currentUser?.role === 'product_specialist' ? '商品专员工作台 - 下架复核终审' : 
           '查看所有下架复核记录'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="复核申请总数"
          value={stats.total}
          icon={<FileCheck className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="待我处理"
          value={stats.pending}
          icon={<Clock className="w-6 h-6 text-white" />}
          color="bg-yellow-500"
        />
        <StatCard
          title="待补录/驳回"
          value={stats.supplement}
          icon={<AlertTriangle className="w-6 h-6 text-white" />}
          color="bg-orange-500"
        />
        <StatCard
          title="已通过"
          value={stats.approved}
          icon={<CheckCircle className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-100 px-5">
          <div className="flex gap-1">
            {[
              { key: 'all', label: '全部' },
              { key: 'pending', label: '待处理' },
              { key: 'reviewing', label: '审核中' },
              { key: 'supplement', label: '待补录' },
              { key: 'done', label: '已完成' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {displayReviews.length === 0 ? (
            <EmptyState message="暂无相关复核记录" icon={FileCheck} />
          ) : (
            displayReviews.map(review => (
              <div
                key={review.id}
                className="p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedReview(review)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {review.nearExpiryRecord.product.name}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getReviewStatusColor(review.status)}`}>
                        {getReviewStatusText(review.status)}
                      </span>
                      {canHandle(review) && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium animate-pulse">
                          待我处理
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span>{review.nearExpiryRecord.product.spec}</span>
                      <span>数量: {review.nearExpiryRecord.quantity}{review.nearExpiryRecord.product.unit}</span>
                      <span>处理方式: {getProcessMethodText(review.nearExpiryRecord.processMethod || '')}</span>
                      <span>门店: {review.store.name}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span>提交人: {getUserName(review.submittedBy)}</span>
                      <span>提交时间: {formatDate(review.submittedAt, 'MM-dd HH:mm')}</span>
                      <span>当前处理: {getRoleText(review.currentHandlerRole)}</span>
                    </div>
                    {review.rejectReason && (
                      <div className="mt-2 bg-red-50 border border-red-100 rounded-lg p-2 text-sm text-red-700">
                        <span className="font-medium">驳回原因: </span>{review.rejectReason}
                      </div>
                    )}
                    {review.supplementRequest && (
                      <div className="mt-2 bg-orange-50 border border-orange-100 rounded-lg p-2 text-sm text-orange-700">
                        <span className="font-medium">补录要求: </span>{review.supplementRequest}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 ml-4" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedReview && !showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">下架复核详情</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHistory(true)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                  title="查看操作历史"
                >
                  <History className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedReview(null);
                    setRemark('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{selectedReview.nearExpiryRecord.product.name}</p>
                  <p className="text-sm text-gray-500">{selectedReview.nearExpiryRecord.product.spec}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${getReviewStatusColor(selectedReview.status)}`}>
                  {getReviewStatusText(selectedReview.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">数量</p>
                  <p className="font-medium text-gray-900">
                    {selectedReview.nearExpiryRecord.quantity}{selectedReview.nearExpiryRecord.product.unit}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">总金额</p>
                  <p className="font-medium text-gray-900">¥{selectedReview.nearExpiryRecord.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">处理方式</p>
                  <p className="font-medium text-gray-900">
                    {getProcessMethodText(selectedReview.nearExpiryRecord.processMethod || '')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">所属门店</p>
                  <p className="font-medium text-gray-900">{selectedReview.store.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">生产日期</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(selectedReview.nearExpiryRecord.productionDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">过期日期</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(selectedReview.nearExpiryRecord.expiryDate)}
                  </p>
                </div>
              </div>

              {selectedReview.nearExpiryRecord.processMethod === 'mark_down' && selectedReview.nearExpiryRecord.markdownPrice && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">促销信息</p>
                  <p className="text-sm text-blue-700">
                    原价: ¥{selectedReview.nearExpiryRecord.unitPrice.toFixed(2)} → 
                    促销价: ¥{selectedReview.nearExpiryRecord.markdownPrice.toFixed(2)}
                  </p>
                </div>
              )}

              {selectedReview.nearExpiryRecord.remark && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">店长备注</p>
                  <p className="text-sm text-gray-700">{selectedReview.nearExpiryRecord.remark}</p>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-900">流程进度</p>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                  
                  <div className="relative flex items-start gap-4 pb-6">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 z-10">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">店长提交申请</p>
                      <p className="text-xs text-gray-500">
                        {getUserName(selectedReview.submittedBy)} · {formatDate(selectedReview.submittedAt)}
                      </p>
                    </div>
                  </div>

                  {selectedReview.firstReviewedAt && (
                    <div className="relative flex items-start gap-4 pb-6">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 z-10">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">督导初审</p>
                        <p className="text-xs text-gray-500">
                          {getUserName(selectedReview.firstReviewedBy)} · {formatDate(selectedReview.firstReviewedAt)}
                        </p>
                        {selectedReview.firstReviewRemark && (
                          <p className="text-xs text-gray-600 mt-1">意见: {selectedReview.firstReviewRemark}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedReview.finalReviewedAt && (
                    <div className="relative flex items-start gap-4 pb-6">
                      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 z-10">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">商品专员终审</p>
                        <p className="text-xs text-gray-500">
                          {getUserName(selectedReview.finalReviewedBy)} · {formatDate(selectedReview.finalReviewedAt)}
                        </p>
                        {selectedReview.finalReviewRemark && (
                          <p className="text-xs text-gray-600 mt-1">意见: {selectedReview.finalReviewRemark}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedReview.supplementSubmittedAt && (
                    <div className="relative flex items-start gap-4 pb-6">
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 z-10">
                        <MessageSquare className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">店长补录资料</p>
                        <p className="text-xs text-gray-500">
                          {getUserName(selectedReview.supplementSubmittedBy)} · {formatDate(selectedReview.supplementSubmittedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {!selectedReview.firstReviewedAt && (
                    <div className="relative flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 z-10">
                        <Clock className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-400">等待督导审核</p>
                      </div>
                    </div>
                  )}

                  {selectedReview.firstReviewedAt && !selectedReview.finalReviewedAt && selectedReview.status === 'under_review' && (
                    <div className="relative flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 z-10">
                        <Clock className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-400">等待商品专员复核</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedReview.rejectReason && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-sm font-medium text-red-800 mb-1">驳回原因</p>
                  <p className="text-sm text-red-700">{selectedReview.rejectReason}</p>
                </div>
              )}

              {selectedReview.supplementRequest && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                  <p className="text-sm font-medium text-orange-800 mb-1">补录要求</p>
                  <p className="text-sm text-orange-700">{selectedReview.supplementRequest}</p>
                </div>
              )}

              {canHandle(selectedReview) && (
                <div className="pt-4 border-t border-gray-100 flex gap-3">
                  <button
                    onClick={() => {
                      setActionType('request_supplement');
                      setShowActionModal(true);
                    }}
                    className="flex-1 py-3 border border-orange-200 text-orange-600 rounded-xl font-medium hover:bg-orange-50 transition-colors"
                  >
                    要求补录
                  </button>
                  <button
                    onClick={() => {
                      setActionType('reject');
                      setShowActionModal(true);
                    }}
                    className="flex-1 py-3 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
                  >
                    驳回
                  </button>
                  <button
                    onClick={() => {
                      setActionType('approve');
                      setShowActionModal(true);
                    }}
                    className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
                  >
                    通过
                  </button>
                </div>
              )}

              {currentUser?.role === 'product_specialist' && selectedReview.status === 'approved' && !selectedReview.nearExpiryRecord.completedAt && (
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={handleComplete}
                    className="w-full py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                  >
                    确认完成处理
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedReview && showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">操作历史记录</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {getRelatedLogsByReviewId(selectedReview.id).map((log, index) => (
                  <div key={log.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                      {index < getRelatedLogsByReviewId(selectedReview.id).length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {getOperationTypeText(log.operationType)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(log.createdAt, 'MM-dd HH:mm')}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        操作人: {log.operatorName} ({getRoleText(log.operatorRole)})
                      </p>
                      {log.remark && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-3">
                          {log.remark}
                        </p>
                      )}
                      {(log.oldStatus || log.newStatus) && (
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          {log.oldStatus && (
                            <span className="text-gray-500">{getReviewStatusText(log.oldStatus)}</span>
                          )}
                          {log.oldStatus && log.newStatus && (
                            <ArrowRight className="w-3 h-3 text-gray-400" />
                          )}
                          {log.newStatus && (
                            <span className="text-green-600 font-medium">{getReviewStatusText(log.newStatus)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showActionModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {actionType === 'approve' ? '通过审核' : 
                 actionType === 'reject' ? '驳回申请' : '要求补录'}
              </h3>
              <button
                onClick={() => setShowActionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                {actionType === 'approve' && `确定要通过 ${selectedReview.nearExpiryRecord.product.name} 的下架复核吗？`}
                {actionType === 'reject' && `确定要驳回 ${selectedReview.nearExpiryRecord.product.name} 的下架复核吗？`}
                {actionType === 'request_supplement' && `要求店长补充 ${selectedReview.nearExpiryRecord.product.name} 的相关资料`}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {actionType === 'approve' ? '审核意见' : 
                   actionType === 'reject' ? '驳回原因' : '补录说明'}
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder={
                    actionType === 'approve' ? '请输入审核意见...' :
                    actionType === 'reject' ? '请输入驳回原因...' :
                    '请说明需要补录的内容...'
                  }
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAction}
                  className={`flex-1 py-3 text-white rounded-xl font-medium transition-colors ${
                    actionType === 'approve' ? 'bg-green-500 hover:bg-green-600' :
                    actionType === 'reject' ? 'bg-red-500 hover:bg-red-600' :
                    'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
