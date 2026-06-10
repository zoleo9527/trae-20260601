const express = require('express');
const cors = require('cors');
const complaintRoutes = require('./routes/complaintRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = 8081;

app.use(cors());
app.use(express.json());

app.use('/api/complaints', complaintRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '观光果园投诉系统后端服务运行中' });
});

app.listen(PORT, () => {
  console.log(`后端服务运行在 http://localhost:${PORT}`);
});
