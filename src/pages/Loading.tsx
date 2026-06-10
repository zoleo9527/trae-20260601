import { useState, useEffect } from 'react';
import { loadingApi } from '../api/endpoints';
import type { LoadingBatch } from '../../shared/types.js';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStore } from '../stores/appStore';
import {
  Truck,
  Filter,
  Check,
  X,
  AlertTriangle,
  Flower2,
  ShoppingCart,
  Calendar,
  User,
  Eye,
  ArrowLeftRight,
  Info,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  History,
  CheckCircle,
} from 'lucide-react';

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待复核' },
  { value: 'confirmed', label: '已确认' },
  { value: 'rejected', label: '已退回' },
];

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'amber'> = {
  pending: 'amber',
  confirmed: 'success',
  rejected: 'danger',
};

const inspectionVariants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'amber'> = {
  qualified: 'success',
  damaged: 'warning',
  rework: 'danger',
};

  const [allBatches, setAllBatches] = useState<LoadingBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [onlyShowChanged, setOnlyShowChanged] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<LoadingBatch | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showChangeHistory, setShowChangeHistory] = useState(false);
  const { showToastMessage, currentRole } = useAppStore();

  useEffect(() => {
    loadBatches();
  }, [statusFilter]);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const result = await loadingApi.getBatches(statusFilter === 'all' ? undefined : statusFilter);
      setAllBatches(result);
    } catch (error) {
      showToastMessage('加载批次失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (batch: LoadingBatch) => {
    setSelectedBatch(batch);
    setShowDetail(true);
    setShowChangeHistory(false);
  };

  const handleConfirm = async (confirmed: boolean) => {
    if (!selectedBatch) return;

    try {
      const confirmer = currentRole === 'packaging' ? '钱主管' : '赵质检';
      await loadingApi.confirm(selectedBatch.id, confirmer, confirmed);
      showToastMessage(confirmed ? '装车复核确认成功' : '已退回处理', 'success');
      setShowDetail(false);
      loadBatches();
    } catch (error) {
      showToastMessage('操作失败', 'error');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (hours < 1) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  const changedCount = allBatches.filter(b => b.inspectionChanged).length;
  const batches = onlyShowChanged
    ? allBatches.filter(b => b.inspectionChanged && (!statusFilter || statusFilter === "all" || b.status === statusFilter))
    : allBatches.filter(b => !statusFilter || statusFilter === "all" || b.status === statusFilter);

  const handleAcknowledgeChange = async () => {
    if (!selectedBatch) return;
    setAcknowledging(true);
    try {
      const { currentUser } = useAppStore.getState();
      await loadingApi.acknowledgeChange(selectedBatch.id, currentUser?.name);
      showToastMessage("已确认质检变更，高亮已清除", "success");
      setShowChangeHistory(false);
      if (selectedBatch) {
        selectedBatch.inspectionChanged = false;
      }
      await loadBatches();
    } catch (e) {
      showToastMessage("操作失败", "error");
    } finally {
      setAcknowledging(false);
    }
  };


  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-forest-900">装车复核</h1>
          <p className="text-forest-600 mt-1 text-sm">出库前复核，确保数量与质量准确</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-cream-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-forest-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field text-sm w-40"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={() => setOnlyShowChanged(!onlyShowChanged)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                onlyShowChanged
                  ? "bg-amber-100 text-amber-800 border border-amber-300 shadow-sm"
                  : "bg-white text-forest-600 border border-forest-200 hover:bg-forest-50"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              仅看已变更
              {changedCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold">
                  {changedCount}
                </span>
              )}
            </button>
          </div>
          <span className="text-sm text-forest-500">共 {batches.length} 个批次</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-forest-500">加载中...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">批次号</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">客户</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">花卉品种</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">规格</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">数量</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">质检状态</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">状态</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {batches.map((batch) => (
                  <tr
                    key={batch.id}
                    className={`transition-all ${
                      batch.inspectionChanged
                        ? 'bg-amber-50 hover:bg-amber-100/70 border-l-4 border-l-amber-400'
                        : 'hover:bg-cream-50/50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-forest-500" />
                        <div>
                          <span className="font-medium text-forest-900">{batch.batchNo}</span>
                          {batch.inspectionChanged && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="w-3 h-3 text-amber-500 animate-pulse-soft" />
                              <span className="text-xs text-amber-600">质检已变更</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-forest-400" />
                        <span className="text-forest-700">{batch.customer}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Flower2 className="w-4 h-4 text-forest-500" />
                        <span className="text-forest-700">{batch.flowerType}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-forest-700">{batch.spec}</td>
                    <td className="px-4 py-3">
                      <div className="text-forest-700">
                        <span>{batch.quantity} 枝</span>
                        <div className="text-xs text-forest-500 mt-0.5">
                          合格 {batch.qualifiedQty} / 破损 {batch.damagedQty}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={batch.inspectionStatusText}
                        variant={inspectionVariants[batch.inspectionStatus]}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={batch.statusText}
                        variant={statusVariants[batch.status]}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {currentRole === 'packaging' && batch.status === 'pending' ? (
                        <button
                          onClick={() => openDetail(batch)}
                          className="text-sm text-forest-600 hover:text-forest-800 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          复核
                        </button>
                      ) : (
                        <button
                          onClick={() => openDetail(batch)}
                          className="text-sm text-forest-500 hover:text-forest-700 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          查看
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDetail && selectedBatch && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-forest-900">装车复核详情</h3>
              <button
                onClick={() => setShowDetail(false)}
                className="text-forest-400 hover:text-forest-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedBatch.inspectionChanged && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 animate-pulse-soft">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">质检结果已变更</p>
                    <p className="text-sm text-amber-700 mt-1">
                      该批次质检结果已于 {selectedBatch.lastInspectionChange ? formatTime(selectedBatch.lastInspectionChange) : '近期'} 被修改，请注意核对
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-cream-50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-forest-500 mb-3">订单信息</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-forest-600">订单号</span>
                    <span className="text-sm font-medium text-forest-900">{selectedBatch.orderNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-forest-600">客户</span>
                    <span className="text-sm text-forest-900">{selectedBatch.customer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-forest-600">花卉品种</span>
                    <span className="text-sm text-forest-900">{selectedBatch.flowerType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-forest-600">规格</span>
                    <span className="text-sm text-forest-900">{selectedBatch.spec}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-forest-600">交货日期</span>
                    <span className="text-sm text-forest-900">{formatDate(selectedBatch.deliveryDate)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-cream-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-forest-500">质检信息</h4>
                  <span className="text-xs text-forest-400">v{selectedBatch.inspectionVersion}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-forest-600">批次号</span>
                    <span className="text-sm font-medium text-forest-900">{selectedBatch.batchNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-forest-600">质检状态</span>
                    <StatusBadge
                      status={selectedBatch.inspectionStatusText}
                      variant={inspectionVariants[selectedBatch.inspectionStatus]}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-forest-600">合格数量</span>
                    <span className="text-sm text-green-600 font-medium">{selectedBatch.qualifiedQty} 枝</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-forest-600">破损数量</span>
                    <span className="text-sm text-red-600 font-medium">{selectedBatch.damagedQty} 枝</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-forest-600">破损率</span>
                    <span className={`text-sm font-medium ${
                      (selectedBatch.damagedQty / selectedBatch.quantity) * 100 > 5
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}>
                      {((selectedBatch.damagedQty / selectedBatch.quantity) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {selectedBatch.damageReasons && selectedBatch.damageReasons.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-amber-900">破损原因</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedBatch.damageReasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedBatch.inspectionRemark && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">质检备注</p>
                    <p className="text-sm text-blue-700 mt-1">{selectedBatch.inspectionRemark}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedBatch.previousInspection && (
              <div className="mb-6">
                <div className="flex items-center justify-between p-4 bg-forest-50 border border-forest-200 rounded-xl">
                  <button
                    onClick={() => setShowChangeHistory(!showChangeHistory)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <History className="w-4 h-4 text-forest-600" />
                    <span className="text-sm font-medium text-forest-800">质检变更前后对比</span>
                    <span className="text-xs text-forest-500">（v{selectedBatch.previousInspection.version} → v{selectedBatch.inspectionVersion}）</span>
                    {showChangeHistory ? (
                      <ChevronUp className="w-4 h-4 text-forest-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-forest-500" />
                    )}
                  </button>
                  {selectedBatch.inspectionChanged && (
                    <button
                      onClick={handleAcknowledgeChange}
                      disabled={acknowledging}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-forest-500 text-white hover:bg-forest-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {acknowledging ? "处理中..." : "确认已读"}
                    </button>
                  )}
                </div>
                {showChangeHistory && (
                  <div className="mt-3 bg-white border border-forest-200 rounded-xl overflow-hidden animate-slide-up">
                    <table className="w-full text-sm">
                      <thead className="bg-cream-50">
                        <tr>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-forest-500">项目</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-red-500">变更前（v{selectedBatch.previousInspection.version}）</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-green-600">变更后（v{selectedBatch.inspectionVersion}）</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cream-200">
                        <tr>
                          <td className="px-4 py-2.5 text-forest-700">合格数量</td>
                          <td className="px-4 py-2.5 text-red-600 font-medium">{selectedBatch.previousInspection.qualifiedQty} 枝</td>
                          <td className="px-4 py-2.5 text-green-600 font-medium">{selectedBatch.qualifiedQty} 枝</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5 text-forest-700">破损数量</td>
                          <td className="px-4 py-2.5 text-red-600 font-medium">{selectedBatch.previousInspection.damagedQty} 枝</td>
                          <td className="px-4 py-2.5 text-green-600 font-medium">{selectedBatch.damagedQty} 枝</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5 text-forest-700">破损原因</td>
                          <td className="px-4 py-2.5">
                            <div className="flex flex-wrap gap-1">
                              {selectedBatch.previousInspection.damageReasons && selectedBatch.previousInspection.damageReasons.length > 0
                                ? selectedBatch.previousInspection.damageReasons.map((r, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">{r}</span>
                                  ))
                                : <span className="text-xs text-forest-400">无</span>
                              }
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex flex-wrap gap-1">
                              {selectedBatch.damageReasons && selectedBatch.damageReasons.length > 0
                                ? selectedBatch.damageReasons.map((r, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{r}</span>
                                  ))
                                : <span className="text-xs text-forest-400">无</span>
                              }
                            </div>
                          </td>
                        </tr>
                        {(selectedBatch.previousInspection.remark || selectedBatch.inspectionRemark) && (
                          <tr>
                            <td className="px-4 py-2.5 text-forest-700">备注</td>
                            <td className="px-4 py-2.5 text-red-600 text-sm">{selectedBatch.previousInspection.remark || '无'}</td>
                            <td className="px-4 py-2.5 text-green-600 text-sm">{selectedBatch.inspectionRemark || '无'}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    {selectedBatch.lastInspectionChange && (
                      <div className="px-4 py-2 bg-cream-50 text-xs text-forest-500">
                        变更时间：{formatTime(selectedBatch.lastInspectionChange)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-cream-200">
              <div className="text-sm text-forest-500">
                当前状态：
                <StatusBadge
                  status={selectedBatch.statusText}
                  variant={statusVariants[selectedBatch.status]}
                  size="md"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDetail(false)}
                  className="btn-secondary"
                >
                  关闭
                </button>
                {currentRole === 'packaging' && selectedBatch.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleConfirm(false)}
                      className="btn-danger flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      退回
                    </button>
                    <button
                      onClick={() => handleConfirm(true)}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      确认装车
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
