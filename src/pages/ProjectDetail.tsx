import { useStore, type EpisodeStatus } from '@/store/useStore'
import { ROLE_LABEL, STATUS_COLOR, STATUS_DOT, STATUS_LABEL, formatDate, isOverdue } from '@/utils/constants'
import { AlertTriangle, ChevronRight, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const TRANSITIONS: Record<EpisodeStatus, { label: string; next: EpisodeStatus }[]> = {
  translating: [{ label: '提交校对', next: 'reviewing' }],
  timing: [{ label: '完成时间轴', next: 'reviewing' }],
  reviewing: [
    { label: '通过', next: 'approved' },
    { label: '打回', next: 'rework' },
  ],
  rework: [{ label: '重新提交', next: 'reviewing' }],
  approved: [{ label: '开始压制', next: 'encoding' }],
  encoding: [{ label: '压制完成', next: 'encoded' }],
  encoded: [{ label: '待交付', next: 'delivering' }],
  delivering: [{ label: '确认交付', next: 'delivered' }],
  delivered: [],
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const project = useStore(s => s.getProject(id!))
  const assignees = useStore(s => s.assignees)
  const fileVersions = useStore(s => s.fileVersions)
  const reviewComments = useStore(s => s.reviewComments)
  const updateEpisode = useStore(s => s.updateEpisode)
  const addSegment = useStore(s => s.addSegment)
  const assignEpisode = useStore(s => s.assignEpisode)
  const openProject = useStore(s => s.openProject)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [segName, setSegName] = useState('')
  const [segStart, setSegStart] = useState('')
  const [segEnd, setSegEnd] = useState('')
  const [segAssignee, setSegAssignee] = useState('')
  const [addAssigneeId, setAddAssigneeId] = useState('')

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f23] text-zinc-500">
        项目不存在
      </div>
    )
  }

  useEffect(() => {
    if (project) openProject(project.id)
  }, [project?.id])
  const selected = project.episodes.find(e => e.id === selectedId)

  const handleTransition = (episodeId: string, next: EpisodeStatus) => {
    updateEpisode(project.id, episodeId, { status: next })
  }

  const handleAddSegment = () => {
    if (!selectedId || !segName.trim() || !segStart || !segEnd || !segAssignee) return
    addSegment(project.id, selectedId, segName.trim(), Number(segStart), Number(segEnd), segAssignee)
    setSegName('')
    setSegStart('')
    setSegEnd('')
    setSegAssignee('')
  }

  const handleAddAssignee = () => {
    if (!selected || !addAssigneeId) return
    if (selected.assigneeIds.includes(addAssigneeId)) return
    assignEpisode(project.id, selected.id, [...selected.assigneeIds, addAssigneeId])
    setAddAssigneeId('')
  }

  const handleDeadlineChange = (episodeId: string, deadline: string) => {
    updateEpisode(project.id, episodeId, { deadline })
  }

  return (
    <div className="min-h-screen bg-[#0f0f23] p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
          <Link to="/projects" className="hover:text-amber-400 transition">项目管理</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-zinc-200">{project.name}</span>
        </nav>

        <div className="flex gap-6">
          <div className="w-[70%] min-w-0">
            <div className="space-y-2">
              {project.episodes.map(ep => {
                const versionCount = fileVersions.filter(v => v.episodeId === ep.id).length
                const missingPaths = fileVersions.filter(v => v.episodeId === ep.id && v.filePath === null).length
                const openComments = reviewComments.filter(c => c.episodeId === ep.id && c.status === 'open').length
                const epAssignees = assignees.filter(a => ep.assigneeIds.includes(a.id))
                const overdue = isOverdue(ep.deadline) && ep.status !== 'delivered'
                const isSelected = selectedId === ep.id
                const isExpanded = expandedId === ep.id

                return (
                  <div key={ep.id}>
                    <div
                      onClick={() => setSelectedId(ep.id)}
                      className={`rounded-xl border bg-[#1e1e3a] transition cursor-pointer ${
                        isSelected ? 'border-amber-500/50 ring-1 ring-amber-500/20' : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center px-4 py-3 gap-4">
                        <div className="flex items-center gap-3 min-w-[100px]">
                          <span className="text-zinc-200 font-semibold">{ep.title}</span>
                          {overdue && <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />}
                        </div>

                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[ep.status]}`}>
                          {STATUS_LABEL[ep.status]}
                        </span>

                        <div className="flex items-center -space-x-1.5 flex-1 min-w-0">
                          {epAssignees.map(a => (
                            <div
                              key={a.id}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/30 text-[10px] font-bold text-amber-300 ring-2 ring-[#1e1e3a]"
                              title={a.name}
                            >
                              {a.name[0]}
                            </div>
                          ))}
                          <span className="ml-2.5 text-zinc-400 text-xs truncate">
                            {epAssignees.map(a => a.name).join('、') || '-'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-500 shrink-0">
                          <span className="font-mono">v{versionCount}</span>
                          {missingPaths > 0 && (
                            <span className="text-red-400 font-medium">路径缺失×{missingPaths}</span>
                          )}
                          {openComments > 0 && (
                            <span className="text-amber-400 font-medium">意见×{openComments}</span>
                          )}
                        </div>

                        <div className={`text-xs shrink-0 ${overdue ? 'text-red-400' : 'text-zinc-500'}`}>
                          {formatDate(ep.deadline)}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Link
                            to={`/projects/${project.id}/versions?ep=${ep.id}`}
                            onClick={e => e.stopPropagation()}
                            className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700 transition"
                          >
                            版本
                          </Link>
                          <Link
                            to={`/projects/${project.id}/review?ep=${ep.id}`}
                            onClick={e => e.stopPropagation()}
                            className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700 transition"
                          >
                            校对
                          </Link>
                          {ep.segments.length > 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : ep.id) }}
                              className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700 transition"
                            >
                              段落 {isExpanded ? '▲' : '▼'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {isExpanded && ep.segments.length > 0 && (
                      <div className="ml-6 mt-1 border-l-2 border-amber-500/20 pl-4 py-2 space-y-1.5">
                        {ep.segments.map(seg => {
                          const segAssignee = assignees.find(a => a.id === seg.assigneeId)
                          return (
                            <div key={seg.id} className="flex items-center gap-3 py-1 text-xs text-zinc-400">
                              <span className={`h-2 w-2 rounded-full ${STATUS_DOT[seg.status]}`} />
                              <span className="text-zinc-300">{seg.name}</span>
                              <span>L{seg.startLine}-{seg.endLine}</span>
                              <span>{segAssignee?.name ?? '-'}</span>
                              <span className={`rounded-full border px-2 py-0.5 ${STATUS_COLOR[seg.status]}`}>
                                {STATUS_LABEL[seg.status]}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {selected && (
              <div className="mt-4 rounded-xl border border-zinc-800 bg-[#1e1e3a] p-4">
                <h3 className="mb-3 text-sm font-medium text-zinc-300">
                  添加段落 — {selected.title}
                </h3>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-zinc-500">名称</label>
                    <input
                      value={segName}
                      onChange={e => setSegName(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div className="w-20">
                    <label className="mb-1 block text-xs text-zinc-500">起始行</label>
                    <input
                      type="number"
                      value={segStart}
                      onChange={e => setSegStart(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div className="w-20">
                    <label className="mb-1 block text-xs text-zinc-500">结束行</label>
                    <input
                      type="number"
                      value={segEnd}
                      onChange={e => setSegEnd(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div className="w-32">
                    <label className="mb-1 block text-xs text-zinc-500">分配</label>
                    <select
                      value={segAssignee}
                      onChange={e => setSegAssignee(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-amber-500/50"
                    >
                      <option value="">选择人员</option>
                      {assignees.map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({ROLE_LABEL[a.role]})</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleAddSegment}
                    disabled={!segName.trim() || !segStart || !segEnd || !segAssignee}
                    className="flex items-center gap-1 rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-zinc-900 transition hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                    添加
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="w-[30%] min-w-0">
            {selected ? (
              <div className="rounded-xl border border-zinc-800 bg-[#1e1e3a] p-5 space-y-5">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-zinc-100">{selected.title}</h2>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[selected.status]}`}>
                    {STATUS_LABEL[selected.status]}
                  </span>
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">分配人员</h3>
                  <div className="space-y-1.5">
                    {assignees.filter(a => selected.assigneeIds.includes(a.id)).map(a => (
                      <div key={a.id} className="flex items-center gap-2 text-sm text-zinc-300">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/30 text-[9px] font-bold text-amber-300">
                          {a.name[0]}
                        </div>
                        <span>{a.name}</span>
                        <span className="text-xs text-zinc-600">{ROLE_LABEL[a.role]}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <select
                      value={addAssigneeId}
                      onChange={e => setAddAssigneeId(e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-amber-500/50"
                    >
                      <option value="">添加人员</option>
                      {assignees.filter(a => !selected.assigneeIds.includes(a.id)).map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({ROLE_LABEL[a.role]})</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddAssignee}
                      disabled={!addAssigneeId}
                      className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-400 transition hover:bg-amber-500/30 disabled:opacity-40"
                    >
                      添加
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">截止日期</h3>
                  <input
                    type="date"
                    value={selected.deadline.slice(0, 10)}
                    onChange={e => handleDeadlineChange(selected.id, new Date(e.target.value).toISOString())}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-amber-500/50"
                  />
                  {isOverdue(selected.deadline) && selected.status !== 'delivered' && (
                    <p className="mt-1 text-xs text-red-400">已逾期</p>
                  )}
                </div>

                {selected.status === 'rework' && selected.reworkReason && (
                  <div>
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">返工原因</h3>
                    <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3">
                      <p className="text-sm text-zinc-300 leading-relaxed">{selected.reworkReason}</p>
                    </div>
                  </div>
                )}

                {selected.segments.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">段落</h3>
                    <div className="space-y-1.5">
                      {selected.segments.map(seg => (
                        <div key={seg.id} className="flex items-center gap-2 text-sm text-zinc-300">
                          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[seg.status]}`} />
                          <span>{seg.name}</span>
                          <span className="text-xs text-zinc-600">L{seg.startLine}-{seg.endLine}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {TRANSITIONS[selected.status].length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">状态操作</h3>
                    <div className="flex flex-wrap gap-2">
                      {TRANSITIONS[selected.status].map(t => (
                        <button
                          key={t.next}
                          onClick={() => handleTransition(selected.id, t.next)}
                          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                            t.next === 'rework'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                              : t.next === 'approved'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                              : 'bg-amber-500 text-zinc-900 hover:bg-amber-400'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-800 bg-[#1e1e3a] p-8 text-center text-sm text-zinc-500">
                点击左侧集数查看详情
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
