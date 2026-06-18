import { courses, users, registrations, waitlist } from '../../data/mockData'

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
  
  return {
    ...course,
    teacherName: teacher?.name || '未知',
    submitterName: submitter?.name || '未知',
    registrations: courseRegistrations,
    waitlist: courseWaitlist,
    openIssues: course.issues.filter(i => i.status === 'open').length
  }
})
