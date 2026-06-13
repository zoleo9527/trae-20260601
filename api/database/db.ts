export type User = {
  id: number
  username: string
  password: string
  role: 'operator' | 'consultant' | 'hr'
  created_at: string
}

export type Job = {
  id: number
  title: string
  company: string
  location: string
  salary: string
  description: string
  requirements: string
  status: 'draft' | 'pending' | 'approved' | 'published' | 'rejected' | 'expired' | 'closed'
  reject_reason: string | null
  created_by: number
  created_at: string
  updated_at: string
}

export type Interview = {
  id: number
  job_id: number
  candidate_name: string
  phone: string
  interview_time: string
  status: 'scheduled' | 'completed' | 'noshow' | 'cancelled'
  no_show: boolean
  created_at: string
}

let users: User[] = [
  { id: 1, username: 'operator', password: '123456', role: 'operator', created_at: new Date().toISOString() },
  { id: 2, username: 'consultant', password: '123456', role: 'consultant', created_at: new Date().toISOString() },
  { id: 3, username: 'hr', password: '123456', role: 'hr', created_at: new Date().toISOString() },
]

let jobs: Job[] = [
  { id: 1, title: '电子厂普工', company: '深圳电子科技有限公司', location: '深圳宝安', salary: '5000-6000/月', description: '负责电子产品组装、检测', requirements: '18-45岁，身体健康', status: 'pending', reject_reason: null, created_by: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, title: '仓库管理员', company: '广州物流有限公司', location: '广州白云', salary: '4500-5500/月', description: '负责仓库货物管理、盘点', requirements: '有仓库管理经验优先', status: 'pending', reject_reason: null, created_by: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, title: '外卖骑手', company: '美团配送', location: '北京朝阳', salary: '8000-12000/月', description: '负责外卖配送服务', requirements: '熟悉当地路线，有电动车', status: 'approved', reject_reason: null, created_by: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 4, title: '保安', company: '上海物业管理公司', location: '上海浦东', salary: '4000-5000/月', description: '负责小区安全保卫', requirements: '无犯罪记录，身高175以上', status: 'published', reject_reason: null, created_by: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 5, title: '保洁员', company: '北京清洁服务公司', location: '北京海淀', salary: '3500-4000/月', description: '负责办公区域清洁', requirements: '吃苦耐劳，有责任心', status: 'rejected', reject_reason: '薪资低于市场标准', created_by: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

let interviews: Interview[] = [
  { id: 1, job_id: 4, candidate_name: '张三', phone: '13800138001', interview_time: '2024-01-15 09:00:00', status: 'scheduled', no_show: false, created_at: new Date().toISOString() },
  { id: 2, job_id: 4, candidate_name: '李四', phone: '13800138002', interview_time: '2024-01-15 10:00:00', status: 'completed', no_show: false, created_at: new Date().toISOString() },
  { id: 3, job_id: 4, candidate_name: '王五', phone: '13800138003', interview_time: '2024-01-14 09:00:00', status: 'noshow', no_show: true, created_at: new Date().toISOString() },
  { id: 4, job_id: 3, candidate_name: '赵六', phone: '13800138004', interview_time: '2024-01-16 14:00:00', status: 'scheduled', no_show: false, created_at: new Date().toISOString() },
]

let nextUserId = 4
let nextJobId = 6
let nextInterviewId = 5

export const db = {
  users: {
    findOne: (username: string, password: string, role: string) => {
      return users.find(u => u.username === username && u.password === password && u.role === role)
    },
    findById: (id: number) => {
      return users.find(u => u.id === id)
    },
  },
  jobs: {
    findAll: (status?: string) => {
      let result = jobs.map(job => {
        const user = users.find(u => u.id === job.created_by)
        return { ...job, created_by_name: user?.username || '' }
      })
      if (status) {
        result = result.filter(j => j.status === status)
      }
      return result
    },
    findById: (id: number) => {
      const job = jobs.find(j => j.id === id)
      if (job) {
        const user = users.find(u => u.id === job.created_by)
        return { ...job, created_by_name: user?.username || '' }
      }
      return undefined
    },
    create: (job: Omit<Job, 'id' | 'status' | 'reject_reason' | 'created_at' | 'updated_at'>) => {
      const newJob: Job = {
        ...job,
        id: nextJobId++,
        status: 'pending',
        reject_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      jobs.push(newJob)
      const user = users.find(u => u.id === job.created_by)
      return { ...newJob, created_by_name: user?.username || '' }
    },
    update: (id: number, job: Partial<Job>) => {
      const index = jobs.findIndex(j => j.id === id)
      if (index !== -1) {
        jobs[index] = { ...jobs[index], ...job, updated_at: new Date().toISOString() }
        const user = users.find(u => u.id === jobs[index].created_by)
        return { ...jobs[index], created_by_name: user?.username || '' }
      }
      return undefined
    },
    deleteAll: () => {
      jobs = []
      nextJobId = 1
    },
    insertMany: (newJobs: Omit<Job, 'id' | 'created_at' | 'updated_at'>[]) => {
      newJobs.forEach(job => {
        jobs.push({
          ...job,
          id: nextJobId++,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      })
    }
  },
  interviews: {
    findAll: (job_id?: number) => {
      let result = interviews.map(interview => {
        const job = jobs.find(j => j.id === interview.job_id)
        return { ...interview, job_title: job?.title || '' }
      })
      if (job_id !== undefined) {
        result = result.filter(i => i.job_id === job_id)
      }
      return result
    },
    findById: (id: number) => {
      const interview = interviews.find(i => i.id === id)
      if (interview) {
        const job = jobs.find(j => j.id === interview.job_id)
        return { ...interview, job_title: job?.title || '' }
      }
      return undefined
    },
    create: (interview: Omit<Interview, 'id' | 'status' | 'no_show' | 'created_at'>) => {
      const newInterview: Interview = {
        ...interview,
        id: nextInterviewId++,
        status: 'scheduled',
        no_show: false,
        created_at: new Date().toISOString()
      }
      interviews.push(newInterview)
      const job = jobs.find(j => j.id === interview.job_id)
      return { ...newInterview, job_title: job?.title || '' }
    },
    update: (id: number, interview: Partial<Interview>) => {
      const index = interviews.findIndex(i => i.id === id)
      if (index !== -1) {
        interviews[index] = { ...interviews[index], ...interview }
        const job = jobs.find(j => j.id === interviews[index].job_id)
        return { ...interviews[index], job_title: job?.title || '' }
      }
      return undefined
    },
    deleteAll: () => {
      interviews = []
      nextInterviewId = 1
    },
    insertMany: (newInterviews: Omit<Interview, 'id' | 'created_at'>[]) => {
      newInterviews.forEach(interview => {
        interviews.push({
          ...interview,
          id: nextInterviewId++,
          created_at: new Date().toISOString()
        })
      })
    }
  }
}