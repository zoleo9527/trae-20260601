import { useStore, type FileVersion } from '@/store/useStore'
import { formatDate, timeAgo } from '@/utils/constants'
import { AlertTriangle, Check, ChevronRight, FolderOpen, Pencil, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

const TYPE_BADGE: Record<FileVersion['type'], { label: string; color: string }> = {
  translation: { label: '翻译', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  timing: { label: '时间轴', color: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' },
  final: { label: '终版', color: 'bg-green-500/20 text-green-400 border border-green-500/30' },
}

export default function Versions() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const project = useStore(s => s.getProject(id ?? ''))
  const assignees = useStore(s => s.assignees)
  const openProject = useStore(s => s.openProject)
  const getEpisodeVersions = useStore(s => s.getEpisodeVersions)
  const addFileVersion = useStore(s => s.addFileVersion)
  const updateFileVersion = useStore(s => s.updateFileVersion)

  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<FileVersion['type']>('translation')
  const [formPath, setFormPath] = useState('')
  const [formNote, setFormNote] = useState('')
  const [formTargetVersion, setFormTargetVersion] = useState<string | null>(null)
  const [formTargetLabel, setFormTargetLabel] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPath, setEditPath] = useState('')
  const [editNote, setEditNote] = useState('')

  const [highlightId, setHighlightId] = useState<string | null>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (project) openProject(project.id)
  }, [project?.id])

  useEffect(() => {
    const source = searchParams.get('source')
    if (source === 'delivery') {
      setShowForm(true)
      setFormType('final')
    }
  }, [searchParams])

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      const timer = setTimeout(() => setHighlightId(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [highlightId])

  if (!project) {
    return (
      <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center text-zinc-500">
        项目不存在
      </div>
    )
  }

  const episodes = project.episodes
  const epId = searchParams.get('ep') || episodes[0]?.id || ''
  const selectedEp = episodes.find(e => e.id === epId) || episodes[0]
  const versions = selectedEp ? getEpisodeVersions(selectedEp.id) : []
  const maxVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version)) : 0
  const nextVersion = maxVersion + 1

  const assigneeMap = new Map(assignees.map(a => [a.id, a.name]))

  const pendingFinal = versions.find(v => v.type === 'final' && v.filePath === null)

  const showFormWithPrefill = (type: FileVersion['type'], target: FileVersion | null) => {
    setShowForm(true)
    setFormType(type)
    if (target) {
      setFormTargetVersion(target.id)
      setFormTargetLabel(`补录到 v${target.version}`)
      setFormNote(target.note || '')
      setFormPath('')
    } else {
      setFormTargetVersion(null)
      setFormTargetLabel('')
      setFormNote('')
      setFormPath('')
    }
  }

  const handleSubmit = () => {
    if (!selectedEp) return
    if (formType === 'final' && pendingFinal && formPath.trim()) {
      updateFileVersion(pendingFinal.id, {
        filePath: formPath.trim() || null,
        note: formNote.trim() || undefined,
      })
      setHighlightId(pendingFinal.id)
      setFormPath('')
      setFormNote('')
      setFormType('translation')
      setFormTargetVersion(null)
      setFormTargetLabel('')
      setShowForm(false)
      return
    }
    if (formTargetVersion && formPath.trim()) {
      updateFileVersion(formTargetVersion, {
        filePath: formPath.trim() || null,
        note: formNote.trim() || undefined,
      })
      setHighlightId(formTargetVersion)
      setFormPath('')
      setFormNote('')
      setFormType('translation')
      setFormTargetVersion(null)
      setFormTargetLabel('')
      setShowForm(false)
      return
    }
    addFileVersion({
      episodeId: selectedEp.id,
      version: nextVersion,
      filePath: formPath || null,
      submittedBy: 'a1',
      submittedAt: new Date().toISOString(),
      note: formNote,
      type: formType,
    })
    setFormPath('')
    setFormNote('')
    setFormType('translation')
    setFormTargetVersion(null)
    setFormTargetLabel('')
    setShowForm(false)
  }

  const handleStartEdit = (v: FileVersion) => {
    setEditingId(v.id)
    setEditPath(v.filePath ?? '')
    setEditNote(v.note ?? '')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditPath('')
    setEditNote('')
  }

  const handleSaveEdit = () => {
    if (!editingId) return
    updateFileVersion(editingId, {
      filePath: editPath.trim() || null,
      note: editNote.trim() || undefined,
    })
    setHighlightId(editingId)
    handleCancelEdit()
  }

  const switchEp = (eid: string) => {
    setSearchParams({ ep: eid })
    setShowForm(false)
    handleCancelEdit()
    setFormTargetVersion(null)
    setFormTargetLabel('')
  }

  const isPrefillMode = formTargetVersion !== null || (formType === 'final' && pendingFinal != null)

  return (
    <div className="min-h-screen bg-[#0f0f23] p-6 space-y-6">
      <nav className="flex items-center gap-1 text-sm text-zinc-500">
        <Link to="/projects" className="hover:text-zinc-300 transition-colors">项目管理</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to={`/projects/${project.id}`} className="hover:text-zinc-300 transition-colors">{project.name}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-zinc-200">版本管理</span>
      </nav>

      <div className="flex items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {episodes.map(ep => (
            <button
              key={ep.id}
              onClick={() => switchEp(ep.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                ep.id === (selectedEp?.id ?? '')
                  ? 'bg-amber-400/20 text-amber-400 border border-amber-500/30'
                  : 'bg-[#1e1e3a] text-zinc-400 border border-zinc-800 hover:border-zinc-600'
              }`}
            >
              {ep.title}
            </button>
          ))}
        </div>
        <button
          onClick={() => showFormWithPrefill('translation', null)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/20 text-amber-400 border border-amber-500/30 text-sm font-medium hover:bg-amber-400/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          提交新版本
        </button>
      </div>

      {showForm && selectedEp && (
        <div className="bg-[#1e1e3a] border border-zinc-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400">
              {isPrefillMode
                ? `补录终版文件路径${formTargetLabel ? `（${formTargetLabel}）` : ''}，提交后更新已有记录`
                : '新增版本记录'}
            </p>
          </div>
          <div className="flex gap-2">
            {(Object.keys(TYPE_BADGE) as FileVersion['type'][]).map(t => (
              <button
                key={t}
                onClick={() => {
                  setFormType(t)
                  if (t === 'final' && pendingFinal) {
                    setFormTargetVersion(pendingFinal.id)
                    setFormTargetLabel(`补录到 v${pendingFinal.version}`)
                    setFormNote(pendingFinal.note || '')
                  } else {
                    setFormTargetVersion(null)
                    setFormTargetLabel('')
                  }
                }}
                className={`px-3 py-1 rounded text-xs font-medium ${formType === t ? TYPE_BADGE[t].color : 'bg-zinc-800 text-zinc-500'}`}
              >
                {TYPE_BADGE[t].label}
              </button>
            ))}
          </div>
          <input
            value={formPath}
            onChange={e => setFormPath(e.target.value)}
            placeholder="本地文件路径"
            className="w-full bg-[#0f0f23] border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
          />
          <textarea
            value={formNote}
            onChange={e => setFormNote(e.target.value)}
            placeholder="备注"
            rows={2}
            className="w-full bg-[#0f0f23] border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-mono">
              {formTargetVersion && formTargetLabel
                ? formTargetLabel
                : `v${nextVersion}`}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowForm(false)
                  setFormTargetVersion(null)
                  setFormTargetLabel('')
                }}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-sm font-medium hover:bg-zinc-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formPath.trim()}
                className="px-4 py-1.5 rounded-lg bg-amber-400/20 text-amber-400 border border-amber-500/30 text-sm font-medium hover:bg-amber-400/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                提交
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedEp && versions.length === 0 && (
        <div className="text-center text-zinc-500 py-12">暂无版本记录</div>
      )}

      <div className="space-y-0">
        {versions.map((v, i) => {
          const isLast = i === versions.length - 1
          const isEditing = editingId === v.id
          const isPathMissing = v.filePath === null
          const isHighlighted = highlightId === v.id

          return (
            <div key={v.id} className="flex gap-4">
              <div className="flex flex-col items-center w-6 shrink-0">
                <div className={`w-3 h-3 rounded-full border-2 border-[#0f0f23] z-10 ${
                  v.type === 'final' ? 'bg-green-400' : isPathMissing ? 'bg-red-400' : 'bg-amber-400'
                }`} />
                {!isLast && <div className="w-0.5 flex-1 bg-amber-500/30" />}
              </div>
              <div className="pb-6 flex-1">
                <div
                  ref={isHighlighted ? highlightRef : undefined}
                  className={`bg-[#1e1e3a] border rounded-lg p-4 space-y-2 transition-all duration-700 ${
                    isHighlighted
                      ? 'border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
                      : isPathMissing
                        ? 'border-red-500/30'
                        : 'border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-400 text-sm font-semibold">v{v.version}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_BADGE[v.type].color}`}>
                      {TYPE_BADGE[v.type].label}
                    </span>
                    {isPathMissing && !isEditing && (
                      <span className="ml-auto text-xs text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        路径缺失
                      </span>
                    )}
                    {isHighlighted && (
                      <span className="ml-auto text-xs text-amber-400/80 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        刚更新
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span>{assigneeMap.get(v.submittedBy) || v.submittedBy}</span>
                    <span>{formatDate(v.submittedAt)}</span>
                    {v.updatedAt && (
                      <span className="text-emerald-400/60">更新于 {timeAgo(v.updatedAt)}</span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 pt-2">
                      <input
                        value={editPath}
                        onChange={e => setEditPath(e.target.value)}
                        placeholder="输入文件路径..."
                        className="w-full bg-[#0f0f23] border border-amber-500/30 rounded px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                        autoFocus
                      />
                      <textarea
                        value={editNote}
                        onChange={e => setEditNote(e.target.value)}
                        placeholder="备注（可选）"
                        rows={2}
                        className="w-full bg-[#0f0f23] border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 rounded text-xs bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
                        >
                          取消
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editPath.trim()}
                          className="px-3 py-1 rounded text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-40 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {v.note && <div className="text-sm text-zinc-300">{v.note}</div>}
                      {v.filePath !== null ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400 min-w-0">
                            <FolderOpen className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                            <span className="truncate font-mono">{v.filePath}</span>
                          </div>
                          <button
                            onClick={() => handleStartEdit(v)}
                            className="px-2 py-0.5 rounded text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors shrink-0 ml-2 flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" />
                            编辑
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => showFormWithPrefill(v.type, v)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                            补录文件路径
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
