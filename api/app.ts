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
import { initSeedData } from './db/memoryDb.js'
import authRoutes from './routes/auth.js'
import complaintsRoutes from './routes/complaints.js'
import todosRoutes from './routes/todos.js'

initSeedData();
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
app.use('/api/complaints', complaintsRoutes)
app.use('/api/todos', todosRoutes)

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
