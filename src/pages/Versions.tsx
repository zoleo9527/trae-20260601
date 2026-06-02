import { useStore, type FileVersion } from '@/store/useStore'
import { formatDate } from '@/utils/constants'
import { AlertTriangle, ChevronRight, FolderOpen, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
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

  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<FileVersion['type']>('translation')
  const [formPath, setFormPath] = useState('')
  const [formNote, setFormNote] = useState('')

  if (!project) {
    return (
      <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center text-zinc-500">
        项目不存在
      </div>
    )
  }

  useEffect(() => {
    if (project) openProject(project.id)
  }, [project?.id])

  const episodes = project.episodes
  const epId = searchParams.get('ep') || episodes[0]?.id || ''
  const selectedEp = episodes.find(e => e.id === epId) || episodes[0]
  const versions = selectedEp ? getEpisodeVersions(selectedEp.id) : []
  const maxVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version)) : 0
  const nextVersion = maxVersion + 1

  const assigneeMap = new Map(assignees.map(a => [a.id, a.name]))

  const handleSubmit = () => {
    if (!selectedEp) return
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
    setShowForm(false)
  }

  const switchEp = (eid: string) => {
    setSearchParams({ ep: eid })
    setShowForm(false)
  }

  return (
    <div className="min-h-screen bg-[#0f0f23] p-6 space-y-6">
      <nav className="flex items-center gap-1 text-sm text-zinc-500">
        <Link to="/" className="hover:text-zinc-300 transition-colors">项目管理</Link>
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
          onClick={() => setShowForm(f => !f)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/20 text-amber-400 border border-amber-500/30 text-sm font-medium hover:bg-amber-400/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          提交新版本
        </button>
      </div>

      {showForm && selectedEp && (
        <div className="bg-[#1e1e3a] border border-zinc-800 rounded-lg p-4 space-y-3">
          <div className="flex gap-2">
            {(Object.keys(TYPE_BADGE) as FileVersion['type'][]).map(t => (
              <button
                key={t}
                onClick={() => setFormType(t)}
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
            <span className="text-xs text-zinc-500 font-mono">v{nextVersion}</span>
            <button
              onClick={handleSubmit}
              className="px-4 py-1.5 rounded-lg bg-amber-400/20 text-amber-400 border border-amber-500/30 text-sm font-medium hover:bg-amber-400/30 transition-colors"
            >
              提交
            </button>
          </div>
        </div>
      )}

      {selectedEp && versions.length === 0 && (
        <div className="text-center text-zinc-500 py-12">暂无版本记录</div>
      )}

      <div className="space-y-0">
        {versions.map((v, i) => {
          const isLast = i === versions.length - 1
          return (
            <div key={v.id} className="flex gap-4">
              <div className="flex flex-col items-center w-6 shrink-0">
                <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-[#0f0f23] z-10" />
                {!isLast && <div className="w-0.5 flex-1 bg-amber-500/30" />}
              </div>
              <div className={`pb-6 flex-1 ${isLast ? '' : ''}`}>
                <div className="bg-[#1e1e3a] border border-zinc-800 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-400 text-sm font-semibold">v{v.version}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_BADGE[v.type].color}`}>
                      {TYPE_BADGE[v.type].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span>{assigneeMap.get(v.submittedBy) || v.submittedBy}</span>
                    <span>{formatDate(v.submittedAt)}</span>
                  </div>
                  {v.note && <div className="text-sm text-zinc-300">{v.note}</div>}
                  {v.filePath !== null ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 min-w-0">
                        <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{v.filePath}</span>
                      </div>
                      <button className="px-2 py-0.5 rounded text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors shrink-0 ml-2">
                        打开
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-red-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>路径丢失</span>
                    </div>
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
