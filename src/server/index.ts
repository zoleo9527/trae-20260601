import express from 'express';
import cors from 'cors';
import outOfStockRouter from './routes/outOfStock';
import replenishRouter from './routes/replenish';
import logsRouter from './routes/logs';
import storesRouter from './routes/stores';
import dishesRouter from './routes/dishes';
import './database';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/out-of-stock', outOfStockRouter);
app.use('/api/replenish', replenishRouter);
app.use('/api/logs', logsRouter);
app.use('/api/stores', storesRouter);
app.use('/api/dishes', dishesRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '餐饮连锁门店管理系统 API 运行正常' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
