import { courses, users } from '../data/mockData'

export default defineEventHandler(() => {
  const coursesWithTeacher = courses.map(course => {
    const teacher = users.find(u => u.id === course.teacherId)
    const submitter = users.find(u => u.id === course.submitterId)
    return {
      ...course,
      teacherName: teacher?.name || '未知',
      submitterName: submitter?.name || '未知',
      openIssues: course.issues.filter(i => i.status === 'open').length
    }
  })
  return coursesWithTeacher
})
