import { join } from 'path';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: join(process.cwd(), 'data', 'database.sqlite'),
  synchronize: true,
  logging: true,
  entities: [join(__dirname, 'entities', '*.{ts,js}')],
  migrations: [],
  subscribers: [],
});
