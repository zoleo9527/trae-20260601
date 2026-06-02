/**
 * This is a API server
 */

import cors from 'cors'
import dotenv from 'dotenv'
import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { resetData } from './data/store.js'
import authRoutes from './routes/auth.js'
import complaintRoutes from './routes/complaints.js'
import faultRoutes from './routes/faults.js'
import orderRoutes from './routes/orders.js'
import settlementRoutes from './routes/settlements.js'
import stationRoutes from './routes/stations.js'
import statsRoutes from './routes/stats.js'
import workOrderRoutes from './routes/workorders.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load env
dotenv.config();

const app: express.Application = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/faults', faultRoutes);
app.use('/api/workorders', workOrderRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/stats', statsRoutes);

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * data reset
 */
app.use(
  '/api/reset',
  (req: Request, res: Response, next: NextFunction): void => {
    resetData();
    res.status(200).json({
      success: true,
      message: '数据已重置为初始状态',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
