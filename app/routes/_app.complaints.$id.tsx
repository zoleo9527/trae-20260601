import { useState } from 'react'
import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node'
import { Form, useLoaderData, useActionData, useNavigation } from '@remix-run/react'
import { AlertTriangle, MessageSquare, UserCheck, XCircle, CheckCircle, Clock } from 'lucide-react'
import { requireUser } from '~/lib/session.server'
import { getComplaintDetail, updateComplaint } from '~/lib/complaints.server'
import { getUsers } from '~/lib/users.server'
import StatusBadge from '~/components/StatusBadge'
import Timeline from '~/components/Timeline'
import EvidencePanel from '~/components/EvidencePanel'
import { COMPLAINT_TYPE_LABELS, COMPLAINT_STATUS_LABELS, STUCK_POINT_LABELS, USER_ROLE_LABELS } from 'shared/types'
import type { Complaint, ComplaintStatus, TimelineEvent, User } from 'shared/types'

type ActionData = {
  errors: Record<string, string>
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { user } = await requireUser(request)
  const id = Number(params.id)

  if (!id || isNaN(id)) {
    throw new Response('Not Found', { status: 404 })
  }

  const detail = await getComplaintDetail(id)
  if (!detail) {
    throw new Response('Not Found', { status: 404 })
  }

  const users = await getUsers()

  return json({
    complaint: detail.complaint as Complaint & { assignee_name: string | null; is_overdue: boolean },
    timeline: detail.timeline as TimelineEvent[],
    evidence: detail.evidence,
    evidence_reviews: detail.evidence_reviews,
    stuck_point: detail.stuck_point as string | null,
    users,
    currentUser: user,
  })
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { user } = await requireUser(request)
  const id = Number(params.id)

  if (!id || isNaN(id)) {
    throw new Response('Not Found', { status: 404 })
  }

  const formData = await request.formData()
  const intent = formData.get('intent') as string

  const errors: Record<string, string> = {}

  if (intent === 'appeal') {
    const appeal_reason = formData.get('appeal_reason') as string

    if (!appeal_reason?.trim()) {
      errors.appeal_reason = '请输入申诉理由'
    }

    if (Object.keys(errors).length > 0) {
      return json({ errors }, { status: 400 })
    }

    await updateComplaint(
      id,
      {
        appeal_reason: appeal_reason.trim(),
        status: 'appealing',
      },
      user.id
    )

    return redirect(`/complaints/${id}`)
  }

  if (intent === 'update_status') {
    const new_status = formData.get('new_status') as ComplaintStatus

    if (!new_status) {
      errors.new_status = '请选择状态'
    }

    if (Object.keys(errors).length > 0) {
      return json({ errors }, { status: 400 })
    }

    await updateComplaint(
      id,
      { status: new_status },
      user.id
    )

    return redirect(`/complaints/${id}`)
  }

  if (intent === 'assign') {
    const assignee_id = formData.get('assignee_id') as string

    if (!assignee_id) {
      errors.assignee_id = '请选择负责人'
    }

    if (Object.keys(errors).length > 0) {
      return json({ errors }, { status: 400 })
    }

    await updateComplaint(
      id,
      { assignee_id: Number(assignee_id) },
      user.id
    )

    return redirect(`/complaints/${id}`)
  }

  return json({ errors }, { status: 400 })
}

