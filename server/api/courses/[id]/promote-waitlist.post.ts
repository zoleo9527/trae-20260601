import { courses, registrations, waitlist } from '../../../../server/data/mockData'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  const course = courses.find(c => c.id === id)
  if (!course) {
    throw createError({ statusCode: 404, message: '课程不存在' })
  }
  
  const waitlistEntry = waitlist.find(w => w.id === body.waitlistId)
  if (!waitlistEntry) {
    throw createError({ statusCode: 404, message: '候补记录不存在' })
  }
  
  const courseRegistrations = registrations.filter(r => r.courseId === id && r.status === 'confirmed')
  
  if (courseRegistrations.length >= course.maxParticipants) {
    throw createError({ statusCode: 400, message: '课程名额已满，无法升级' })
  }
  
  const newRegistration = {
    id: `r${Date.now()}`,
    courseId: id!,
    participantName: waitlistEntry.participantName,
    phone: waitlistEntry.phone,
    email: waitlistEntry.email,
    status: 'confirmed' as const,
    createdAt: waitlistEntry.createdAt,
    updatedAt: new Date().toISOString()
  }
  
  registrations.push(newRegistration)
  
  const waitlistIndex = waitlist.findIndex(w => w.id === body.waitlistId)
  if (waitlistIndex !== -1) {
    waitlist[waitlistIndex].status = 'promoted'
    waitlist[waitlistIndex].promotedAt = new Date().toISOString()
    waitlist[waitlistIndex].updatedAt = new Date().toISOString()
  }
  
  waitlist
    .filter(w => w.courseId === id && w.status === 'active' && w.position > waitlistEntry.position)
    .forEach(w => {
      w.position--
      w.updatedAt = new Date().toISOString()
    })
  
  const courseIndex = courses.findIndex(c => c.id === id)
  if (courseIndex !== -1) {
    courses[courseIndex].currentParticipants++
  }
  
  return {
    success: true,
    message: `已将 ${waitlistEntry.participantName} 从候补升级为正式报名`,
    registration: newRegistration,
    waitlistEntry: waitlist[waitlistIndex]
  }
})
