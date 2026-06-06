import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user.routes';
import orderRoutes from './routes/order.routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);

app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null,
  });
});

export default app;
