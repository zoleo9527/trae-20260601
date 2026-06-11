import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData, Link, useSearchParams, useNavigation } from '@remix-run/react'
import { Search, ChevronLeft, ChevronRight, Clock, AlertTriangle } from 'lucide-react'
import { requireUser } from '~/lib/session.server'
import { getComplaintList } from '~/lib/complaints.server'
import StatusBadge from '~/components/StatusBadge'
import { COMPLAINT_TYPE_LABELS, EVIDENCE_REVIEW_STATUS_LABELS } from 'shared/types'
import type { Complaint, ComplaintStatus, ComplaintType } from 'shared/types'

export async function loader({ request }: LoaderFunctionArgs) {
  const { user } = await requireUser(request)

  const url = new URL(request.url)
  const status = url.searchParams.get('status') as ComplaintStatus | null
  const type = url.searchParams.get('type') as ComplaintType | null
  const page = parseInt(url.searchParams.get('page') || '1', 10)

  const result = await getComplaintList({
    status: status || undefined,
    type: type || undefined,
    page,
    limit: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
  })

  return json({
    complaints: result.items as (Complaint & {
      assignee_name: string | null
      is_overdue: boolean
      stuck_point: string | null
      evidence_review_status: string | null
    })[],
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: Math.ceil(result.total / result.limit),
  })
}

const statusOptions: { value: string; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'appealing', label: '申诉中' },
]

const typeOptions: { value: string; label: string }[] = [
  { value: '', label: '全部类型' },
  ...Object.entries(COMPLAINT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
]

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function getEvidenceStatusColor(status: string | null): string {
  switch (status) {
    case 'completed':
      return 'text-emerald-400'
    case 'in_progress':
      return 'text-amber-400'
    case 'blocked':
      return 'text-red-400'
    default:
      return 'text-park-muted'
  }
}

export default function EvidenceList() {
  const data = useLoaderData<typeof loader>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigation = useNavigation()

  const statusFilter = searchParams.get('status') || ''
  const typeFilter = searchParams.get('type') || ''
  const currentPage = data.page
  const totalPages = data.totalPages

  const isLoading = navigation.state === 'loading'

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set('status', value)
    } else {
      params.delete('status')
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const handleTypeChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set('type', value)
    } else {
      params.delete('type')
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(page))
    setSearchParams(params)
  }

  return (
    <div className="pb-16">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-park-card rounded-lg border border-park-border p-4 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-park-bg border border-park-border rounded px-3 py-1.5 text-sm text-park-text outline-none focus:border-park-amber"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="bg-park-bg border border-park-border rounded px-3 py-1.5 text-sm text-park-text outline-none focus:border-park-amber"
            >
              {typeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-park-card rounded-lg border border-park-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-park-muted text-left border-b border-park-border">
                <th className="py-3 px-4 font-medium">投诉编号</th>
                <th className="py-3 px-4 font-medium">类型</th>
                <th className="py-3 px-4 font-medium">车牌号</th>
                <th className="py-3 px-4 font-medium">投诉状态</th>
                <th className="py-3 px-4 font-medium">回查状态</th>
                <th className="py-3 px-4 font-medium">责任人</th>
                <th className="py-3 px-4 font-medium">创建时间</th>
                <th className="py-3 px-4 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {data.complaints.map((complaint) => (
                <tr
                  key={complaint.id}
                  className={`border-b border-park-border/50 hover:bg-park-hover/50 transition-colors ${isLoading ? 'opacity-50' : ''}`}
                >
                  <td className="py-3 px-4 text-park-text font-medium">
                    <Link to={`/evidence/${complaint.id}`} className="hover:text-park-amber transition-colors">
                      {complaint.complaint_no}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-park-hover text-park-text text-xs">
                      {COMPLAINT_TYPE_LABELS[complaint.type]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-park-muted">
                    {complaint.plate_number || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={complaint.status} />
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs flex items-center gap-1 ${getEvidenceStatusColor(complaint.evidence_review_status)}`}>
                      {complaint.evidence_review_status === 'blocked' && (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      {complaint.evidence_review_status === 'in_progress' && (
                        <Clock className="w-3 h-3" />
                      )}
                      {complaint.evidence_review_status
                        ? EVIDENCE_REVIEW_STATUS_LABELS[complaint.evidence_review_status as keyof typeof EVIDENCE_REVIEW_STATUS_LABELS] || complaint.evidence_review_status
                        : '待回查'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {complaint.assignee_name ? (
                      <span className="text-park-text">{complaint.assignee_name}</span>
                    ) : (
                      <span className="text-red-400 text-xs">未分配</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-park-muted">
                    {formatTime(complaint.created_at)}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      to={`/evidence/${complaint.id}`}
                      className="text-park-amber hover:text-park-amber/80 text-xs flex items-center gap-1"
                    >
                      <Search className="w-3 h-3" />
                      证据回查
                    </Link>
                  </td>
                </tr>
              ))}
              {data.complaints.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-park-muted">暂无数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-park-border">
            <span className="text-xs text-park-muted">共 {data.total} 条</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1 text-sm rounded bg-park-hover text-park-muted hover:text-park-text disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-park-muted">{currentPage} / {totalPages}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 text-sm rounded bg-park-hover text-park-muted hover:text-park-text disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
