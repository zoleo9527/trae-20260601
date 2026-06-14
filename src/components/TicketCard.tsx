
import { AlertTriangle, Clock, Wrench, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { FaultTicket, TicketStatus, TicketPriority } from '../types'

const statusConfig: Record<TicketStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: { label: '待审核', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Clock },
  approved: { label: '已派工', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: ArrowRight },
  repairing: { label: '维修中', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Wrench },
  completed: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  rejected: { label: '已退回', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
}

const priorityConfig: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: '低', color: 'text-gray-600' },
  medium: { label: '中', color: 'text-amber-600' },
  high: { label: '高', color: 'text-red-600' },
}

interface TicketCardProps {
  ticket: FaultTicket
  onClick: () => void
  isSelected: boolean
}

export function TicketCard({ ticket, onClick, isSelected }: TicketCardProps) {
  const status = statusConfig[ticket.status]
  const priority = priorityConfig[ticket.priority]
  const StatusIcon = status.icon

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-mono font-medium text-gray-900">{ticket.deviceId}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priority.color} bg-gray-100`}>
            {priority.label}优先级
          </span>
        </div>
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color} ${status.bgColor}`}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
      </div>

      <h3 className="font-medium text-gray-900 mb-2">{ticket.deviceName}</h3>
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{ticket.description}</p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{ticket.storeName}</span>
        <span>{formatDate(ticket.updatedAt)}</span>
      </div>

      {ticket.priority === 'high' && (
        <div className="mt-3 flex items-center gap-1 text-red-600 text-xs">
          <AlertTriangle className="w-3 h-3" />
          <span>紧急处理</span>
        </div>
      )}
    </div>
  )
}
