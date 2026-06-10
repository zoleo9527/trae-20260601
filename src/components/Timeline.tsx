import type { TimelineEvent } from '@/types';

const roleConfig: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  technician: { label: '维保技师', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
  service: { label: '客服', dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  supervisor: { label: '项目主管', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  system: { label: '系统', dot: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-600' },
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${mi}`
}

interface TimelineProps {
  events: TimelineEvent[]
}

export default function Timeline({ events }: TimelineProps) {
  if (events.length === 0) return null

  return (
    <div className="relative pl-6">
      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gray-200" />

      {events.map((event, i) => {
        const cfg = roleConfig[event.role] || roleConfig.system
        return (
          <div
            key={event.id}
            className="relative pb-6 last:pb-0 animate-[fadeIn_0.4s_ease_both]"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div
              className={`absolute left-[-15px] top-1.5 h-3 w-3 rounded-full ${cfg.dot} ring-2 ring-white`}
            />

            <div className="ml-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
                <span className="text-sm font-medium text-gray-800">{event.action}</span>
                <span className="text-xs text-gray-400 ml-auto">{formatTimestamp(event.timestamp)}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{event.detail}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
