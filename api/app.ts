import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import inspectionRoutes from './routes/inspections.js'
import eggRecordRoutes from './routes/egg-records.js'
import anomalyRoutes from './routes/anomalies.js'
import notificationRoutes from './routes/notifications.js'
import uploadRoutes from './routes/upload.js'
import dashboardRoutes from './routes/dashboard.js'
import { authMiddleware } from './middleware/auth.js'
import './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)

app.use('/api/inspections', authMiddleware, inspectionRoutes)
app.use('/api/egg-records', authMiddleware, eggRecordRoutes)
app.use('/api/anomalies', authMiddleware, anomalyRoutes)
app.use('/api/notifications', authMiddleware, notificationRoutes)
app.use('/api/upload', authMiddleware, uploadRoutes)
app.use('/api/dashboard', authMiddleware, dashboardRoutes)

app.use('/api/uploads', express.static(path.join(__dirname, '..', 'uploads')))

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
  if (error.message === '只支持 JPG/PNG 格式图片') {
    res.status(400).json({ success: false, error: error.message })
    return
  }
  if (error.message.includes('File too large')) {
    res.status(400).json({ success: false, error: '文件大小不能超过5MB' })
    return
  }
  if (error.name === 'MulterError') {
    res.status(400).json({ success: false, error: '文件上传失败' })
    return
  }
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
