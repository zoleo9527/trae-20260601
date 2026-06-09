const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const animalRoutes = require('./routes/animals');
const visitRoutes = require('./routes/visits');
const recallRoutes = require('./routes/recalls');
const attachmentRoutes = require('./routes/attachments');
const handoverRoutes = require('./routes/handover');
const batchRoutes = require('./routes/batch');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/recalls', recallRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/handover', handoverRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`后端服务运行在 http://localhost:${PORT}`);
});
