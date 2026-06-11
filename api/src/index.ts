import express from 'express';
import cors from 'cors';
import './database.js';
import './seed.js';
import documentsRouter from './routes/documents.js';
import exceptionsRouter from './routes/exceptions.js';
import dashboardRouter from './routes/dashboard.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/documents', documentsRouter);
app.use('/api/documents', exceptionsRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((_req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
