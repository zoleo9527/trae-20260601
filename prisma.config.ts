import { PrismaConfig } from '@prisma/internals';
import { config } from 'dotenv';

config();

const prismaConfig: PrismaConfig = {
  schemaPath: './prisma/schema.prisma',
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  generators: [
    {
      name: 'client',
      provider: 'prisma-client-js',
      output: './.prisma/client',
    },
  ],
};

export default prismaConfig;