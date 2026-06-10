import type { QualitySample, SampleStatus } from '@/types'
import { cn } from '@/lib/utils'
import { User, Clock } from 'lucide-react'
import SampleStatusBadge from './SampleStatusBadge'

const BORDER_COLORS: Record<SampleStatus, string> = {
  unqualified: 'border-l-red-500',
  pending_sample: 'border-l-orange-500',
  testing: 'border-l-blue-500',
  qualified: 'border-l-emerald-500',
  archived: 'border-l-purple-500',
  destroyed: 'border-l-zinc-400',
}

function getRelativeTime(timestamp: string): string {
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

interface SampleCardProps {
  sample: QualitySample
  onClick: () => void
}

export default function SampleCard({ sample, onClick }: SampleCardProps) {
  const indicatorEntries = Object.entries(sample.indicators).slice(0, 2)

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg border border-slate-200 border-l-4 p-3 cursor-pointer',
        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
        BORDER_COLORS[sample.status]
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-slate-900">{sample.sampleNo}</span>
        <SampleStatusBadge status={sample.status} />
      </div>

      <p className="text-xs text-slate-500 mb-2">批次: {sample.batchNo}</p>

      {indicatorEntries.length > 0 && (
        <div className="flex gap-2 mb-2">
          {indicatorEntries.map(([name, value]) => (
            <span key={name} className="text-xs text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded">
              {name}: {value}%
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <User size={12} />
          {sample.lastModifiedBy || sample.tester}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {getRelativeTime(sample.updatedAt || sample.testedAt || sample.createdAt)}
        </span>
      </div>
    </div>
  )
}
