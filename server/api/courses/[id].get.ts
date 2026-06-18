import { courses, users, registrations, waitlist, schedules, waitlistHistory } from '../../data/mockData'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const course = courses.find(c => c.id === id)
  
  if (!course) {
    throw createError({ statusCode: 404, message: '课程不存在' })
  }
  
  const teacher = users.find(u => u.id === course.teacherId)
  const submitter = users.find(u => u.id === course.submitterId)
  const courseRegistrations = registrations.filter(r => r.courseId === id && r.status === 'confirmed')
  const courseWaitlist = waitlist.filter(w => w.courseId === id && w.status === 'active')
  const courseSchedule = schedules.find(s => s.courseId === id)
  const scheduleTeacher = courseSchedule ? users.find(u => u.id === courseSchedule.teacherId) : null
  const scheduleAssigner = courseSchedule?.assignedBy ? users.find(u => u.id === courseSchedule.assignedBy) : null
  const scheduleConfirmer = courseSchedule?.confirmedBy ? users.find(u => u.id === courseSchedule.confirmedBy) : null
  const courseWaitlistHistory = waitlistHistory.filter(h => h.courseId === id)
  
  const confirmedMaterials = course.materials.filter(m => m.confirmedBy).length
  const totalMaterials = course.materials.length
  const materialConfirmationRate = totalMaterials > 0 ? Math.round((confirmedMaterials / totalMaterials) * 100) : 0
  
  const currentParticipants = courseRegistrations.length
  const isFull = currentParticipants >= course.maxParticipants
  
  return {
    ...course,
    teacherName: teacher?.name || '未知',
    submitterName: submitter?.name || '未知',
    registrations: courseRegistrations,
    waitlist: courseWaitlist,
    schedule: courseSchedule ? {
      ...courseSchedule,
      teacherName: scheduleTeacher?.name || '未知',
      assignerName: scheduleAssigner?.name || '未知',
      confirmerName: scheduleConfirmer?.name || '未知'
    } : null,
    waitlistHistory: courseWaitlistHistory,
    materialConfirmationRate,
    confirmedMaterials,
    openIssues: course.issues.filter(i => i.status === 'open').length,
    currentParticipants,
    isFull
  }
})
