import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDb } from './db.js'
import { syncExpiredLocks } from './lib/lockStatusSync.js'
import adjustmentsRoutes from './routes/adjustments.js'
import priceLocksRoutes from './routes/price-locks.js'
import quotesRoutes from './routes/quotes.js'
import inventoryRoutes from './routes/inventory.js'
import customersRoutes from './routes/customers.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

initDb()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/adjustments', adjustmentsRoutes)
app.use('/api/price-locks', priceLocksRoutes)
app.use('/api/quotes', quotesRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/customers', customersRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use(
  '/api/sync-locks',
  (req: Request, res: Response, next: NextFunction): void => {
    syncExpiredLocks()
    res.status(200).json({
      success: true,
      message: 'Locks synced successfully',
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
