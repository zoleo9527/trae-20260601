import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Eye, Edit } from 'lucide-react'
import { couponApi } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import type { Coupon } from '@/types'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function CouponList() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  useEffect(() => {
    loadCoupons()
  }, [status, page])

  const loadCoupons = async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = { page, limit }
      if (status) params.status = status
      if (search) params.search = search

      const response = await couponApi.list(params)
      if (response.success) {
        setCoupons(response.data.items)
        setTotal(response.data.total)
      }
    } catch (error) {
      console.error('Failed to load coupons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadCoupons()
  }

  const statusLabels: Record<string, string> = {
    draft: '草稿',
    pending_review: '待复核',
    issued: '已发放',
    verified: '已核销',
    archived: '已归档',
    rejected: '已拒绝',
  }

  const statusStyles: Record<string, string> = {
    draft: 'status-draft',
    pending_review: 'status-pending',
    issued: 'status-issued',
    verified: 'status-verified',
    archived: 'bg-gray-300 text-gray-600',
    rejected: 'status-rejected',
  }

  const canIssue = user?.role === 'clerk' || user?.role === 'manager'
  const canReview = user?.role === 'manager'
  const isBuyer = user?.role === 'buyer'

  const getDefaultStatus = () => {
    if (isBuyer) return 'issued'
    return ''
  }

  useEffect(() => {
    if (isBuyer && !status) {
      setStatus('issued')
    }
  }, [isBuyer])

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {isBuyer ? '促销券查询' : '促销券管理'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isBuyer ? '查看已发放和已核销的促销券记录' : '管理促销券的发放、复核与核销'}
          </p>
        </div>
        {canIssue && (
          <Link
            to="/coupons/issue"
            className="btn btn-primary flex items-center"
          >
            <Plus size={20} className="mr-2" />
            新建发放
          </Link>
        )}
      </div>

      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索券编号、会员姓名..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">全部状态</option>
            {!isBuyer && <option value="draft">草稿</option>}
            {!isBuyer && <option value="pending_review">待复核</option>}
            <option value="issued">已发放</option>
            <option value="verified">已核销</option>
            {!isBuyer && <option value="archived">已归档</option>}
            {!isBuyer && <option value="rejected">已拒绝</option>}
          </select>

          <button type="submit" className="btn btn-primary">
            搜索
          </button>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">暂无数据</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">
                    券编号
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">
                    政策名称
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">
                    会员
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">
                    发放日期
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">
                    有效期至
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">
                    状态
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="table-row border-b border-gray-100">
                    <td className="py-3 px-4 font-mono text-sm">
                      {coupon.coupon_code}
                    </td>
                    <td className="py-3 px-4">
                      {coupon.policy?.name || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-800">
                          {coupon.member?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {coupon.member?.phone}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {coupon.issue_date
                        ? format(new Date(coupon.issue_date), 'yyyy-MM-dd', {
                            locale: zhCN,
                          })
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {coupon.expiry_date
                        ? format(new Date(coupon.expiry_date), 'yyyy-MM-dd', {
                            locale: zhCN,
                          })
                        : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`status-badge ${statusStyles[coupon.status]}`}
                      >
                        {statusLabels[coupon.status]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/coupons/${coupon.id}`}
                          className="p-2 hover:bg-gray-100 rounded transition-colors"
                          title="查看详情"
                        >
                          <Eye size={18} className="text-gray-600" />
                        </Link>
                        {coupon.status === 'draft' && (
                          <Link
                            to={`/coupons/${coupon.id}/edit`}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                            title="编辑"
                          >
                            <Edit size={18} className="text-gray-600" />
                          </Link>
                        )}
                        {coupon.status === 'pending_review' && canReview && (
                          <Link
                            to={`/coupons/${coupon.id}/review`}
                            className="p-2 hover:bg-primary-50 rounded transition-colors"
                            title="复核"
                          >
                            <Edit size={18} className="text-primary" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {total > limit && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  显示 {(page - 1) * limit + 1} - {Math.min(page * limit, total)}{' '}
                  条，共 {total} 条
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    上一页
                  </button>
                  <span className="px-3 py-1">
                    第 {page} / {Math.ceil(total / limit)} 页
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page * limit >= total}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
