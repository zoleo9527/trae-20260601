import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, backfillExceptionSourceIds } from './db.js';
import { seedData } from './seed.js';
import authRoutes from './routes/auth.js';
import inspectionRoutes from './routes/inspections.js';
import eggRecordRoutes from './routes/eggRecords.js';
import exceptionRoutes from './routes/exceptions.js';
import dashboardRoutes from './routes/dashboard.js';
import notificationRoutes from './routes/notifications.js';
import exportRoutes from './routes/export.js';
import attachmentRoutes from './routes/attachments.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

app.use('/api/auth', authRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/egg-records', eggRecordRoutes);
app.use('/api/exceptions', exceptionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/attachments', upload.single('file'), attachmentRoutes);

initDb();
seedData();
const backfill = backfillExceptionSourceIds();
if (backfill.fixedNull > 0 || backfill.corrected > 0) {
  console.log(`[数据回填] egg_record 异常 source_id：补回 ${backfill.fixedNull} 条，纠正 ${backfill.corrected} 条`);
}

app.listen(PORT, () => {
  console.log(`[蛋鸡养殖场] 后端服务已启动: http://localhost:${PORT}`);
});
