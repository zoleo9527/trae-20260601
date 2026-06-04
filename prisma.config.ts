import { defineConfig } from '@prisma/client';

export default defineConfig({
  datasource: {
    db: {
      url: 'file:./prisma/dev.db',
    },
  },
});
