import cors from 'cors'
import dotenv from 'dotenv'
import express, { type Request, type Response } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDatabase } from './database/database.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.js'
import customerRoutes from './routes/customers.js'
import handoverRoutes from './routes/handovers.js'
import noteRoutes from './routes/notes.js'
import renewalRoutes from './routes/renewals.js'
import statisticsRoutes from './routes/statistics.js'
import userRoutes from './routes/users.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/handovers', handoverRoutes)
app.use('/api/renewals', renewalRoutes)
app.use('/api/notes', noteRoutes)
app.use('/api/users', userRoutes)
app.use('/api/statistics', statisticsRoutes)

app.use('/api/health', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'ok'
  })
})

app.use(notFoundHandler)

app.use(errorHandler)

export async function initializeApp(): Promise<void> {
  await initDatabase()
}

export default app