import { useStore } from '@/store/useStore'
import { STATUS_COLOR, STATUS_DOT, STATUS_LABEL } from '@/utils/constants'
import { AlertTriangle, ExternalLink, FileWarning, FolderOpen, Truck, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

type KanbanCol = {
  key: string
  label: string
  statuses: string[]
  accent: string
}

const COLUMNS: KanbanCol[] = [
  { key: 'encoding', label: '待压制', statuses: ['approved', 'encoding'], accent: 'bg-orange-500' },
  { key: 'encoded', label: '已压制', statuses: ['encoded'], accent: 'bg-amber-500' },
  { key: 'delivering', label: '待交付', statuses: ['delivering'], accent: 'bg-yellow-500' },
  { key: 'delivered', label: '已交付', statuses: ['delivered'], accent: 'bg-emerald-500' },
]

export default function Delivery() {
  const projects = useStore(s => s.projects)
  const assignees = useStore(s => s.assignees)
  const getEpisodeVersions = useStore(s => s.getEpisodeVersions)
  const markEncoded = useStore(s => s.markEncoded)
  const markDelivering = useStore(s => s.markDelivering)
  const markDelivered = useStore(s => s.markDelivered)

  const [modal, setModal] = useState<{ projectId: string; episodeId: string } | null>(null)
  const [outputPath, setOutputPath] = useState('')

  const allEpisodes = projects.flatMap(p =>
    p.episodes.map(e => ({ ...e, projectName: p.name, projectId: p.id }))
  )

  const columns = COLUMNS.map(col => ({
    ...col,
    episodes: allEpisodes.filter(ep => col.statuses.includes(ep.status)),
  }))

  const encoderMap = new Map(assignees.filter(a => a.role === 'encoder').map(a => [a.id, a.name]))

  const handleSubmitEncode = () => {
    if (!modal || !outputPath.trim()) return
    markEncoded(modal.projectId, modal.episodeId, outputPath.trim())
    setModal(null)
    setOutputPath('')
  }

  return (
    <div className="min-h-screen bg-[#0f0f23] p-6 space-y-6">
      <h1 className="flex items-center gap-3 text-xl font-bold text-zinc-200">
        <Truck className="w-6 h-6 text-amber-400" />
        交付看板
      </h1>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => (
          <div
            key={col.key}
            className="flex-1 min-w-[300px] bg-[#1e1e3a] border border-zinc-800 rounded-xl flex flex-col"
          >
            <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${col.accent}`} />
              <span className="font-semibold text-zinc-200">{col.label}</span>
              <span className="ml-auto text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                {col.episodes.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[calc(100vh-180px)]">
              {col.episodes.map(ep => {
                const versions = getEpisodeVersions(ep.id)
                const finalVersion = versions.find(v => v.type === 'final')
                const hasFinalFile = finalVersion?.filePath != null
                const encoders = ep.assigneeIds
                  .map(id => encoderMap.get(id))
                  .filter(Boolean)
                const showFilePath = ep.status === 'encoded' || ep.status === 'delivering'

                return (
                  <div
                    key={ep.id}
                    className="bg-[#252545] border border-zinc-700/50 rounded-lg p-3 space-y-2"
                  >
                    <div className="text-xs text-zinc-400">{ep.projectName}</div>
                    <div className="text-sm font-medium text-zinc-200">{ep.title}</div>

                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[ep.status as keyof typeof STATUS_DOT]}`} />
                      <span className={`text-xs ${STATUS_COLOR[ep.status as keyof typeof STATUS_COLOR]}`}>
                        {STATUS_LABEL[ep.status as keyof typeof STATUS_LABEL]}
                      </span>
                    </div>

                    {encoders.length > 0 && (
                      <div className="text-xs text-zinc-500">压制: {encoders.join(', ')}</div>
                    )}

                    {showFilePath && (
                      <div className={`rounded-md px-2.5 py-1.5 text-xs ${
                        hasFinalFile
                          ? 'bg-emerald-500/5 border border-emerald-500/20'
                          : 'bg-red-500/5 border border-red-500/20'
                      }`}>
                        {hasFinalFile ? (
                          <div className="flex items-start gap-1.5">
                            <FolderOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="text-emerald-300/80 break-all font-mono leading-relaxed">{finalVersion.filePath}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <FileWarning className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span className="text-red-400">终版文件路径未登记</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span className="font-mono">v{versions.length}</span>
                      {showFilePath ? (
                        hasFinalFile ? (
                          <span className="text-emerald-400/60">终版就绪</span>
                        ) : (
                          <span className="text-red-400/80">缺终版</span>
                        )
                      ) : (
                        versions.some(v => v.filePath) ? (
                          <FolderOpen className="w-3.5 h-3.5 text-emerald-400/60" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400/60" />
                        )
                      )}
                    </div>

                    {showFilePath && !hasFinalFile && (
                      <Link
                        to={`/projects/${ep.projectId}/versions?ep=${ep.id}`}
                        className="flex items-center justify-center gap-1 text-xs text-amber-400/80 hover:text-amber-300 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1 hover:bg-amber-500/10 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        补录文件路径
                      </Link>
                    )}

                    <div className="flex gap-2 pt-1">
                      {ep.status === 'encoding' && (
                        <button
                          onClick={() => setModal({ projectId: ep.projectId, episodeId: ep.id })}
                          className="flex-1 text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded px-2 py-1 hover:bg-orange-500/30 transition-colors"
                        >
                          压制完成
                        </button>
                      )}
                      {ep.status === 'encoded' && (
                        <button
                          onClick={() => markDelivering(ep.projectId, ep.id)}
                          className="flex-1 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded px-2 py-1 hover:bg-amber-500/30 transition-colors"
                        >
                          准备交付
                        </button>
                      )}
                      {ep.status === 'delivering' && (
                        <button
                          onClick={() => markDelivered(ep.projectId, ep.id)}
                          className="flex-1 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded px-2 py-1 hover:bg-yellow-500/30 transition-colors"
                        >
                          确认交付
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
              {col.episodes.length === 0 && (
                <div className="text-center text-xs text-zinc-600 py-6">暂无剧集</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setModal(null)}>
          <div className="bg-[#1e1e3a] border border-zinc-700 rounded-xl p-5 w-96 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-200">压制完成</h3>
              <button onClick={() => setModal(null)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">输出文件路径</label>
              <input
                value={outputPath}
                onChange={e => setOutputPath(e.target.value)}
                placeholder="/Volumes/output/..."
                className="w-full bg-[#252545] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-400/50"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSubmitEncode()}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 text-sm bg-zinc-800 text-zinc-400 rounded-lg px-3 py-2 hover:bg-zinc-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitEncode}
                disabled={!outputPath.trim()}
                className="flex-1 text-sm bg-amber-400/20 text-amber-400 border border-amber-500/30 rounded-lg px-3 py-2 hover:bg-amber-400/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
