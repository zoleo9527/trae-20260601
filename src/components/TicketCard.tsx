import { AlertTriangle, Clock, Wrench, CheckCircle, XCircle, ArrowRight, RefreshCcw, Gift, Bell } from 'lucide-react'
import { FaultTicket, TicketStatus, TicketPriority, HandoverType } from '../types'

const statusConfig: Record<TicketStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: { label: '待审核', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Clock },
  approved: { label: '待派工', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: ArrowRight },
  repairing: { label: '维修中', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Wrench },
  completed: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  rejected: { label: '已退回', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
}

const priorityConfig: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: '低', color: 'text-gray-600' },
  medium: { label: '中', color: 'text-amber-600' },
  high: { label: '高', color: 'text-red-600' },
}

const handoverConfig: Record<HandoverType, { label: string; icon: typeof RefreshCcw; color: string; bgColor: string }> = {
  shift_close: { label: '班结', icon: RefreshCcw, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  prize_claim: { label: '兑奖', icon: Gift, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  normal_fault: { label: '故障', icon: AlertTriangle, color: 'text-gray-600', bgColor: 'bg-gray-100' },
}

const categoryLabels: Record<string, string> = {
  shift_issue: '班结问题',
  prize_device: '兑奖设备',
  print_error: '打印异常',
  network_issue: '网络问题',
  other: '其他',
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

  const handover = ticket.handoverType ? handoverConfig[ticket.handoverType] : null
  const HandoverIcon = handover?.icon

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200'
      } ${ticket.isAlert ? 'ring-2 ring-amber-500' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-medium text-gray-900">{ticket.deviceId}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priority.color} bg-gray-100`}>
            {priority.label}优先级
          </span>
          {handover && HandoverIcon && (
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${handover.color} ${handover.bgColor}`}>
              <HandoverIcon className="w-3 h-3" />
              {handover.label}
            </span>
          )}
        </div>
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color} ${status.bgColor}`}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
      </div>

      <h3 className="font-medium text-gray-900 mb-2">{ticket.deviceName}</h3>
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{ticket.description}</p>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span>{ticket.storeName}</span>
        <span>{formatDate(ticket.updatedAt)}</span>
      </div>

      {ticket.shiftCloseInfo && (
        <div className="bg-purple-50 rounded-lg p-2 mb-2">
          <p className="text-xs text-purple-700 font-medium">
            班结单号: {ticket.shiftCloseInfo.shiftId}
          </p>
          <p className="text-xs text-purple-600">
            {ticket.shiftCloseInfo.shiftPeriod === 'morning' ? '早班' : 
             ticket.shiftCloseInfo.shiftPeriod === 'afternoon' ? '中班' :
             ticket.shiftCloseInfo.shiftPeriod === 'evening' ? '晚班' : '夜班'} 
            - 销售额: ¥{ticket.shiftCloseInfo.salesAmount.toLocaleString()}
          </p>
        </div>
      )}

      {ticket.prizeClaimInfo && (
        <div className="bg-amber-50 rounded-lg p-2 mb-2">
          <p className="text-xs text-amber-700 font-medium">
            兑奖单号: {ticket.prizeClaimInfo.claimId}
          </p>
          <p className="text-xs text-amber-600">
            {ticket.prizeClaimInfo.prizeLevel} - ¥{ticket.prizeClaimInfo.prizeAmount.toLocaleString()}
          </p>
        </div>
      )}

      {ticket.isAlert && (
        <div className="flex items-center gap-1 text-amber-600 text-xs mb-2">
          <Bell className="w-3 h-3" />
          <span className="font-medium">异常提醒</span>
        </div>
      )}

      {ticket.status === 'rejected' && ticket.rejectedReason && (
        <div className="bg-red-50 rounded-lg p-2 mb-2">
          <p className="text-xs text-red-700 font-medium">退回原因</p>
          <p className="text-xs text-red-600">{ticket.rejectedReason}</p>
        </div>
      )}
    </div>
  )
}
