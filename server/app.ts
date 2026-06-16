import express from 'express';
import cors from 'cors';
import sequelize from './config/database';
import { seedData } from './utils/seedData';
import usersRouter from './routes/users';
import soupBasesRouter from './routes/soupBases';
import soldOutsRouter from './routes/soldOuts';
import ordersRouter from './routes/orders';
import auditLogsRouter from './routes/auditLogs';
import todoItemsRouter from './routes/todoItems';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/soupBases', soupBasesRouter);
app.use('/api/soldOuts', soldOutsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/auditLogs', auditLogsRouter);
app.use('/api/todoItems', todoItemsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    
    await sequelize.sync({ force: true });
    console.log('Database synced');
    
    await seedData();
    console.log('Seed data inserted');
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();
