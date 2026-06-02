import express from 'express';
import cors from 'cors';
import { initDatabase } from './database';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

initDatabase();

app.use('/api', routes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '校车管理系统 API 运行正常' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
});

export default app;
