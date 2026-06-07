const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'dairy.db');
if (!fs.existsSync(dbPath)) {
  console.log('数据库不存在，正在初始化...');
  require('./initDB');
}

const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const checkinRoutes = require('./routes/checkins');
const exceptionRoutes = require('./routes/exceptions');
const replenishmentRoutes = require('./routes/replenishments');
const timelineRoutes = require('./routes/timeline');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/exceptions', exceptionRoutes);
app.use('/api/replenishments', replenishmentRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '乳品配送站服务运行正常' });
});

app.listen(PORT, () => {
  console.log(`乳品配送站后端服务已启动: http://localhost:${PORT}`);
  console.log(`API文档: http://localhost:${PORT}/api/health`);
});
