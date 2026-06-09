import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Filter, Plus, Calendar, X, ChevronDown, ChevronUp, User } from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import { cn } from '@/lib/utils'
import { QualificationBadge } from '@/components/StatusBadge'
import { useStore, roleConfig } from '@/store'
import type { Qualification, QualificationStatus, PaginatedResponse } from '@/types'

const statusOptions: { value: '' | QualificationStatus; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
  { value: 'expiring_soon', label: '即将到期' },
  { value: 'expired', label: '已过期' },
]

const licenseTypes = ['医疗器械经营许可证', '营业执照', '医疗机构执业许可证']

const statusBorderColors: Record<QualificationStatus, string> = {
  pending: 'border-l-gray-300',
  approved: 'border-l-green-400',
  rejected: 'border-l-red-400',
  expiring_soon: 'border-l-amber-400',
  expired: 'border-l-red-500',
}

function getExpireLabel(dateStr: string) {
  const now = new Date()
  const exp = new Date(dateStr)
  const diff = exp.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days < 0) return { label: '已过期', className: 'text-red-600' }
  if (days <= 30) return { label: '即将到期', className: 'text-amber-600' }
  return null
}

export default function QualificationList() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useStore()
  const canCreate = session?.role && roleConfig[session.role]?.canCreateQualification

  const [status, setStatus] = useState<'' | QualificationStatus>('')
  const [keyword, setKeyword] = useState('')
  const [submittedBy, setSubmittedBy] = useState('')
  const [expireAfter, setExpireAfter] = useState('')
  const [expireBefore, setExpireBefore] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [list, setList] = useState<Qualification[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ customer_name: '', license_type: licenseTypes[0], license_no: '', expire_date: '' })
  const [submitting, setSubmitting] = useState(false)

  const pageSize = 10
  const totalPages = Math.ceil(total / pageSize)

  useEffect(() => {
    if (location.state?.showForm) {
      setShowForm(true)
      navigate(location.pathname, { state: {}, replace: true })
    }
  }, [location.state])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page), page_size: String(pageSize) }
      if (status) params.status = status
      if (keyword.trim()) params.customer_name = keyword.trim()
      if (submittedBy.trim()) params.submitted_by = submittedBy.trim()
      if (expireAfter) params.expire_after = expireAfter
      if (expireBefore) params.expire_before = expireBefore
      const res = await apiGet<PaginatedResponse<Qualification>>('/qualifications', params)
      setList(res.list)
      setTotal(res.total)
    } catch {
      setList([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [status, page])

  const handleSearch = () => { setPage(1); fetchData() }

  const handleReset = () => {
    setStatus('')
    setKeyword('')
    setSubmittedBy('')
    setExpireAfter('')
    setExpireBefore('')
    setPage(1)
  }

  const handleCreate = async () => {
    if (!form.customer_name || !form.license_no || !form.expire_date) return
    setSubmitting(true)
    try {
      await apiPost('/qualifications', form)
      setShowForm(false)
      setForm({ customer_name: '', license_type: licenseTypes[0], license_no: '', expire_date: '' })
      setPage(1)
      fetchData()
    } finally {
      setSubmitting(false)
    }
  }

  const hasFilters = status || keyword || submittedBy || expireAfter || expireBefore

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as '' | QualificationStatus); setPage(1) }}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm"
          >
            {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索客户名称"
              className="w-full rounded-md border border-gray-200 py-1.5 pl-8 pr-3 text-sm"
            />
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              'flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm transition-colors',
              showAdvanced ? 'border-blue-300 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50',
            )}
          >
            更多筛选
            {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {canCreate && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />新建资质
            </button>
          )}
        </div>

        {showAdvanced && (
          <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                value={submittedBy}
                onChange={(e) => setSubmittedBy(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="提交人"
                className="rounded-md border border-gray-200 py-1.5 pl-8 pr-3 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>到期日</span>
              <input
                type="date"
                value={expireAfter}
                onChange={(e) => setExpireAfter(e.target.value)}
                className="rounded-md border border-gray-200 px-2 py-1.5 text-sm"
              />
              <span>~</span>
              <input
                type="date"
                value={expireBefore}
                onChange={(e) => setExpireBefore(e.target.value)}
                className="rounded-md border border-gray-200 px-2 py-1.5 text-sm"
              />
            </div>
            <button onClick={handleSearch} className="rounded-md bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600">搜索</button>
            {hasFilters && (
              <button onClick={handleReset} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                <X className="h-3 w-3" />清除
              </button>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">新建客户资质</h3>
            <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="客户名称" className="rounded-md border border-gray-200 px-3 py-1.5 text-sm" />
            <select value={form.license_type} onChange={(e) => setForm({ ...form, license_type: e.target.value })} className="rounded-md border border-gray-200 px-3 py-1.5 text-sm">
              {licenseTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input value={form.license_no} onChange={(e) => setForm({ ...form, license_no: e.target.value })} placeholder="许可证号" className="rounded-md border border-gray-200 px-3 py-1.5 text-sm" />
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="date" value={form.expire_date} onChange={(e) => setForm({ ...form, expire_date: e.target.value })} className="w-full rounded-md border border-gray-200 py-1.5 pl-8 pr-3 text-sm" />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="rounded-md border border-gray-200 px-4 py-1.5 text-sm">取消</button>
            <button onClick={handleCreate} disabled={submitting} className="rounded-md bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
              {submitting ? '提交中...' : '提交'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-lg bg-gray-100" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">暂无资质记录</div>
      ) : (
        <div className="space-y-3">
          {list.map((q) => {
            const expireInfo = getExpireLabel(q.expire_date)
            return (
              <div
                key={q.id}
                onClick={() => navigate(`/qualifications/${q.id}`)}
                className={cn('cursor-pointer rounded-lg border-l-4 bg-white p-4 shadow-sm transition-shadow hover:shadow-md', statusBorderColors[q.status])}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{q.customer_name}</div>
                    <div className="mt-1 text-sm text-gray-500">{q.license_type} · {q.license_no}</div>
                  </div>
                  <QualificationBadge status={q.status} />
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {expireInfo ? <span className={expireInfo.className}>{expireInfo.label}</span> : q.expire_date}
                  </span>
                  <span>提交人: {q.submitted_by}</span>
                  {q.reviewed_by && <span>审核人: {q.reviewed_by}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-40">上一页</button>
          <span>{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-40">下一页</button>
        </div>
      )}
    </div>
  )
}
