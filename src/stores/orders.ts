import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Order, Remark, OrderStatus, FeeAdjustment } from '@/types'
import { orders as mockOrders } from '@/mock/orders'
import { timeline as mockTimeline } from '@/mock/timeline'

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>(JSON.parse(JSON.stringify(mockOrders)))
  const selectedOrderId = ref<string | null>(null)
  const detailOpen = ref(false)

  const selectedOrder = computed(() =>
    orders.value.find((o) => o.id === selectedOrderId.value) ?? null
  )

  const stuckOrders = computed(() => orders.value.filter((o) => o.isStuck))

  function getOrdersByRole(role: string) {
    return orders.value.filter((o) => o.assignedRole === role)
  }

  function getStuckByRole(role: string) {
    return orders.value.filter((o) => o.isStuck && o.assignedRole === role)
  }

  function getOrdersByStatus(status: OrderStatus) {
    return orders.value.filter((o) => o.status === status)
  }

  function getTimeline(orderId: string) {
    return mockTimeline.filter((t) => t.orderId === orderId)
  }

  function selectOrder(orderId: string) {
    selectedOrderId.value = orderId
    detailOpen.value = true
  }

  function closeDetail() {
    detailOpen.value = false
    selectedOrderId.value = null
  }

  function addRemark(orderId: string, remark: Remark) {
    const order = orders.value.find((o) => o.id === orderId)
    if (order) {
      order.remarks.push(remark)
      order.updatedAt = new Date().toLocaleString('zh-CN')
    }
  }

  function updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = orders.value.find((o) => o.id === orderId)
    if (order) {
      order.status = status
      order.updatedAt = new Date().toLocaleString('zh-CN')
    }
  }

  function createFeeAdjustment(orderId: string, data: Omit<FeeAdjustment, 'id' | 'orderId' | 'createdAt'>) {
    const order = orders.value.find((o) => o.id === orderId)
    if (order) {
      order.feeAdjustment = {
        id: 'f' + Date.now(),
        orderId,
        createdAt: new Date().toLocaleString('zh-CN'),
        ...data,
      }
      order.status = 'fee_adjusting'
      order.updatedAt = new Date().toLocaleString('zh-CN')
    }
  }

  function approveFeeAdjustment(orderId: string) {
    const order = orders.value.find((o) => o.id === orderId)
    if (order?.feeAdjustment) {
      order.feeAdjustment.status = 'approved'
      order.feeAdjustment.approvedBy = '当前用户'
      order.status = 'completed'
      order.updatedAt = new Date().toLocaleString('zh-CN')
    }
  }

  function rejectFeeAdjustment(orderId: string) {
    const order = orders.value.find((o) => o.id === orderId)
    if (order?.feeAdjustment) {
      order.feeAdjustment.status = 'rejected'
      order.updatedAt = new Date().toLocaleString('zh-CN')
    }
  }

  return {
    orders,
    selectedOrderId,
    selectedOrder,
    detailOpen,
    stuckOrders,
    getOrdersByRole,
    getStuckByRole,
    getOrdersByStatus,
    getTimeline,
    selectOrder,
    closeDetail,
    addRemark,
    updateOrderStatus,
    createFeeAdjustment,
    approveFeeAdjustment,
    rejectFeeAdjustment,
  }
})
