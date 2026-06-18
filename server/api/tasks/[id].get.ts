import {
  mockRefundRequests,
  mockRescheduleRequests,
  mockComplaints,
  mockExceptionRecords,
  getTaskTrackerInfo
} from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const type = getQuery(event).type as 'refund' | 'reschedule' | 'complaint'

  let item: any = null
  let trackerInfo: any = null

  if (type === 'refund') {
    item = mockRefundRequests.find(r => r.id === id)
    if (item) {
      trackerInfo = getTaskTrackerInfo('refund', item)
    }
  } else if (type === 'reschedule') {
    item = mockRescheduleRequests.find(r => r.id === id)
    if (item) {
      trackerInfo = getTaskTrackerInfo('reschedule', item)
    }
  } else if (type === 'complaint') {
    item = mockComplaints.find(c => c.id === id)
    if (item) {
      trackerInfo = getTaskTrackerInfo('complaint', item)
    }
  }

  if (!item) {
    throw createError({
      statusCode: 404,
      message: '任务不存在'
    })
  }

  const relatedException = mockExceptionRecords.find(
    e => e.relatedId === id || e.relatedNo === item.ticketNo || e.relatedNo === item.complaintNo
  )

  return {
    code: 200,
    message: 'success',
    data: {
      task: item,
      tracker: trackerInfo,
      relatedException
    }
  }
})
