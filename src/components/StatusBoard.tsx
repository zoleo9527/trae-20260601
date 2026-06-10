import OrderCard from '@/components/OrderCard'
import { useStore } from '@/store'
import type { MaintenanceOrder, OrderStatus, Role } from '@/types'
import { useNavigate } from 'react-router-dom'

interface ColumnDef {
  title: string
  statuses: OrderStatus[]
  dotColor: string
}

const columnsByRole: Record<Role, ColumnDef[]> = {
  technician: [
    { title: '待签到', statuses: ['pending'], dotColor: 'bg-amber-400' },
    { title: '已签到', statuses: ['checked_in'], dotColor: 'bg-blue-400' },
    { title: '已完成', statuses: ['completed', 'rejected'], dotColor: 'bg-green-400' },
  ],
  service: [
    { title: '待跟进', statuses: ['checked_in'], dotColor: 'bg-blue-400' },
    { title: '审核中', statuses: ['reviewing'], dotColor: 'bg-purple-400' },
    { title: '已完成', statuses: ['completed', 'rejected'], dotColor: 'bg-green-400' },
  ],
  supervisor: [
    { title: '待审核', statuses: ['reviewing'], dotColor: 'bg-purple-400' },
    { title: '已通过', statuses: ['completed'], dotColor: 'bg-green-400' },
    { title: '已退回', statuses: ['rejected'], dotColor: 'bg-red-400' },
  ],
}

interface StatusBoardProps {
  onQuickAction?: (order: MaintenanceOrder) => void
}

export default function StatusBoard({ onQuickAction }: StatusBoardProps) {
  const { currentRole, orders } = useStore()
  const navigate = useNavigate()
  const columns = columnsByRole[currentRole]

  const handleCardClick = (order: MaintenanceOrder) => {
    navigate(`/order/${order.id}`)
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {columns.map((col) => {
        const filtered = orders.filter((o) =>
          col.statuses.includes(o.status)
        )
        return (
          <div key={col.title} className="flex flex-col">
            <div className="mb-3 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
              <h3 className="text-sm font-semibold text-slate-700">
                {col.title}
              </h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {filtered.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {filtered.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
                  暂无工单
                </div>
              ) : (
                filtered.map((order) => (
                  <div key={order.id} onClick={() => handleCardClick(order)} className="cursor-pointer">
                    <OrderCard
                      order={order}
                      selectable={true}
                      onQuickAction={onQuickAction}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
