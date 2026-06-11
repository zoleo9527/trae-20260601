import { useState } from 'react'
import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node'
import { Form, useLoaderData, useActionData, useNavigation, Link } from '@remix-run/react'
import { ArrowLeft, Search, FileText, Clock } from 'lucide-react'
import { requireUser } from '~/lib/session.server'
import { getComplaintDetail, updateEvidenceReview } from '~/lib/complaints.server'
import StatusBadge from '~/components/StatusBadge'
import EvidencePanel from '~/components/EvidencePanel'
import Timeline from '~/components/Timeline'
import { COMPLAINT_TYPE_LABELS, EVIDENCE_REVIEW_STATUS_LABELS } from 'shared/types'
import type { EvidenceReviewStatus, EvidenceReview, Complaint } from 'shared/types'

type ActionData = {
  errors: Record<string, string>
}

const reviewStatusOptions: { value: EvidenceReviewStatus; label: string }[] = [
  { value: 'in_progress', label: '回查中' },
  { value: 'completed', label: '已完成' },
  { value: 'blocked', label: '受阻' },
]

const reviewStatusColors: Record<EvidenceReviewStatus, string> = {
  pending: 'bg-gray-500/20 text-gray-400',
  in_progress: 'bg-amber-500/20 text-amber-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  blocked: 'bg-red-500/20 text-red-400',
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { user } = await requireUser(request)
  const id = parseInt(params.id || '0', 10)

  const detail = await getComplaintDetail(id)
  if (!detail) {
    throw new Response('Not Found', { status: 404 })
  }

  return json({
    complaint: detail.complaint as Complaint & { assignee_name: string | null; parking_lot_name: string; is_overdue: boolean },
    evidence: detail.evidence,
    evidence_reviews: detail.evidence_reviews as EvidenceReview[],
    timeline: detail.timeline,
    stuckPoint: detail.stuck_point as string | null,
  })
}

export async function action({ params, request }: ActionFunctionArgs) {
  const { user } = await requireUser(request)
  const id = parseInt(params.id || '0', 10)

  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'review_update') {
    const status = formData.get('status') as EvidenceReviewStatus
    const notes = formData.get('notes') as string

    const errors: Record<string, string> = {}

    if (!status) {
      errors.status = '请选择验证状态'
    }
    if (!notes?.trim()) {
      errors.notes = '请输入回查备注'
    }

    if (Object.keys(errors).length > 0) {
      return json({ errors }, { status: 400 })
    }

    await updateEvidenceReview(id, user.id, {
      status,
      notes: notes.trim(),
    })

    return redirect(`/evidence/${id}`)
  }

  return json({ errors: {} }, { status: 400 })
}

export default function EvidenceDetail() {
  const data = useLoaderData<typeof loader>()
  const actionData = useActionData<ActionData>()
  const navigation = useNavigation()

  const [reviewStatus, setReviewStatus] = useState<EvidenceReviewStatus>('in_progress')

  const isSubmitting = navigation.state === 'submitting'

  const latestReview = data.evidence_reviews.length > 0 ? data.evidence_reviews[0] : null

  return (
    <div className="pb-16">
      <div className="flex items-center gap-3 mb-4">
        <Link
          to="/evidence"
          className="flex items-center gap-1 text-park-muted hover:text-park-text text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </Link>
      </div>

      <div className="bg-park-card rounded-lg border border-park-border p-5 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-park-text flex items-center gap-2">
                <Search className="w-5 h-5 text-park-amber" />
                {data.complaint.complaint_no}
              </h1>
              <StatusBadge status={data.complaint.status} />
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-park-muted">
                类型：<span className="text-park-text">{COMPLAINT_TYPE_LABELS[data.complaint.type]}</span>
              </span>
              <span className="text-park-muted">
                车牌号：<span className="text-park-text">{data.complaint.plate_number || '-'}</span>
              </span>
              {data.complaint.gate_name && (
                <span className="text-park-muted">
                  道闸：<span className="text-park-text">{data.complaint.gate_name}</span>
                </span>
              )}
              {data.complaint.incident_time && (
                <span className="text-park-muted">
                  事发时间：<span className="text-park-text">{formatTime(data.complaint.incident_time)}</span>
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-park-muted">责任人</div>
            <div className="text-sm text-park-text">
              {data.complaint.assignee_name || '未分配'}
            </div>
          </div>
        </div>

        {data.complaint.description && (
          <div className="mt-4 pt-4 border-t border-park-border">
            <div className="text-xs text-park-muted mb-1.5">投诉描述</div>
            <p className="text-sm text-park-text">{data.complaint.description}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <div>
            <h2 className="text-sm font-medium text-park-text mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-park-amber" />
              证据材料
            </h2>
            <EvidencePanel evidence={data.evidence} />
          </div>

          <div className="bg-park-card rounded-lg border border-park-border p-5">
            <h2 className="text-sm font-medium text-park-text mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-park-amber" />
              回查记录
            </h2>
            {data.evidence_reviews.length === 0 ? (
              <div className="text-center py-6 text-park-muted text-sm">
                暂无回查记录
              </div>
            ) : (
              <div className="space-y-3">
                {data.evidence_reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-3 bg-park-bg rounded border border-park-border/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            reviewStatusColors[review.status as EvidenceReviewStatus] ||
                            'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {EVIDENCE_REVIEW_STATUS_LABELS[
                            review.status as EvidenceReviewStatus
                          ] || review.status}
                        </span>
                        <span className="text-xs text-park-muted">
                          {review.reviewer_name || '未知'}
                        </span>
                      </div>
                      <span className="text-xs text-park-muted/60">
                        {review.reviewed_at ? formatTime(review.reviewed_at) : '-'}
                      </span>
                    </div>
                    {review.notes && (
                      <p className="text-sm text-park-text">{review.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-park-card rounded-lg border border-park-border p-5">
            <h2 className="text-sm font-medium text-park-text mb-4">证据回查</h2>
            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="review_update" />

              <div>
                <label className="text-sm text-park-muted mb-1.5 block">
                  验证状态 <span className="text-red-400">*</span>
                </label>
                <select
                  name="status"
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as EvidenceVerificationStatus)}
                  className="w-full bg-park-bg border border-park-border rounded px-3 py-2 text-sm text-park-text outline-none focus:border-park-amber"
                >
                  {reviewStatusOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {actionData?.errors?.status && (
                  <p className="text-red-400 text-xs mt-1">{actionData.errors.status}</p>
                )}
              </div>

              <div>
                <label className="text-sm text-park-muted mb-1.5 block">
                  回查备注 <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="notes"
                  rows={4}
                  placeholder="请输入证据回查的详细说明..."
                  className="w-full bg-park-bg border border-park-border rounded px-3 py-2 text-sm text-park-text placeholder-park-muted outline-none focus:border-park-amber resize-none"
                />
                {actionData?.errors?.notes && (
                  <p className="text-red-400 text-xs mt-1">{actionData.errors.notes}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-2 text-sm rounded bg-park-amber hover:bg-park-amber/90 disabled:opacity-50 text-park-bg font-medium transition-colors"
              >
                {isSubmitting ? '提交中...' : '提交回查结果'}
              </button>
            </Form>
          </div>

          <div className="bg-park-card rounded-lg border border-park-border p-5">
            <h2 className="text-sm font-medium text-park-text mb-4">操作时间线</h2>
            <Timeline events={data.timeline} stuckPoint={data.stuckPoint} />
          </div>
        </div>
      </div>
    </div>
  )
}
