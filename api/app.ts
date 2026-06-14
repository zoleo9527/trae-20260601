import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import avRoutes from './routes/absence-violation.js'
import spRoutes from './routes/score-publish.js'
import queryRoutes from './routes/query.js'
import exportRoutes from './routes/export.js'
import auditLogRoutes from './routes/audit-logs.js'
import roleRoutes from './routes/role.js'
import resetRoutes from './routes/reset.js'

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/absence-violation', avRoutes)
app.use('/api/score-publish', spRoutes)
app.use('/api/query', queryRoutes)
app.use('/api/export', exportRoutes)
app.use('/api/audit-logs', auditLogRoutes)
app.use('/api/role', roleRoutes)
app.use('/api/reset', resetRoutes)

app.use(
  '/api/health',
  (_req: Request, res: Response, _next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
