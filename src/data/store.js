import { reactive } from 'vue'
import { mockOrders } from './mockData.js'
import { ORDER_STATUS, ACTION_TYPES, ROLES } from './constants.js'
import dayjs from 'dayjs'

export const store = reactive({
  orders: [...mockOrders],
  currentRole: 'CONSULTANT',
  selectedOrderId: null,
  statusFilter: 'ALL',
  flowFilter: 'ALL',
  selectedIds: [],
  get selectedOrder() {
    return this.orders.find(o => o.id === this.selectedOrderId)
  },
  get filteredOrders() {
    let result = [...this.orders]
    if (this.statusFilter !== 'ALL') {
      result = result.filter(o => o.currentStatus === this.statusFilter)
    }
    if (this.flowFilter !== 'ALL') {
      result = result.filter(o => o.flowType === this.flowFilter)
    }
    return result.sort((a, b) => 
      dayjs(b.history[b.history.length - 1].timestampRaw).valueOf() - 
      dayjs(a.history[a.history.length - 1].timestampRaw).valueOf()
    )
  },
  get rolePermissions() {
    return {
      CONSULTANT: {
        canSeeConsultation: true,
        canSeeQuotation: true,
        canSeePostop: true,
        canEditRefund: true,
        canNegotiate: true,
        canTransfer: true,
        canWriteoff: false,
        canSupplement: true
      },
      DOCTOR_ASSISTANT: {
        canSeeConsultation: false,
        canSeeQuotation: false,
        canSeePostop: true,
        canEditRefund: false,
        canNegotiate: false,
        canTransfer: true,
        canWriteoff: true,
        canSupplement: false
      },
      CUSTOMER_SERVICE: {
        canSeeConsultation: true,
        canSeeQuotation: true,
        canSeePostop: true,
        canEditRefund: true,
        canNegotiate: true,
        canTransfer: true,
        canWriteoff: false,
        canSupplement: true
      }
    }[this.currentRole]
  }
})

