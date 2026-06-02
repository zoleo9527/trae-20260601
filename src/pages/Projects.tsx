import { useStore, type EpisodeStatus } from '@/store/useStore'
import { STATUS_DOT, STATUS_LABEL, formatDate } from '@/utils/constants'
import { FolderKanban, Plus, Search, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const STATUS_BAR_COLOR: Record<EpisodeStatus, string> = {
  translating: 'bg-blue-400',
  timing: 'bg-cyan-400',
  reviewing: 'bg-purple-400',
  rework: 'bg-red-400',
  approved: 'bg-green-400',
  encoding: 'bg-orange-400',
  encoded: 'bg-amber-400',
  delivering: 'bg-yellow-400',
  delivered: 'bg-emerald-400',
}

export default function Projects() {
  const projects = useStore(s => s.projects)
  const addProject = useStore(s => s.addProject)
  const openProject = useStore(s => s.openProject)
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTotal, setNewTotal] = useState(12)

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = () => {
    if (!newName.trim() || newTotal < 1) return
    const id = addProject(newName.trim(), newTotal)
    setShowModal(false)
    setNewName('')
    setNewTotal(12)
    openProject(id)
    navigate(`/projects/${id}`)
  }

  const handleOpen = (id: string) => {
    openProject(id)
    navigate(`/projects/${id}`)
  }

  return (
    <div className="min-h-screen bg-[#0f0f23] p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <FolderKanban className="h-7 w-7 text-amber-400" />
            <h1 className="text-2xl font-bold text-zinc-100">项目管理</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索项目..."
                className="rounded-lg border border-zinc-800 bg-[#1e1e3a] py-2 pl-9 pr-4 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-amber-400"
            >
              <Plus className="h-4 w-4" />
              新建项目
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">
            {search ? '未找到匹配的项目' : '暂无项目，点击"新建项目"开始'}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(project => {
              const statusCounts = new Map<EpisodeStatus, number>()
              for (const ep of project.episodes) {
                statusCounts.set(ep.status, (statusCounts.get(ep.status) ?? 0) + 1)
              }
              const doneCount = project.episodes.filter(e =>
                ['approved', 'encoded', 'delivering', 'delivered'].includes(e.status)
              ).length
              const progress = project.totalEpisodes > 0
                ? Math.round((doneCount / project.totalEpisodes) * 100)
                : 0

              return (
                <button
                  key={project.id}
                  onClick={() => handleOpen(project.id)}
                  className="group rounded-xl border border-zinc-800 bg-[#1e1e3a] p-0 text-left transition hover:border-zinc-700 hover:ring-1 hover:ring-amber-500/20"
                >
                  <div className="flex h-1 rounded-t-xl overflow-hidden">
                    {project.episodes.map((ep, i) => (
                      <div
                        key={i}
                        className={`flex-1 ${STATUS_BAR_COLOR[ep.status]}`}
                      />
                    ))}
                    {project.totalEpisodes > project.episodes.length &&
                      Array.from({ length: project.totalEpisodes - project.episodes.length }).map((_, i) => (
                        <div key={`empty-${i}`} className="flex-1 bg-zinc-700/30" />
                      ))
                    }
                  </div>

                  <div className="p-5">
                    <h2 className="text-lg font-bold text-zinc-100 group-hover:text-amber-400 transition mb-3">
                      {project.name}
                    </h2>

                    <div className="mb-3 flex items-center gap-2 text-sm text-zinc-400">
                      <span>{project.totalEpisodes} 集</span>
                    </div>

                    <div className="mb-3">
                      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">{progress}%</div>
                    </div>

                    {statusCounts.size > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {[...statusCounts.entries()].map(([status, count]) => (
                          <span
                            key={status}
                            className="flex items-center gap-1.5 rounded-full border border-zinc-700/50 bg-zinc-800/50 px-2 py-0.5 text-xs text-zinc-300"
                          >
                            <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
                            {STATUS_LABEL[status]} {count}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-zinc-600">
                      创建于 {formatDate(project.createdAt)}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-[#1e1e3a] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-100">新建项目</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-zinc-400">节目名称</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="输入节目名称"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-zinc-400">总集数</label>
                <input
                  type="number"
                  min={1}
                  value={newTotal}
                  onChange={e => setNewTotal(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
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
