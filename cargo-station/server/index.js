import cors from 'cors'
import express from 'express'
import { initDB } from './db.js'
import { acceptanceRouter } from './routes/acceptance.js'
import { auditRouter } from './routes/audit.js'
import { verificationRouter } from './routes/verification.js'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/acceptance', acceptanceRouter)
app.use('/api/verification', verificationRouter)
app.use('/api/audit', auditRouter)

initDB()

app.listen(3001, () => {
  console.log('货站后端服务已启动 http://localhost:3001')
})
