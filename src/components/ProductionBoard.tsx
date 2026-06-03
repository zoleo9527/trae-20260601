import { useEffect, useState, useRef } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { Lock, GripVertical, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '@/store/useAppStore'
import { fetchProductionBoard, updateSchedule } from '@/utils/api'
import type { Order } from '@/types'
import { cn } from '@/lib/utils'

function DroppableColumn({ date, count, isFocused, children }: { date: string; count: number; isFocused: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `date-${date}` })
  const colRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isFocused && colRef.current) {
      colRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [isFocused])

  return (
    <div
      ref={(el) => { setNodeRef(el); (colRef as React.MutableRefObject<HTMLDivElement | null>).current = el; }}
      className={cn(
        'min-w-[260px] flex-shrink-0 bg-factory-bg rounded-lg border transition flex flex-col',
        isOver ? 'border-factory-amber' : 'border-factory-border',
        isFocused && 'ring-2 ring-factory-amber ring-offset-2 ring-offset-factory-bg'
      )}
    >
      <div className="p-3 border-b border-factory-border flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-200">{date}</p>
          <p className="text-xs text-factory-muted">{count} 个工单</p>
        </div>
        {isFocused && (
          <div className="w-2 h-2 rounded-full bg-factory-amber animate-pulse" />
        )}
      </div>
      <div className="p-2 space-y-2 min-h-[120px] flex-1">{children}</div>
    </div>
  )
}

function DraggableCard({ order }: { order: Order }) {
  const navigate = useNavigate()
  const hasAnomaly = order.anomalies.some((a) => !a.resolvedAt)
  const isBlocked = hasAnomaly
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
    disabled: isBlocked,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-factory-surface border rounded-lg p-3 group',
        isBlocked ? 'border-factory-red/30' : 'border-factory-border hover:border-factory-amber transition',
        isDragging && 'opacity-50 shadow-lg'
      )}
      {...(isBlocked ? {} : { ...listeners, ...attributes })}
    >
      <div className="flex items-center gap-2">
        {!isBlocked && <GripVertical className="w-3.5 h-3.5 text-factory-muted flex-shrink-0 cursor-grab active:cursor-grabbing" />}
        {isBlocked && <Lock className="w-3.5 h-3.5 text-factory-red flex-shrink-0" />}
        <span className="font-mono text-sm text-gray-300">{order.orderNo}</span>
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/order/${order.id}`) }}
          className="ml-auto opacity-0 group-hover:opacity-100 p-0.5 text-factory-muted hover:text-factory-amber transition"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-xs text-factory-muted mt-1">{order.customerName} · {order.productType}</p>
      {hasAnomaly && (
        <p className="text-xs text-factory-red mt-1">存在异常，无法调整</p>
      )}
    </div>
  )
}

function DragOverlayCard({ order }: { order: Order }) {
  return (
    <div className="bg-factory-surface border border-factory-amber rounded-lg p-3 shadow-xl shadow-factory-amber/20 w-[240px]">
      <div className="flex items-center gap-2">
        <GripVertical className="w-3.5 h-3.5 text-factory-amber flex-shrink-0" />
        <span className="font-mono text-sm text-factory-amber">{order.orderNo}</span>
      </div>
      <p className="text-xs text-gray-300 mt-1">{order.customerName} · {order.productType}</p>
    </div>
  )
}

export default function ProductionBoard() {
  const [groups, setGroups] = useState<{ date: string; count: number; orders: Order[] }[]>([])
  const [loading, setLoading] = useState(true)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const productionBoardFocusDate = useAppStore((s) => s.productionBoardFocusDate)
  const setProductionBoardFocusDate = useAppStore((s) => s.setProductionBoardFocusDate)
  const prevFocusDate = useRef<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  useEffect(() => {
    loadBoard()
  }, [])

  useEffect(() => {
    if (productionBoardFocusDate && productionBoardFocusDate !== prevFocusDate.current) {
      prevFocusDate.current = productionBoardFocusDate
      const timeout = setTimeout(() => {
        setProductionBoardFocusDate(null)
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [productionBoardFocusDate, setProductionBoardFocusDate])

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
    const targetId = over.id as string
    if (!targetId.startsWith('date-')) return

    const targetDate = targetId.replace('date-', '')
    const order = groups.flatMap((g) => g.orders).find((o) => o.id === orderId)
    if (!order || order.anomalies.some((a) => !a.resolvedAt)) return

    if (order.deliveryDate === targetDate) return

    const sourceGroup = groups.find(g => g.orders.some(o => o.id === orderId))
    if (!sourceGroup) return

    setGroups(prev => {
      const next = prev.map(g => ({
        ...g,
        orders: g.orders.filter(o => o.id !== orderId)
      }))
      const target = next.find(g => g.date === targetDate)
      if (target) {
        target.orders.push({ ...order, deliveryDate: targetDate })
        target.count = target.orders.length
      }
      const source = next.find(g => g.date === sourceGroup.date)
      if (source) {
        source.count = source.orders.length
      }
      return [...next]
    })

    try {
      await updateSchedule(orderId, { deliveryDate: targetDate })
    } catch {
      await loadBoard()
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
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-4 overflow-x-auto h-full">
        {groups.map((group) => (
          <DroppableColumn key={group.date} date={group.date} count={group.count} isFocused={productionBoardFocusDate === group.date}>
            {group.orders.map((order) => (
              <DraggableCard key={order.id} order={order} />
            ))}
          </DroppableColumn>
        ))}
      </div>
      <DragOverlay>
        {activeOrder && <DragOverlayCard order={activeOrder} />}
      </DragOverlay>
    </DndContext>
  )
}
