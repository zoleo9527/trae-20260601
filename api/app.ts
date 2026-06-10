import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { initDb } from './db.js'
import authRoutes from './routes/auth.js'
import statsRoutes from './routes/stats.js'
import transfersRoutes from './routes/transfers.js'
import assessmentsRoutes from './routes/assessments.js'
import logsRoutes from './routes/logs.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

initDb()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use((req: Request, _res: Response, next: NextFunction) => {
  const decodeHeader = (val: string | undefined): string => {
    if (!val) return ''
    try {
      return decodeURIComponent(escape(val))
    } catch {
      return val
    }
  }
  ;(req as any).decodedRole = decodeHeader(req.headers['x-user-role'] as string)
  ;(req as any).decodedName = decodeHeader(req.headers['x-user-name'] as string)
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/transfers', transfersRoutes)
app.use('/api/assessments', assessmentsRoutes)
app.use('/api/logs', logsRoutes)

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
  console.error('Server error:', error)
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
