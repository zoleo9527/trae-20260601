import { useSampleStore } from '@/stores/sampleStore'
import { useUIStore } from '@/stores/uiStore'
import { useActivityStore } from '@/stores/activityStore'
import { ROLE_MAP, SAMPLE_STATUS_MAP } from '@/types'
import type { SampleStatus, UserRole } from '@/types'
import SampleStatusBadge from './SampleStatusBadge'
import SampleTrendChart from './SampleTrendChart'
import Timeline from '@/components/shared/Timeline'
import { Link } from 'react-router-dom'

const INDICATOR_STANDARDS: Record<string, { min: number; max: number; unit: string }> = {
  蛋白质: { min: 17, max: 22, unit: '%' },
  水分: { min: 0, max: 13, unit: '%' },
  灰分: { min: 0, max: 7, unit: '%' },
  粗脂肪: { min: 2, max: 6, unit: '%' },
}

const TRANSITION_OPTIONS: Record<SampleStatus, { toStatus: SampleStatus; label: string; variant: 'primary' | 'danger'; role: UserRole }[]> = {
  pending_sample: [{ toStatus: 'testing', label: '开始检测', variant: 'primary', role: 'qc_inspector' }],
  testing: [
    { toStatus: 'qualified', label: '标记合格', variant: 'primary', role: 'qc_inspector' },
    { toStatus: 'unqualified', label: '标记不合格', variant: 'danger', role: 'qc_inspector' },
  ],
  unqualified: [{ toStatus: 'testing', label: '重新检测', variant: 'primary', role: 'qc_inspector' }],
  qualified: [{ toStatus: 'archived', label: '留样入库', variant: 'primary', role: 'qc_inspector' }],
  archived: [{ toStatus: 'destroyed', label: '销毁留样', variant: 'danger', role: 'qc_inspector' }],
  destroyed: [],
}

function IndicatorBar({ name, value }: { name: string; value: number }) {
  const std = INDICATOR_STANDARDS[name]
  if (!std) return null
  const range = std.max - std.min
  const percent = Math.min(100, Math.max(0, ((value - std.min) / range) * 100))
  const isOk = value >= std.min && value <= std.max

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600 font-medium">{name}</span>
        <span className={isOk ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
          {value}{std.unit}
        </span>
      </div>
      <div className="relative h-1.5 bg-slate-100 rounded-full">
        <div
          className={`absolute top-0 left-0 h-1.5 rounded-full transition-all ${isOk ? 'bg-emerald-400' : 'bg-red-400'}`}
          style={{ width: `${percent}%` }}
        />
        <div
          className="absolute top-0 h-full w-px bg-slate-400"
          style={{ left: `${((std.min / std.max) * 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>标准: {std.min}{std.unit}</span>
        <span>{std.max}{std.unit}</span>
      </div>
    </div>
  )
}

export default function SampleDetail({ sampleId }: { sampleId: string }) {
  const sample = useSampleStore((s) => s.getSampleById(sampleId))
  const transitionStatus = useSampleStore((s) => s.transitionStatus)
  const currentRole = useUIStore((s) => s.currentRole)
  const openDetailPanel = useUIStore((s) => s.openDetailPanel)
  const addActivity = useActivityStore((s) => s.addActivity)

  if (!sample) {
    return <p className="text-sm text-slate-400">留样不存在</p>
  }

  const options = TRANSITION_OPTIONS[sample.status].filter((o) => o.role === currentRole)
  const indicatorEntries = Object.entries(sample.indicators)

  const timelineItems = sample.history.map((entry) => ({
    id: entry.id,
    title: entry.remark,
    subtitle: `${entry.operator} (${ROLE_MAP[entry.operatorRole].label})`,
    timestamp: entry.timestamp,
    highlight: entry.toStatus === 'unqualified',
  }))

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-base font-bold text-slate-900">{sample.sampleNo}</h4>
        <SampleStatusBadge status={sample.status} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <span className="text-slate-400 text-xs">关联批次</span>
          <button
            onClick={() => openDetailPanel('batch', sample.batchId)}
            className="block text-orange-600 hover:text-orange-700 font-medium text-sm"
          >
            {sample.batchNo}
          </button>
        </div>
        <div>
          <span className="text-slate-400 text-xs">创建人</span>
          <p className="text-slate-900 font-medium">{sample.createdBy}</p>
        </div>
        <div>
          <span className="text-slate-400 text-xs">检测人</span>
          <p className="text-slate-900 font-medium">{sample.tester ?? '-'}</p>
        </div>
        <div>
          <span className="text-slate-400 text-xs">最近修改</span>
          <p className="text-slate-900 font-medium">{sample.lastModifiedBy}</p>
        </div>
        <div>
          <span className="text-slate-400 text-xs">创建时间</span>
          <p className="text-slate-700 text-xs">{new Date(sample.createdAt).toLocaleString('zh-CN')}</p>
        </div>
        <div>
          <span className="text-slate-400 text-xs">最近修改时间</span>
          <p className="text-slate-700 text-xs">{new Date(sample.updatedAt).toLocaleString('zh-CN')}</p>
        </div>
        {sample.testedAt && (
          <>
            <div>
              <span className="text-slate-400 text-xs">检测时间</span>
              <p className="text-slate-700 text-xs">{new Date(sample.testedAt).toLocaleString('zh-CN')}</p>
            </div>
            <div>
              <span className="text-slate-400 text-xs">留样到期</span>
              <p className="text-slate-700 text-xs">{sample.retentionExpiry ?? '-'}</p>
            </div>
          </>
        )}
      </div>

      {indicatorEntries.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">检测指标</h5>
          {indicatorEntries.map(([name, value]) => (
            <IndicatorBar key={name} name={name} value={value} />
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">历史趋势</h5>
        <SampleTrendChart />
      </div>

      {options.length > 0 && (
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          {options.map((opt) => (
            <button
              key={opt.toStatus}
              onClick={() => {
                const operator = ROLE_MAP[currentRole].defaultOperator
                transitionStatus(sample.id, opt.toStatus, operator, currentRole, opt.label)
                addActivity({
                  id: `act-${Date.now()}`,
                  type: 'sample',
                  action: opt.label,
                  operator,
                  operatorRole: currentRole,
                  targetId: sample.id,
                  targetName: sample.sampleNo,
                  timestamp: new Date().toISOString(),
                  priority: opt.variant === 'danger' ? 'urgent' : 'normal',
                })
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

      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">操作记录</h5>
        <Timeline items={timelineItems} />
      </div>
    </div>
  )
}
