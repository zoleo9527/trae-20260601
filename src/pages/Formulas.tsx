import { FileText, Beaker, Clock } from 'lucide-react'
import { mockFormulas } from '@/data/mock'

function formatDateTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Formulas() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">配方单</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockFormulas.map((formula) => (
          <div
            key={formula.id}
            className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-500">{formula.code}</span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                <Beaker size={12} />
                {formula.batchCount} 批次
              </span>
            </div>

            <h3 className="text-base font-semibold text-slate-900 mb-3">{formula.name}</h3>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock size={12} />
              <span>最近使用: {formatDateTime(formula.lastUsedAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
