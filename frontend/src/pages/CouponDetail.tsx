import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Package,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import { couponApi } from '@/services/api'
import type { Coupon } from '@/types'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function CouponDetail() {
  const { id } = useParams<{ id: string }>()
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64Content = event.target?.result as string
        const base64Data = base64Content.split(',')[1]
        
        await couponApi.uploadAttachment(parseInt(id), {
          filename: file.name,
          file_type: file.type,
          file_size: file.size,
          base64_content: base64Data,
        })
        
        loadCoupon()
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Failed to upload file:', error)
      alert('上传失败，请重试')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDownloadAttachment = async (attachmentId: number, filename: string) => {
    try {
      const response = await couponApi.downloadAttachment(attachmentId)
      if (response.success) {
        alert(`正在下载: ${filename}`)
      }
    } catch (error) {
      console.error('Failed to download file:', error)
      alert('下载失败，请重试')
    }
  }

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!confirm('确定要删除这个附件吗？')) return
    
    try {
      const response = await couponApi.deleteAttachment(attachmentId)
      if (response.success) {
        loadCoupon()
      }
    } catch (error) {
      console.error('Failed to delete file:', error)
      alert('删除失败，请重试')
    }
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
    draft: 'bg-gray-100 text-gray-600',
    pending_review: 'bg-yellow-100 text-yellow-700',
    issued: 'bg-blue-100 text-blue-700',
    verified: 'bg-green-100 text-green-700',
    archived: 'bg-gray-300 text-gray-600',
    rejected: 'bg-red-100 text-red-700',
  }

  const statusIcons: Record<string, any> = {
    draft: Clock,
    pending_review: AlertTriangle,
    issued: CheckCircle,
    verified: CheckCircle,
    archived: CheckCircle,
    rejected: XCircle,
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

  const StatusIcon = statusIcons[coupon.status]

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {coupon.coupon_code}
                </h1>
                <p className="text-gray-500 mt-1">
                  发放于{' '}
                  {coupon.issue_date
                    ? format(new Date(coupon.issue_date), 'yyyy年MM月dd日', {
                        locale: zhCN,
                      })
                    : '-'}
                </p>
              </div>
              <span
                className={`status-badge ${statusStyles[coupon.status]} flex items-center`}
              >
                <StatusIcon size={14} className="mr-1" />
                {statusLabels[coupon.status]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  促销政策
                </h3>
                <p className="text-lg font-semibold text-gray-800">
                  {coupon.policy?.name || '-'}
                </p>
                {coupon.policy?.discount_amount && (
                  <p className="text-2xl font-bold text-primary mt-1">
                    ¥{coupon.policy.discount_amount}
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  有效期至
                </h3>
                <p className="text-lg font-semibold text-gray-800">
                  {coupon.expiry_date
                    ? format(new Date(coupon.expiry_date), 'yyyy年MM月dd日', {
                        locale: zhCN,
                      })
                    : '-'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  会员信息
                </h3>
                <p className="font-semibold text-gray-800">
                  {coupon.member?.name || '-'}
                </p>
                <p className="text-sm text-gray-500">
                  {coupon.member?.phone || '-'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  发放门店
                </h3>
                <p className="font-semibold text-gray-800">
                  {coupon.store?.name || '-'}
                </p>
                <p className="text-sm text-gray-500">
                  操作员：{coupon.operator?.name || '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              发放备注
            </h2>
            <div className="p-4 bg-gray-50 rounded-lg">
              {coupon.issue_remarks ? (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {coupon.issue_remarks}
                </p>
              ) : (
                <p className="text-gray-400 italic">暂无备注</p>
              )}
            </div>
          </div>

          {coupon.batch && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Package size={24} className="mr-2 text-primary" />
                  关联批号
                </h2>
                <Link
                  to={`/batches/${coupon.batch.id}`}
                  className="text-sm text-primary hover:text-primary-600"
                >
                  查看详情 →
                </Link>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">批号：</span>
                    <span className="font-mono font-medium">
                      {coupon.batch.batch_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">供应商：</span>
                    <span>{coupon.batch.supplier}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">生产日期：</span>
                    <span>{coupon.batch.production_date || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">到期日期：</span>
                    <span>{coupon.batch.expiry_date || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Upload size={24} className="mr-2 text-primary" />
                附件
              </h2>
              <label className="btn btn-secondary text-sm cursor-pointer">
                <Upload size={16} className="mr-2 inline" />
                上传附件
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".jpg,.jpeg,.png,.pdf"
                  disabled={uploading}
                />
              </label>
            </div>

            {coupon.attachments && coupon.attachments.length > 0 ? (
              <div className="space-y-2">
                {coupon.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <span className="text-gray-700">{attachment.filename}</span>
                      {attachment.file_size && (
                        <span className="text-xs text-gray-400 ml-2">
                          ({(attachment.file_size / 1024).toFixed(1)} KB)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleDownloadAttachment(attachment.id, attachment.filename)}
                        className="text-sm text-primary hover:text-primary-600"
                      >
                        下载
                      </button>
                      <button
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        className="text-sm text-red-500 hover:text-red-600"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Upload size={48} className="mx-auto mb-2" />
                <p>暂无附件</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Clock size={24} className="mr-2 text-primary" />
              操作历史
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
              <div className="text-center py-8 text-gray-400">
                <Clock size={48} className="mx-auto mb-2" />
                <p>暂无历史记录</p>
              </div>
            )}
          </div>

          {coupon.status === 'pending_review' && (
            <div className="card bg-primary-50 border-primary-200">
              <h3 className="font-semibold text-gray-800 mb-3">待复核</h3>
              <p className="text-sm text-gray-600 mb-4">
                此券正在等待店长复核，请耐心等待...
              </p>
              <Link
                to={`/coupons/${coupon.id}/review`}
                className="btn btn-primary w-full"
              >
                去复核
              </Link>
            </div>
          )}

          {coupon.status === 'draft' && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">草稿状态</h3>
              <p className="text-sm text-gray-600 mb-4">
                此券尚未提交复核，可以继续编辑
              </p>
              <div className="space-y-2">
                <Link
                  to={`/coupons/${coupon.id}/edit`}
                  className="btn btn-primary w-full block text-center"
                >
                  编辑
                </Link>
                <button
                  onClick={async () => {
                    await couponApi.submit(coupon.id)
                    loadCoupon()
                  }}
                  className="btn btn-secondary w-full"
                >
                  提交复核
                </button>
              </div>
            </div>
          )}

          {coupon.status === 'rejected' && (
            <div className="card bg-red-50 border-red-200">
              <h3 className="font-semibold text-red-800 mb-3">审核被拒绝</h3>
              <p className="text-sm text-red-600 mb-2">
                {coupon.review_remarks || '未填写拒绝原因'}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                请修改后重新提交复核
              </p>
              <div className="space-y-2">
                <Link
                  to={`/coupons/${coupon.id}/edit`}
                  className="btn btn-primary w-full block text-center"
                >
                  修改并重提
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
