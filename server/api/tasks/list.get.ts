import {
  mockRefundRequests,
  mockRescheduleRequests,
  mockComplaints,
  mockDashboardStats,
  generateId,
  generateRefundNo,
  generateComplaintNo
} from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { type, status, handler } = query

  let results: any[] = []

  if (type === 'refund') {
    results = mockRefundRequests
  } else if (type === 'reschedule') {
    results = mockRescheduleRequests
  } else if (type === 'complaint') {
    results = mockComplaints
  } else {
    results = [
      ...mockRefundRequests,
      ...mockRescheduleRequests,
      ...mockComplaints
    ]
  }

  if (status) {
    results = results.filter(item => item.status === status)
  }

  if (handler) {
    results = results.filter(item => item.currentHandler === handler)
  }

  return {
    code: 200,
    message: 'success',
    data: results
  }
})
