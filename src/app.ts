import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDatabase } from './database/connection'
import gradeRoutes from './routes/gradeRoutes'
import packingRoutes from './routes/packingRoutes'
import userRoutes from './routes/userRoutes'
import { setupSwagger } from './swagger/swagger'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/grades', gradeRoutes)
app.use('/api/packings', packingRoutes)
app.use('/api/users', userRoutes)

setupSwagger(app)

app.get('/', (req, res) => {
  res.redirect('/api-docs')
})

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  })
})

async function startServer() {
  try {
    await initDatabase()
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`)
      console.log(`API文档地址: http://localhost:${port}/api-docs`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app