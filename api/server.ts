import app from './app.js';
import { getDb } from './database.js';
import { detectProblems } from './detect.js';

const PORT = process.env.PORT || 3001;

process.on('uncaughtException', (err) => {
  console.error('[Fatal] Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Fatal] Unhandled rejection:', reason);
});

try {
  getDb();
  const initialDetect = detectProblems();
  const initialNew = initialDetect.filter(r => r.isNew).length;
  if (initialNew > 0) {
    console.log(`[Startup] ${initialNew} problem(s) detected during startup`);
  }
} catch (err) {
  console.error('[Startup] Error during initialization:', err);
}

const server = app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

const DETECT_INTERVAL = 5 * 60 * 1000;
const detectTimer = setInterval(() => {
  try {
    const result = detectProblems();
    const newCount = result.filter(r => r.isNew).length;
    if (newCount > 0) {
      console.log(`[AutoDetect] ${newCount} new problem(s) detected at ${new Date().toISOString()}`);
    }
  } catch (err) {
    console.error('[AutoDetect] Error:', err);
  }
}, DETECT_INTERVAL);

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  clearInterval(detectTimer);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  clearInterval(detectTimer);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;