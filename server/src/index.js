import express from 'express'
import cors from 'cors'
import { initDb } from './db.js'
import { seed } from './seed.js'
import { registerRoutes } from './routes.js'

const app = express()
const PORT = 4000

app.use(cors())
app.use(express.json())

initDb()
seed()

registerRoutes(app)

app.listen(PORT, () => {
  console.log(`服务已启动 http://localhost:${PORT}`)
})
