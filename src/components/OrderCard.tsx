import React from 'react'
import dayjs from 'dayjs'
import type { Order } from '../types'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, URGENCY_LABELS, URGENCY_COLORS } from '../types'

interface OrderCardProps {
  order: Order
  selected: boolean
  onClick: () => void
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, selected, onClick }) => {
  const isUrgent = order.urgency !== 'normal'
  const isOverdue = dayjs(order.deadline).isBefore(dayjs(), 'day') && 
    !['completed', 'cancelled'].includes(order.status)

  return (
    <div
      onClick={onClick}
      className={`factory-card cursor-pointer transition-all duration-150 hover:border-factory-accent ${
        selected ? 'border-factory-accent bg-factory-accent/5' : ''
      } ${isOverdue ? 'border-red-500/50' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-mono text-sm font-bold text-factory-text">
            {order.order_no}
          </div>
          <div className="text-xs text-factory-muted truncate max-w-[180px]">
            {order.customer_name}
          </div>
        </div>
        <span className={`urgency-badge ${URGENCY_COLORS[order.urgency]}`}>
          {URGENCY_LABELS[order.urgency]}
        </span>
      </div>

      <div className="text-sm font-medium text-factory-text mb-1 truncate">
        {order.product_name}
      </div>

      <div className="flex items-center gap-2 text-xs text-factory-muted mb-2">
        <span>{order.quantity.toLocaleString()}份</span>
        <span>·</span>
        <span>{order.size}</span>
        <span>·</span>
        <span>{order.paper_type}{order.paper_gsm}g</span>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className={`status-badge ${ORDER_STATUS_COLORS[order.status]}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
        <div className={`text-xs font-mono ${isOverdue ? 'text-red-400' : 'text-factory-muted'}`}>
          📅 {dayjs(order.deadline).format('MM-DD')}
        </div>
      </div>

      {order.quote_amount && order.quote_amount > 0 && (
        <div className="mt-2 pt-2 border-t border-factory-border text-right">
          <span className="text-xs text-factory-muted">报价</span>
          <span className="ml-2 text-sm font-bold text-factory-accent font-mono">
            ¥{order.quote_amount.toLocaleString()}
          </span>
        </div>
      )}

      {isOverdue && (
        <div className="mt-2 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
          ⚠️ 已逾期
        </div>
      )}
    </div>
  )
}
