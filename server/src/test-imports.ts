import { initDb } from './db.js';
import returnsRouter from './routes/returns.js';
import reissueRouter from './routes/reissue.js';

console.log('Testing imports...');
console.log('initDb:', typeof initDb);
console.log('returnsRouter:', typeof returnsRouter);
console.log('reissueRouter:', typeof reissueRouter);

try {
  initDb();
  console.log('DB initialized successfully');
} catch (e) {
  console.error('DB init error:', e);
}
