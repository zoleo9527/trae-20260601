import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X as XIcon, RotateCcw } from 'lucide-react'
import { apiGet, apiPost, apiPut } from '@/lib/api'
import { cn } from '@/lib/utils'
import { QualificationBadge } from '@/components/StatusBadge'
import Timeline from '@/components/Timeline'
import { useStore, roleConfig } from '@/store'
import type { Qualification, Purchase } from '@/types'

export default function QualificationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useStore()

  const [data, setData] = useState<Qualification | null>(null)
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [purchases, setPurchases] = useState<Purchase[]>([])

  const canReview = session?.role && roleConfig[session.role]?.canReviewQualification
  const isSalesClerk = session?.role === 'sales_clerk'
  const isPending = data?.status === 'pending' || data?.status === 'expiring_soon'
  const isRejected = data?.status === 'rejected'

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await apiGet<Qualification>(`/qualifications/${id}`)
      setData(res)
      try {
        const purchaseRes = await apiGet<{ list: Purchase[] }>('/purchases', { qualification_id: id })
        setPurchases(purchaseRes.list || [])
      } catch {
        setPurchases([])
      }
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!id) return
    setActionLoading(true)
    try {
      await apiPost(`/qualifications/${id}/review`, { action, note })
      setNote('')
      fetchData()
    } finally {
      setActionLoading(false)
    }
  }

  const handleResubmit = async () => {
    if (!id || !data) return
    setActionLoading(true)
    try {
      await apiPut(`/qualifications/${id}`, {
        customer_name: data.customer_name,
        license_type: data.license_type,
        license_no: data.license_no,
        expire_date: data.expire_date,
      })
      setNote('')
      fetchData()
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-4xl space-y-4 p-4"><div className="h-48 animate-pulse rounded-lg bg-gray-100" /></div>
  }

  if (!data) {
    return <div className="py-16 text-center text-gray-400">资质记录不存在</div>
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <button onClick={() => navigate('/qualifications')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" />返回列表
      </button>

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{data.customer_name}</h2>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <div>证照类型: {data.license_type}</div>
              <div>许可证号: {data.license_no}</div>
              <div>到期日期: {data.expire_date}</div>
              <div>提交人: {data.submitted_by}</div>
              {data.reviewed_by && <div>审核人: {data.reviewed_by}</div>}
              {data.review_note && <div>审核备注: {data.review_note}</div>}
            </div>
          </div>
          <QualificationBadge status={data.status} />
        </div>
      </div>

      {((canReview && isPending) || (isSalesClerk && isRejected)) && (
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-medium text-gray-900">操作</h3>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="请输入备注"
            className="mb-3 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            {canReview && isPending && (
              <>
                <button onClick={() => handleReview('approve')} disabled={actionLoading} className="flex items-center gap-1 rounded-md bg-green-600 px-4 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50">
                  <Check className="h-4 w-4" />通过
                </button>
                <button onClick={() => handleReview('reject')} disabled={actionLoading} className="flex items-center gap-1 rounded-md bg-red-500 px-4 py-1.5 text-sm text-white hover:bg-red-600 disabled:opacity-50">
                  <XIcon className="h-4 w-4" />驳回
                </button>
              </>
            )}
            {isSalesClerk && isRejected && (
              <button onClick={handleResubmit} disabled={actionLoading} className="flex items-center gap-1 rounded-md bg-amber-500 px-4 py-1.5 text-sm text-white hover:bg-amber-600 disabled:opacity-50">
                <RotateCcw className="h-4 w-4" />重新提交
              </button>
            )}
          </div>
        </div>
      )}

      {data.logs && data.logs.length > 0 && (
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-medium text-gray-900">审核记录</h3>
          <Timeline entries={data.logs} />
        </div>
      )}

      {purchases.length > 0 && (
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-medium text-gray-900">关联采购单</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 font-medium">申请单号</th>
                <th className="pb-2 font-medium">客户</th>
                <th className="pb-2 font-medium">状态</th>
                <th className="pb-2 font-medium text-right">金额</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2 text-blue-600">{p.request_no}</td>
                  <td className="py-2">{p.customer_name}</td>
                  <td className="py-2">{p.status}</td>
                  <td className="py-2 text-right">¥{p.total_amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
