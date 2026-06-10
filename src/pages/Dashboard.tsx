import { useMemo } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  ClipboardList,
  Eye,
  FlaskConical,
  FileCheck,
  Search,
  Beaker,
  Link2,
  BarChart3,
  ShieldAlert,
  ListChecks,
} from 'lucide-react'
import { useBatchStore } from '@/stores/batchStore'
import { useSampleStore } from '@/stores/sampleStore'
import { useActivityStore } from '@/stores/activityStore'
import { useUIStore } from '@/stores/uiStore'
import { BATCH_STATUS_MAP, SAMPLE_STATUS_MAP, ROLE_MAP } from '@/types'
import type { UserRole } from '@/types'
import StatusBadge from '@/components/shared/StatusBadge'
import Timeline from '@/components/shared/Timeline'

interface StatCardProps {
  label: string
  count: number
  gradient: string
  icon: React.ReactNode
}

function StatCard({ label, count, gradient, icon }: StatCardProps) {
  return (
    <div className={`rounded-xl p-5 text-white ${gradient} shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{label}</p>
          <p className="text-3xl font-bold mt-1">{count}</p>
        </div>
        <div className="opacity-80">{icon}</div>
      </div>
    </div>
  )
}

interface PriorityCardProps {
  name: string
  statusLabel: string
  statusColor: string
  statusBg: string
  responsible: string
  happenedAt: string
  actionLabel: string
  onAction: () => void
}

function PriorityCard({ name, statusLabel, statusColor, statusBg, responsible, happenedAt, actionLabel, onAction }: PriorityCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
          <div className="mt-1.5">
            <StatusBadge label={statusLabel} colorClass={statusColor} bgClass={statusBg} />
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
            <span>{responsible}</span>
            <span>{happenedAt}</span>
          </div>
        </div>
        <button
          onClick={onAction}
          className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-900 text-white hover:bg-slate-700 transition-colors"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}

const ROLE_SHORTCUTS: Record<UserRole, { label: string; icon: React.ElementType }[]> = {
  production_lead: [
    { label: '创建批次', icon: Plus },
    { label: '记录投料', icon: ClipboardList },
    { label: '查看待投料', icon: Eye },
  ],
  qc_inspector: [
    { label: '取样检测', icon: FlaskConical },
    { label: '提交结果', icon: FileCheck },
    { label: '查看待检测', icon: Search },
  ],
  formulator: [
    { label: '查看配方', icon: Beaker },
    { label: '关联批次', icon: Link2 },
    { label: '查看质检结果', icon: FileCheck },
  ],
  manager: [
    { label: '全局看板', icon: BarChart3 },
    { label: '异常追踪', icon: ShieldAlert },
    { label: '审批列表', icon: ListChecks },
  ],
}

function formatRelativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

export default function Dashboard() {
  const batches = useBatchStore((s) => s.batches)
  const samples = useSampleStore((s) => s.samples)
  const getActiveSampleByBatchId = useSampleStore((s) => s.getActiveSampleByBatchId)
  const activities = useActivityStore((s) => s.activities)
  const currentRole = useUIStore((s) => s.currentRole)
  const openDetailPanel = useUIStore((s) => s.openDetailPanel)

  const pendingCount = useMemo(() => {
    const batchPending = batches.filter(
      (b) => b.status === 'pending_feed' || b.status === 'pending_qc'
    ).length
    const samplePending = samples.filter(
      (s) => s.status === 'pending_sample' || s.status === 'testing'
    ).length
    return batchPending + samplePending
  }, [batches, samples])

  const abnormalCount = useMemo(() => {
    const abnormalBatches = batches.filter((b) => b.status === 'abnormal').length
    const unqualifiedSamples = samples.filter((s) => s.status === 'unqualified').length
    return abnormalBatches + unqualifiedSamples
  }, [batches, samples])

  const completedTodayCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const completedBatches = batches.filter(
      (b) => b.status === 'completed' && b.updatedAt.slice(0, 10) === today
    ).length
    const qualifiedSamples = samples.filter(
      (s) => s.status === 'qualified' && s.testedAt && s.testedAt.slice(0, 10) === today
    ).length
    return completedBatches + qualifiedSamples
  }, [batches, samples])

  const urgentBatches = useMemo(
    () => batches.filter((b) => b.status === 'abnormal'),
    [batches]
  )
  const urgentSamples = useMemo(
    () => samples.filter((s) => s.status === 'unqualified'),
    [samples]
  )
  const pendingQcBatches = useMemo(
    () => batches.filter((b) => b.status === 'pending_qc'),
    [batches]
  )
  const pendingSamplesList = useMemo(
    () => samples.filter((s) => s.status === 'pending_sample'),
    [samples]
  )

  const timelineItems = useMemo(
    () =>
      activities.map((a) => ({
        id: a.id,
        title: `${a.action} - ${a.targetName}`,
        subtitle: `${a.operator} (${ROLE_MAP[a.operatorRole].label})`,
        timestamp: a.timestamp,
        highlight: a.priority === 'urgent',
      })),
    [activities]
  )

  const shortcuts = ROLE_SHORTCUTS[currentRole]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">工作台</h1>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="待处理"
          count={pendingCount}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          icon={<Clock size={32} />}
        />
        <StatCard
          label="异常/卡住"
          count={abnormalCount}
          gradient="bg-gradient-to-br from-red-500 to-rose-600"
          icon={<AlertTriangle size={32} />}
        />
        <StatCard
          label="今日完成"
          count={completedTodayCount}
          gradient="bg-gradient-to-br from-emerald-500 to-green-600"
          icon={<CheckCircle2 size={32} />}
        />
      </div>

      <div className="space-y-4">
        <div className="border-l-4 border-red-500 bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-red-700 mb-3">紧急待处理</h2>
          <div className="space-y-3">
            {urgentBatches.length === 0 && urgentSamples.length === 0 && (
              <p className="text-sm text-slate-400">暂无紧急事项</p>
            )}
            {urgentBatches.map((batch) => {
              const statusInfo = BATCH_STATUS_MAP[batch.status]
              return (
                <PriorityCard
                  key={batch.id}
                  name={`${batch.batchNo} - ${batch.formulaName}`}
                  statusLabel={statusInfo.label}
                  statusColor={statusInfo.color}
                  statusBg={statusInfo.bg}
                  responsible={batch.lastModifiedBy}
                  happenedAt={formatRelativeTime(batch.updatedAt)}
                  actionLabel="处理"
                  onAction={() => openDetailPanel('batch', batch.id)}
                />
              )
            })}
            {urgentSamples.map((sample) => {
              const statusInfo = SAMPLE_STATUS_MAP[sample.status]
              return (
                <PriorityCard
                  key={sample.id}
                  name={`${sample.sampleNo} - ${sample.batchNo}`}
                  statusLabel={statusInfo.label}
                  statusColor={statusInfo.color}
                  statusBg={statusInfo.bg}
                  responsible={sample.lastModifiedBy}
                  happenedAt={formatRelativeTime(sample.updatedAt)}
                  actionLabel="处理"
                  onAction={() => openDetailPanel('sample', sample.id)}
                />
              )
            })}
          </div>
        </div>

        <div className="border-l-4 border-orange-500 bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-orange-700 mb-3">待处理</h2>
          <div className="space-y-3">
            {pendingQcBatches.length === 0 && pendingSamplesList.length === 0 && (
              <p className="text-sm text-slate-400">暂无待处理事项</p>
            )}
            {pendingQcBatches.map((batch) => {
              const statusInfo = BATCH_STATUS_MAP[batch.status]
              const linkedSample = getActiveSampleByBatchId(batch.id)
              return (
                <PriorityCard
                  key={batch.id}
                  name={`${batch.batchNo} - ${batch.formulaName}`}
                  statusLabel={statusInfo.label}
                  statusColor={statusInfo.color}
                  statusBg={statusInfo.bg}
                  responsible={batch.lastModifiedBy}
                  happenedAt={formatRelativeTime(batch.updatedAt)}
                  actionLabel="查看质检"
                  onAction={() => {
                    if (linkedSample) {
                      openDetailPanel('sample', linkedSample.id)
                    } else {
                      openDetailPanel('batch', batch.id)
                    }
                  }}
                />
              )
            })}
            {pendingSamplesList.map((sample) => {
              const statusInfo = SAMPLE_STATUS_MAP[sample.status]
              return (
                <PriorityCard
                  key={sample.id}
                  name={`${sample.sampleNo} - ${sample.batchNo}`}
                  statusLabel={statusInfo.label}
                  statusColor={statusInfo.color}
                  statusBg={statusInfo.bg}
                  responsible={sample.lastModifiedBy}
                  happenedAt={formatRelativeTime(sample.updatedAt)}
                  actionLabel="取样"
                  onAction={() => openDetailPanel('sample', sample.id)}
                />
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">最近活动</h2>
          <Timeline items={timelineItems} />
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">
            角色快捷入口
            <span className="ml-2 text-xs font-normal text-slate-400">
              {ROLE_MAP[currentRole].label}
            </span>
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {shortcuts.map(({ label, icon: Icon }) => (
              <button
                key={label}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
              >
                <Icon size={24} className="text-slate-600" />
                <span className="text-xs font-medium text-slate-700">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
