/**
 * This is a API server
 */

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
import shopRoutes from './routes/shop.js'
import { ERROR_CODES, ERROR_MESSAGES } from '../shared/types.js'

// for esm mode
const _filename = fileURLToPath(import.meta.url)
const _dirname = path.dirname(_filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * health
 */
app.use(
  '/api/health',
  (_req: Request, res: Response, _next: NextFunction): void => {
    res.status(200).json({
      code: ERROR_CODES.SUCCESS,
      message: ERROR_MESSAGES[ERROR_CODES.SUCCESS],
      data: { status: 'ok' },
    })
  },
)

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api', shopRoutes)

/**
 * error handler middleware
 */
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({
    code: ERROR_CODES.INTERNAL_ERROR,
    message: ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR] + (error.message ? `：${error.message}` : ''),
    data: null,
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({
      code: ERROR_CODES.INVALID_PARAMS,
      message: `接口不存在：${req.method} ${req.path}`,
      data: null,
    })
  } else {
    res.status(404).json({
      code: ERROR_CODES.INVALID_PARAMS,
      message: '资源不存在',
      data: null,
    })
  }
})

export default app
