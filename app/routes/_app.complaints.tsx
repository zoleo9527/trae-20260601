import { useState } from 'react'
import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node'
import { Form, useLoaderData, useActionData, useSearchParams, useNavigation, Link } from '@remix-run/react'
import { Plus, X, ChevronLeft, ChevronRight, Users, CheckCircle } from 'lucide-react'
import { requireUser } from '~/lib/session.server'
import { getComplaintList, createComplaint, batchUpdateComplaints } from '~/lib/complaints.server'
import { getUsers } from '~/lib/users.server'
import StatusBadge from '~/components/StatusBadge'
import { COMPLAINT_TYPE_LABELS, COMPLAINT_STATUS_LABELS, USER_ROLE_LABELS } from 'shared/types'
import type { Complaint, ComplaintType, ComplaintStatus, User } from 'shared/types'

type ActionData = {
  errors: Record<string, string>
  batchResult?: { updated: number }
}

const gateOptions = [
  { id: 1, name: 'A区入口' },
  { id: 2, name: 'A区出口' },
  { id: 3, name: 'B区入口' },
  { id: 4, name: 'C区入口' },
]

const statusOptions: { value: string; label: string }[] = [
  { value: '', label: '全部状态' },
  ...Object.entries(COMPLAINT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
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

export async function loader({ request }: LoaderFunctionArgs) {
  const { user } = await requireUser(request)

  const url = new URL(request.url)
  const status = url.searchParams.get('status') as ComplaintStatus | null
  const type = url.searchParams.get('type') as ComplaintType | null
  const page = parseInt(url.searchParams.get('page') || '1', 10)

  const [complaintsResult, users] = await Promise.all([
    getComplaintList({
      status: status || undefined,
      type: type || undefined,
      page,
      limit: 20,
    }),
    getUsers(),
  ])

  return json({
    complaints: complaintsResult.items,
    total: complaintsResult.total,
    page: complaintsResult.page,
    limit: complaintsResult.limit,
    totalPages: Math.ceil(complaintsResult.total / complaintsResult.limit),
    users,
  })
}

export async function action({ request }: ActionFunctionArgs) {
  const { user } = await requireUser(request)
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'create') {
    const type = formData.get('type') as ComplaintType
    const plate_number = formData.get('plate_number') as string
    const description = formData.get('description') as string
    const deadline = formData.get('deadline') as string
    const incident_time = formData.get('incident_time') as string
    const gate_id = formData.get('gate_id') as string
    const gate_name = formData.get('gate_name') as string

    const errors: Record<string, string> = {}

    if (!type) {
      errors.type = '请选择投诉类型'
    }
    if (!description?.trim()) {
      errors.description = '请输入投诉描述'
    }
    if (!deadline) {
      errors.deadline = '请选择截止时间'
    }
    if (type !== 'unlicensed_vehicle' && !plate_number?.trim()) {
      errors.plate_number = '请输入车牌号'
    }

    if (Object.keys(errors).length > 0) {
      return json({ errors }, { status: 400 })
    }

    await createComplaint({
      type,
      plate_number: type === 'unlicensed_vehicle' ? null : plate_number.trim() || null,
      description: description.trim(),
      parking_lot_id: 1,
      deadline: new Date(deadline).toISOString(),
      incident_time: incident_time ? new Date(incident_time).toISOString() : null,
      gate_id: gate_id ? Number(gate_id) : null,
      gate_name: gate_name || null,
      creator_id: user.id,
    })

    return redirect('/complaints')
  }

  if (intent === 'batch_assign') {
    const idsStr = formData.get('ids') as string
    const assignee_id = formData.get('assignee_id') as string

    const ids = idsStr ? idsStr.split(',').map(Number).filter(Boolean) : []
    const errors: Record<string, string> = {}

    if (ids.length === 0) {
      errors.ids = '请选择要处理的工单'
    }
    if (!assignee_id) {
      errors.assignee_id = '请选择负责人'
    }

    if (Object.keys(errors).length > 0) {
      return json({ errors }, { status: 400 })
    }

    const updated = await batchUpdateComplaints(
      ids,
      { assignee_id: Number(assignee_id) },
      user.id
    )

    return json({ errors: {}, batchResult: { updated } })
  }

  if (intent === 'batch_status') {
    const idsStr = formData.get('ids') as string
    const status = formData.get('status') as ComplaintStatus

    const ids = idsStr ? idsStr.split(',').map(Number).filter(Boolean) : []
    const errors: Record<string, string> = {}

    if (ids.length === 0) {
      errors.ids = '请选择要处理的工单'
    }
    if (!status) {
      errors.status = '请选择状态'
    }

    if (Object.keys(errors).length > 0) {
      return json({ errors }, { status: 400 })
    }

    const updated = await batchUpdateComplaints(
      ids,
      { status },
      user.id
    )

    return json({ errors: {}, batchResult: { updated } })
  }

  return json({ errors: {} }, { status: 400 })
}

export default function Complaints() {
  const data = useLoaderData<typeof loader>()
  const actionData = useActionData<ActionData>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigation = useNavigation()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [formType, setFormType] = useState<ComplaintType>('monthly_rental_expired')
  const [batchAssignValue, setBatchAssignValue] = useState('')
  const [batchStatusValue, setBatchStatusValue] = useState('')

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

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedIds.length === data.complaints.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(data.complaints.map((c) => c.id))
    }
  }

  const openCreateModal = () => {
    setFormType('monthly_rental_expired')
    setShowCreateModal(true)
  }

  const closeCreateModal = () => {
    setShowCreateModal(false)
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
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1 px-4 py-2.5 text-sm rounded bg-park-amber hover:bg-park-amber/90 text-park-bg font-medium transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          新建投诉
        </button>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-park-card rounded-lg border border-park-border p-3 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm text-park-text">
              已选择 <span className="text-park-amber font-medium">{selectedIds.length}</span> 项
            </span>

            <Form method="post" className="flex items-center gap-2">
              <input type="hidden" name="intent" value="batch_assign" />
              <input type="hidden" name="ids" value={selectedIds.join(',')} />
              <Users className="w-4 h-4 text-park-muted" />
              <select
                name="assignee_id"
                value={batchAssignValue}
                onChange={(e) => setBatchAssignValue(e.target.value)}
                className="bg-park-bg border border-park-border rounded px-2 py-1 text-sm text-park-text outline-none focus:border-park-amber"
              >
                <option value="">批量指派</option>
                {data.users.map((u: User) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({USER_ROLE_LABELS[u.role]})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!batchAssignValue || isLoading}
                className="px-3 py-1 text-sm rounded bg-park-amber hover:bg-park-amber/90 disabled:opacity-50 text-park-bg font-medium transition-colors"
              >
                确定
              </button>
            </Form>

            <Form method="post" className="flex items-center gap-2">
              <input type="hidden" name="intent" value="batch_status" />
              <input type="hidden" name="ids" value={selectedIds.join(',')} />
              <CheckCircle className="w-4 h-4 text-park-muted" />
              <select
                name="status"
                value={batchStatusValue}
                onChange={(e) => setBatchStatusValue(e.target.value)}
                className="bg-park-bg border border-park-border rounded px-2 py-1 text-sm text-park-text outline-none focus:border-park-amber"
              >
                <option value="">批量改状态</option>
                {statusOptions.filter((o) => o.value).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!batchStatusValue || isLoading}
                className="px-3 py-1 text-sm rounded bg-emerald-500 hover:bg-emerald-500/90 disabled:opacity-50 text-white font-medium transition-colors"
              >
                确定
              </button>
            </Form>

            {actionData?.batchResult && (
              <span className="text-sm text-emerald-400">
                已更新 {actionData.batchResult.updated} 条
              </span>
            )}

            <button
              onClick={() => setSelectedIds([])}
              className="ml-auto text-sm text-park-muted hover:text-park-text transition-colors"
            >
              取消选择
            </button>
          </div>
        </div>
      )}

      <div className="bg-park-card rounded-lg border border-park-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-park-muted text-left border-b border-park-border">
                <th className="py-3 px-4 font-medium w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === data.complaints.length && data.complaints.length > 0}
                    onChange={toggleAll}
                    className="rounded border-park-border bg-park-bg accent-park-amber"
                  />
                </th>
                <th className="py-3 px-4 font-medium">投诉编号</th>
                <th className="py-3 px-4 font-medium">类型</th>
                <th className="py-3 px-4 font-medium">车牌号</th>
                <th className="py-3 px-4 font-medium">状态</th>
                <th className="py-3 px-4 font-medium">责任人</th>
                <th className="py-3 px-4 font-medium">截止时间</th>
                <th className="py-3 px-4 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {data.complaints.map((complaint: Complaint & { assignee_name: string | null; is_overdue: boolean }) => (
                <tr
                  key={complaint.id}
                  className={`border-b border-park-border/50 hover:bg-park-hover/50 transition-colors ${isLoading ? 'opacity-50' : ''}`}
                >
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(complaint.id)}
                      onChange={() => toggleSelect(complaint.id)}
                      className="rounded border-park-border bg-park-bg accent-park-amber"
                    />
                  </td>
                  <td className="py-3 px-4 text-park-text font-medium">
                    <Link to={`/complaints/${complaint.id}`} className="hover:text-park-amber transition-colors">
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
                    {complaint.assignee_name ? (
                      <span className="text-park-text">{complaint.assignee_name}</span>
                    ) : (
                      <span className="text-red-400 text-xs">未分配</span>
                    )}
                  </td>
                  <td className={`py-3 px-4 ${complaint.is_overdue ? 'text-red-400 font-medium' : 'text-park-muted'}`}>
                    {formatTime(complaint.deadline)}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      to={`/complaints/${complaint.id}`}
                      className="text-park-amber hover:text-park-amber/80 text-xs"
                    >
                      查看详情
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

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-park-card rounded-lg border border-park-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-park-text">新建投诉</h3>
              <button
                onClick={closeCreateModal}
                className="text-park-muted hover:text-park-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="create" />

              <div>
                <label className="text-sm text-park-muted mb-1.5 block">投诉类型 <span className="text-red-400">*</span></label>
                <select
                  name="type"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as ComplaintType)}
                  className="w-full bg-park-bg border border-park-border rounded px-3 py-2 text-sm text-park-text outline-none focus:border-park-amber"
                >
                  {Object.entries(COMPLAINT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {actionData?.errors?.type && (
                  <p className="text-red-400 text-xs mt-1">{actionData.errors.type}</p>
                )}
              </div>

              {formType !== 'unlicensed_vehicle' && (
                <div>
                  <label className="text-sm text-park-muted mb-1.5 block">车牌号</label>
                  <input
                    type="text"
                    name="plate_number"
                    placeholder={formType === 'gate_malfunction' ? '选填，若涉及车辆可填写' : '请输入车牌号'}
                    className="w-full bg-park-bg border border-park-border rounded px-3 py-2 text-sm text-park-text placeholder-park-muted outline-none focus:border-park-amber"
                  />
                  {actionData?.errors?.plate_number && (
                    <p className="text-red-400 text-xs mt-1">{actionData.errors.plate_number}</p>
                  )}
                </div>
              )}

              {formType === 'unlicensed_vehicle' && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded px-3 py-2 text-xs text-purple-300">
                  无牌车争议：无需填写车牌号，系统将通过事发时间和道闸位置匹配车场日志和道闸异常记录
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-park-muted mb-1.5 block">事发道闸</label>
                  <select
                    name="gate_id"
                    className="w-full bg-park-bg border border-park-border rounded px-3 py-2 text-sm text-park-text outline-none focus:border-park-amber"
                    onChange={(e) => {
                      const selected = gateOptions.find((g) => g.id === Number(e.target.value))
                      const hiddenInput = document.querySelector('input[name="gate_name"]') as HTMLInputElement
                      if (hiddenInput && selected) {
                        hiddenInput.value = selected.name
                      } else if (hiddenInput) {
                        hiddenInput.value = ''
                      }
                    }}
                  >
                    <option value="">选择道闸</option>
                    {gateOptions.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <input type="hidden" name="gate_name" value="" />
                </div>
                <div>
                  <label className="text-sm text-park-muted mb-1.5 block">事发时间</label>
                  <input
                    type="datetime-local"
                    name="incident_time"
                    className="w-full bg-park-bg border border-park-border rounded px-3 py-2 text-sm text-park-text outline-none focus:border-park-amber"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-park-muted mb-1.5 block">投诉描述 <span className="text-red-400">*</span></label>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="请详细描述投诉内容..."
                  className="w-full bg-park-bg border border-park-border rounded px-3 py-2 text-sm text-park-text placeholder-park-muted outline-none focus:border-park-amber resize-none"
                />
                {actionData?.errors?.description && (
                  <p className="text-red-400 text-xs mt-1">{actionData.errors.description}</p>
                )}
              </div>

              <div>
                <label className="text-sm text-park-muted mb-1.5 block">截止时间 <span className="text-red-400">*</span></label>
                <input
                  type="datetime-local"
                  name="deadline"
                  className="w-full bg-park-bg border border-park-border rounded px-3 py-2 text-sm text-park-text outline-none focus:border-park-amber"
                />
                {actionData?.errors?.deadline && (
                  <p className="text-red-400 text-xs mt-1">{actionData.errors.deadline}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 text-sm rounded bg-park-hover text-park-muted hover:text-park-text transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm rounded bg-park-amber hover:bg-park-amber/90 disabled:opacity-50 text-park-bg font-medium transition-colors"
                >
                  {isLoading ? '提交中...' : '提交投诉'}
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  )
}
