import express from 'express';
import { initializeDatabase } from './database/index.js';
import reservationsRouter from './routes/reservations.js';
import todosRouter from './routes/todos.js';
import singerSchedulesRouter from './routes/singer-schedules.js';
import beverageStorageRouter from './routes/beverage-storage.js';
import issuesRouter from './routes/issues.js';

initializeDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/reservations', reservationsRouter);
app.use('/api/todos', todosRouter);
app.use('/api/singer-schedules', singerSchedulesRouter);
app.use('/api/beverage-storage', beverageStorageRouter);
app.use('/api/issues', issuesRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

export default app;
