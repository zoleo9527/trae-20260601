import { useState } from 'react'
import type { SampleStatus } from '@/types'
import { SAMPLE_STATUS_MAP } from '@/types'
import { cn } from '@/lib/utils'
import { useSampleStore } from '@/stores/sampleStore'
import { useUIStore } from '@/stores/uiStore'
import { FlaskConical } from 'lucide-react'
import SampleCard from './SampleCard'

const STATUS_TABS: { key: SampleStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  ...Object.entries(SAMPLE_STATUS_MAP).map(([key, { label }]) => ({
    key: key as SampleStatus,
    label,
  })),
]

export default function SampleList() {
  const [activeTab, setActiveTab] = useState<SampleStatus | 'all'>('all')
  const { samples, getSamplesByStatus } = useSampleStore()
  const { openDetailPanel } = useUIStore()

  const filtered = activeTab === 'all' ? samples : getSamplesByStatus(activeTab)

  const countFor = (key: SampleStatus | 'all') => {
    if (key === 'all') return samples.length
    return samples.filter((s) => s.status === key).length
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FlaskConical size={20} className="text-orange-500" />
          质检留样
        </h1>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {tab.label}
            <span className={cn('ml-1', activeTab === tab.key ? 'text-slate-300' : 'text-slate-400')}>
              {countFor(tab.key)}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <FlaskConical size={40} className="mb-3 opacity-40" />
          <p className="text-sm">暂无匹配的质检留样</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((sample) => (
            <SampleCard
              key={sample.id}
              sample={sample}
              onClick={() => openDetailPanel('sample', sample.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
