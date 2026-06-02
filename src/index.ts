import express from 'express'
import { initDb } from './db'
import accessRecordRoutes from './routes/access-records'
import dashboardRoutes from './routes/dashboard'
import employeeRoutes from './routes/employees'
import enterpriseRoutes from './routes/enterprises'
import evaluationRoutes from './routes/evaluations'
import repairOrderRoutes from './routes/repair-orders'
import visitorRoutes from './routes/visitors'
import workOrderRoutes from './routes/work-orders'
import { seed } from './seed'

const app = express()
const PORT = 3000

app.use(express.json())

initDb()
seed()

app.use('/api/enterprises', enterpriseRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/visitors', visitorRoutes)
app.use('/api/access-records', accessRecordRoutes)
app.use('/api/repair-orders', repairOrderRoutes)
app.use('/api/work-orders', workOrderRoutes)
app.use('/api/evaluations', evaluationRoutes)
app.use('/api/dashboard', dashboardRoutes)

app.get('/api', (_req, res) => {
  res.json({
    name: '园区物业管理系统 API',
    version: '1.0.0',
    roles: {
      gate: '门岗 - 访客核验、通行记录',
      cs: '客服 - 报修创建/跟进、访客预约、评价录入',
      engineer: '工程师 - 接单/开工/完工',
      supervisor: '主管 - 查看超时、差评、统计'
    },
    endpoints: [
      'GET    /api/enterprises',
      'POST   /api/enterprises',
      'GET    /api/employees?enterprise_id=',
      'POST   /api/employees',
      'GET    /api/visitors?status=&visit_date=',
      'POST   /api/visitors',
      'PUT    /api/visitors/:id/arrive',
      'PUT    /api/visitors/:id/cancel',
      'GET    /api/access-records?pass_type=&gate_no=',
      'POST   /api/access-records',
      'GET    /api/repair-orders?status=&overdue=',
      'POST   /api/repair-orders',
      'PUT    /api/repair-orders/:id',
      'PUT    /api/repair-orders/:id/close',
      'GET    /api/work-orders?repair_order_id=',
      'GET    /api/work-orders/mine',
      'POST   /api/work-orders',
      'PUT    /api/work-orders/:id/accept',
      'PUT    /api/work-orders/:id/start',
      'PUT    /api/work-orders/:id/complete',
      'PUT    /api/work-orders/:id/reassign',
      'GET    /api/evaluations?repair_order_id=&min_rating=',
      'POST   /api/evaluations',
      'GET    /api/dashboard/overdue-repairs',
      'GET    /api/dashboard/bad-evaluations',
      'GET    /api/dashboard/stats'
    ],
    auth: '所有接口需带 x-user-id 请求头（种子用户 id 1-6）'
  })
})

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: err.message || '服务器错误' })
})

app.listen(PORT, () => {
  console.log(`物业管理系统 API 已启动: http://localhost:${PORT}/api`)
  console.log('种子用户:')
  console.log('  id=1 门岗-张师傅 (gate)')
  console.log('  id=2 客服-小陈 (cs)')
  console.log('  id=3 客服-小刘 (cs)')
  console.log('  id=4 工程师-老王 (engineer)')
  console.log('  id=5 工程师-小赵 (engineer)')
  console.log('  id=6 主管-周经理 (supervisor)')
})
