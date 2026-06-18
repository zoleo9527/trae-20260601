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
  const { type, status, handler, stuck, urgent } = query

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

  if (stuck === 'true') {
    results = results.filter(item => item.stuckPoint)
  }

  if (urgent === 'true') {
    results = results.filter(item => item.level === 'urgent')
  }

  return {
    code: 200,
    message: 'success',
    data: results
  }
})
