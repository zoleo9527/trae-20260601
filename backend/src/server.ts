import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users';
import customersRouter from './routes/customers';
import documentsRouter from './routes/documents';
import dueDiligenceRouter from './routes/dueDiligence';
import notificationsRouter from './routes/notifications';
import handoffsRouter from './routes/handoffs';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/due-diligence', dueDiligenceRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/handoffs', handoffsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
