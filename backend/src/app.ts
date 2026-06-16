import express from 'express'
import cors from 'cors'
import { initializeDatabase } from './database.js'
import authRoutes from './routes/auth.js'
import couponRoutes from './routes/coupons.js'
import memberRoutes from './routes/members.js'
import batchRoutes from './routes/batches.js'
import policyRoutes from './routes/policies.js'
import attachmentRoutes from './routes/attachments.js'
import dashboardRoutes from './routes/dashboard.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

initializeDatabase()

app.use('/api/auth', authRoutes)
app.use('/api/coupons', couponRoutes)
app.use('/api/members', memberRoutes)
app.use('/api/batches', batchRoutes)
app.use('/api/policies', policyRoutes)
app.use('/api/attachments', attachmentRoutes)
app.use('/api/dashboard', dashboardRoutes)

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' })
})

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误',
    },
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
