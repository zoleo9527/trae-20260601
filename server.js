const express = require('express');
const cors = require('cors');
const db = require('./database');
const authRoutes = require('./routes/auth');
const trainingRoutes = require('./routes/training');
const certificateRoutes = require('./routes/certificate');
const evaluationRoutes = require('./routes/evaluation');
const attendanceRoutes = require('./routes/attendance');
const exceptionRoutes = require('./routes/exception');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/certificate', certificateRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/exception', exceptionRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '培训证书系统API运行中' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

db.initialize();

app.listen(PORT, () => {
  console.log(`后端服务运行在 http://localhost:${PORT}`);
});
