import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { RoleSelector } from '@/components/RoleSelector';
import { StatCard } from '@/components/StatCard';
import { formatDate, getNearExpiryStatusText, getNearExpiryStatusColor, getProcessMethodText, getRoleText } from '@/lib/utils';
import { AlertTriangle, Clock, CheckCircle, XCircle, ChevronRight, Tag, Gift, ArrowLeftCircle, Trash2, FileText, Plus, X } from 'lucide-react';
import type { NearExpiryRecord } from '@/types';

export default function NearExpiryPage() {
  const {
    currentUser,
    nearExpiryRecords,
    getFilteredNearExpiry,
    processNearExpiry,
    submitNearExpiryForReview,
    supplementReview,
    offShelfReviews,
    users,
  } = useAppStore();

  const [selectedRecord, setSelectedRecord] = useState<NearExpiryRecord | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processMethod, setProcessMethod] = useState<'mark_down' | 'donate' | 'return' | 'destroy'>('mark_down');
  const [markdownPrice, setMarkdownPrice] = useState('');
  const [remark, setRemark] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'processing' | 'review' | 'done'>('all');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showSupplementModal, setShowSupplementModal] = useState(false);
  const [supplementRemark, setSupplementRemark] = useState('');

  const filteredRecords = getFilteredNearExpiry();

  const tabFilters: Record<string, NearExpiryRecord[]> = {
    all: filteredRecords,
    pending: filteredRecords.filter(r => r.status === 'pending_process'),
    processing: filteredRecords.filter(r => ['marked_down', 'donated', 'returned', 'destroyed'].includes(r.status)),
    review: filteredRecords.filter(r => ['pending_review', 'review_rejected', 'review_approved'].includes(r.status)),
    done: filteredRecords.filter(r => r.status === 'completed'),
  };

  const displayRecords = tabFilters[activeTab];

  const stats = {
    total: nearExpiryRecords.length,
    pending: nearExpiryRecords.filter(r => r.status === 'pending_process').length,
    inReview: nearExpiryRecords.filter(r => ['pending_review', 'review_rejected'].includes(r.status)).length,
    completed: nearExpiryRecords.filter(r => r.status === 'completed').length,
  };

  const getUserName = (userId?: string) => {
    if (!userId) return '-';
    const user = users.find(u => u.id === userId);
    return user ? user.name : '-';
  };

  const handleProcess = () => {
    if (!selectedRecord) return;
    const extra: any = {};
    if (processMethod === 'mark_down' && markdownPrice) {
      extra.markdownPrice = parseFloat(markdownPrice);
    }
    processNearExpiry(selectedRecord.id, processMethod, remark, extra);
    setShowProcessModal(false);
    setSelectedRecord(null);
    setRemark('');
    setMarkdownPrice('');
  };

  const handleSubmitReview = () => {
    if (!selectedRecord) return;
    submitNearExpiryForReview(selectedRecord.id, remark || '提交复核');
    setShowSubmitConfirm(false);
    setSelectedRecord(null);
    setRemark('');
  };

  const handleSupplement = () => {
    if (!selectedRecord) return;
    const review = offShelfReviews.find(r => r.nearExpiryId === selectedRecord.id);
    if (review) {
      supplementReview(review.id, supplementRemark || '补录资料');
    }
    setShowSupplementModal(false);
    setSelectedRecord(null);
    setSupplementRemark('');
  };

  const getReviewForRecord = (recordId: string) => {
    return offShelfReviews.find(r => r.nearExpiryId === recordId);
  };

  const EmptyState = ({ message, icon: Icon }: { message: string; icon: any }) => (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <Icon className="w-16 h-16 mb-4" />
      <p className="text-lg">{message}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <RoleSelector />

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">临期商品处理工作台</h2>
        <p className="text-sm text-gray-500">
          {currentUser?.role === 'store_manager' ? '店长工作台 - 处理门店临期商品' : '查看所有门店临期商品'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="临期商品总数"
          value={stats.total}
          icon={<Tag className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="待处理"
          value={stats.pending}
          icon={<Clock className="w-6 h-6 text-white" />}
          color="bg-yellow-500"
        />
        <StatCard
          title="复核中"
          value={stats.inReview}
          icon={<AlertTriangle className="w-6 h-6 text-white" />}
          color="bg-orange-500"
        />
        <StatCard
          title="已完成"
          value={stats.completed}
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
              { key: 'processing', label: '处理中' },
              { key: 'review', label: '复核中' },
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
          {displayRecords.length === 0 ? (
            <EmptyState message="暂无相关记录" icon={Tag} />
          ) : (
            displayRecords.map(record => {
              const review = getReviewForRecord(record.id);
              const isUrgent = record.daysRemaining <= 1;
              return (
                <div
                  key={record.id}
                  className="p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedRecord(record)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {record.product.name}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getNearExpiryStatusColor(record.status)}`}>
                          {getNearExpiryStatusText(record.status)}
                        </span>
                        {isUrgent && record.status === 'pending_process' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            紧急
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span>{record.product.spec}</span>
                        <span>数量: {record.quantity}{record.product.unit}</span>
                        <span>金额: ¥{record.totalAmount.toFixed(2)}</span>
                        <span className={isUrgent ? 'text-red-500 font-medium' : ''}>
                          距过期: {record.daysRemaining > 0 ? `${record.daysRemaining}天` : `已过期${Math.abs(record.daysRemaining)}天`}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                        <span>门店: {record.store.name}</span>
                        <span>生产日期: {formatDate(record.productionDate, 'MM-dd')}</span>
                        <span>过期日期: {formatDate(record.expiryDate, 'MM-dd')}</span>
                        {record.processMethod && (
                          <span>处理方式: {getProcessMethodText(record.processMethod)}</span>
                        )}
                      </div>
                      {review?.status === 'rejected' && review.rejectReason && (
                        <div className="mt-2 bg-red-50 border border-red-100 rounded-lg p-2 text-sm text-red-700">
                          <span className="font-medium">驳回原因: </span>{review.rejectReason}
                        </div>
                      )}
                      {review?.status === 'supplement_requested' && review.supplementRequest && (
                        <div className="mt-2 bg-orange-50 border border-orange-100 rounded-lg p-2 text-sm text-orange-700">
                          <span className="font-medium">补录要求: </span>{review.supplementRequest}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 ml-4" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">临期商品详情</h3>
              <button
                onClick={() => {
                  setSelectedRecord(null);
                  setRemark('');
                  setMarkdownPrice('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">商品名称</p>
                  <p className="font-medium text-gray-900">{selectedRecord.product.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">商品编码</p>
                  <p className="font-medium text-gray-900">{selectedRecord.product.sku}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">规格</p>
                  <p className="font-medium text-gray-900">{selectedRecord.product.spec}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">数量</p>
                  <p className="font-medium text-gray-900">{selectedRecord.quantity}{selectedRecord.product.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">单价</p>
                  <p className="font-medium text-gray-900">¥{selectedRecord.unitPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">总金额</p>
                  <p className="font-medium text-gray-900">¥{selectedRecord.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">生产日期</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedRecord.productionDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">过期日期</p>
                  <p className={`font-medium ${selectedRecord.daysRemaining <= 1 ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatDate(selectedRecord.expiryDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">所属门店</p>
                  <p className="font-medium text-gray-900">{selectedRecord.store.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">当前状态</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getNearExpiryStatusColor(selectedRecord.status)}`}>
                    {getNearExpiryStatusText(selectedRecord.status)}
                  </span>
                </div>
              </div>

              {selectedRecord.remark && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">备注</p>
                  <p className="text-sm text-gray-700">{selectedRecord.remark}</p>
                </div>
              )}

              {selectedRecord.processMethod && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">处理信息</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">处理方式: </span>
                      <span className="text-gray-900">{getProcessMethodText(selectedRecord.processMethod)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">处理人: </span>
                      <span className="text-gray-900">{getUserName(selectedRecord.handledBy)}</span>
                    </div>
                    {selectedRecord.markdownPrice && (
                      <div>
                        <span className="text-gray-500">促销价: </span>
                        <span className="text-gray-900">¥{selectedRecord.markdownPrice.toFixed(2)}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">处理时间: </span>
                      <span className="text-gray-900">{selectedRecord.handledAt ? formatDate(selectedRecord.handledAt) : '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedRecord.submittedAt && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">复核信息</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600">提交人: </span>
                      <span className="text-blue-900">{getUserName(selectedRecord.submittedBy)}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">提交时间: </span>
                      <span className="text-blue-900">{formatDate(selectedRecord.submittedAt)}</span>
                    </div>
                    {selectedRecord.reviewedBy && (
                      <>
                        <div>
                          <span className="text-blue-600">复核人: </span>
                          <span className="text-blue-900">{getUserName(selectedRecord.reviewedBy)}</span>
                        </div>
                        <div>
                          <span className="text-blue-600">复核时间: </span>
                          <span className="text-blue-900">{selectedRecord.reviewedAt ? formatDate(selectedRecord.reviewedAt) : '-'}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {selectedRecord.reviewRemark && (
                    <p className="mt-2 text-sm text-blue-700">
                      <span className="font-medium">复核意见: </span>{selectedRecord.reviewRemark}
                    </p>
                  )}
                  {selectedRecord.rejectReason && (
                    <p className="mt-2 text-sm text-red-600">
                      <span className="font-medium">驳回原因: </span>{selectedRecord.rejectReason}
                    </p>
                  )}
                </div>
              )}

              {selectedRecord.status === 'pending_process' && currentUser?.role === 'store_manager' && (
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setShowProcessModal(true)}
                    className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    处理临期商品
                  </button>
                </div>
              )}

              {(selectedRecord.status === 'marked_down' || selectedRecord.status === 'donated' || selectedRecord.status === 'returned' || selectedRecord.status === 'destroyed') && currentUser?.role === 'store_manager' && !selectedRecord.submittedAt && (
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setShowSubmitConfirm(true)}
                    className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    提交下架复核
                  </button>
                </div>
              )}

              {selectedRecord.status === 'review_rejected' && currentUser?.role === 'store_manager' && (
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setShowSupplementModal(true)}
                    className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    补录资料重新提交
                  </button>
                </div>
              )}

              {(selectedRecord.status === 'supplement_requested') && currentUser?.role === 'store_manager' && (
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setShowSupplementModal(true)}
                    className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    补录资料
                  </button>
                </div>
              )}

              {selectedRecord.status === 'review_approved' && currentUser?.role === 'store_manager' && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-green-600 mb-3 text-center">复核已通过，请执行实际下架操作</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showProcessModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">选择处理方式</h3>
              <button
                onClick={() => setShowProcessModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'mark_down', label: '降价促销', icon: Tag, color: 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-400' },
                  { key: 'donate', label: '捐赠处理', icon: Gift, color: 'border-purple-200 bg-purple-50 text-purple-700 hover:border-purple-400' },
                  { key: 'return', label: '退回供应商', icon: ArrowLeftCircle, color: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-400' },
                  { key: 'destroy', label: '销毁处理', icon: Trash2, color: 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-400' },
                ].map(option => (
                  <button
                    key={option.key}
                    onClick={() => setProcessMethod(option.key as any)}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      processMethod === option.key
                        ? option.color + ' border-current'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <option.icon className="w-6 h-6" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>

              {processMethod === 'mark_down' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    促销单价 (元)
                  </label>
                  <input
                    type="number"
                    value={markdownPrice}
                    onChange={(e) => setMarkdownPrice(e.target.value)}
                    placeholder={`原价: ¥${selectedRecord.unitPrice}`}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注说明
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="请输入处理说明..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowProcessModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleProcess}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                >
                  确认处理
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSubmitConfirm && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">提交下架复核</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                确定要提交 <span className="font-medium text-gray-900">{selectedRecord.product.name}</span> 的下架复核申请吗？
                提交后将由督导和商品专员进行复核。
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注说明
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="请输入提交说明..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitReview}
                  className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
                >
                  确认提交
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSupplementModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">补录资料</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                请补充相关资料后重新提交复核
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  补录说明
                </label>
                <textarea
                  value={supplementRemark}
                  onChange={(e) => setSupplementRemark(e.target.value)}
                  placeholder="请输入补录资料说明..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSupplementModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSupplement}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
                >
                  提交补录
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