export default function ComplaintDetail() {
  const data = useLoaderData<typeof loader>()
  const actionData = useActionData<ActionData>()
  const navigation = useNavigation()

  const [showAppealForm, setShowAppealForm] = useState(false)
  const [showStatusForm, setShowStatusForm] = useState(false)
  const [showAssignForm, setShowAssignForm] = useState(false)

  const { complaint, timeline, evidence, stuck_point, users, currentUser } = data

  const isLoading = navigation.state === 'loading'

  const canAppeal = complaint.status !== 'closed' && complaint.status !== 'appealing'
  const canUpdateStatus = currentUser.role === 'operations' || currentUser.role === 'customer_service'
  const canAssign = currentUser.role === 'operations'

  const statusOptions: { value: ComplaintStatus; label: string }[] = [
    { value: 'pending', label: '待处理' },
    { value: 'assigned', label: '已分配' },
    { value: 'processing', label: '处理中' },
    { value: 'rejected', label: '已退回' },
    { value: 'closed', label: '已关闭' },
  ]

  return (
    <div className="pb-8">
      <div className="bg-park-card rounded-lg border border-park-border p-5 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-park-text">{complaint.complaint_no}</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-park-hover text-park-text text-xs">
              {COMPLAINT_TYPE_LABELS[complaint.type]}
            </span>
            <StatusBadge status={complaint.status} />
            {complaint.is_overdue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs font-medium">
                <AlertTriangle className="w-3 h-3" />
                已逾期
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canUpdateStatus && (
              <button
                onClick={() => setShowStatusForm(!showStatusForm)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-park-hover text-park-text hover:bg-park-hover/80 transition-colors"
              >
                <Clock className="w-4 h-4" />
                更新状态
              </button>
            )}
            {canAssign && (
              <button
                onClick={() => setShowAssignForm(!showAssignForm)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-park-hover text-park-text hover:bg-park-hover/80 transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                分配
              </button>
            )}
          </div>
        </div>

        {showStatusForm && (
          <div className="mb-4 p-3 bg-park-bg rounded border border-park-border">
            <Form method="post" className="flex items-center gap-3">
              <input type="hidden" name="intent" value="update_status" />
              <select
                name="new_status"
                className="bg-park-card border border-park-border rounded px-3 py-1.5 text-sm text-park-text outline-none focus:border-park-amber"
                defaultValue={complaint.status}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={isLoading}
                className="px-3 py-1.5 text-sm rounded bg-park-amber hover:bg-park-amber/90 disabled:opacity-50 text-park-bg font-medium transition-colors"
              >
                {isLoading ? '提交中...' : '确认'}
              </button>
              <button
                type="button"
                onClick={() => setShowStatusForm(false)}
                className="px-3 py-1.5 text-sm rounded bg-park-hover text-park-muted hover:text-park-text transition-colors"
              >
                取消
              </button>
              {actionData?.errors?.new_status && (
                <p className="text-red-400 text-xs">{actionData.errors.new_status}</p>
              )}
            </Form>
          </div>
        )}

        {showAssignForm && (
          <div className="mb-4 p-3 bg-park-bg rounded border border-park-border">
            <Form method="post" className="flex items-center gap-3">
              <input type="hidden" name="intent" value="assign" />
              <select
                name="assignee_id"
                className="bg-park-card border border-park-border rounded px-3 py-1.5 text-sm text-park-text outline-none focus:border-park-amber"
                defaultValue={complaint.assignee_id || ''}
              >
                <option value="">选择负责人</option>
                {users.map((u: User) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({USER_ROLE_LABELS[u.role]})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={isLoading}
                className="px-3 py-1.5 text-sm rounded bg-park-amber hover:bg-park-amber/90 disabled:opacity-50 text-park-bg font-medium transition-colors"
              >
                {isLoading ? '提交中...' : '确认'}
              </button>
              <button
                type="button"
                onClick={() => setShowAssignForm(false)}
                className="px-3 py-1.5 text-sm rounded bg-park-hover text-park-muted hover:text-park-text transition-colors"
              >
                取消
              </button>
              {actionData?.errors?.assignee_id && (
                <p className="text-red-400 text-xs">{actionData.errors.assignee_id}</p>
              )}
            </Form>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4 text-sm">
          <div>
            <div className="text-park-muted text-xs mb-1">车牌号</div>
            <div className="text-park-text font-medium">
              {complaint.plate_number || (
                <span className="text-purple-400">无牌车</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-park-muted text-xs mb-1">负责人</div>
            <div className="text-park-text">
              {complaint.assignee_name || (
                <span className="text-red-400 text-xs">未分配</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-park-muted text-xs mb-1">事发道闸</div>
            <div className="text-park-text">{complaint.gate_name || '-'}</div>
          </div>
          <div>
            <div className="text-park-muted text-xs mb-1">事发时间</div>
            <div className="text-park-text">
              {complaint.incident_time ? formatTime(complaint.incident_time) : '-'}
            </div>
          </div>
          <div>
            <div className="text-park-muted text-xs mb-1">创建时间</div>
            <div className="text-park-text">{formatTime(complaint.created_at)}</div>
          </div>
          <div>
            <div className="text-park-muted text-xs mb-1">更新时间</div>
            <div className="text-park-text">{formatTime(complaint.updated_at)}</div>
          </div>
          <div>
            <div className="text-park-muted text-xs mb-1">截止时间</div>
            <div className={complaint.is_overdue ? 'text-red-400 font-medium' : 'text-park-text'}>
              {formatTime(complaint.deadline)}
            </div>
          </div>
          {complaint.appealed_at && (
            <div>
              <div className="text-park-muted text-xs mb-1">申诉时间</div>
              <div className="text-purple-400">{formatTime(complaint.appealed_at)}</div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-park-muted text-xs mb-1.5">投诉描述</div>
            <div className="text-park-text text-sm leading-relaxed bg-park-bg rounded p-3 border border-park-border">
              {complaint.description}
            </div>
          </div>

          {complaint.appeal_reason && (
            <div>
              <div className="text-purple-400 text-xs mb-1.5 font-medium">申诉理由</div>
              <div className="text-park-text text-sm leading-relaxed bg-purple-500/10 border border-purple-500/30 rounded p-3">
                {complaint.appeal_reason}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        <div className="lg:col-span-7">
          <EvidencePanel evidence={evidence} />
        </div>

        <div className="lg:col-span-3 space-y-4">
          {stuck_point && stuck_point !== 'processing' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-medium text-sm">卡点预警</span>
              </div>
              <div className="text-red-300 text-sm">
                {STUCK_POINT_LABELS[stuck_point] || stuck_point}
              </div>
              <div className="text-red-400/70 text-xs mt-1">
                该工单当前在此环节停滞，需要及时处理
              </div>
            </div>
          )}

          <div className="bg-park-card rounded-lg border border-park-border p-4">
            <h3 className="text-park-text font-medium text-sm mb-3">操作</h3>
            <div className="space-y-2">
              {canAppeal && (
                <>
                  {showAppealForm ? (
                    <Form method="post">
                      <input type="hidden" name="intent" value="appeal" />
                      <div className="mb-3">
                        <textarea
                          name="appeal_reason"
                          rows={3}
                          placeholder="请输入申诉理由..."
                          className="w-full bg-park-bg border border-park-border rounded px-3 py-2 text-sm text-park-text placeholder-park-muted outline-none focus:border-park-amber resize-none"
                        />
                        {actionData?.errors?.appeal_reason && (
                          <p className="text-red-400 text-xs mt-1">{actionData.errors.appeal_reason}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded bg-purple-500 hover:bg-purple-500/90 disabled:opacity-50 text-white font-medium transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          {isLoading ? '提交中...' : '提交申诉'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAppealForm(false)}
                          className="px-3 py-2 text-sm rounded bg-park-hover text-park-muted hover:text-park-text transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </Form>
                  ) : (
                    <button
                      onClick={() => setShowAppealForm(true)}
                      className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm rounded bg-purple-500 hover:bg-purple-500/90 text-white font-medium transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      申诉
                    </button>
                  )}
                </>
              )}

              {complaint.status !== 'closed' && canUpdateStatus && (
                <Form method="post">
                  <input type="hidden" name="intent" value="update_status" />
                  <input type="hidden" name="new_status" value="processing" />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm rounded bg-amber-500 hover:bg-amber-500/90 disabled:opacity-50 text-park-bg font-medium transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    处理
                  </button>
                </Form>
              )}

              {complaint.status !== 'closed' && canUpdateStatus && (
                <Form method="post">
                  <input type="hidden" name="intent" value="update_status" />
                  <input type="hidden" name="new_status" value="closed" />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm rounded bg-emerald-500 hover:bg-emerald-500/90 disabled:opacity-50 text-white font-medium transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    关闭
                  </button>
                </Form>
              )}

              {complaint.status === 'closed' && (
                <div className="text-center text-park-muted text-sm py-2">
                  该投诉已关闭
                </div>
              )}
            </div>
          </div>

          <div className="bg-park-card rounded-lg border border-park-border p-4">
            <h3 className="text-park-text font-medium text-sm mb-3">操作记录</h3>
            <Timeline events={timeline} stuckPoint={stuck_point} />
          </div>
        </div>
      </div>
    </div>
  )
}
