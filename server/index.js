const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { initDB } = require('./db');
const { seed } = require('./seed');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

initDB();
seed();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/users', require('./routes/users'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/tax-filings', require('./routes/taxFilings'));
app.use('/api/exceptions', require('./routes/exceptions'));
app.use('/api/logs', require('./routes/logs'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/stats', (req, res) => {
  const { db } = require('./db');

  const filingStats = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM tax_filings
    GROUP BY status
  `).all();

  const exceptionStats = db.prepare(`
    SELECT type, COUNT(*) as count
    FROM exceptions
    WHERE status IN ('open', 'processing')
    GROUP BY type
  `).all();

  const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
  const filingCount = db.prepare('SELECT COUNT(*) as count FROM tax_filings').get().count;
  const exceptionOpenCount = db.prepare("SELECT COUNT(*) as count FROM exceptions WHERE status IN ('open', 'processing')").get().count;

  res.json({
    customerCount,
    filingCount,
    exceptionOpenCount,
    filingStats,
    exceptionStats,
  });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   会计代账公司 - 税期申报与异常提醒系统                  ║
║                                                          ║
║   后端服务已启动: http://localhost:${PORT}                    ║
║   API 文档:                                              ║
║     - GET  /api/health          健康检查                  ║
║     - GET  /api/stats           统计数据                  ║
║     - GET  /api/users           用户列表                  ║
║     - GET  /api/customers       客户列表                  ║
║     - GET  /api/tax-filings     税期申报列表              ║
║     - GET  /api/exceptions      异常提醒列表              ║
║     - GET  /api/logs            操作日志                  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});
