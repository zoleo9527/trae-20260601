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
import clarificationRoutes from './routes/clarifications.js'
import logRoutes from './routes/logs.js'
import registrationRoutes from './routes/registrations.js'
import todoRoutes from './routes/todos.js'
import userRoutes from './routes/users.js'

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
app.use('/api/registrations', registrationRoutes)
app.use('/api/clarifications', clarificationRoutes)
app.use('/api/logs', logRoutes)
app.use('/api/todos', todoRoutes)
app.use('/api/users', userRoutes)

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
