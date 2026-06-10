import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }
  const db = getDb();
  const user = db.prepare('SELECT id, username, name, role, phone FROM users WHERE username = ? AND password = ?').get(username, password);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  res.json({ user });
});

router.get('/demo-accounts', (req, res) => {
  const db = getDb();
  const accounts = db.prepare("SELECT id, username, name, role, phone FROM users ORDER BY CASE role WHEN 'manager' THEN 1 WHEN 'feeder' THEN 2 WHEN 'sorter' THEN 3 END").all();
  res.json({ accounts });
});

router.get('/users', (req, res) => {
  const db = getDb();
  const { role } = req.query;
  let sql = 'SELECT id, username, name, role, phone FROM users';
  const params = [];
  if (role) {
    sql += ' WHERE role = ?';
    params.push(role);
  }
  sql += ' ORDER BY role, name';
  res.json({ users: db.prepare(sql).all(...params) });
});

export default router;
