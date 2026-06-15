import express from 'express';
import cors from 'cors';
import { initDatabase, seedData } from './database';
import ordersRouter from './api/orders';
import locationsRouter from './api/locations';
import deliveryNotesRouter from './api/deliveryNotes';
import usersRouter from './api/users';
import logsRouter from './api/logs';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

app.use('/api/orders', ordersRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/delivery-notes', deliveryNotesRouter);
app.use('/api/users', usersRouter);
app.use('/api/logs', logsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  try {
    await initDatabase();
    await seedData();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
