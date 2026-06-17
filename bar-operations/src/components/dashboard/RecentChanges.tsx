import { Package, ScanLine, Calendar, AlertTriangle, Clock } from 'lucide-react'

interface RecentItem {
  id: string
  type: 'deposit' | 'redeem' | 'booking' | 'expiry'
  title: string
  description: string
  time: string
  status: 'pending' | 'success' | 'danger'
}

interface RecentChangesProps {
  items: RecentItem[]
}

const typeConfig = {
  deposit: {
    icon: Package,
    color: 'text-[#00D9FF]',
    bgColor: 'bg-[#00D9FF]/20',
  },
  redeem: {
    icon: ScanLine,
    color: 'text-[#4ECDC4]',
    bgColor: 'bg-[#4ECDC4]/20',
  },
  booking: {
    icon: Calendar,
    color: 'text-[#F5A623]',
    bgColor: 'bg-[#F5A623]/20',
  },
  expiry: {
    icon: AlertTriangle,
    color: 'text-[#FF6B6B]',
    bgColor: 'bg-[#FF6B6B]/20',
  },
}

const statusConfig = {
  pending: {
    color: 'text-[#F5A623]',
    bgColor: 'bg-[#F5A623]/20',
    text: '待处理',
  },
  success: {
    color: 'text-[#4ECDC4]',
    bgColor: 'bg-[#4ECDC4]/20',
    text: '已完成',
  },
  danger: {
    color: 'text-[#FF6B6B]',
    bgColor: 'bg-[#FF6B6B]/20',
    text: '已过期',
  },
}

export function RecentChanges({ items }: RecentChangesProps) {
  return (
    <div className="bg-[#1A1F2E] rounded-xl border border-[#2D3748] overflow-hidden">
      <div className="p-4 border-b border-[#2D3748]">
        <h3 className="text-lg font-bold text-white">最近变更</h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => {
            const type = typeConfig[item.type]
            const status = statusConfig[item.status]
            const Icon = type.icon
            return (
              <div
                key={item.id}
                className="p-4 bg-[#0D1117] rounded-lg border border-[#2D3748] hover:border-[#00D9FF]/50 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 ${type.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${type.color}`} />
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                    {status.text}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-white mb-1 group-hover:text-[#00D9FF] transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-[#A0AEC0] mb-2">{item.description}</p>
                <div className="flex items-center gap-1 text-xs text-[#A0AEC0]">
                  <Clock className="w-3 h-3" />
                  {item.time}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}