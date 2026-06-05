/**
 * local server entry file, for local development
 */
import app from './app.js';
import { seed } from './seed.js';
import db from './db.js';

const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='roast_curves'").get();
if (!row) {
  seed();
  console.log('Database initialized with sample data');
} else {
  const count = db.prepare('SELECT COUNT(*) as count FROM roast_curves').get() as { count: number };
  if (count.count === 0) {
    seed();
    console.log('Database seeded with sample data');
  }
}

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;