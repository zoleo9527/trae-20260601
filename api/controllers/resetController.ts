import { Request, Response } from 'express'
import { db } from '../database/db.js'

export const resetData = (req: Request, res: Response) => {
  db.interviews.deleteAll()
  db.jobs.deleteAll()
  
  db.jobs.insertMany([
    { title: '电子厂普工', company: '深圳电子科技有限公司', location: '深圳宝安', salary: '5000-6000/月', description: '负责电子产品组装、检测', requirements: '18-45岁，身体健康', status: 'pending', reject_reason: null, created_by: 3 },
    { title: '仓库管理员', company: '广州物流有限公司', location: '广州白云', salary: '4500-5500/月', description: '负责仓库货物管理、盘点', requirements: '有仓库管理经验优先', status: 'pending', reject_reason: null, created_by: 3 },
    { title: '外卖骑手', company: '美团配送', location: '北京朝阳', salary: '8000-12000/月', description: '负责外卖配送服务', requirements: '熟悉当地路线，有电动车', status: 'approved', reject_reason: null, created_by: 3 },
    { title: '保安', company: '上海物业管理公司', location: '上海浦东', salary: '4000-5000/月', description: '负责小区安全保卫', requirements: '无犯罪记录，身高175以上', status: 'published', reject_reason: null, created_by: 3 },
    { title: '保洁员', company: '北京清洁服务公司', location: '北京海淀', salary: '3500-4000/月', description: '负责办公区域清洁', requirements: '吃苦耐劳，有责任心', status: 'rejected', reject_reason: '薪资低于市场标准', created_by: 3 },
  ])
  
  db.interviews.insertMany([
    { job_id: 1, candidate_name: '张三', phone: '13800138001', interview_time: '2024-01-15 09:00:00', status: 'scheduled', no_show: false },
    { job_id: 1, candidate_name: '李四', phone: '13800138002', interview_time: '2024-01-15 10:00:00', status: 'completed', no_show: false },
    { job_id: 1, candidate_name: '王五', phone: '13800138003', interview_time: '2024-01-14 09:00:00', status: 'noshow', no_show: true },
    { job_id: 2, candidate_name: '赵六', phone: '13800138004', interview_time: '2024-01-16 14:00:00', status: 'scheduled', no_show: false },
  ])
  
  res.json({ success: true, message: 'Data reset successfully' })
}