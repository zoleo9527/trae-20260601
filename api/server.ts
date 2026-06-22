import app from './app.js'
import { initDb } from './db.js'

const PORT = process.env.PORT || 3001

initDb()

app.listen(PORT, () => {
  console.log(`再生资源分拣中心-调价审核与库存锁价系统运行在 http://localhost:${PORT}`)
})
