import { Router, type Request, type Response } from 'express'

const router = Router()

const ROLES = [
  { key: 'technician', label: '维保技师', description: '查看待执行计划、到场签到、提交维保记录' },
  { key: 'service', label: '客服', description: '查看签到状态、跟进异常工单、添加备注' },
  { key: 'supervisor', label: '项目主管', description: '审核维保完成记录、批量处理、查看统计' },
]

router.post('/demo/:role', (req: Request, res: Response): void => {
  const { role } = req.params
  const found = ROLES.find(r => r.key === role)
  if (!found) {
    res.status(400).json({ success: false, error: `无效角色: ${role}` })
    return
  }
  res.json({ success: true, data: found })
})

export default router
