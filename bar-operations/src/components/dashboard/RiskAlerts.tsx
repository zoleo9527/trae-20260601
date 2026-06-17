import { AlertTriangle, Clock, Package, AlertCircle } from 'lucide-react'

interface RiskItem {
  id: string
  type: 'expiry' | 'anomaly' | 'inventory'
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  count: number
}

interface RiskAlertsProps {
  items: RiskItem[]
}

const typeConfig = {
  expiry: {
    icon: Clock,
    color: 'text-[#FF6B6B]',
    bgColor: 'bg-[#FF6B6B]/20',
  },
  anomaly: {
    icon: AlertTriangle,
    color: 'text-[#F5A623]',
    bgColor: 'bg-[#F5A623]/20',
  },
  inventory: {
    icon: Package,
    color: 'text-[#00D9FF]',
    bgColor: 'bg-[#00D9FF]/20',
  },
}

const severityColors = {
  high: 'border-l-[#FF6B6B]',
  medium: 'border-l-[#F5A623]',
  low: 'border-l-[#00D9FF]',
}

export function RiskAlerts({ items }: RiskAlertsProps) {
  return (
    <div className="bg-[#1A1F2E] rounded-xl border border-[#2D3748] overflow-hidden">
      <div className="p-4 border-b border-[#2D3748] flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">风险预警</h3>
        <span className="flex items-center gap-1 text-sm text-[#FF6B6B]">
          <AlertCircle className="w-4 h-4" />
          {items.length} 项风险
        </span>
      </div>
      <div className="p-4 space-y-3">
        {items.map((item) => {
          const config = typeConfig[item.type]
          const Icon = config.icon
          return (
            <div
              key={item.id}
              className={`p-4 bg-[#0D1117] rounded-lg border-l-4 ${severityColors[item.severity]} hover:border-[#00D9FF]/50 transition-all group cursor-pointer`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-white truncate group-hover:text-[#00D9FF] transition-colors">
                      {item.title}
                    </h4>
                    <span className={`text-xs font-bold ${config.color}`}>
                      {item.count}
                    </span>
                  </div>
                  <p className="text-xs text-[#A0AEC0] line-clamp-2">{item.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}