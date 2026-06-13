export type JobStatus = 'draft' | 'pending' | 'approved' | 'published' | 'rejected' | 'expired' | 'closed'

export type InterviewStatus = 'scheduled' | 'completed' | 'noshow' | 'cancelled'

export interface Job {
  id: number
  title: string
  company: string
  location: string
  salary: string
  description: string
  requirements: string
  status: JobStatus
  reject_reason: string | null
  created_by: number
  created_by_name: string
  created_at: string
  updated_at: string
}

export interface Interview {
  id: number
  job_id: number
  job_title: string
  candidate_name: string
  phone: string
  interview_time: string
  status: InterviewStatus
  no_show: boolean
  created_at: string
}

const getToken = () => localStorage.getItem('token')

export const api = {
  jobs: {
    list: async (status?: string): Promise<Job[]> => {
      const params = status ? `?status=${status}` : ''
      const response = await fetch(`/api/jobs${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await response.json()
      return data.jobs || []
    },
    
    get: async (id: number): Promise<Job> => {
      const response = await fetch(`/api/jobs/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await response.json()
      return data.job
    },
    
    create: async (job: Omit<Job, 'id' | 'status' | 'reject_reason' | 'created_by' | 'created_by_name' | 'created_at' | 'updated_at'>): Promise<Job> => {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(job)
      })
      const data = await response.json()
      return data.job
    },
    
    update: async (id: number, job: Partial<Job>): Promise<Job> => {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(job)
      })
      const data = await response.json()
      return data.job
    },
    
    audit: async (id: number, action: 'approve' | 'reject', remark?: string): Promise<Job> => {
      const response = await fetch(`/api/jobs/${id}/audit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ action, remark })
      })
      const data = await response.json()
      return data.job
    },
    
    publish: async (id: number): Promise<Job> => {
      const response = await fetch(`/api/jobs/${id}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await response.json()
      return data.job
    }
  },
  
  interviews: {
    list: async (jobId?: number): Promise<Interview[]> => {
      const params = jobId ? `?job_id=${jobId}` : ''
      const response = await fetch(`/api/interviews${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await response.json()
      return data.interviews || []
    },
    
    create: async (interview: Omit<Interview, 'id' | 'job_title' | 'status' | 'no_show' | 'created_at'>): Promise<Interview> => {
      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(interview)
      })
      const data = await response.json()
      return data.interview
    },
    
    updateStatus: async (id: number, status: InterviewStatus): Promise<Interview> => {
      const response = await fetch(`/api/interviews/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ status })
      })
      const data = await response.json()
      return data.interview
    }
  },
  
  reset: {
    data: async (): Promise<void> => {
      await fetch('/api/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` }
      })
    }
  }
}