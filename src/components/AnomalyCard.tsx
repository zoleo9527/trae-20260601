import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Clock, FileX } from 'lucide-react'
import { cn } from '@/lib/utils'
import StatusBadge from './StatusBadge'

interface AnomalyCardProps {
  diversion: {
    id: string
    examNo: string
    patientName: string
    anomalyType: string[]
    urgency: 'normal' | 'urgent' | 'timeout'
    status: string
  }
}

const anomalyBadgeMap: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  missing_material: { label: '缺材料', className: 'bg-red-50 text-red-600', icon: <FileX className="w-3 h-3" /> },
  timeout: { label: '超时', className: 'bg-amber-50 text-amber-600', icon: <Clock className="w-3 h-3" /> },
  review_failed: { label: '复核不通过', className: 'bg-red-50 text-red-600', icon: <AlertTriangle className="w-3 h-3" /> },
}

const urgencyConfig: Record<string, { label: string; className: string }> = {
  timeout: { label: '已超时', className: 'text-red-600 bg-red-50' },
  urgent: { label: '紧急', className: 'text-amber-600 bg-amber-50' },
  normal: { label: '普通', className: 'text-gray-500 bg-gray-50' },
}

export default function AnomalyCard({ diversion }: AnomalyCardProps) {
  const navigate = useNavigate()
  const isUrgent = diversion.urgency === 'timeout' || diversion.urgency === 'urgent'
  const urgency = urgencyConfig[diversion.urgency]

  return (
    <div
      onClick={() => navigate(`/diversion/${diversion.id}`)}
      className={cn(
        'bg-white rounded-lg p-4 border cursor-pointer transition-shadow hover:shadow-md',
        isUrgent ? 'border-l-4 border-l-red-500 border-t border-r border-b border-t-warm-300 border-r-warm-300 border-b-warm-300' : 'border-warm-300'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-primary">{diversion.examNo}</span>
        {urgency && (
          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', urgency.className)}>
            {urgency.label}
          </span>
        )}
      </div>
      <div className="text-sm text-gray-700 mb-2">{diversion.patientName}</div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {diversion.anomalyType.map((type) => {
          const badge = anomalyBadgeMap[type]
          if (!badge) return null
          return (
            <span key={type} className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium', badge.className)}>
              {badge.icon}
              {badge.label}
            </span>
          )
        })}
      </div>
      <StatusBadge status={diversion.status} type="diversion" />
    </div>
  )
}
