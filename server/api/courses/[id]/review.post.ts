import { courses, users } from '../../../../server/data/mockData'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  const course = courses.find(c => c.id === id)
  if (!course) {
    throw createError({ statusCode: 404, message: '课程不存在' })
  }
  
  if (course.status !== 'submitted') {
    throw createError({ statusCode: 400, message: '课程状态不允许审核' })
  }
  
  const reviewer = users.find(u => u.id === body.reviewerId)
  if (!reviewer || reviewer.role !== 'manager') {
    throw createError({ statusCode: 403, message: '只有主管可以审核课程' })
  }
  
  const courseIndex = courses.findIndex(c => c.id === id)
  if (courseIndex === -1) {
    throw createError({ statusCode: 404, message: '课程不存在' })
  }
  
  const newStatus = body.approved ? 'approved' : 'rejected'
  
  const newTimelineItem = {
    id: `t${Date.now()}`,
    action: 'review',
    actorId: body.reviewerId,
    actorName: reviewer.name,
    timestamp: new Date().toISOString(),
    description: body.approved ? '审核通过' : '审核未通过'
  }
  
  courses[courseIndex].status = newStatus
  courses[courseIndex].updatedAt = new Date().toISOString()
  courses[courseIndex].timeline.push(newTimelineItem)
  
  if (!body.approved) {
    const newIssue = {
      id: `i${Date.now()}`,
      type: 'review_failed' as const,
      title: '课程审核未通过',
      description: body.reason || '未提供审核意见',
      status: 'open' as const,
      createdAt: new Date().toISOString()
    }
    courses[courseIndex].issues.push(newIssue)
  }
  
  return {
    success: true,
    message: body.approved ? '课程已通过审核' : '课程审核未通过',
    course: courses[courseIndex]
  }
})
