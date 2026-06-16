import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  AlertCircle,
} from 'lucide-react'
import { couponApi } from '@/services/api'
import type { Coupon } from '@/types'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function CouponReview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)

  useEffect(() => {
    if (id) {
      loadCoupon()
    }
  }, [id])

  const loadCoupon = async () => {
    if (!id) return
    setLoading(true)
    try {
      const response = await couponApi.get(parseInt(id))
      if (response.success) {
        setCoupon(response.data)
      }
    } catch (error) {
      console.error('Failed to load coupon:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (reviewAction: 'approve' | 'reject') => {
    if (reviewAction === 'reject' && !remarks.trim()) {
      alert('请填写拒绝原因')
      return
    }

    setAction(reviewAction)
    setShowConfirm(true)
  }

  const confirmReview = async () => {
    if (!id || !action) return

    setSubmitting(true)
    try {
      const response = await couponApi.review(parseInt(id), {
        action,
        remarks: remarks.trim(),
      })

      if (response.success) {
        navigate('/coupons')
      }
    } catch (error) {
      console.error('Failed to review coupon:', error)
    } finally {
      setSubmitting(false)
      setShowConfirm(false)
    }
  }

  const actionLabels: Record<string, string> = {
    created: '创建',
    submitted_for_review: '提交复核',
    approved: '审核通过',
    rejected: '审核拒绝',
    verified: '核销',
    updated: '更新',
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

  if (!coupon) {
    return (
      <div className="p-8">
        <p className="text-gray-500">未找到该券信息</p>
      </div>
    )
  }

  const statusFlow = [
    { status: 'draft', label: '草稿', icon: '📝' },
    { status: 'pending_review', label: '待复核', icon: '⏰' },
    { status: 'issued', label: '已发放', icon: '✅' },
    { status: 'verified', label: '已核销', icon: '🎉' },
  ]

  const currentStatusIndex = statusFlow.findIndex(s => s.status === coupon.status)
  const isRejected = coupon.status === 'rejected'

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          to="/coupons"
          className="inline-flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={20} className="mr-2" />
          返回列表
        </Link>
      </div>

      <div className="card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800">
                {coupon.coupon_code}
              </h1>
              <span className="ml-3 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                待复核
              </span>
            </div>
            <p className="text-gray-500 mt-1">
              提交时间：{' '}
              {coupon.updated_at
                ? format(new Date(coupon.updated_at), 'yyyy年MM月dd日 HH:mm', {
                    locale: zhCN,
                  })
                : '-'}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-600 mb-3">券状态流程</h3>
          <div className="flex items-center justify-between">
            {statusFlow.map((step, index) => {
              const isActive = index <= currentStatusIndex && !isRejected
              const isCurrent = index === currentStatusIndex && !isRejected
              return (
                <div key={step.status} className="flex items-center flex-1">
                  <div className={`flex flex-col items-center ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      isCurrent ? 'bg-primary text-white ring-4 ring-primary-200' :
                      isActive ? 'bg-green-500 text-white' : 'bg-gray-300 text-white'
                    }`}>
                      {isActive && !isCurrent ? '✓' : step.icon}
                    </div>
                    <span className={`text-xs mt-2 ${isCurrent ? 'font-semibold text-primary' : 'text-gray-500'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < statusFlow.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${index < currentStatusIndex ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  )}
                </div>
              )
            })}
          </div>
          {isRejected && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <XCircle size={20} className="text-red-500 mr-2" />
              <span className="text-red-700 text-sm font-medium">此券已被拒绝，请查看下方链路追溯</span>
            </div>
          )}
        </div>

            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle size={20} className="text-blue-600 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-800">复核说明</h3>
                    <p className="text-sm text-blue-600 mt-1">
                      请仔细核对以下信息，确保发放无误后再进行复核操作
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  促销政策
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {coupon.policy?.name || '-'}
                      </p>
                      {coupon.policy?.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {coupon.policy.description}
                        </p>
                      )}
                    </div>
                    <span className="text-2xl font-bold text-primary">
                      ¥{coupon.policy?.discount_amount || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  会员信息
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">姓名</p>
                      <p className="font-semibold text-gray-800">
                        {coupon.member?.name || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">手机号</p>
                      <p className="font-semibold text-gray-800">
                        {coupon.member?.phone || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">宝宝姓名</p>
                      <p className="font-semibold text-gray-800">
                        {coupon.member?.baby_name || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">会员等级</p>
                      <p className="font-semibold text-gray-800 capitalize">
                        {coupon.member?.tier || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {coupon.batch && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    关联批号
                  </h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Package size={20} className="text-primary mr-3" />
                      <div className="flex-1">
                        <p className="font-mono font-semibold text-gray-800">
                          {coupon.batch.batch_number}
                        </p>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          <span>{coupon.batch.supplier}</span>
                          <span>
                            到期：{coupon.batch.expiry_date || '-'}
                          </span>
                        </div>
                      </div>
                      {coupon.batch.status === 'expiring' && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm">
                          即将过期
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-500">
                    发放备注（来自发放环节）
                  </h3>
                  <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary text-xs rounded">
                    自动流转
                  </span>
                </div>
                <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  {coupon.issue_remarks ? (
                    <div>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {coupon.issue_remarks}
                      </p>
                      <div className="mt-3 pt-3 border-t border-primary-200 text-xs text-gray-500 flex items-center space-x-4">
                        <span>发放人：{coupon.operator?.name || '-'}</span>
                        <span>发放时间：{coupon.issue_date || '-'}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">发放时未填写备注</p>
                  )}
                </div>
                {coupon.review_remarks && (
                  <div className="mt-4">
                    <div className="flex items-center mb-3">
                      <h3 className="text-sm font-medium text-gray-500">
                        复核备注
                      </h3>
                    </div>
                    <div className="p-4 bg-accent-50 border border-accent-200 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {coupon.review_remarks}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  附件
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  {coupon.attachments && coupon.attachments.length > 0 ? (
                    <div className="space-y-2">
                      {coupon.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-gray-700">
                            {att.filename}
                          </span>
                          <button className="text-sm text-primary hover:text-primary-600">
                            查看
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">暂无附件</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Clock size={24} className="mr-2 text-primary" />
              发放链路追溯
            </h2>

            {coupon.history && coupon.history.length > 0 ? (
              <div className="space-y-4">
                {coupon.history.map((log, index) => (
                  <div key={log.id || index} className="relative">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800">
                            {actionLabels[log.action] || log.action}
                          </span>
                          <span className="text-xs text-gray-400">
                            {format(
                              new Date(log.created_at),
                              'MM/dd HH:mm',
                              { locale: zhCN }
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {log.user?.name || '系统'}
                        </p>
                        {log.new_value && (
                          <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                            {log.new_value}
                          </p>
                        )}
                      </div>
                    </div>
                    {index < coupon.history.length - 1 && (
                      <div className="absolute left-1 top-4 bottom-0 w-px bg-gray-200"></div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">暂无历史记录</p>
            )}
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              复核操作
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  复核意见
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                  placeholder={
                    '填写复核意见（拒绝时必填）'
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleReview('approve')}
                  disabled={submitting}
                  className="w-full btn btn-primary py-3 flex items-center justify-center disabled:opacity-50"
                >
                  <CheckCircle size={20} className="mr-2" />
                  审核通过
                </button>

                <button
                  onClick={() => handleReview('reject')}
                  disabled={submitting}
                  className="w-full btn bg-red-500 text-white hover:bg-red-600 py-3 flex items-center justify-center disabled:opacity-50"
                >
                  <XCircle size={20} className="mr-2" />
                  审核拒绝
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              确认复核操作
            </h3>
            <p className="text-gray-600 mb-6">
              {action === 'approve'
                ? '确定要审核通过此券吗？审核通过后，券将变为"已发放"状态。'
                : '确定要拒绝此券吗？拒绝后，券将返回给店员重新处理。'}
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn btn-secondary"
              >
                取消
              </button>
              <button
                onClick={confirmReview}
                disabled={submitting}
                className={`btn ${
                  action === 'approve' ? 'btn-primary' : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {submitting ? '处理中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
