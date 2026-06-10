import { useBatchStore } from '@/stores/batchStore'
import { useSampleStore } from '@/stores/sampleStore'
import { useUIStore } from '@/stores/uiStore'
import { useActivityStore } from '@/stores/activityStore'
import { ROLE_MAP, BATCH_STATUS_MAP } from '@/types'
import type { BatchStatus, UserRole } from '@/types'
import BatchStatusBadge from './BatchStatusBadge'
import SampleStatusBadge from '@/components/sample/SampleStatusBadge'
import Timeline from '@/components/shared/Timeline'
import { FlaskConical } from 'lucide-react'

const BORDER_COLORS: Record<BatchStatus, string> = {
  abnormal: 'border-l-red-500',
  pending_qc: 'border-l-orange-500',
  pending_feed: 'border-l-amber-400',
  in_production: 'border-l-blue-500',
  completed: 'border-l-emerald-500',
}

const TRANSITION_OPTIONS: Record<BatchStatus, { toStatus: BatchStatus; label: string; variant: 'primary' | 'danger'; role: UserRole }[]> = {
  pending_feed: [{ toStatus: 'in_production', label: '开始投料', variant: 'primary', role: 'production_lead' }],
  in_production: [{ toStatus: 'pending_qc', label: '提交质检', variant: 'primary', role: 'production_lead' }],
  pending_qc: [
    { toStatus: 'completed', label: '质检通过', variant: 'primary', role: 'qc_inspector' },
    { toStatus: 'abnormal', label: '标记异常', variant: 'danger', role: 'qc_inspector' },
  ],
  abnormal: [{ toStatus: 'pending_qc', label: '重新质检', variant: 'primary', role: 'qc_inspector' }],
  completed: [],
}

export default function BatchDetail({ batchId }: { batchId: string }) {
  const batch = useBatchStore((s) => s.getBatchById(batchId))
  const transitionStatus = useBatchStore((s) => s.transitionStatus)
  const currentRole = useUIStore((s) => s.currentRole)
  const openDetailPanel = useUIStore((s) => s.openDetailPanel)
  const addActivity = useActivityStore((s) => s.addActivity)
  const getActiveSampleByBatchId = useSampleStore((s) => s.getActiveSampleByBatchId)
  const createSample = useSampleStore((s) => s.createSample)
  const samples = useSampleStore((s) => s.samples.filter((s) => s.batchId === batchId))

  if (!batch) {
    return <p className="text-sm text-slate-400">批次不存在</p>
  }

  const options = TRANSITION_OPTIONS[batch.status].filter((o) => o.role === currentRole)

  const timelineItems = batch.history.map((entry) => ({
    id: entry.id,
    title: entry.remark,
    subtitle: `${entry.operator} (${ROLE_MAP[entry.operatorRole].label})`,
    timestamp: entry.timestamp,
    highlight: entry.toStatus === 'abnormal',
  }))

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-base font-bold text-slate-900">{batch.batchNo}</h4>
          <p className="text-xs text-slate-500 mt-0.5">{batch.formulaName}</p>
        </div>
        <BatchStatusBadge status={batch.status} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <span className="text-slate-400 text-xs">计划产量</span>
          <p className="text-slate-900 font-medium">{batch.plannedQty}kg</p>
        </div>
        <div>
          <span className="text-slate-400 text-xs">实际产量</span>
          <p className="text-slate-900 font-medium">{batch.actualQty != null ? `${batch.actualQty}kg` : '-'}</p>
        </div>
        <div>
          <span className="text-slate-400 text-xs">创建人</span>
          <p className="text-slate-700">{batch.createdBy}</p>
        </div>
        <div>
          <span className="text-slate-400 text-xs">最后操作</span>
          <p className="text-slate-700">{batch.lastModifiedBy}</p>
        </div>
        <div>
          <span className="text-slate-400 text-xs">创建时间</span>
          <p className="text-slate-700 text-xs">{new Date(batch.createdAt).toLocaleString('zh-CN')}</p>
        </div>
        <div>
          <span className="text-slate-400 text-xs">最近修改</span>
          <p className="text-slate-700 text-xs">{new Date(batch.updatedAt).toLocaleString('zh-CN')}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">生产进度</span>
          <span className="text-slate-700 font-medium">{batch.progress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              batch.status === 'abnormal' ? 'bg-red-400' : batch.status === 'completed' ? 'bg-emerald-400' : 'bg-blue-400'
            }`}
            style={{ width: `${batch.progress}%` }}
          />
        </div>
      </div>

      {options.length > 0 && (
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          {options.map((opt) => (
            <button
              key={opt.toStatus}
              onClick={() => {
                const operator = ROLE_MAP[currentRole].defaultOperator
                transitionStatus(batch.id, opt.toStatus, operator, currentRole, opt.label)
                addActivity({
                  id: `act-${Date.now()}`,
                  type: 'batch',
                  action: opt.label,
                  operator,
                  operatorRole: currentRole,
                  targetId: batch.id,
                  targetName: batch.batchNo,
                  timestamp: new Date().toISOString(),
                  priority: batch.status === 'abnormal' ? 'urgent' : 'normal',
                })
                if (opt.toStatus === 'pending_qc') {
                  const existing = getActiveSampleByBatchId(batch.id)
                  if (!existing) {
                    const sample = createSample(batch.id, batch.batchNo, operator, currentRole)
                    addActivity({
                      id: `act-${Date.now() + 1}`,
                      type: 'sample',
                      action: '创建取样任务',
                      operator,
                      operatorRole: currentRole,
                      targetId: sample.id,
                      targetName: sample.sampleNo,
                      timestamp: new Date().toISOString(),
                      priority: 'normal',
                    })
                  }
                }
              }}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                opt.variant === 'danger'
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-slate-900 text-white hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {samples.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">关联质检</h5>
          {samples.map((sample) => (
            <button
              key={sample.id}
              onClick={() => openDetailPanel('sample', sample.id)}
              className="w-full text-left flex items-center gap-2 p-2.5 rounded-lg border border-slate-100 hover:border-orange-200 hover:bg-orange-50/50 transition-colors"
            >
              <FlaskConical size={14} className="text-slate-400 shrink-0" />
              <span className="text-xs font-medium text-slate-700 flex-1">{sample.sampleNo}</span>
              <SampleStatusBadge status={sample.status} />
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">操作记录</h5>
        <Timeline items={timelineItems} />
      </div>
    </div>
  )
}
