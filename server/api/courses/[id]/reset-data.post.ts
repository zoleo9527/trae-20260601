import { courses, registrations, waitlist } from '../../../../server/data/mockData'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  const courseIndex = courses.findIndex(c => c.id === id)
  if (courseIndex === -1) {
    throw createError({ statusCode: 404, message: '课程不存在' })
  }
  
  const course = courses[courseIndex]
  
  registrations
    .filter(r => r.courseId === id)
    .forEach(r => {
      const idx = registrations.findIndex(reg => reg.id === r.id)
      if (idx !== -1) {
        registrations[idx].status = 'cancelled'
        registrations[idx].updatedAt = new Date().toISOString()
      }
    })
  
  waitlist
    .filter(w => w.courseId === id)
    .forEach(w => {
      const idx = waitlist.findIndex(entry => entry.id === w.id)
      if (idx !== -1) {
        waitlist[idx].status = 'cancelled'
        waitlist[idx].updatedAt = new Date().toISOString()
      }
    })
  
  courses[courseIndex].currentParticipants = 0
  courses[courseIndex].updatedAt = new Date().toISOString()
  
  const newTimelineItem = {
    id: `t${Date.now()}`,
    action: 'reset',
    actorId: 'system',
    actorName: '系统管理员',
    timestamp: new Date().toISOString(),
    description: '重置报名数据'
  }
  
  courses[courseIndex].timeline.push(newTimelineItem)
  
  return {
    success: true,
    message: `已重置课程「${course.title}」的所有报名数据`,
    course: courses[courseIndex]
  }
})
