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
import advanceRoutes from './routes/advances.js'
import authRoutes from './routes/auth.js'
import billRoutes from './routes/bills.js'
import dashboardRoutes from './routes/dashboard.js'
import disputeRoutes from './routes/disputes.js'
import expenseRoutes from './routes/expenses.js'
import landlordRoutes from './routes/landlords.js'
import orderRoutes from './routes/orders.js'
import propertyRoutes from './routes/properties.js'
import repairRoutes from './routes/repairs.js'

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
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/landlords', landlordRoutes)
app.use('/api/properties', propertyRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/repairs', repairRoutes)
app.use('/api/advances', advanceRoutes)
app.use('/api/bills', billRoutes)
app.use('/api/disputes', disputeRoutes)

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
