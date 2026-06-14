import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users';
import customersRouter from './routes/customers';
import documentsRouter from './routes/documents';
import dueDiligenceRouter from './routes/dueDiligence';
import notificationsRouter from './routes/notifications';
import handoffsRouter from './routes/handoffs';
import { authenticate } from './middleware/auth';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/customers', authenticate, customersRouter);
app.use('/api/documents', authenticate, documentsRouter);
app.use('/api/due-diligence', authenticate, dueDiligenceRouter);
app.use('/api/notifications', authenticate, notificationsRouter);
app.use('/api/handoffs', authenticate, handoffsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
