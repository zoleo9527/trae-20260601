import { useState, useEffect } from 'react';
import { packagingApi } from '../api/endpoints';
import type { PackagingBatch, InspectionResult } from '../../shared/types.js';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStore } from '../stores/appStore';
import {
  Package,
  Filter,
  Check,
  X,
  Edit3,
  AlertTriangle,
  Flower2,
  MapPin,
  ShoppingCart,
  Clock,
  User,
} from 'lucide-react';

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待质检' },
  { value: 'inspecting', label: '质检中' },
  { value: 'inspected', label: '已质检' },
  { value: 'rework', label: '返工' },
];

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'amber'> = {
  pending: 'amber',
  inspecting: 'info',
  inspected: 'success',
  rework: 'danger',
};

const damageReasonOptions = [
  '花瓣挤压损伤',
  '花头偏小',
  '运输途中折枝',
  '病虫害',
  '开放度过高',
  '花茎弯曲',
];

export default function Packaging() {
  const [batches, setBatches] = useState<PackagingBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<PackagingBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    qualifiedQty: 0,
    damagedQty: 0,
    damageReasons: [] as string[],
    remark: '',
  });
  const { showToastMessage, currentRole } = useAppStore();

  useEffect(() => {
    loadBatches();
  }, [statusFilter]);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const result = await packagingApi.getBatches(statusFilter === 'all' ? undefined : statusFilter);
      setBatches(result);
    } catch (error) {
      showToastMessage('加载批次失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openInspectModal = (batch: PackagingBatch, edit = false) => {
    setSelectedBatch(batch);
    setIsEditMode(edit);

    if (edit && batch.inspectionResult) {
      setFormData({
        qualifiedQty: batch.inspectionResult.qualifiedQty,
        damagedQty: batch.inspectionResult.damagedQty,
        damageReasons: [...batch.inspectionResult.damageReasons],
        remark: batch.inspectionResult.remark || '',
      });
    } else {
      setFormData({
        qualifiedQty: batch.planQuantity,
        damagedQty: 0,
        damageReasons: [],
        remark: '',
      });
    }

    setShowInspectModal(true);
  };

  const handleSubmit = async () => {
    if (!selectedBatch) return;

    try {
      const inspector = currentRole === 'packaging' ? '钱主管' : '赵质检';

      if (isEditMode) {
        await packagingApi.updateInspection(selectedBatch.id, {
          ...formData,
          inspector,
        });
        showToastMessage('质检结果已更新', 'success');
      } else {
        await packagingApi.submitInspection(selectedBatch.id, {
          ...formData,
          inspector,
        });
        showToastMessage('质检提交成功', 'success');
      }

      setShowInspectModal(false);
      loadBatches();
    } catch (error) {
      showToastMessage('操作失败', 'error');
    }
  };

  const toggleDamageReason = (reason: string) => {
    setFormData(prev => ({
      ...prev,
      damageReasons: prev.damageReasons.includes(reason)
        ? prev.damageReasons.filter(r => r !== reason)
        : [...prev.damageReasons, reason],
    }));
  };

  const damageRate = formData.qualifiedQty + formData.damagedQty > 0
    ? ((formData.damagedQty / (formData.qualifiedQty + formData.damagedQty)) * 100).toFixed(1)
    : '0';

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-forest-900">包装质检</h1>
          <p className="text-forest-600 mt-1 text-sm">包装批次质检管理与质量跟踪</p>
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
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">关联订单</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">花卉品种</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">规格</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">计划数量</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">状态</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">质检结果</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {batches.map((batch) => (
                  <tr
                    key={batch.id}
                    className={`hover:bg-cream-50/50 transition-colors ${
                      batch.inspectionChanged ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-forest-500" />
                        <span className="font-medium text-forest-900">{batch.batchNo}</span>
                        {batch.inspectionChanged && (
                          <span className="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            质检已变更
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-forest-400" />
                        <span className="text-forest-700 text-sm">{batch.orderNo}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Flower2 className="w-4 h-4 text-forest-500" />
                        <span className="text-forest-700">{batch.flowerType}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-forest-700">{batch.spec}</td>
                    <td className="px-4 py-3 text-forest-700">
                      {batch.planQuantity} 枝
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={batch.statusText}
                        variant={statusVariants[batch.status] || 'default'}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {batch.inspectionResult ? (
                        <div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-green-600">合格 {batch.inspectionResult.qualifiedQty}</span>
                            <span className="text-forest-300">/</span>
                            <span className="text-red-600">破损 {batch.inspectionResult.damagedQty}</span>
                          </div>
                          <p className="text-xs text-forest-500 mt-0.5">
                            破损率 {((batch.inspectionResult.damagedQty / (batch.inspectionResult.qualifiedQty + batch.inspectionResult.damagedQty)) * 100).toFixed(1)}%
                          </p>
                        </div>
                      ) : (
                        <span className="text-forest-400 text-sm">待质检</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {currentRole === 'packaging' && (
                        batch.status === 'pending' ? (
                          <button
                            onClick={() => openInspectModal(batch)}
                            className="text-sm text-forest-600 hover:text-forest-800 flex items-center gap-1"
                          >
                            <Check className="w-4 h-4" />
                            质检
                          </button>
                        ) : batch.status === 'inspected' ? (
                          <button
                            onClick={() => openInspectModal(batch, true)}
                            className="text-sm text-amber-600 hover:text-amber-800 flex items-center gap-1"
                          >
                            <Edit3 className="w-4 h-4" />
                            修改
                          </button>
                        ) : null
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showInspectModal && selectedBatch && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-forest-900">
                {isEditMode ? '修改质检结果' : '包装质检'}
              </h3>
              <button
                onClick={() => setShowInspectModal(false)}
                className="text-forest-400 hover:text-forest-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-cream-50 rounded-xl p-4 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-forest-500">批次号</p>
                  <p className="font-semibold text-forest-900">{selectedBatch.batchNo}</p>
                </div>
                <StatusBadge status={selectedBatch.statusText} variant={statusVariants[selectedBatch.status]} size="md" />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-forest-500">花卉品种</p>
                  <p className="text-sm text-forest-800">{selectedBatch.flowerType}</p>
                </div>
                <div>
                  <p className="text-xs text-forest-500">规格</p>
                  <p className="text-sm text-forest-800">{selectedBatch.spec}</p>
                </div>
                <div>
                  <p className="text-xs text-forest-500">计划数量</p>
                  <p className="text-sm text-forest-800">{selectedBatch.planQuantity} 枝</p>
                </div>
                <div>
                  <p className="text-xs text-forest-500">棚区</p>
                  <p className="text-sm text-forest-800">{selectedBatch.greenhouse}</p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">合格数量 (枝)</label>
                  <input
                    type="number"
                    value={formData.qualifiedQty}
                    onChange={(e) => setFormData(prev => ({ ...prev, qualifiedQty: parseInt(e.target.value) || 0 }))}
                    className="input-field"
                    min="0"
                  />
                </div>
                <div>
                  <label className="label-field">破损数量 (枝)</label>
                  <input
                    type="number"
                    value={formData.damagedQty}
                    onChange={(e) => setFormData(prev => ({ ...prev, damagedQty: parseInt(e.target.value) || 0 }))}
                    className="input-field"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-cream-50">
                <span className="text-sm text-forest-600">破损率</span>
                <span className={`font-semibold ${parseFloat(damageRate) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                  {damageRate}%
                </span>
              </div>

              <div>
                <label className="label-field">破损原因</label>
                <div className="flex flex-wrap gap-2">
                  {damageReasonOptions.map(reason => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => toggleDamageReason(reason)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        formData.damageReasons.includes(reason)
                          ? 'bg-red-100 text-red-700 ring-2 ring-red-200'
                          : 'bg-cream-100 text-forest-600 hover:bg-cream-200'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-field">备注</label>
                <textarea
                  value={formData.remark}
                  onChange={(e) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
                  className="input-field min-h-[80px] resize-none"
                  placeholder="输入质检备注说明..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowInspectModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="btn-primary flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {isEditMode ? '保存修改' : '提交质检'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
