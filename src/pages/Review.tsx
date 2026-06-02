import { useStore, type ReviewComment } from '@/store/useStore'
import {
    COMMENT_TYPE_COLOR,
    COMMENT_TYPE_LABEL,
    ROLE_LABEL,
    STATUS_COLOR,
    STATUS_LABEL,
    formatDate, isOverdue,
} from '@/utils/constants'
import { Check, ChevronRight, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

const WORKFLOW_STEPS = [
  { label: '翻译', statuses: ['translating', 'timing'] },
  { label: '校对', statuses: ['reviewing', 'rework'] },
  { label: '通过', statuses: ['approved'] },
  { label: '压制', statuses: ['encoding', 'encoded'] },
  { label: '交付', statuses: ['delivering', 'delivered'] },
]

function getStepIndex(status: string): number {
  return WORKFLOW_STEPS.findIndex(s => s.statuses.includes(status))
}

export default function Review() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const project = useStore(s => s.projects.find(p => p.id === id))
  const assignees = useStore(s => s.assignees)
  const addReviewComment = useStore(s => s.addReviewComment)
  const resolveComment = useStore(s => s.resolveComment)
  const approveEpisode = useStore(s => s.approveEpisode)
  const markEpisodeRework = useStore(s => s.markEpisodeRework)
  const getEpisodeComments = useStore(s => s.getEpisodeComments)

  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<ReviewComment['type']>('typo')
  const [formContent, setFormContent] = useState('')
  const [reworkReason, setReworkReason] = useState('')

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f23] text-zinc-500">
        项目不存在
      </div>
    )
  }

  const episodes = project.episodes
  const epId = searchParams.get('ep') || episodes[0]?.id
  const episode = episodes.find(e => e.id === epId) ?? episodes[0]

  const comments = episode ? getEpisodeComments(episode.id) : []
  const openComments = comments.filter(c => c.status === 'open')
  const reviewerIds = episode?.assigneeIds ?? []
  const reviewers = assignees.filter(a => reviewerIds.includes(a.id))
  const stepIdx = episode ? getStepIndex(episode.status) : -1

  const handleAddComment = () => {
    if (!formContent.trim() || !episode) return
    addReviewComment({
      episodeId: episode.id,
      authorId: 'a4',
      type: formType,
      content: formContent.trim(),
      timestamp: new Date().toISOString(),
      status: 'open',
    })
    setFormContent('')
    setShowForm(false)
  }

  const handleApprove = () => {
    if (!episode) return
    approveEpisode(project.id, episode.id)
  }

  const handleRework = () => {
    if (!episode) return
    markEpisodeRework(project.id, episode.id, reworkReason || '校对未通过')
    setReworkReason('')
  }

  return (
    <div className="min-h-screen bg-[#0f0f23] p-6">
      <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <Link to="/projects" className="hover:text-amber-400 transition">项目管理</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to={`/projects/${project.id}`} className="hover:text-amber-400 transition">{project.name}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-zinc-200">校对工单</span>
      </nav>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {episodes.map(ep => (
          <button
            key={ep.id}
            onClick={() => setSearchParams({ ep: ep.id })}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
              ep.id === episode?.id
                ? 'bg-amber-500 text-zinc-900'
                : 'bg-[#1e1e3a] border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {ep.title}
          </button>
        ))}
      </div>

      {!episode ? (
        <div className="py-20 text-center text-zinc-500">暂无剧集</div>
      ) : (
        <div className="flex gap-6">
          <div className="w-[60%] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-200">校对意见</h2>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-sm text-amber-400 hover:bg-amber-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                添加意见
              </button>
            </div>

            {showForm && (
              <div className="rounded-lg bg-[#1e1e3a] border border-zinc-800 p-4 space-y-3">
                <select
                  value={formType}
                  onChange={e => setFormType(e.target.value as ReviewComment['type'])}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-amber-500/50"
                >
                  {Object.entries(COMMENT_TYPE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <textarea
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  placeholder="输入校对意见..."
                  rows={3}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-amber-500/50 resize-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleAddComment}
                    disabled={!formContent.trim()}
                    className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-zinc-900 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    提交
                  </button>
                </div>
              </div>
            )}

            {comments.length === 0 ? (
              <div className="rounded-lg bg-[#1e1e3a] border border-zinc-800 p-8 text-center text-zinc-500">
                暂无校对意见
              </div>
            ) : (
              comments.map(c => {
                const author = assignees.find(a => a.id === c.authorId)
                return (
                  <div key={c.id} className="rounded-lg bg-[#1e1e3a] border border-zinc-800 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${COMMENT_TYPE_COLOR[c.type]}`}>
                        {COMMENT_TYPE_LABEL[c.type]}
                      </span>
                      <span className="text-sm text-zinc-300">{author?.name ?? '未知'}</span>
                      <span className="text-xs text-zinc-600">{formatDate(c.timestamp)}</span>
                      <span className="ml-auto">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                          c.status === 'open' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {c.status === 'open' ? '待处理' : '已解决'}
                        </span>
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{c.content}</p>
                    {c.status === 'open' && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => resolveComment(c.id)}
                          className="rounded px-3 py-1 text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition"
                        >
                          解决
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          <div className="w-[40%] space-y-4">
            <div className="rounded-lg bg-[#1e1e3a] border border-zinc-800 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className={`rounded border px-3 py-1 text-sm font-medium ${STATUS_COLOR[episode.status]}`}>
                  {STATUS_LABEL[episode.status]}
                </span>
                {isOverdue(episode.deadline) && episode.status !== 'delivered' && (
                  <span className="text-xs text-red-400">已逾期</span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-100">{episode.title}</h3>
                <p className="text-sm text-zinc-500 mt-1">截止日期：{formatDate(episode.deadline)}</p>
              </div>

              {reviewers.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 mb-2">校对人员</p>
                  <div className="flex flex-wrap gap-2">
                    {reviewers.map(r => (
                      <span key={r.id} className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
                        {r.name}
                        <span className="ml-1 text-zinc-500">{ROLE_LABEL[r.role]}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {episode.status === 'reviewing' && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleApprove}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-green-500/10 border border-green-500/30 py-2 text-sm font-medium text-green-400 hover:bg-green-500/20 transition"
                  >
                    <Check className="w-4 h-4" /> 通过
                  </button>
                  <button
                    onClick={handleRework}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/30 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition"
                  >
                    <X className="w-4 h-4" /> 打回返工
                  </button>
                </div>
              )}

              {episode.status === 'rework' && openComments.length > 0 && (
                <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3 space-y-2">
                  <p className="text-xs font-medium text-red-400">返工原因</p>
                  {openComments.slice(0, 3).map(c => (
                    <p key={c.id} className="text-sm text-zinc-400">· {c.content}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg bg-[#1e1e3a] border border-zinc-800 p-5">
              <p className="text-xs text-zinc-500 mb-3">状态流程</p>
              <div className="flex items-center gap-1">
                {WORKFLOW_STEPS.map((step, i) => (
                  <div key={step.label} className="flex items-center gap-1 flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i <= stepIdx
                          ? 'bg-amber-500 text-zinc-900'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {i < stepIdx ? <Check className="w-3.5 h-3.5" /> : i + 1}
                      </div>
                      <span className={`mt-1 text-xs ${i <= stepIdx ? 'text-amber-400' : 'text-zinc-600'}`}>
                        {step.label}
                      </span>
                    </div>
                    {i < WORKFLOW_STEPS.length - 1 && (
                      <div className={`h-0.5 w-full mt-[-14px] ${i < stepIdx ? 'bg-amber-500' : 'bg-zinc-800'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
