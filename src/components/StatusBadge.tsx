interface StatusBadgeProps {
  status: string
}

const statusStyles: Record<string, string> = {
  '待派件员确认': 'bg-blue-100 text-blue-700',
  '待驿站认定': 'bg-amber-100 text-amber-700',
  '退回处理完成': 'bg-green-100 text-green-700',
  '已驳回-待补录': 'bg-red-100 text-red-700',
  '已驳回-待客服补录': 'bg-red-100 text-red-800',
  '复盘进行中': 'bg-purple-100 text-purple-700',
  '复盘完成': 'bg-emerald-100 text-emerald-700',
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-700'

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${style}`}>
      {status}
    </span>
  )
}
