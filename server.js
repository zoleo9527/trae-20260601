const express = require('express')
const cors = require('cors')

const errorCodesRouter = require('./routes/errorCodes')
const recordsRouter = require('./routes/records')
const linesRouter = require('./routes/lines')
const anomaliesRouter = require('./routes/anomalies')
const dashboardRouter = require('./routes/dashboard')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/error-codes', errorCodesRouter)
app.use('/api/records', recordsRouter)
app.use('/api/lines', linesRouter)
app.use('/api/anomalies', anomaliesRouter)
app.use('/api/dashboard', dashboardRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})