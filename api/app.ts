/**
 * This is a API server
 */

import cors from 'cors'
import dotenv from 'dotenv'
import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import orderRoutes from './routes/orders.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/orders', orderRoutes)

app.get('/api/roles', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { key: 'technician', label: '维保技师', description: '查看待执行计划、到场签到、提交维保记录' },
      { key: 'service', label: '客服', description: '查看签到状态、跟进异常工单、添加备注' },
      { key: 'supervisor', label: '项目主管', description: '审核维保完成记录、批量处理、查看统计' },
    ],
  })
})

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
