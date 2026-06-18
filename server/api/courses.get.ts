import { courses, users, registrations, waitlist, schedules } from '../data/mockData'

export default defineEventHandler(() => {
  const coursesWithDetails = courses.map(course => {
    const teacher = users.find(u => u.id === course.teacherId)
    const submitter = users.find(u => u.id === course.submitterId)
    const courseRegistrations = registrations.filter(r => r.courseId === course.id && r.status === 'confirmed')
    const courseWaitlist = waitlist.filter(w => w.courseId === course.id && w.status === 'active')
    const courseSchedule = schedules.find(s => s.courseId === course.id)
    
    const currentParticipants = courseRegistrations.length
    const isFull = currentParticipants >= course.maxParticipants
    const confirmedMaterials = course.materials.filter(m => m.confirmedBy).length
    const totalMaterials = course.materials.length
    const materialConfirmationRate = totalMaterials > 0 ? Math.round((confirmedMaterials / totalMaterials) * 100) : 0
    
    return {
      ...course,
      teacherName: teacher?.name || '未知',
      submitterName: submitter?.name || '未知',
      openIssues: course.issues.filter(i => i.status === 'open').length,
      currentParticipants,
      maxParticipants: course.maxParticipants,
      isFull,
      waitlistCount: courseWaitlist.length,
      scheduleStatus: courseSchedule?.status || 'not_assigned',
      materialConfirmationRate
    }
  })
  return coursesWithDetails
})
