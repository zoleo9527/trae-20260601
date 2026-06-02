import { useStore } from '@/store/useStore'
import { isOverdue, timeAgo } from '@/utils/constants'
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, FileWarning, RotateCcw, Truck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface StatCard {
  label: string
  count: number
  color: string
  gradient: string
  icon: React.ReactNode
}

interface AlertItem {
  episodeTitle: string
  projectName: string
  projectId: string
  description: string
  badge: string
  badgeColor: string
  icon: React.ReactNode
}

export default function Dashboard() {
  const navigate = useNavigate()
  const projects = useStore(s => s.projects)
  const recentProjectIds = useStore(s => s.recentProjectIds)
  const fileVersions = useStore(s => s.fileVersions)
  const reviewComments = useStore(s => s.reviewComments)

  const allEpisodes = projects.flatMap(p => p.episodes)

  const stats: StatCard[] = [
    {
      label: '翻译中',
      count: allEpisodes.filter(e => e.status === 'translating').length,
      color: 'text-blue-400',
      gradient: 'from-blue-500/20',
      icon: <AlertCircle className="w-4 h-4 text-blue-400" />,
    },
    {
      label: '校对中',
      count: allEpisodes.filter(e => e.status === 'reviewing').length,
      color: 'text-purple-400',
      gradient: 'from-purple-500/20',
      icon: <AlertCircle className="w-4 h-4 text-purple-400" />,
    },
    {
      label: '待压制',
      count: allEpisodes.filter(e => e.status === 'approved' || e.status === 'encoding').length,
      color: 'text-orange-400',
      gradient: 'from-orange-500/20',
      icon: <AlertCircle className="w-4 h-4 text-orange-400" />,
    },
    {
      label: '待交付',
      count: allEpisodes.filter(e => e.status === 'encoded' || e.status === 'delivering').length,
      color: 'text-amber-400',
      gradient: 'from-amber-500/20',
      icon: <Truck className="w-4 h-4 text-amber-400" />,
    },
    {
      label: '已交付',
      count: allEpisodes.filter(e => e.status === 'delivered').length,
      color: 'text-emerald-400',
      gradient: 'from-emerald-500/20',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    },
  ]

  const recentProjects = recentProjectIds
    .map(id => projects.find(p => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined)
    .slice(0, 5)

  const projectMap = new Map(projects.map(p => [p.id, p]))

  const alerts: AlertItem[] = []

  for (const ep of allEpisodes) {
    const project = projectMap.get(ep.projectId)
    if (!project) continue

    if (ep.status === 'translating' && isOverdue(ep.deadline)) {
      alerts.push({
        episodeTitle: ep.title,
        projectName: project.name,
        projectId: project.id,
        description: '翻译截止日期已过，尚未完成提交',
        badge: '迟交',
        badgeColor: 'bg-red-500/20 text-red-400',
        icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
      })
    }

    if (ep.status === 'rework') {
      alerts.push({
        episodeTitle: ep.title,
        projectName: project.name,
        projectId: project.id,
        description: ep.reworkReason || `校对打回需返工，${reviewComments.filter(c => c.episodeId === ep.id && c.status === 'open').length} 条待处理意见`,
        badge: '打回',
        badgeColor: 'bg-orange-500/20 text-orange-400',
        icon: <RotateCcw className="w-4 h-4 text-orange-400" />,
      })
    }

    const epVersions = fileVersions.filter(v => v.episodeId === ep.id)
    const missingCount = epVersions.filter(v => v.filePath === null).length
    if (missingCount > 0) {
      alerts.push({
        episodeTitle: ep.title,
        projectName: project.name,
        projectId: project.id,
        description: `${missingCount} 个版本文件路径未录入，无法追溯文件`,
        badge: '路径丢失',
        badgeColor: 'bg-yellow-500/20 text-yellow-400',
        icon: <FileWarning className="w-4 h-4 text-yellow-400" />,
      })
    }

    if (ep.status === 'delivering') {
      const finalVersions = epVersions.filter(v => v.type === 'final').sort((a, b) => b.version - a.version)
      const finalVersion = finalVersions[0]
      alerts.push({
        episodeTitle: ep.title,
        projectName: project.name,
        projectId: project.id,
        description: `已压制完成，待确认交付${finalVersion?.filePath ? '（文件就绪）' : '（终版文件未录入）'}`,
        badge: '待交付',
        badgeColor: 'bg-emerald-500/20 text-emerald-400',
        icon: <Truck className="w-4 h-4 text-emerald-400" />,
      })
    }

    if ((ep.status === 'encoded' || ep.status === 'delivering') && !epVersions.some(v => v.type === 'final' && v.filePath)) {
      alerts.push({
        episodeTitle: ep.title,
        projectName: project.name,
        projectId: project.id,
        description: '终版文件路径未登记，交付前需补录压制输出文件',
        badge: '终版缺失',
        badgeColor: 'bg-red-500/20 text-red-400',
        icon: <FileWarning className="w-4 h-4 text-red-400" />,
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f23] p-6 space-y-8">
      <div className="grid grid-cols-5 gap-4">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="relative rounded-xl bg-[#1e1e3a] border border-zinc-800 p-5 overflow-hidden"
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-b ${stat.gradient} to-transparent`} />
            <div className="flex items-center justify-between mb-2">
              {stat.icon}
              <div className={`font-mono text-3xl font-bold ${stat.color}`}>{stat.count}</div>
            </div>
            <div className="text-sm text-zinc-400">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <section>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-200 mb-4">
            <Clock className="w-5 h-5 text-amber-400" />
            最近项目
          </h2>
          <div className="space-y-3">
            {recentProjects.map(project => {
              const delivered = project.episodes.filter(e => e.status === 'delivered').length
              const total = project.episodes.length
              const pct = total > 0 ? Math.round((delivered / total) * 100) : 0

              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="rounded-xl bg-[#1e1e3a] border border-zinc-800 p-4 cursor-pointer hover:border-amber-400/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-zinc-200">{project.name}</span>
                    <span className="text-xs text-zinc-500">{timeAgo(project.lastOpenedAt)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-zinc-400">
                      {delivered}/{total}
                    </span>
                  </div>
                </div>
              )
            })}
            {recentProjects.length === 0 && (
              <div className="rounded-xl bg-[#1e1e3a] border border-zinc-800 p-6 text-center text-zinc-500">
                暂无最近项目
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-200 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            异常告警
          </h2>
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <div
                key={i}
                onClick={() => navigate(`/projects/${alert.projectId}`)}
                className="flex items-start gap-3 rounded-xl bg-[#1e1e3a] border border-zinc-800 border-l-4 border-l-red-500 p-4 cursor-pointer hover:border-zinc-700 transition-colors"
              >
                <div className="mt-0.5 shrink-0">{alert.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-zinc-200">{alert.episodeTitle}</span>
                    <span className="text-zinc-500">·</span>
                    <span className="text-sm text-zinc-400">{alert.projectName}</span>
                  </div>
                  <div className="text-sm text-zinc-400">{alert.description}</div>
                </div>
                <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${alert.badgeColor}`}>
                  {alert.badge}
                </span>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="rounded-xl bg-[#1e1e3a] border border-zinc-800 p-6 text-center text-zinc-500">
                暂无异常
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
