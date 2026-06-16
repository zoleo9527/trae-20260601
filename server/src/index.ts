import express from 'express'
import cors from 'cors'
import { initDatabase } from './database/db'
import { seedData } from './database/seedData'
import { complaintRouter } from './routes/complaints'
import { compensationRouter } from './routes/compensations'
import { tableRouter } from './routes/tables'
import { userRouter } from './routes/users'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

initDatabase()

setTimeout(() => {
  seedData()
}, 100)

app.use('/api/complaints', complaintRouter)
app.use('/api/compensations', compensationRouter)
app.use('/api/tables', tableRouter)
app.use('/api/users', userRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
})