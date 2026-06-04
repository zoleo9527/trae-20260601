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
        canSupplement: true,
        canCompleteRefund: false
      },
      DOCTOR_ASSISTANT: {
        canSeeConsultation: false,
        canSeeQuotation: false,
        canSeePostop: true,
        canEditRefund: false,
        canNegotiate: false,
        canTransfer: true,
        canWriteoff: true,
        canSupplement: false,
        canCompleteRefund: false
      },
      CUSTOMER_SERVICE: {
        canSeeConsultation: true,
        canSeeQuotation: true,
        canSeePostop: true,
        canEditRefund: true,
        canNegotiate: true,
        canTransfer: true,
        canWriteoff: false,
        canSupplement: true,
        canCompleteRefund: true
      }
    }[this.currentRole]
  }
})

function getOperatorName(order, role) {
  if (role === 'CONSULTANT') return order.consultant
  if (role === 'DOCTOR_ASSISTANT') return order.doctorAssistant
  if (role === 'CUSTOMER_SERVICE') return order.customerService || '客服'
  return '系统'
}

function makeResponsible(order, role) {
  const name = getOperatorName(order, role)
  return { role, name }
}

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
    } else if (newStatus === ORDER_STATUS.COMPLETED.value) {
      order.currentResponsible = null
    }
    this.addHistory(orderId, {
      action: `状态变更：${ORDER_STATUS[oldStatus]?.label || oldStatus} → ${ORDER_STATUS[newStatus]?.label || newStatus}`,
      operator: getOperatorName(order, store.currentRole),
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
      this.addHistory(orderId, {
        action: ACTION_TYPES.APPROVE_REFUND,
        operator: getOperatorName(order, store.currentRole),
        operatorRole: store.currentRole,
        content: `${agreement || note || '退款申请已通过'}`,
        responsible: makeResponsible(order, 'CUSTOMER_SERVICE'),
        transferNote: '协商完成，移交客服跟进财务退款流程'
      })
      this.updateStatus(
        orderId,
        ORDER_STATUS.REFUND_APPROVED.value,
        note || '退款申请已通过',
        makeResponsible(order, 'CUSTOMER_SERVICE')
      )
    } else if (result === 'REJECT') {
      const fullNote = `${note || '退款申请已驳回'}，客户同意继续治疗，转回疗程核销`
      this.addHistory(orderId, {
        action: ACTION_TYPES.REJECT_REFUND,
        operator: getOperatorName(order, store.currentRole),
        operatorRole: store.currentRole,
        content: fullNote,
        responsible: makeResponsible(order, 'DOCTOR_ASSISTANT'),
        transferNote: '退款驳回，转回医疗端跟进剩余疗程核销'
      })
      this.updateStatus(
        orderId,
        ORDER_STATUS.TREATMENT_WRITEOFF.value,
        fullNote,
        makeResponsible(order, 'DOCTOR_ASSISTANT')
      )
    }
  },
  completeRefund(orderId, note) {
    const order = store.orders.find(o => o.id === orderId)
    if (!order) return
    this.addHistory(orderId, {
      action: ACTION_TYPES.COMPLETE_REFUND,
      operator: getOperatorName(order, store.currentRole),
      operatorRole: store.currentRole,
      content: `退款已到账。${note || ''}`,
      responsible: order.currentResponsible
    })
    this.updateStatus(
      orderId,
      ORDER_STATUS.COMPLETED.value,
      '退款已到账确认，订单归档',
      null
    )
    order.currentResponsible = null
  },
  requestSupplement(orderId, requirement) {
    const order = store.orders.find(o => o.id === orderId)
    if (!order) return
    this.addHistory(orderId, {
      action: ACTION_TYPES.REQUEST_SUPPLEMENT,
      operator: getOperatorName(order, store.currentRole),
      operatorRole: store.currentRole,
      content: requirement,
      responsible: makeResponsible(order, 'CONSULTANT'),
      transferNote: '请联系客户补充材料，材料齐全后再进入审核'
    })
    this.updateStatus(
      orderId,
      ORDER_STATUS.REFUND_SUPPLEMENT.value,
      requirement,
      makeResponsible(order, 'CONSULTANT')
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
      makeResponsible(order, 'CUSTOMER_SERVICE')
    )
  },
  writeoffTreatment(orderId, note) {
    const order = store.orders.find(o => o.id === orderId)
    if (!order) return
    order.treatedCount = Math.min(order.treatedCount + 1, order.treatmentCount)
    this.addHistory(orderId, {
      action: ACTION_TYPES.WRITE_OFF_TREATMENT,
      operator: getOperatorName(order, store.currentRole),
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
      operator: getOperatorName(order, store.currentRole),
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
    orderIds.forEach(id => {
      const order = store.orders.find(o => o.id === id)
      if (!order) return
      this.updateStatus(id, order.currentStatus, note, makeResponsible(order, targetRole))
    })
  }
}
