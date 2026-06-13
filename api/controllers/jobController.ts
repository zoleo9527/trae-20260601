import { Request, Response } from 'express'
import { db, User } from '../database/db.js'

export const getJobs = (req: Request & { user?: User }, res: Response) => {
  const { status } = req.query
  const jobs = db.jobs.findAll(status as string)
  res.json({ success: true, jobs })
}

export const getJobById = (req: Request, res: Response) => {
  const { id } = req.params
  const job = db.jobs.findById(Number(id))
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' })
  }
  res.json({ success: true, job })
}

export const createJob = (req: Request & { user?: User }, res: Response) => {
  const { title, company, location, salary, description, requirements } = req.body
  const createdBy = req.user?.id
  
  if (!createdBy) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }
  
  const job = db.jobs.create({ title, company, location, salary, description, requirements, created_by: createdBy })
  res.json({ success: true, job })
}

export const updateJob = (req: Request & { user?: User }, res: Response) => {
  const { id } = req.params
  const { title, company, location, salary, description, requirements } = req.body
  
  const job = db.jobs.update(Number(id), { title, company, location, salary, description, requirements, status: 'pending' })
  
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' })
  }
  
  res.json({ success: true, job })
}

export const auditJob = (req: Request & { user?: User }, res: Response) => {
  const { id } = req.params
  const { action, remark } = req.body
  
  if (action !== 'approve' && action !== 'reject') {
    return res.status(400).json({ success: false, message: 'Invalid action' })
  }
  
  const status = action === 'approve' ? 'approved' : 'rejected'
  const job = db.jobs.update(Number(id), { status, reject_reason: remark || null })
  
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' })
  }
  
  res.json({ success: true, job })
}

export const publishJob = (req: Request & { user?: User }, res: Response) => {
  const { id } = req.params
  
  const job = db.jobs.update(Number(id), { status: 'published' })
  
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' })
  }
  
  res.json({ success: true, job })
}