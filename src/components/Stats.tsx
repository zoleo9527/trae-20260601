import { AlertCircle, CheckCircle, PhoneCall, AlertTriangle } from 'lucide-react'

interface StatsProps {
  pendingCount: number
  compensatedCount: number
  followupCount: number
  abnormalCount: number
}

export function Stats({ pendingCount, compensatedCount, followupCount, abnormalCount }: StatsProps) {
  const stats = [
    {
      label: '当晚待处理',
      value: pendingCount,
      icon: AlertCircle,
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-400',
      borderColor: 'border-red-500/30'
    },
    {
      label: '已补偿',
      value: compensatedCount,
      icon: CheckCircle,
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-400',
      borderColor: 'border-green-500/30'
    },
    {
      label: '待回访',
      value: followupCount,
      icon: PhoneCall,
      bgColor: 'bg-yellow-500/20',
      textColor: 'text-yellow-400',
      borderColor: 'border-yellow-500/30'
    },
    {
      label: '异常核销',
      value: abnormalCount,
      icon: AlertTriangle,
      bgColor: 'bg-orange-500/20',
      textColor: 'text-orange-400',
      borderColor: 'border-orange-500/30'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`${stat.bgColor} ${stat.borderColor} border rounded-xl p-4 hover:shadow-lg transition-shadow`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
            </div>
            <stat.icon className={`h-8 w-8 ${stat.textColor}`} />
          </div>
        </div>
      ))}
    </div>
  )
}