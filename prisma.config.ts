import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';

config();

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL,
  },
  datasource: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL,
  },
});