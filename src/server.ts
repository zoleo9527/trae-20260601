import express from 'express'
import cors from 'cors'
import teamBuildingRoutes from './routes/teamBuildingRoutes'
import settlementRoutes from './routes/settlementRoutes'
import roleViewRoutes from './routes/roleViewRoutes'
import statusFlowRoutes from './routes/statusFlowRoutes'

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/team-buildings', teamBuildingRoutes)
app.use('/api/settlements', settlementRoutes)
app.use('/api/roles', roleViewRoutes)
app.use('/api/status-flow', statusFlowRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})