import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import scheduleRoutes from './routes/schedules.js'
import attendanceRoutes from './routes/attendance.js'
import reviewRoutes from './routes/reviews.js'
import exceptionRoutes from './routes/exceptions.js'
import logRoutes from './routes/logs.js'
import { resetDb } from './db.js'

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/exceptions', exceptionRoutes)
app.use('/api/logs', logRoutes)

app.post('/api/reset', (_req: Request, res: Response): void => {
  try {
    resetDb()
    res.json({ success: true, data: '数据库已重置' })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
