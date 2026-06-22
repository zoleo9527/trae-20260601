import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/Card'
import Button from '@/components/Button'
import Modal from '@/components/Modal'
import {
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Filter,
  ChevronDown,
  X,
} from 'lucide-react'
import {
  formatCurrency,
  formatDateTime,
  calcPriceDiffPercent,
  adjustmentTypeLabels,
  adjustmentTypeColors,
  adjustmentStatusLabels,
  adjustmentStatusColors,
} from '@/lib/format'
import type { PriceAdjustment, AdjustmentStatus, AdjustmentType } from '@/types'

type FilterStatus = 'all' | AdjustmentStatus
type FilterType = 'all' | AdjustmentType

export default function Adjustments() {
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    fetchAdjustments,
    fetchInventory,
    fetchCustomers,
    createAdjustment,
    reviewAdjustment,
    getAdjustmentDetail,
    adjustments,
    inventory,
    customers,
    loading,
  } = useAppStore()

  const urlStatus = searchParams.get('status') as FilterStatus | null
  const initialStatus =
    urlStatus && ['pending', 'approved', 'rejected', 'expired'].includes(urlStatus)
      ? urlStatus
      : 'all'

  const urlType = searchParams.get('type') as FilterType | null
  const initialType =
    urlType && ['market_change', 'customer_negotiation', 'grade_change'].includes(urlType)
      ? urlType
      : 'all'

  const [filterStatus, setFilterStatus] = useState<FilterStatus>(initialStatus)
  const [filterType, setFilterType] = useState<FilterType>(initialType)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedAdjustment, setSelectedAdjustment] = useState<PriceAdjustment | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [formData, setFormData] = useState<{
    inventory_id: string
    new_price: string
    adjustment_type: AdjustmentType
    reason: string
    requested_lock_days: string
    customer_id: string
    applicant_name: string
  }>({
    inventory_id: '',
    new_price: '',
    adjustment_type: 'market_change',
    reason: '',
    requested_lock_days: '30',
    customer_id: '',
    applicant_name: '',
  })

  const [reviewData, setReviewData] = useState({
    action: 'approve' as 'approve' | 'reject',
    opinion: '',
    lockDays: '',
    reviewerName: '',
  })

  useEffect(() => {
    fetchAdjustments()
    fetchInventory()
    fetchCustomers()
  }, [fetchAdjustments, fetchInventory, fetchCustomers])

  const filteredAdjustments = adjustments.filter((a) => {
    const statusMatch = filterStatus === 'all' || a.status === filterStatus
    const typeMatch = filterType === 'all' || a.adjustment_type === filterType
    return statusMatch && typeMatch
  })

  const getSelectedInventory = () => {
    return inventory.find((i) => i.id === formData.inventory_id)
  }

  const handleCreate = async () => {
    const inv = getSelectedInventory()
    if (!inv) return

    await createAdjustment({
      inventory_id: formData.inventory_id,
      original_price: inv.market_price,
      new_price: parseFloat(formData.new_price),
      adjustment_type: formData.adjustment_type,
      reason: formData.reason || undefined,
      requested_lock_days: parseInt(formData.requested_lock_days) || undefined,
      customer_id: formData.customer_id,
      applicant_name: formData.applicant_name,
    })

    setShowCreateModal(false)
    setFormData({
      inventory_id: '',
      new_price: '',
      adjustment_type: 'market_change',
      reason: '',
      requested_lock_days: '30',
      customer_id: '',
      applicant_name: '',
    })
  }

  const handleReview = async () => {
    if (!selectedAdjustment) return

    await reviewAdjustment(selectedAdjustment.id, {
      action: reviewData.action,
      opinion: reviewData.opinion || undefined,
      lockDays: parseInt(reviewData.lockDays) || undefined,
      reviewerName: reviewData.reviewerName || undefined,
    })

    setShowReviewModal(false)
    setReviewData({
      action: 'approve',
      opinion: '',
      lockDays: '',
      reviewerName: '',
    })
    setSelectedAdjustment(null)
  }

  const openDetail = async (adj: PriceAdjustment) => {
    setDetailLoading(true)
    const detail = await getAdjustmentDetail(adj.id)
    if (detail) {
      setSelectedAdjustment(detail)
      setShowDetailModal(true)
    }
    setDetailLoading(false)
  }

  const openReview = (adj: PriceAdjustment) => {
    setSelectedAdjustment(adj)
    setReviewData({
      ...reviewData,
      lockDays: adj.requested_lock_days?.toString() || '30',
    })
    setShowReviewModal(true)
  }

  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status)
    if (status === 'all') {
      searchParams.delete('status')
    } else {
      searchParams.set('status', status)
    }
    setSearchParams(searchParams)
  }

  const handleTypeChange = (type: FilterType) => {
    setFilterType(type)
    if (type === 'all') {
      searchParams.delete('type')
    } else {
      searchParams.set('type', type)
    }
    setSearchParams(searchParams)
  }

  const clearFilter = () => {
    setFilterStatus('all')
    setFilterType('all')
    searchParams.delete('status')
    searchParams.delete('type')
    setSearchParams(searchParams)
  }

  const clearStatusFilter = () => {
    setFilterStatus('all')
    searchParams.delete('status')
    setSearchParams(searchParams)
  }

  const clearTypeFilter = () => {
    setFilterType('all')
    searchParams.delete('type')
    setSearchParams(searchParams)
  }

  const statusFilters: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: '全部状态' },
    { value: 'pending', label: '待审核' },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已拒绝' },
    { value: 'expired', label: '已过期' },
  ]

  const typeFilters: { value: FilterType; label: string }[] = [
    { value: 'all', label: '全部类型' },
    { value: 'market_change', label: '市场价变化' },
    { value: 'customer_negotiation', label: '客户议价' },
    { value: 'grade_change', label: '库存等级变化' },
  ]

  return (
    <div className="space-y-6">
      {(filterStatus !== 'all' || filterType !== 'all') && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-500">当前筛选：</span>
          {filterStatus !== 'all' && (
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                adjustmentStatusColors[filterStatus as AdjustmentStatus]
              }`}
            >
              {adjustmentStatusLabels[filterStatus as AdjustmentStatus]}
              <button
                onClick={clearStatusFilter}
                className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterType !== 'all' && (
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                adjustmentTypeColors[filterType as AdjustmentType]
              }`}
            >
              {adjustmentTypeLabels[filterType as AdjustmentType]}
              <button
                onClick={clearTypeFilter}
                className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={clearFilter}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            清除所有筛选
          </button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>调价申请管理</CardTitle>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => handleFilterChange(e.target.value as FilterStatus)}
                  className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {statusFilters.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => handleTypeChange(e.target.value as FilterType)}
                className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {typeFilters.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4" />
              发起调价
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  申请编号
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  库存商品
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  价格调整
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  调整类型
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  客户
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  申请人
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  申请时间
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAdjustments.map((adj) => (
                <tr key={adj.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                    {adj.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-800">{adj.inventoryName}</div>
                    <div className="text-xs text-slate-500">
                      {adj.inventoryCategory} · {adj.inventoryGrade}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-600">
                      {formatCurrency(adj.original_price)} →{' '}
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(adj.new_price)}
                      </span>
                    </div>
                    <div
                      className={`text-xs font-medium ${
                        adj.new_price >= adj.original_price ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {calcPriceDiffPercent(adj.original_price, adj.new_price)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        adjustmentTypeColors[adj.adjustment_type]
                      }`}
                    >
                      {adjustmentTypeLabels[adj.adjustment_type]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {adj.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        adjustmentStatusColors[adj.status]
                      }`}
                    >
                      {adjustmentStatusLabels[adj.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {adj.applicant_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {formatDateTime(adj.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openDetail(adj)}>
                        <Eye className="w-4 h-4" />
                        详情
                      </Button>
                      {adj.status === 'pending' && (
                        <Button variant="primary" size="sm" onClick={() => openReview(adj)}>
                          审核
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAdjustments.length === 0 && (
            <div className="py-12 text-center text-slate-500">暂无调价申请记录</div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="发起调价申请"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !formData.inventory_id ||
                !formData.new_price ||
                !formData.customer_id ||
                !formData.applicant_name ||
                loading
              }
            >
              提交申请
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                库存商品 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.inventory_id}
                onChange={(e) => setFormData({ ...formData, inventory_id: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">请选择库存商品</option>
                {inventory.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name} ({inv.category} · {inv.grade}) - 市场价: {formatCurrency(inv.market_price)}/吨
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                客户 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">请选择客户</option>
                {customers.map((cust) => (
                  <option key={cust.id} value={cust.id}>
                    {cust.name} - {cust.contact}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {getSelectedInventory() && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-sm text-slate-600">
                当前市场价：
                <span className="font-semibold text-slate-800">
                  {formatCurrency(getSelectedInventory()!.market_price)}/吨
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                新价格（元/吨） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.new_price}
                onChange={(e) => setFormData({ ...formData, new_price: e.target.value })}
                placeholder="请输入新价格"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                调整类型 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.adjustment_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    adjustment_type: e.target.value as AdjustmentType,
                  })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="market_change">市场价变化</option>
                <option value="customer_negotiation">客户议价</option>
                <option value="grade_change">库存等级变化</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                申请锁价天数
              </label>
              <input
                type="number"
                value={formData.requested_lock_days}
                onChange={(e) => setFormData({ ...formData, requested_lock_days: e.target.value })}
                placeholder="默认30天"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                申请人 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.applicant_name}
                onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })}
                placeholder="请输入申请人姓名"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">调整原因</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="请输入调整原因说明"
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedAdjustment(null)
        }}
        title="调价申请详情"
        size="lg"
      >
        {selectedAdjustment && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">申请编号</div>
                <div className="text-sm font-medium text-slate-800">{selectedAdjustment.id}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">状态</div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    adjustmentStatusColors[selectedAdjustment.status]
                  }`}
                >
                  {adjustmentStatusLabels[selectedAdjustment.status]}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">库存商品</div>
                <div className="text-sm font-medium text-slate-800">
                  {selectedAdjustment.inventoryName}
                </div>
                <div className="text-xs text-slate-500">
                  {selectedAdjustment.inventoryCategory} · {selectedAdjustment.inventoryGrade} · 库存
                  {selectedAdjustment.inventoryQuantity?.toLocaleString()}{' '}
                  {selectedAdjustment.inventoryUnit}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">客户</div>
                <div className="text-sm font-medium text-slate-800">
                  {selectedAdjustment.customerName}
                </div>
                <div className="text-xs text-slate-500">{selectedAdjustment.customerContact}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">原价</div>
                <div className="text-sm font-medium text-slate-800">
                  {formatCurrency(selectedAdjustment.original_price)}/吨
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">新价</div>
                <div className="text-sm font-semibold text-emerald-600">
                  {formatCurrency(selectedAdjustment.new_price)}/吨
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">变动幅度</div>
                <div
                  className={`text-sm font-semibold ${
                    selectedAdjustment.new_price >= selectedAdjustment.original_price
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {calcPriceDiffPercent(selectedAdjustment.original_price, selectedAdjustment.new_price)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">调整类型</div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    adjustmentTypeColors[selectedAdjustment.adjustment_type]
                  }`}
                >
                  {adjustmentTypeLabels[selectedAdjustment.adjustment_type]}
                </span>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">申请锁价天数</div>
                <div className="text-sm font-medium text-slate-800">
                  {selectedAdjustment.requested_lock_days || '-'} 天
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">调整原因</div>
              <div className="text-sm text-slate-700 p-3 bg-slate-50 rounded-lg">
                {selectedAdjustment.reason || '-'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">申请人</div>
                <div className="text-sm font-medium text-slate-800">
                  {selectedAdjustment.applicant_name}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">申请时间</div>
                <div className="text-sm text-slate-600">
                  {formatDateTime(selectedAdjustment.created_at)}
                </div>
              </div>
            </div>

            {selectedAdjustment.status !== 'pending' && (
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">审核信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">审核人</div>
                    <div className="text-sm font-medium text-slate-800">
                      {selectedAdjustment.reviewer_name || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">审核时间</div>
                    <div className="text-sm text-slate-600">
                      {formatDateTime(selectedAdjustment.reviewed_at)}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-slate-500 mb-1">审核意见</div>
                  <div className="text-sm text-slate-700 p-3 bg-slate-50 rounded-lg">
                    {selectedAdjustment.review_opinion || '-'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={showReviewModal}
        onClose={() => {
          setShowReviewModal(false)
          setSelectedAdjustment(null)
        }}
        title="审核调价申请"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
              取消
            </Button>
            <Button
              variant={reviewData.action === 'approve' ? 'primary' : 'danger'}
              onClick={handleReview}
              disabled={!reviewData.reviewerName || loading}
            >
              {reviewData.action === 'approve' ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  通过
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  拒绝
                </>
              )}
            </Button>
          </>
        }
      >
        {selectedAdjustment && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">库存商品：</span>
                <span className="font-medium text-slate-800">{selectedAdjustment.inventoryName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">价格调整：</span>
                <span className="font-medium text-slate-800">
                  {formatCurrency(selectedAdjustment.original_price)} →{' '}
                  {formatCurrency(selectedAdjustment.new_price)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">调整类型：</span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    adjustmentTypeColors[selectedAdjustment.adjustment_type]
                  }`}
                >
                  {adjustmentTypeLabels[selectedAdjustment.adjustment_type]}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">客户：</span>
                <span className="font-medium text-slate-800">{selectedAdjustment.customerName}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                审核结果 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="action"
                    value="approve"
                    checked={reviewData.action === 'approve'}
                    onChange={(e) =>
                      setReviewData({ ...reviewData, action: e.target.value as 'approve' | 'reject' })
                    }
                    className="w-4 h-4 text-emerald-600"
                  />
                  <span className="text-sm text-slate-700">通过</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="action"
                    value="reject"
                    checked={reviewData.action === 'reject'}
                    onChange={(e) =>
                      setReviewData({ ...reviewData, action: e.target.value as 'approve' | 'reject' })
                    }
                    className="w-4 h-4 text-red-600"
                  />
                  <span className="text-sm text-slate-700">拒绝</span>
                </label>
              </div>
            </div>

            {reviewData.action === 'approve' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">锁价天数</label>
                <input
                  type="number"
                  value={reviewData.lockDays}
                  onChange={(e) => setReviewData({ ...reviewData, lockDays: e.target.value })}
                  placeholder={selectedAdjustment.requested_lock_days?.toString() || '30'}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="text-xs text-slate-500 mt-1">
                  申请人原申请：{selectedAdjustment.requested_lock_days || 30} 天
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">审核意见</label>
              <textarea
                value={reviewData.opinion}
                onChange={(e) => setReviewData({ ...reviewData, opinion: e.target.value })}
                placeholder={reviewData.action === 'approve' ? '请输入审核意见（可选）' : '请输入拒绝原因'}
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                审核人 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={reviewData.reviewerName}
                onChange={(e) => setReviewData({ ...reviewData, reviewerName: e.target.value })}
                placeholder="请输入审核人姓名"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}
      </Modal>

      {(loading || detailLoading) && (
        <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
