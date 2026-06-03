import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Order, OrderStatus } from '@/types'

const now = new Date()
const fmt = (d: Date) => d.toISOString()
const hoursAgo = (h: number) => {
  const d = new Date(now.getTime() - h * 3600000)
  return fmt(d)
}

const mockOrders: Order[] = [
  {
    id: 'WO-20260601-001',
    patientName: '张明远',
    designType: '全瓷冠',
    status: 'pending_qc',
    assignedCs: 'staff-1',
    assignedDesigner: 'staff-3',
    assignedQc: 'staff-5',
    createdAt: hoursAgo(48),
    updatedAt: hoursAgo(4),
    stuckAt: 'pending_qc',
    stuckDuration: 240,
  },
  {
    id: 'WO-20260601-002',
    patientName: '李婷婷',
    designType: '贴面',
    status: 'qc_in_progress',
    assignedCs: 'staff-1',
    assignedDesigner: 'staff-3',
    assignedQc: 'staff-5',
    createdAt: hoursAgo(36),
    updatedAt: hoursAgo(1),
  },
  {
    id: 'WO-20260601-003',
    patientName: '王建国',
    designType: '活动义齿',
    status: 'rejected',
    assignedCs: 'staff-1',
    assignedDesigner: 'staff-4',
    assignedQc: 'staff-5',
    createdAt: hoursAgo(72),
    updatedAt: hoursAgo(6),
    rejectionReason: '咬合偏高，需重新调整',
  },
  {
    id: 'WO-20260601-004',
    patientName: '陈思雨',
    designType: '种植桥',
    status: 'designing',
    assignedCs: 'staff-2',
    assignedDesigner: 'staff-3',
    assignedQc: 'staff-6',
    createdAt: hoursAgo(24),
    updatedAt: hoursAgo(2),
    stuckAt: 'designing',
    stuckDuration: 120,
  },
  {
    id: 'WO-20260601-005',
    patientName: '刘芳华',
    designType: '全瓷冠',
    status: 'passed',
    assignedCs: 'staff-2',
    assignedDesigner: 'staff-4',
    assignedQc: 'staff-6',
    createdAt: hoursAgo(60),
    updatedAt: hoursAgo(8),
  },
  {
    id: 'WO-20260601-006',
    patientName: '赵德明',
    designType: '嵌体',
    status: 'pending_shipping',
    assignedCs: 'staff-1',
    assignedDesigner: 'staff-3',
    assignedQc: 'staff-5',
    createdAt: hoursAgo(96),
    updatedAt: hoursAgo(12),
    stuckAt: 'pending_shipping',
    stuckDuration: 720,
  },
  {
    id: 'WO-20260601-007',
    patientName: '孙丽萍',
    designType: '贴面',
    status: 'shipped',
    assignedCs: 'staff-2',
    assignedDesigner: 'staff-4',
    assignedQc: 'staff-6',
    createdAt: hoursAgo(120),
    updatedAt: hoursAgo(24),
  },
  {
    id: 'WO-20260601-008',
    patientName: '周伟强',
    designType: '活动义齿',
    status: 'delivered',
    assignedCs: 'staff-1',
    assignedDesigner: 'staff-3',
    assignedQc: 'staff-5',
    createdAt: hoursAgo(168),
    updatedAt: hoursAgo(48),
  },
  {
    id: 'WO-20260601-009',
    patientName: '吴晓燕',
    designType: '种植冠',
    status: 'pending_qc',
    assignedCs: 'staff-2',
    assignedDesigner: 'staff-4',
    assignedQc: 'staff-6',
    createdAt: hoursAgo(30),
    updatedAt: hoursAgo(3),
    stuckAt: 'pending_qc',
    stuckDuration: 180,
  },
  {
    id: 'WO-20260601-010',
    patientName: '郑浩然',
    designType: '全瓷冠',
    status: 'qc_in_progress',
    assignedCs: 'staff-1',
    assignedDesigner: 'staff-3',
    assignedQc: 'staff-5',
    createdAt: hoursAgo(18),
    updatedAt: hoursAgo(0.5),
  },
  {
    id: 'WO-20260601-011',
    patientName: '黄雅芳',
    designType: '贴面',
    status: 'pending_design',
    assignedCs: 'staff-2',
    assignedDesigner: 'staff-4',
    assignedQc: 'staff-6',
    createdAt: hoursAgo(6),
    updatedAt: hoursAgo(6),
    stuckAt: 'pending_design',
    stuckDuration: 360,
  },
  {
    id: 'WO-20260601-012',
    patientName: '林大鹏',
    designType: '嵌体',
    status: 'passed',
    assignedCs: 'staff-1',
    assignedDesigner: 'staff-3',
    assignedQc: 'staff-5',
    createdAt: hoursAgo(84),
    updatedAt: hoursAgo(16),
  },
]

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>([...mockOrders])

  const todayPendingQc = computed(() =>
    orders.value.filter((o) => o.status === 'pending_qc' || o.status === 'qc_in_progress')
  )

  const todayPendingShipping = computed(() =>
    orders.value.filter((o) => o.status === 'pending_shipping')
  )

  const todayDesigning = computed(() =>
    orders.value.filter((o) => o.status === 'pending_design' || o.status === 'designing')
  )

  const todayRejected = computed(() =>
    orders.value.filter((o) => o.status === 'rejected')
  )

  const stuckOrders = computed(() =>
    orders.value.filter((o) => o.stuckAt && o.stuckDuration && o.stuckDuration > 60)
  )

  function passOrder(orderId: string) {
    const order = orders.value.find((o) => o.id === orderId)
    if (order) {
      order.status = 'pending_shipping' as OrderStatus
      order.updatedAt = fmt(new Date())
      order.stuckAt = undefined
      order.stuckDuration = undefined
    }
  }

  function rejectOrder(orderId: string, reason: string) {
    const order = orders.value.find((o) => o.id === orderId)
    if (order) {
      order.status = 'rejected' as OrderStatus
      order.rejectionReason = reason
      order.updatedAt = fmt(new Date())
    }
  }

  function startQc(orderId: string) {
    const order = orders.value.find((o) => o.id === orderId)
    if (order && order.status === 'pending_qc') {
      order.status = 'qc_in_progress' as OrderStatus
      order.updatedAt = fmt(new Date())
    }
  }

  function reassignToDesigner(orderId: string) {
    const order = orders.value.find((o) => o.id === orderId)
    if (order && order.status === 'rejected') {
      order.status = 'designing' as OrderStatus
      order.rejectionReason = undefined
      order.updatedAt = fmt(new Date())
    }
  }

  function shipOrder(orderId: string) {
    const order = orders.value.find((o) => o.id === orderId)
    if (order && (order.status === 'pending_shipping' || order.status === 'passed')) {
      order.status = 'shipped' as OrderStatus
      order.updatedAt = fmt(new Date())
      order.stuckAt = undefined
      order.stuckDuration = undefined
    }
  }

  function deliverOrder(orderId: string) {
    const order = orders.value.find((o) => o.id === orderId)
    if (order && order.status === 'shipped') {
      order.status = 'delivered' as OrderStatus
      order.updatedAt = fmt(new Date())
    }
  }

  return {
    orders,
    todayPendingQc,
    todayPendingShipping,
    todayDesigning,
    todayRejected,
    stuckOrders,
    passOrder,
    rejectOrder,
    startQc,
    reassignToDesigner,
    shipOrder,
    deliverOrder,
  }
})
