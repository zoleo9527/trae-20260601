import express, { Express } from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

import farmersRouter from './routes/farmers'
import ordersRouter from './routes/orders'
import productsRouter from './routes/products'
import repaymentsRouter from './routes/repayments'

dotenv.config()

const app: Express = express()
const port = process.env.PORT || 3000

app.use(express.json())

app.use('/api/farmers', farmersRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/products', productsRouter)
app.use('/api/repayments', repaymentsRouter)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agri_store')
    console.log('Connected to MongoDB')
    
    app.listen(port, () => {
      console.log(`Server running on port ${port}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()