import { Router, type Request, type Response } from 'express'
import { listExportTasks, createExportTask, getExportDownload, getExportTaskById } from '../services/export.js'
import type { ExportType, Role } from '../../shared/types.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  const tasks = listExportTasks()
  res.json({ list: tasks, total: tasks.length })
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { type, filters, operatorRole, operatorName } = req.body
    const task = createExportTask(type as ExportType, filters || {}, operatorRole as Role, operatorName)
    res.json({ success: true, data: task })
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  const task = getExportTaskById(req.params.id)
  if (!task) { res.status(404).json({ error: '[未找到] 导出任务不存在' }); return }
  res.json({ success: true, data: task })
})

router.get('/:id/download', (req: Request, res: Response): void => {
  try {
    const { csv, filename } = getExportDownload(req.params.id)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`)
    res.send('\uFEFF' + csv)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

export default router
