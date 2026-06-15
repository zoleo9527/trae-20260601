import express from 'express';
import cors from 'cors';
import fileRoutes from './routes/file.routes';
import batchRoutes from './routes/batch.routes';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

const DEMO_USERS = {
  'USER-W001': { id: 'USER-W001', name: '陈窗口', role: 'WINDOW_STAFF' },
  'USER-W002': { id: 'USER-W002', name: '赵窗口', role: 'WINDOW_STAFF' },
  'USER-W003': { id: 'USER-W003', name: '王窗口', role: 'WINDOW_STAFF' },
  'USER-N001': { id: 'USER-N001', name: '刘公证员', role: 'NOTARY' },
  'USER-N002': { id: 'USER-N002', name: '孙公证员', role: 'NOTARY' },
  'USER-A001': { id: 'USER-A001', name: '李档案', role: 'ARCHIVE_KEEPER' },
  'USER-A002': { id: 'USER-A002', name: '张档案', role: 'ARCHIVE_KEEPER' },
};

app.use((req, res, next) => {
  const userId = req.headers['x-user-id'] as string;
  const user = DEMO_USERS[userId];

  if (user) {
    (req as any).user = user;
  }

  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/files', fileRoutes);
app.use('/api/batch', batchRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available demo users:');
  Object.values(DEMO_USERS).forEach(user => {
    console.log(`  - ${user.id}: ${user.name} (${user.role})`);
  });
});

export default app;
