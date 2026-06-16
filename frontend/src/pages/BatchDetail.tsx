import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Package, Ticket, AlertTriangle } from 'lucide-react'
import { batchApi } from '@/services/api'
import type { Batch, Coupon } from '@/types'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function BatchDetail() {
  const { id } = useParams<{ id: string }>()
  const [batch, setBatch] = useState<Batch | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadBatch()
    }
  }, [id])

  const loadBatch = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [batchRes, couponsRes] = await Promise.all([
        batchApi.get(parseInt(id)),
        batchApi.getCoupons(parseInt(id)),
      ])

      if (batchRes.success) setBatch(batchRes.data)
      if (couponsRes.success) setCoupons(couponsRes.data)
    } catch (error) {
      console.error('Failed to load batch:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusLabels: Record<string, string> = {
    normal: '正常',
    expiring: '即将过期',
    expired: '已过期',
  }

  const statusStyles: Record<string, string> = {
    normal: 'bg-green-100 text-green-700',
    expiring: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-red-100 text-red-700',
  }

  const couponStatusLabels: Record<string, string> = {
    draft: '草稿',
    pending_review: '待复核',
    issued: '已发放',
    verified: '已核销',
    archived: '已归档',
    rejected: '已拒绝',
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="p-8">
        <p className="text-gray-500">未找到该批号信息</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          to="/batches"
          className="inline-flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={20} className="mr-2" />
          返回列表
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold font-mono text-gray-800">
                  {batch.batch_number}
                </h1>
                <div className="flex items-center mt-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles[batch.status]}`}
                  >
                    {statusLabels[batch.status]}
                  </span>
                  {batch.status === 'expiring' && (
                    <div className="ml-3 flex items-center text-yellow-600 text-sm">
                      <AlertTriangle size={16} className="mr-1" />
                      批号即将过期，请尽快处理
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  供应商
                </h3>
                <p className="font-semibold text-gray-800">
                  {batch.supplier || '-'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  数量
                </h3>
                <p className="font-semibold text-gray-800">{batch.quantity}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  生产日期
                </h3>
                <p className="font-semibold text-gray-800">
                  {batch.production_date
                    ? format(
                        new Date(batch.production_date),
                        'yyyy年MM月dd日',
                        { locale: zhCN }
                      )
                    : '-'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  有效期至
                </h3>
                <p
                  className={`font-semibold ${
                    batch.status === 'expired'
                      ? 'text-red-600'
                      : batch.status === 'expiring'
                      ? 'text-yellow-600'
                      : 'text-gray-800'
                  }`}
                >
                  {batch.expiry_date
                    ? format(
                        new Date(batch.expiry_date),
                        'yyyy年MM月dd日',
                        { locale: zhCN }
                      )
                    : '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Ticket size={24} className="mr-2 text-primary" />
                关联促销券
              </h2>
              <span className="text-sm text-gray-500">
                共 {coupons.length} 张券
              </span>
            </div>

            {coupons.length === 0 ? (
              <div className="text-center py-12">
                <Ticket size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400">暂无关联券</p>
              </div>
            ) : (
              <div className="space-y-4">
                {coupons.map((coupon) => (
                  <Link
                    key={coupon.id}
                    to={`/coupons/${coupon.id}`}
                    className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-semibold text-gray-800">
                        {coupon.coupon_code}
                      </span>
                      <span
                        className={`status-badge ${
                          coupon.status === 'verified'
                            ? 'status-verified'
                            : coupon.status === 'pending_review'
                            ? 'status-pending'
                            : coupon.status === 'rejected'
                            ? 'status-rejected'
                            : 'status-draft'
                        }`}
                      >
                        {couponStatusLabels[coupon.status]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {coupon.policy?.name}
                      </span>
                      <span className="text-gray-500">
                        会员：{coupon.member?.name}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card bg-primary-50 border-primary-200">
            <div className="flex items-center mb-4">
              <Package size={24} className="text-primary mr-3" />
              <h3 className="font-semibold text-gray-800">批号追溯</h3>
            </div>
            <p className="text-sm text-gray-600">
              通过批号可以追溯到每罐奶粉的生产信息、销售去向，是质量安全管理的重要手段。
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">关联券数</span>
                <span className="font-medium">{coupons.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">已核销</span>
                <span className="font-medium">
                  {coupons.filter((c) => c.status === 'verified').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">待处理</span>
                <span className="font-medium">
                  {coupons.filter(
                    (c) =>
                      c.status === 'draft' || c.status === 'pending_review'
                  ).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
