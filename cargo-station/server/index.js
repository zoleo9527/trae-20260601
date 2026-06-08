import cors from 'cors'
import express from 'express'
import { initDB } from './db.js'
import { acceptanceRouter } from './routes/acceptance.js'
import { auditRouter } from './routes/audit.js'
import { verificationRouter } from './routes/verification.js'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }))

app.use('/api/acceptance', acceptanceRouter)
app.use('/api/verification', verificationRouter)
app.use('/api/audit', auditRouter)

initDB()

const server = app.listen(3001, () => {
  console.log('货站后端服务已启动 http://localhost:3001')
})

server.on('error', (e) => { console.error('Server error:', e) })

process.on('uncaughtException', (e) => { console.error('Uncaught:', e) })
