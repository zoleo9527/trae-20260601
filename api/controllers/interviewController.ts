import { Request, Response } from 'express'
import { db } from '../database/db.js'

export const getInterviews = (req: Request, res: Response) => {
  const { job_id } = req.query
  const interviews = db.interviews.findAll(job_id ? Number(job_id) : undefined)
  res.json({ success: true, interviews })
}

export const createInterview = (req: Request, res: Response) => {
  const { job_id, candidate_name, phone, interview_time } = req.body
  
  const interview = db.interviews.create({ job_id: Number(job_id), candidate_name, phone, interview_time })
  res.json({ success: true, interview })
}

export const updateInterviewStatus = (req: Request, res: Response) => {
  const { id } = req.params
  const { status } = req.body
  
  const noShow = status === 'noshow'
  const interview = db.interviews.update(Number(id), { status, no_show: noShow })
  
  if (!interview) {
    return res.status(404).json({ success: false, message: 'Interview not found' })
  }
  
  res.json({ success: true, interview })
}