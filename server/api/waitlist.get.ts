import { waitlist, courses } from '../data/mockData'

export default defineEventHandler(() => {
  const waitlistWithCourse = waitlist.map(entry => {
    const course = courses.find(c => c.id === entry.courseId)
    return {
      ...entry,
      courseTitle: course?.title || '未知课程'
    }
  })
  return waitlistWithCourse
})