export const actions = {
  setRole(role) {
    store.currentRole = role
  },
  selectOrder(orderId) {
    store.selectedOrderId = orderId
  },
  setStatusFilter(status) {
    store.statusFilter = status
  },
  setFlowFilter(flow) {
    store.flowFilter = flow
  },
  toggleSelect(orderId) {
    const idx = store.selectedIds.indexOf(orderId)
    if (idx > -1) {
      store.selectedIds.splice(idx, 1)
    } else {
      store.selectedIds.push(orderId)
    }
  },
  clearSelection() {
    store.selectedIds = []
  },
  addHistory(orderId, actionData) {
    const order = store.orders.find(o => o.id === orderId)
    if (!order) return
    const newHistory = {
      id: `h-${order.history.length + 1}`,
      ...actionData,
      timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      timestampRaw: dayjs().toISOString()
    }
    order.history.push(newHistory)
  },
  updateStatus(orderId, newStatus, transferNote, newResponsible) {
    const order = store.orders.find(o => o.id === orderId)
    if (!order) return
    const oldStatus = order.currentStatus
    order.currentStatus = newStatus
    if (newResponsible) {
      order.currentResponsible = {
        ...newResponsible,
        transferFrom: order.currentResponsible ? {
          role: order.currentResponsible.role,
          name: order.currentResponsible.name,
          reason: transferNote || '流程推进'
        } : null
      }
    }
    this.addHistory(orderId, {
      action: `状态变更：${ORDER_STATUS[oldStatus]?.label || oldStatus} → ${ORDER_STATUS[newStatus]?.label || newStatus}`,
      operator: { CONSULTANT: '王咨询师', DOCTOR_ASSISTANT: '赵助理', CUSTOMER_SERVICE: '李客服' }[store.currentRole],
      operatorRole: store.currentRole,
      content: transferNote || '状态更新',
      responsible: newResponsible || order.currentResponsible
    })
  },
  processRefund(orderId, result, note, agreement) {
    const order = store.orders.find(o => o.id === orderId)
    if (!order) return
    if (agreement) {
      order.refundNegotiation.finalAgreement = agreement
    }
    if (result === 'APPROVE') {
      this.updateStatus(
        orderId, 
        ORDER_STATUS.REFUND_APPROVED.value,
        note || '退款申请已通过',
        { role: 'CUSTOMER_SERVICE', name: '李客服' }
      )
    } else if (result === 'REJECT') {
      this.updateStatus(
        orderId,
        ORDER_STATUS.TREATMENT_WRITEOFF.value,
        `${note || '退款申请已驳回'}，客户同意继续治疗，转回疗程核销`,
        { role: 'DOCTOR_ASSISTANT', name: '赵助理' }
      )
    }
  },
  requestSupplement(orderId, requirement) {
    const order = store.orders.find(o => o.id === orderId)
    if (!order) return
    this.updateStatus(
      orderId,
      ORDER_STATUS.REFUND_SUPPLEMENT.value,
      requirement,
      { role: 'CONSULTANT', name: '王咨询师' }
    )
  },
  submitSupplement(orderId, content) {
    const order = store.orders.find(o => o.id === orderId)
    if (!order) return
    this.addHistory(orderId, {
      action: ACTION_TYPES.SUBMIT_SUPPLEMENT,
      operator: '客户（代录）',
      operatorRole: 'CUSTOMER',
      content: content,
      responsible: order.currentResponsible
    })
    this.updateStatus(
      orderId,
      ORDER_STATUS.REFUND_NEGOTIATING.value,
      '材料已补录，重新进入退款审核',
      { role: 'CUSTOMER_SERVICE', name: '李客服' }
    )
  },
  writeoffTreatment(orderId, note) {
    const order = store.orders.find(o => o.id === orderId)
    if (!order) return
    order.treatedCount = Math.min(order.treatedCount + 1, order.treatmentCount)
    this.addHistory(orderId, {
      action: ACTION_TYPES.WRITE_OFF_TREATMENT,
      operator: { DOCTOR_ASSISTANT: '赵助理', CONSULTANT: '王咨询师', CUSTOMER_SERVICE: '李客服' }[store.currentRole],
      operatorRole: store.currentRole,
      content: `核销第 ${order.treatedCount}/${order.treatmentCount} 次疗程。${note || ''}`,
      responsible: order.currentResponsible
    })
    if (order.treatedCount >= order.treatmentCount) {
      this.updateStatus(
        orderId,
        ORDER_STATUS.COMPLETED.value,
        '所有疗程已核销完成，自动归档',
        null
      )
      order.currentResponsible = null
    }
  },
  addNote(orderId, note) {
    const order = store.orders.find(o => o.id === orderId)
    if (!order) return
    this.addHistory(orderId, {
      action: ACTION_TYPES.ADD_NOTE,
      operator: { CONSULTANT: '王咨询师', DOCTOR_ASSISTANT: '赵助理', CUSTOMER_SERVICE: '李客服' }[store.currentRole],
      operatorRole: store.currentRole,
      content: note,
      responsible: order.currentResponsible
    })
  },
  batchWriteoff(orderIds) {
    orderIds.forEach(id => {
      const order = store.orders.find(o => o.id === id)
      if (order && order.currentStatus === ORDER_STATUS.TREATMENT_WRITEOFF.value) {
        this.writeoffTreatment(id, '批量核销')
      }
    })
  },
  batchTransfer(orderIds, targetRole, note) {
    const roleName = { CONSULTANT: '王咨询师', DOCTOR_ASSISTANT: '赵助理', CUSTOMER_SERVICE: '李客服' }
    orderIds.forEach(id => {
      this.updateStatus(id, store.orders.find(o => o.id === id).currentStatus, note, {
        role: targetRole,
        name: roleName[targetRole]
      })
    })
  }
}
