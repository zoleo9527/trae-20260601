import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/Card'
import Button from '@/components/Button'
import Modal from '@/components/Modal'
import { Lock, Unlock, AlertTriangle, Calendar, Filter, ChevronDown } from 'lucide-react'
import {
  formatCurrency,
  formatDate,
  lockStatusLabels,
  lockStatusColors,
  adjustmentTypeLabels,
} from '@/lib/format'
import type { PriceLock, LockStatus } from '@/types'

type FilterStatus = 'all' | LockStatus

export default function PriceLocks() {
  const { fetchPriceLocks, fetchAdjustments, priceLocks, adjustments, expireLock, loading } =
    useAppStore()

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showExpireModal, setShowExpireModal] = useState(false)
  const [selectedLock, setSelectedLock] = useState<PriceLock | null>(null)

  useEffect(() => {
    fetchPriceLocks()
    fetchAdjustments()
  }, [fetchPriceLocks, fetchAdjustments])

  const filteredLocks =
    filterStatus === 'all'
      ? priceLocks
      : priceLocks.filter((l) => l.status === filterStatus)

  const getRelatedAdjustment = (adjustmentId: string) => {
    return adjustments.find((a) => a.id === adjustmentId)
  }

  const openDetail = (lock: PriceLock) => {
    setSelectedLock(lock)
    setShowDetailModal(true)
  }

  const openExpire = (lock: PriceLock) => {
    setSelectedLock(lock)
    setShowExpireModal(true)
  }

  const handleExpire = async () => {
    if (!selectedLock) return
    await expireLock(selectedLock.id)
    setShowExpireModal(false)
    setSelectedLock(null)
  }

  const statusFilters: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'active', label: '锁价中' },
    { value: 'expiring_soon', label: '即将到期' },
    { value: 'expired', label: '已失效' },
  ]

  const activeLocks = priceLocks.filter((l) => l.status === 'active')
  const expiringLocks = priceLocks.filter((l) => l.status === 'expiring_soon')
  const expiredLocks = priceLocks.filter((l) => l.status === 'expired')

  const totalLockedValue = activeLocks.reduce(
    (sum, lock) => sum + lock.locked_price * lock.quantity,
    0,
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50">
              <Lock className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{activeLocks.length}</div>
              <div className="text-sm text-slate-500">锁价中</div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-50">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{expiringLocks.length}</div>
              <div className="text-sm text-slate-500">即将到期</div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gray-50">
              <Unlock className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{expiredLocks.length}</div>
              <div className="text-sm text-slate-500">已失效</div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{formatCurrency(totalLockedValue)}</div>
              <div className="text-sm text-slate-500">锁价总值</div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>锁价库存管理</CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
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
        </CardHeader>
        <CardBody className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  锁价编号
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  库存商品
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  锁价价格
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  锁价数量
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  客户
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  有效期
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  剩余天数
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLocks.map((lock) => (
                <tr key={lock.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                    {lock.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-800">{lock.inventoryName}</div>
                    <div className="text-xs text-slate-500">
                      原市场价：{formatCurrency(lock.original_market_price)}/吨
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-emerald-600">
                      {formatCurrency(lock.locked_price)}/吨
                    </div>
                    <div
                      className={`text-xs font-medium ${
                        lock.locked_price >= lock.original_market_price ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {lock.locked_price >= lock.original_market_price ? '↑' : '↓'}{' '}
                      {Math.abs(((lock.locked_price - lock.original_market_price) / lock.original_market_price) * 100).toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {lock.quantity.toLocaleString()} {lock.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {lock.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    <div>{formatDate(lock.lock_start_date)}</div>
                    <div className="text-xs text-slate-500">至 {formatDate(lock.lock_end_date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        (lock.remainingDays ?? 0) <= 3
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {lock.remainingDays} 天
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        lockStatusColors[lock.status]
                      }`}
                    >
                      {lockStatusLabels[lock.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openDetail(lock)}>
                        详情
                      </Button>
                      {lock.status === 'active' && (
                        <Button variant="danger" size="sm" onClick={() => openExpire(lock)}>
                          提前解锁
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLocks.length === 0 && (
            <div className="py-12 text-center text-slate-500">暂无锁价记录</div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedLock(null)
        }}
        title="锁价详情"
        size="lg"
      >
        {selectedLock && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">锁价编号</div>
                <div className="text-sm font-medium text-slate-800">{selectedLock.id}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">关联申请</div>
                <div className="text-sm font-medium text-slate-800">{selectedLock.adjustment_id}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">库存商品</div>
                <div className="text-sm font-medium text-slate-800">{selectedLock.inventoryName}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">客户</div>
                <div className="text-sm font-medium text-slate-800">{selectedLock.customerName}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">原市场价</div>
                <div className="text-sm font-medium text-slate-800">
                  {formatCurrency(selectedLock.original_market_price)}/吨
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">锁价价格</div>
                <div className="text-sm font-semibold text-emerald-600">
                  {formatCurrency(selectedLock.locked_price)}/吨
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">锁价数量</div>
                <div className="text-sm font-medium text-slate-800">
                  {selectedLock.quantity.toLocaleString()} {selectedLock.unit}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">锁价开始日期</div>
                <div className="text-sm font-medium text-slate-800">
                  {formatDate(selectedLock.lock_start_date)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">锁价结束日期</div>
                <div className="text-sm font-medium text-slate-800">
                  {formatDate(selectedLock.lock_end_date)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">剩余天数</div>
                <div className="text-sm font-medium text-slate-800">{selectedLock.remainingDays} 天</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">状态</div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    lockStatusColors[selectedLock.status]
                  }`}
                >
                  {lockStatusLabels[selectedLock.status]}
                </span>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-lg">
              <div className="text-sm text-slate-600">
                锁价总价值：
                <span className="font-semibold text-emerald-700">
                  {formatCurrency(selectedLock.locked_price * selectedLock.quantity)}
                </span>
              </div>
            </div>

            {getRelatedAdjustment(selectedLock.adjustment_id) && (
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">调价申请信息</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">调整类型：</span>
                    <span className="font-medium text-slate-800">
                      {adjustmentTypeLabels[getRelatedAdjustment(selectedLock.adjustment_id)!.adjustment_type]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">调整原因：</span>
                    <span className="font-medium text-slate-800">
                      {getRelatedAdjustment(selectedLock.adjustment_id)!.reason || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">审核人：</span>
                    <span className="font-medium text-slate-800">
                      {getRelatedAdjustment(selectedLock.adjustment_id)!.reviewer_name || '-'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={showExpireModal}
        onClose={() => {
          setShowExpireModal(false)
          setSelectedLock(null)
        }}
        title="确认提前解锁"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowExpireModal(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleExpire} disabled={loading}>
              确认解锁
            </Button>
          </>
        }
      >
        {selectedLock && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-red-800">确认提前解锁此锁价？</div>
                <div className="text-xs text-red-600 mt-1">
                  解锁后，库存将恢复按市场价结算，此操作不可撤销。
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">库存商品：</span>
                <span className="font-medium text-slate-800">{selectedLock.inventoryName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">锁价价格：</span>
                <span className="font-medium text-slate-800">
                  {formatCurrency(selectedLock.locked_price)}/吨
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">锁价数量：</span>
                <span className="font-medium text-slate-800">
                  {selectedLock.quantity.toLocaleString()} {selectedLock.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">客户：</span>
                <span className="font-medium text-slate-800">{selectedLock.customerName}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {loading && (
        <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
