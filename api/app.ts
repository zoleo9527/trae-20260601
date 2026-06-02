import cors from 'cors'
import dotenv from 'dotenv'
import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import './db.js'
import customerRoutes from './routes/customers.js'
import employeeRoutes from './routes/employees.js'
import inspectionRoutes from './routes/inspections.js'
import orderRoutes from './routes/orders.js'
import packageRoutes from './routes/packages.js'
import statsRoutes from './routes/stats.js'
import vehicleRoutes from './routes/vehicles.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/customers', customerRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/packages', packageRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/inspections', inspectionRoutes)
app.use('/api/stats', statsRoutes)

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
