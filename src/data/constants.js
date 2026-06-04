export const ORDER_STATUS = {
  PENDING_TREATMENT: {
    value: 'PENDING_TREATMENT',
    label: '待核销',
    className: 'status-pending',
    description: '客户已付费，待执行疗程'
  },
  REFUND_NEGOTIATING: {
    value: 'REFUND_NEGOTIATING',
    label: '退款协商中',
    className: 'status-refund',
    description: '客户提出退款申请，正在协商'
  },
  REFUND_SUPPLEMENT: {
    value: 'REFUND_SUPPLEMENT',
    label: '待补录材料',
    className: 'status-supplement',
    description: '退款申请材料不全，需补充后重审'
  },
  REFUND_REJECTED: {
    value: 'REFUND_REJECTED',
    label: '退款驳回',
    className: 'status-rejected',
    description: '退款申请已驳回，转回疗程处理'
  },
  REFUND_APPROVED: {
    value: 'REFUND_APPROVED',
    label: '退款同意',
    className: 'status-processing',
    description: '退款协商通过，待财务处理'
  },
  TREATMENT_WRITEOFF: {
    value: 'TREATMENT_WRITEOFF',
    label: '疗程核销中',
    className: 'status-writeoff',
    description: '已转回疗程，待执行核销'
  },
  COMPLETED: {
    value: 'COMPLETED',
    label: '已归档',
    className: 'status-completed',
    description: '流程全部完成，已归档'
  }
}

export const ROLES = {
  CONSULTANT: { value: 'CONSULTANT', label: '咨询师', description: '前端销售，掌握客户沟通记录' },
  DOCTOR_ASSISTANT: { value: 'DOCTOR_ASSISTANT', label: '医生助理', description: '医疗端，掌握治疗记录与术后回访' },
  CUSTOMER_SERVICE: { value: 'CUSTOMER_SERVICE', label: '客服', description: '客诉处理，掌握投诉记录' }
}

export const ACTION_TYPES = {
  CREATE_ORDER: '创建订单',
  SUBMIT_REFUND: '提交退款申请',
  NEGOTIATE_REFUND: '协商退款方案',
  REQUEST_SUPPLEMENT: '要求补录材料',
  SUBMIT_SUPPLEMENT: '提交补充材料',
  APPROVE_REFUND: '同意退款',
  REJECT_REFUND: '驳回退款',
  TRANSFER_TO_TREATMENT: '转回疗程核销',
  WRITE_OFF_TREATMENT: '核销疗程',
  ARCHIVE: '归档',
  ADD_NOTE: '补充说明'
}

export const FLOW_TYPES = {
  SMOOTH: 'smooth',
  PROBLEM: 'problem',
  ARCHIVED: 'archived'
}
