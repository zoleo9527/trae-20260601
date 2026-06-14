
import { Clock, Wrench, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { useTicketStore } from '../store/ticketStore'

const statsConfig = [
  { key: 'pending', label: '待审核', icon: Clock, color: 'bg-blue-500', bgColor: 'bg-blue-50' },
  { key: 'approved', label: '已派工', icon: ArrowRight, color: 'bg-purple-500', bgColor: 'bg-purple-50' },
  { key: 'repairing', label: '维修中', icon: Wrench, color: 'bg-amber-500', bgColor: 'bg-amber-50' },
  { key: 'completed', label: '已完成', icon: CheckCircle, color: 'bg-green-500', bgColor: 'bg-green-50' },
  { key: 'rejected', label: '已退回', icon: XCircle, color: 'bg-red-500', bgColor: 'bg-red-50' },
]

export function StatsCard() {
  const tickets = useTicketStore((state) => state.tickets)
  
  const stats = { pending: 0, repairing: 0, completed: 0, rejected: 0, approved: 0 }
  tickets.forEach((ticket) => {
    if (ticket.status in stats) {
      stats[ticket.status as keyof typeof stats]++
    }
  })

  return (
    <div className="grid grid-cols-5 gap-4">
      {statsConfig.map(({ key, label, icon: Icon, color, bgColor }) => (
        <div
          key={key}
          className={`${bgColor} rounded-xl p-4 transition-transform hover:scale-105 cursor-pointer`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats[key as keyof typeof stats]}</p>
              <p className="text-sm text-gray-600">{label}</p>
            </div>
            <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
