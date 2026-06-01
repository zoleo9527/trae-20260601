import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppDataSource } from './data-source';
import { Class } from './entities/Class';
import { setupRoutes } from './routes';
import { seedDatabase } from './seeds';

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = join(process.cwd(), 'data');

app.use(cors());
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

setupRoutes(app);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

AppDataSource.initialize()
  .then(async () => {
    console.log('Database connected');
    
    const classRepo = AppDataSource.getRepository(Class);
    const count = await classRepo.count();
    if (count === 0) {
      console.log('Empty database detected, seeding initial data from template...');
      await seedDatabase(AppDataSource);
    }
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Database: ${DATA_DIR}/database.sqlite`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });
