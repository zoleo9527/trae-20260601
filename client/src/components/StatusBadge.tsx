type BadgeVariant = 'yellow' | 'green' | 'red' | 'blue' | 'purple' | 'gray'

const statusColorMap: Record<string, BadgeVariant> = {
  '待处理': 'yellow',
  '已放行': 'green',
  '异常退回': 'red',
  '待确认': 'yellow',
  '已确认': 'blue',
  '已到场': 'purple',
  '已完成': 'green',
  '已取消': 'gray',
  '异常': 'red',
}

const variantClasses: Record<BadgeVariant, string> = {
  yellow: 'bg-yellow-100 text-yellow-800',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  gray: 'bg-gray-100 text-gray-600',
}

interface StatusBadgeProps {
  status: string
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const variant = statusColorMap[status] || 'gray'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]}`}>
      {status}
    </span>
  )
}
