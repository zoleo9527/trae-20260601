import { courses, registrations, waitlist } from '../../../../server/data/mockData'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  const course = courses.find(c => c.id === id)
  if (!course) {
    throw createError({ statusCode: 404, message: '课程不存在' })
  }
  
  if (course.status !== 'approved') {
    throw createError({ statusCode: 400, message: '课程尚未开放报名' })
  }
  
  const existingRegistration = registrations.find(
    r => r.courseId === id && r.phone === body.phone
  )
  
  if (existingRegistration) {
    throw createError({ statusCode: 400, message: '您已报名该课程' })
  }
  
  const existingWaitlist = waitlist.find(
    w => w.courseId === id && w.phone === body.phone
  )
  
  if (existingWaitlist) {
    throw createError({ statusCode: 400, message: '您已在候补名单中' })
  }
  
  const courseRegistrations = registrations.filter(r => r.courseId === id && r.status === 'confirmed')
  
  if (courseRegistrations.length < course.maxParticipants) {
    const newRegistration = {
      id: `r${Date.now()}`,
      courseId: id!,
      participantName: body.participantName,
      phone: body.phone,
      email: body.email,
      status: 'confirmed' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    registrations.push(newRegistration)
    
    const courseIndex = courses.findIndex(c => c.id === id)
    if (courseIndex !== -1) {
      courses[courseIndex].currentParticipants++
    }
    
    return {
      success: true,
      type: 'confirmed',
      message: '报名成功',
      data: newRegistration
    }
  } else {
    const position = waitlist.filter(w => w.courseId === id && w.status === 'active').length + 1
    
    const newWaitlistEntry = {
      id: `w${Date.now()}`,
      courseId: id!,
      participantName: body.participantName,
      phone: body.phone,
      email: body.email,
      position,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    waitlist.push(newWaitlistEntry)
    
    return {
      success: true,
      type: 'waitlist',
      message: `报名已满，已加入候补队列，当前位置：第 ${position} 位`,
      data: newWaitlistEntry
    }
  }
})
