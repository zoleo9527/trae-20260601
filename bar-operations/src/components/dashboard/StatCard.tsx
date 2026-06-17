import { Package, ScanLine, AlertTriangle, TrendingUp } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change: string
  changeType: 'increase' | 'decrease'
  icon: 'deposit' | 'redeem' | 'risk' | 'trend'
  color: 'cyan' | 'gold' | 'red' | 'green'
}

const iconMap = {
  deposit: Package,
  redeem: ScanLine,
  risk: AlertTriangle,
  trend: TrendingUp,
}

const colorMap = {
  cyan: {
    bg: 'bg-[#00D9FF]/20',
    text: 'text-[#00D9FF]',
    gradient: 'from-[#00D9FF] to-[#00B8D9]',
  },
  gold: {
    bg: 'bg-[#F5A623]/20',
    text: 'text-[#F5A623]',
    gradient: 'from-[#F5A623] to-[#E09000]',
  },
  red: {
    bg: 'bg-[#FF6B6B]/20',
    text: 'text-[#FF6B6B]',
    gradient: 'from-[#FF6B6B] to-[#E55555]',
  },
  green: {
    bg: 'bg-[#4ECDC4]/20',
    text: 'text-[#4ECDC4]',
    gradient: 'from-[#4ECDC4] to-[#3DBBA4]',
  },
}

export function StatCard({ title, value, change, changeType, icon, color }: StatCardProps) {
  const Icon = iconMap[icon]
  const colors = colorMap[color]

  return (
    <div className="bg-[#1A1F2E] rounded-xl border border-[#2D3748] p-6 hover:border-[#00D9FF]/50 transition-all hover:shadow-lg hover:shadow-[#00D9FF]/5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            changeType === 'increase' ? 'text-[#4ECDC4]' : 'text-[#FF6B6B]'
          }`}
        >
          {changeType === 'increase' ? (
            <span className="text-[#4ECDC4]">↑</span>
          ) : (
            <span className="text-[#FF6B6B]">↓</span>
          )}
          {change}
        </div>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-[#A0AEC0]">{title}</p>
    </div>
  )
}