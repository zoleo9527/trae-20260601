import { readDB, writeDB, getNow } from '../utils/storage.js';

export const getTalents = (req, res) => {
  const db = readDB();
  res.json({ code: 0, data: db.talents || [] });
};

export const getBrands = (req, res) => {
  const db = readDB();
  res.json({ code: 0, data: db.brands || [] });
};

export const getTodos = (req, res) => {
  const db = readDB();
  res.json({ code: 0, data: db.todos || [] });
};

export const updateTodo = (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = (db.todos || []).findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ code: 1, message: '待办不存在' });
  }

  db.todos[index] = {
    ...db.todos[index],
    ...req.body,
  };

  writeDB(db);
  res.json({ code: 0, data: db.todos[index], message: '更新成功' });
};

export const getRisks = (req, res) => {
  const db = readDB();
  res.json({ code: 0, data: db.risks || [] });
};

export const getRecentChanges = (req, res) => {
  const db = readDB();
  const changes = (db.recentChanges || []).slice(0, 20);
  res.json({ code: 0, data: changes });
};
