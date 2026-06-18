import { mockRefundRequests, mockRescheduleRequests, mockComplaints } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const type = getQuery(event).type as 'refund' | 'reschedule' | 'complaint'

  let item: any = null

  if (type === 'refund') {
    item = mockRefundRequests.find(r => r.id === id)
  } else if (type === 'reschedule') {
    item = mockRescheduleRequests.find(r => r.id === id)
  } else if (type === 'complaint') {
    item = mockComplaints.find(c => c.id === id)
  }

  if (!item) {
    throw createError({
      statusCode: 404,
      message: '任务不存在'
    })
  }

  const relatedTicketRules = [
    {
      ticketType: item.type || 'adult',
      refundPolicy: '游玩日前1天可全额退款,当天不可退款',
      reschedulePolicy: '游玩日前可免费改期1次',
      validDays: 1
    }
  ]

  const relatedTickets = [
    {
      id: item.ticketId || 't1',
      ticketNo: item.ticketNo || 'TK20240618001',
      type: 'adult',
      price: item.refundAmount || 150,
      purchaseTime: '2024-06-15 10:30:00',
      validFrom: '2024-06-20 08:00:00',
      validUntil: '2024-06-20 18:00:00',
      status: 'valid'
    }
  ]

  return {
    code: 200,
    message: 'success',
    data: {
      task: item,
      ticketRules: relatedTicketRules,
      tickets: relatedTickets
    }
  }
})
