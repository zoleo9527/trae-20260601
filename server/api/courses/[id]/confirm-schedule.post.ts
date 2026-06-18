import { courses, schedules, users } from '../../../../server/data/mockData'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  const course = courses.find(c => c.id === id)
  if (!course) {
    throw createError({ statusCode: 404, message: '课程不存在' })
  }
  
  const actor = users.find(u => u.id === body.actorId)
  if (!actor) {
    throw createError({ statusCode: 403, message: '无效的操作人' })
  }
  
  const scheduleIndex = schedules.findIndex(s => s.courseId === id)
  if (scheduleIndex === -1) {
    throw createError({ statusCode: 404, message: '排班记录不存在' })
  }
  
  const schedule = schedules[scheduleIndex]
  
  if (schedule.status === 'confirmed') {
    throw createError({ statusCode: 400, message: '排班已确认' })
  }
  
  if (schedule.status === 'completed') {
    throw createError({ statusCode: 400, message: '课程已完成' })
  }
  
  if (actor.role === 'teacher' && schedule.teacherId !== actor.id) {
    throw createError({ statusCode: 403, message: '讲师只能确认自己的排班' })
  }
  
  if (actor.role === 'volunteer') {
    throw createError({ statusCode: 403, message: '志愿者无法确认排班' })
  }
  
  schedules[scheduleIndex].status = 'confirmed'
  schedules[scheduleIndex].confirmedAt = new Date().toISOString()
  schedules[scheduleIndex].confirmedBy = body.actorId
  
  const courseIndex = courses.findIndex(c => c.id === id)
  if (courseIndex !== -1) {
    courses[courseIndex].updatedAt = new Date().toISOString()
    
    const newTimelineItem = {
      id: `t${Date.now()}`,
      action: 'schedule_confirm',
      actorId: body.actorId,
      actorName: actor.name,
      timestamp: new Date().toISOString(),
      description: actor.role === 'teacher' ? '确认授课安排' : '确认讲师排班',
      result: '已确认'
    }
    courses[courseIndex].timeline.push(newTimelineItem)
  }
  
  return {
    success: true,
    message: `${actor.role === 'teacher' ? '您已确认' : '已确认'}授课安排`,
    schedule: schedules[scheduleIndex],
    confirmedBy: actor.name,
    confirmedAt: new Date().toISOString()
  }
})
