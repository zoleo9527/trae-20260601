import express from 'express'
import cors from 'cors'
import { initDb } from './db.js'
import { seed } from './seed.js'
import authRoutes from './routes/auth.js'
import prescriptionRoutes from './routes/prescriptions.js'
import batchRoutes from './routes/batches.js'
import labelRoutes from './routes/labels.js'
import logRoutes from './routes/logs.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

seed()
initDb()

app.use('/api/auth', authRoutes)
app.use('/api/prescriptions', prescriptionRoutes)
app.use('/api/batches', batchRoutes)
app.use('/api/labels', labelRoutes)
app.use('/api/logs', logRoutes)

app.use((err, req, res, _next) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message })
})

app.listen(PORT, () => {
  console.log(`煎药房后端服务已启动: http://localhost:${PORT}`)
})
