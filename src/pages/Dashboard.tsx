import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Card, CardBody } from '@/components/Card'
import {
  TrendingUp,
  TrendingDown,
  Lock,
  FileText,
  MessageSquareQuote,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { formatCurrency, adjustmentTypeLabels } from '@/lib/format'

export default function Dashboard() {
  const { fetchAll, adjustments, priceLocks, quotes, inventory, loading } = useAppStore()

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const pendingCount = adjustments.filter((a) => a.status === 'pending').length
  const approvedCount = adjustments.filter((a) => a.status === 'approved').length
  const rejectedCount = adjustments.filter((a) => a.status === 'rejected').length
  const expiredCount = adjustments.filter((a) => a.status === 'expired').length

  const activeLocks = priceLocks.filter((l) => l.status === 'active')
  const expiringLocks = priceLocks.filter((l) => l.status === 'expiring_soon')

  const activeQuotes = quotes.filter((q) => q.status === 'active')

  const totalInventoryValue = inventory.reduce((sum, item) => sum + item.market_price * item.quantity, 0)
  const totalLockedValue = activeLocks.reduce(
    (sum, lock) => sum + lock.locked_price * lock.quantity,
    0,
  )

  const stats = [
    {
      label: '待审核申请',
      value: pendingCount,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: '已通过申请',
      value: approvedCount,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: '已拒绝申请',
      value: rejectedCount,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: '已过期申请',
      value: expiredCount,
      icon: FileText,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ]

  const lockStats = [
    {
      label: '活跃锁价',
      value: activeLocks.length,
      icon: Lock,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: '即将到期',
      value: expiringLocks.length,
      icon: TrendingDown,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      label: '有效报价',
      value: activeQuotes.length,
      icon: MessageSquareQuote,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <CardBody className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {lockStats.map((stat, idx) => (
          <Card key={idx}>
            <CardBody className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            </CardBody>
          </Card>
        ))}
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{formatCurrency(totalLockedValue)}</div>
              <div className="text-sm text-slate-500">锁价库存总值</div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-800">库存概览</h3>
          </div>
          <CardBody>
            <div className="text-sm text-slate-500 mb-3">总库存价值：{formatCurrency(totalInventoryValue)}</div>
            <div className="space-y-3">
              {inventory.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="font-medium text-slate-800">{item.name}</div>
                    <div className="text-xs text-slate-500">
                      {item.category} · {item.grade}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-800">{formatCurrency(item.market_price)}/吨</div>
                    <div className="text-xs text-slate-500">
                      {item.quantity.toLocaleString()} {item.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-800">最近调价申请</h3>
          </div>
          <CardBody>
            <div className="space-y-3">
              {adjustments.slice(0, 5).map((adj) => (
                <div key={adj.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="font-medium text-slate-800">
                      {adj.inventoryName} → {formatCurrency(adj.new_price)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {adjustmentTypeLabels[adj.adjustment_type]} · {adj.customerName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        adj.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : adj.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : adj.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {adj.status === 'pending'
                        ? '待审核'
                        : adj.status === 'approved'
                          ? '已通过'
                          : adj.status === 'rejected'
                            ? '已拒绝'
                            : '已过期'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(adj.created_at).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
