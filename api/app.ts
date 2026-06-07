
import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import promotionRoutes from './routes/promotions.js';
import inspectionRoutes from './routes/inspections.js';
import systemRoutes from './routes/system.js';

dotenv.config();

try {
  initDatabase();
} catch (error) {
  console.error('Database init error:', error);
}

const app: express.Application = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/system', systemRoutes);

app.use(
  '/api/health',
  (_req: Request, res: Response, _next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    });
  },
);

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  });
});

export default app;
