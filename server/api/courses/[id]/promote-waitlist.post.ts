import { courses, registrations, waitlist, users, waitlistHistory } from '../../../../server/data/mockData'

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
  
  const actor = users.find(u => u.id === body.actorId)
  if (!actor || actor.role !== 'manager') {
    throw createError({ statusCode: 403, message: '只有活动主管可以进行候补升级' })
  }
  
  const courseRegistrations = registrations.filter(r => r.courseId === id && r.status === 'confirmed')
  
  if (courseRegistrations.length >= course.maxParticipants) {
    const historyEntry = {
      id: `h${Date.now()}`,
      waitlistEntryId: waitlistEntry.id,
      courseId: id!,
      action: 'promote' as const,
      actorId: body.actorId,
      actorName: actor.name,
      timestamp: new Date().toISOString(),
      result: '升级失败，名额已满',
      participantName: waitlistEntry.participantName,
      originalPosition: waitlistEntry.position,
      previousStatus: 'active',
      newStatus: 'active'
    }
    waitlistHistory.push(historyEntry)
    
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
    updatedAt: new Date().toISOString(),
    promotedFromWaitlist: true,
    promotedBy: body.actorId,
    promotedAt: new Date().toISOString()
  }
  
  registrations.push(newRegistration)
  
  const waitlistIndex = waitlist.findIndex(w => w.id === body.waitlistId)
  if (waitlistIndex !== -1) {
    const originalPosition = waitlist[waitlistIndex].position
    waitlist[waitlistIndex].status = 'promoted'
    waitlist[waitlistIndex].promotedAt = new Date().toISOString()
    waitlist[waitlistIndex].promotedBy = body.actorId
    waitlist[waitlistIndex].handledBy = body.actorId
    waitlist[waitlistIndex].handledAt = new Date().toISOString()
    waitlist[waitlistIndex].handledResult = 'promoted'
    waitlist[waitlistIndex].updatedAt = new Date().toISOString()
    
    const historyEntry = {
      id: `h${Date.now()}`,
      waitlistEntryId: waitlistEntry.id,
      courseId: id!,
      action: 'promote' as const,
      actorId: body.actorId,
      actorName: actor.name,
      timestamp: new Date().toISOString(),
      result: '成功升级为正式报名',
      notes: body.notes,
      participantName: waitlistEntry.participantName,
      originalPosition,
      previousStatus: 'active',
      newStatus: 'promoted'
    }
    waitlistHistory.push(historyEntry)
  }
  
  waitlist
    .filter(w => w.courseId === id && w.status === 'active' && w.position > waitlistEntry.position)
    .forEach(w => {
      w.position--
      w.updatedAt = new Date().toISOString()
    })
  
  const courseIndex = courses.findIndex(c => c.id === id)
  if (courseIndex !== -1) {
    courses[courseIndex].updatedAt = new Date().toISOString()
    
    const newTimelineItem = {
      id: `t${Date.now()}`,
      action: 'waitlist_promote',
      actorId: body.actorId,
      actorName: actor.name,
      timestamp: new Date().toISOString(),
      description: `将候补学员 ${waitlistEntry.participantName} 升级为正式报名`,
      result: '成功'
    }
    courses[courseIndex].timeline.push(newTimelineItem)
  }
  
  return {
    success: true,
    message: `已将 ${waitlistEntry.participantName} 从候补升级为正式报名`,
    registration: newRegistration,
    waitlistEntry: waitlist[waitlistIndex],
    historyEntry: waitlistHistory[waitlistHistory.length - 1]
  }
})
