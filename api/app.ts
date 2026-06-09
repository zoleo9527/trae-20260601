import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import containerRoutes from './routes/containers.js'
import gateRecordRoutes from './routes/gate-records.js'
import yardSlotRoutes from './routes/yard-slots.js'
import overstayRoutes from './routes/overstay.js'
import feeRoutes from './routes/fees.js'
import inspectionRoutes from './routes/inspections.js'
import timelineRoutes from './routes/timeline.js'
import attachmentRoutes from './routes/attachments.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/containers', containerRoutes)
app.use('/api/gate-records', gateRecordRoutes)
app.use('/api/yard-slots', yardSlotRoutes)
app.use('/api/overstay', overstayRoutes)
app.use('/api/fees', feeRoutes)
app.use('/api/inspections', inspectionRoutes)
app.use('/api/timeline', timelineRoutes)
app.use('/api/attachments', attachmentRoutes)

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
