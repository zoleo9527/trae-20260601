import cors from 'cors';
import express from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import './db.js';
import { checkOverdue } from './overdueCheck.js';
import alertRoutes from './routes/alerts.js';
import authRoutes from './routes/auth.js';
import consumableRoutes from './routes/consumables.js';
import logRoutes from './routes/logs.js';
import patientRoutes from './routes/patients.js';
import scheduleRoutes from './routes/schedules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/consumables', consumableRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/logs', logRoutes);

const clientDist = join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(join(clientDist, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`种植牙追踪系统后端运行在 http://localhost:${PORT}`);
  checkOverdue();
  setInterval(checkOverdue, 60 * 60 * 1000);
});

export { checkOverdue };
