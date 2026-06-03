import { useEffect, useState } from 'react'
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Lock, GripVertical } from 'lucide-react'
import { fetchProductionBoard, updateSchedule } from '@/utils/api'
import type { Order } from '@/types'
import { cn } from '@/lib/utils'

function DroppableColumn({ date, orders, children }: { date: string; orders: Order[]; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `date-${date}` })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-w-[240px] flex-shrink-0 bg-factory-bg rounded-lg border transition',
        isOver ? 'border-factory-amber' : 'border-factory-border'
      )}
    >
      <div className="p-3 border-b border-factory-border">
        <p className="text-sm font-medium text-gray-200">{date}</p>
        <p className="text-xs text-factory-muted">{orders.length} 个订单</p>
      </div>
      <div className="p-2 space-y-2 min-h-[120px]">{children}</div>
    </div>
  )
}

function DraggableCard({ order, isDragOverlay }: { order: Order; isDragOverlay?: boolean }) {
  const hasAnomaly = order.anomalies.some((a) => !a.resolvedAt)
  const isBlocked = hasAnomaly

  if (isDragOverlay) {
    return (
      <div className="bg-factory-surface border border-factory-amber rounded-lg p-3 shadow-lg shadow-factory-amber/20">
        <p className="font-mono text-sm text-factory-amber">{order.orderNo}</p>
        <p className="text-xs text-gray-300 mt-1">{order.customerName} · {order.productType}</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-factory-surface border rounded-lg p-3',
        isBlocked ? 'border-factory-red/30 cursor-not-allowed' : 'border-factory-border cursor-grab active:cursor-grabbing hover:border-factory-amber transition'
      )}
    >
      <div className="flex items-center gap-2">
        {!isBlocked && <GripVertical className="w-3.5 h-3.5 text-factory-muted flex-shrink-0" />}
        {isBlocked && <Lock className="w-3.5 h-3.5 text-factory-red flex-shrink-0" />}
        <span className="font-mono text-sm text-gray-300">{order.orderNo}</span>
      </div>
      <p className="text-xs text-factory-muted mt-1">{order.customerName} · {order.productType}</p>
      {hasAnomaly && (
        <p className="text-xs text-factory-red mt-1">存在异常，无法调整</p>
      )}
    </div>
  )
}

export default function ProductionBoard() {
  const [groups, setGroups] = useState<{ date: string; orders: Order[] }[]>([])
  const [loading, setLoading] = useState(true)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => {
    loadBoard()
  }, [])

  const loadBoard = async () => {
    try {
      const groups = await fetchProductionBoard()
      setGroups(groups)
    } catch {
      setGroups([])
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const orderId = event.active.id as string
    const order = groups.flatMap((g) => g.orders).find((o) => o.id === orderId)
    if (order && !order.anomalies.some((a) => !a.resolvedAt)) {
      setActiveOrder(order)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveOrder(null)
    const { active, over } = event
    if (!over) return

    const orderId = active.id as string
    const targetDateStr = (over.id as string).replace('date-', '')
    if (!targetDateStr) return

    const order = groups.flatMap((g) => g.orders).find((o) => o.id === orderId)
    if (!order || order.anomalies.some((a) => !a.resolvedAt)) return

    try {
      await updateSchedule(orderId, { deliveryDate: targetDateStr })
      await loadBoard()
    } catch {
      // handle error silently
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-factory-muted text-sm">加载排产看板...</div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-4 overflow-x-auto">
        {groups.map((group) => (
          <DroppableColumn key={group.date} date={group.date} orders={group.orders}>
            <SortableContext
              items={group.orders.map((o) => o.id)}
              strategy={verticalListSortingStrategy}
            >
              {group.orders.map((order) => (
                <DraggableCard key={order.id} order={order} />
              ))}
            </SortableContext>
          </DroppableColumn>
        ))}
      </div>
      <DragOverlay>
        {activeOrder && <DraggableCard order={activeOrder} isDragOverlay />}
      </DragOverlay>
    </DndContext>
  )
}
