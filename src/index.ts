import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { sequelize } from './config/database';
import './models/associations';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api', routes);

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await sequelize.sync({ force: false });
    console.log('Database synchronized');
  } catch (error) {
    console.error('Database synchronization failed:', error);
  }
});

export default app;