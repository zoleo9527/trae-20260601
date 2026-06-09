import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './repositories/db.js';
import salesRouter from './routes/sales.js';
import inventoryRouter from './routes/inventory.js';
import creditRouter from './routes/credit.js';
import db from './repositories/db.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Routes
app.use('/api/sales', salesRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/credit', creditRouter);

// 获取农药列表（用于下拉选择）
app.get('/api/pesticides', (req, res) => {
  try {
    const pesticides = db.prepare('SELECT * FROM pesticides ORDER BY name ASC').all();
    res.json({ success: true, data: pesticides });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// 获取客户列表（用于下拉选择）
app.get('/api/customers', (req, res) => {
  try {
    const customers = db.prepare('SELECT * FROM customers ORDER BY name ASC').all();
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// 获取用户列表（用于选择当前用户模拟登录）
app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, role FROM users ORDER BY role, name ASC').all();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
