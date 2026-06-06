import express from 'express'
import cors from 'cors'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import purchasesRouter from './routes/purchases.js'
import acceptanceRouter from './routes/acceptance.js'
import samplesRouter from './routes/samples.js'
import exceptionsRouter from './routes/exceptions.js'
import disputesRouter from './routes/disputes.js'
import { seedDatabase } from './data/seed.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

const file = join(__dirname, 'db.json')
const adapter = new JSONFile(file)
const db = new Low(adapter, { purchaseOrders: [], users: [] })

await db.read()

if (!db.data || db.data.purchaseOrders.length === 0) {
  console.log('初始化数据库...')
  const seedData = seedDatabase()
  db.data = seedData
  await db.write()
  console.log('数据库初始化完成')
}

app.use((req, res, next) => {
  req.db = db
  next()
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/purchases', purchasesRouter)
app.use('/api/acceptance', acceptanceRouter)
app.use('/api/samples', samplesRouter)
app.use('/api/exceptions', exceptionsRouter)
app.use('/api/disputes', disputesRouter)

app.get('/api/users', (req, res) => {
  res.json(req.db.data.users)
})

app.listen(PORT, () => {
  console.log(`🚀 后端服务运行在 http://localhost:${PORT}`)
  console.log(`📦 数据库文件: ${file}`)
})
