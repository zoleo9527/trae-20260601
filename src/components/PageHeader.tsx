import type { ReactNode } from 'react'

export default function PageHeader({
  title,
  subtitle,
  actions,
  stats,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  stats?: { label: string; value: string | number; tone?: 'warn' | 'safe' | 'info' | 'danger' }[]
}) {
  const toneMap: Record<string, string> = {
    warn: 'text-warn-400',
    safe: 'text-safe-400',
    info: 'text-info-400',
    danger: 'text-danger-400',
  }
  return (
    <div className="px-5 pt-5 pb-3 border-b border-ink-700/50">
      <div className="flex items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-base font-bold text-ink-100 tracking-wide">{title}</h1>
          {subtitle && <p className="text-xs text-ink-400 mt-0.5">{subtitle}</p>}
        </div>
        {stats && stats.length > 0 && (
          <div className="ml-auto flex items-center gap-4">
            {stats.map(s => (
              <div key={s.label} className="text-right">
                <div className={`text-lg font-bold font-mono leading-none ${s.tone ? toneMap[s.tone] : 'text-ink-100'}`}>{s.value}</div>
                <div className="text-[10px] text-ink-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
