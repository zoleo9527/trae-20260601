import cors from 'cors'
import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express'
import { initDb } from './db.js'
import careRecordRoutes from './routes/care-records.js'
import communicationRoutes from './routes/communications.js'
import followupRoutes from './routes/followups.js'
import orderRoutes from './routes/orders.js'
import patientRoutes from './routes/patients.js'

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

initDb()

app.use('/api/patients', patientRoutes)
app.use('/api/care-records', careRecordRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/followups', followupRoutes)
app.use('/api/communications', communicationRoutes)

app.use('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'ok' })
})

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(error)
  res.status(500).json({ success: false, error: '服务器内部错误' })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: '接口未找到' })
})

export default app
