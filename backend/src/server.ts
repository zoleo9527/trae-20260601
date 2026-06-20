import express from 'express';
import cors from 'cors';
import path from 'path';
import batchRoutes from './routes/batch.routes';
import sortingRoutes from './routes/sorting.routes';
import gradeRoutes from './routes/grade.routes';
import inventoryRoutes from './routes/inventory.routes';
import userRoutes from './routes/user.routes';
import priceRoutes from './routes/price.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const frontendDir = path.join(__dirname, '../../frontend');
app.use(express.static(frontendDir));

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: '再生资源分拣中心品级确认系统 API 运行正常',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/batches', batchRoutes);
app.use('/api/sorting', sortingRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/prices', priceRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'API 端点不存在' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 再生资源分拣中心品级确认系统`);
  console.log(`📡 服务器运行在: http://localhost:${PORT}`);
  console.log(`📚 API 文档: http://localhost:${PORT}/api/health\n`);
});

export default app;
