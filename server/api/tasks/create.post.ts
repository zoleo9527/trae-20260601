import { mockRefundRequests, mockRescheduleRequests, mockComplaints } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { type, ticketId, ticketNo, touristName, touristPhone, reason, newDate, title } = body

  let newItem: any = null

  if (type === 'refund') {
    const refundItem = {
      id: `r${Date.now()}`,
      ticketId,
      ticketNo,
      touristName,
      touristPhone,
      refundReason: reason,
      refundAmount: 150,
      status: 'pending',
      currentHandler: 'customer_service' as const,
      currentHandlerName: '王芳',
      handlerDepartment: '客服部',
      stuckPoint: null,
      stuckReason: null,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      processingLogs: []
    }
    mockRefundRequests.push(refundItem)
    newItem = refundItem
  } else if (type === 'reschedule') {
    const rescheduleItem = {
      id: `rs${Date.now()}`,
      ticketId,
      ticketNo,
      touristName,
      touristPhone,
      originalDate: '2024-06-20',
      newDate,
      rescheduleReason: reason,
      status: 'pending',
      currentHandler: 'customer_service' as const,
      currentHandlerName: '王芳',
      handlerDepartment: '客服部',
      stuckPoint: null,
      stuckReason: null,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      processingLogs: []
    }
    mockRescheduleRequests.push(rescheduleItem)
    newItem = rescheduleItem
  } else if (type === 'complaint') {
    const complaintItem = {
      id: `c${Date.now()}`,
      complaintNo: generateComplaintNo(),
      title: title || reason,
      description: reason,
      source: 'onsite' as const,
      level: 'medium' as const,
      status: 'submitted',
      relatedTicketId: ticketId,
      relatedTicketNo: ticketNo,
      touristName,
      touristPhone,
      assignedTo: null,
      assignedToName: null,
      currentHandler: 'customer_service' as const,
      currentHandlerName: '王芳',
      handlerDepartment: '客服部',
      stuckPoint: null,
      stuckReason: null,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      processingLogs: []
    }
    mockComplaints.push(complaintItem)
    newItem = complaintItem
  }

  if (!newItem) {
    throw createError({
      statusCode: 400,
      message: '无效的任务类型'
    })
  }

  return {
    code: 200,
    message: '任务创建成功',
    data: newItem
  }
})

function generateComplaintNo() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `CT${date}${random}`
}
