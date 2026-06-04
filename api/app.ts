import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDb } from './db/init.js'
import authRoutes from './routes/auth.js'
import appointmentRoutes from './routes/appointments.js'
import exceptionRoutes from './routes/exceptions.js'
import noteRoutes from './routes/notes.js'
import visitRoutes from './routes/visits.js'
import planRoutes from './routes/plans.js'

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

initDb()

app.use('/api/auth', authRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/exceptions', exceptionRoutes)
app.use('/api/notes', noteRoutes)
app.use('/api/visits', visitRoutes)
app.use('/api/plans', planRoutes)

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
  console.error(error)
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
