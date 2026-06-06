const express = require('express');
const cors = require('cors');
const path = require('path');
const { loadDB, saveDB, uuidv4 } = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function getClassById(db, classId) {
  return db.classes.find(c => c.id === classId);
}

app.get('/api/classes', (req, res) => {
  const db = loadDB();
  const withCounts = db.classes.map(c => ({
    ...c,
    _count: {
      meals: db.meals.filter(m => m.classId === c.id).length,
      feedbacks: db.feedbacks.filter(f => f.classId === c.id).length
    }
  }));
  res.json(withCounts);
});

app.post('/api/classes', (req, res) => {
  const db = loadDB();
  const { name, grade, teacher, students } = req.body;
  const newClass = { id: uuidv4(), name, grade, teacher, students, createdAt: new Date().toISOString() };
  db.classes.push(newClass);
  saveDB(db);
  res.json(newClass);
});

app.post('/api/meals', (req, res) => {
  const db = loadDB();
  const { classId, mealDate, mealType, quantity, receivedBy, notes } = req.body;
  const now = new Date().toISOString();
  const meal = {
    id: uuidv4(),
    classId,
    mealDate,
    mealType,
    quantity,
    receivedBy,
    receivedAt: now,
    status: 'DELIVERED',
    notes: notes || null,
    archived: false,
    archivedAt: null,
    archivedBy: null,
    createdAt: now
  };
  db.meals.unshift(meal);
  saveDB(db);
  res.json({ ...meal, class: getClassById(db, classId) });
});

app.get('/api/meals', (req, res) => {
  const db = loadDB();
  const { classId, date, archived } = req.query;
  
  let meals = [...db.meals];
  if (classId) meals = meals.filter(m => m.classId === classId);
  if (date) meals = meals.filter(m => m.mealDate === date);
  if (archived !== undefined) meals = meals.filter(m => m.archived === (archived === 'true'));
  
  const result = meals.map(m => ({
    ...m,
    class: getClassById(db, m.classId),
    feedbacks: db.feedbacks.filter(f => f.mealRecordId === m.id)
  }));
  
  res.json(result);
});

app.get('/api/meals/:id', (req, res) => {
  const db = loadDB();
  const meal = db.meals.find(m => m.id === req.params.id);
  if (!meal) return res.status(404).json({ error: '记录不存在' });
  
  res.json({
    ...meal,
    class: getClassById(db, meal.classId),
    feedbacks: db.feedbacks.filter(f => f.mealRecordId === meal.id)
  });
});

app.post('/api/feedbacks', (req, res) => {
  const db = loadDB();
  const { classId, mealRecordId, mealDate, mealType, feedbackType, description, reportedBy } = req.body;
  const now = new Date().toISOString();
  const feedback = {
    id: uuidv4(),
    classId,
    mealRecordId: mealRecordId || null,
    mealDate,
    mealType,
    feedbackType,
    description,
    reportedBy,
    reportedAt: now,
    status: 'PENDING',
    handledBy: null,
    handledAt: null,
    handleNotes: null,
    archived: false,
    archivedAt: null,
    archivedBy: null,
    createdAt: now
  };
  db.feedbacks.unshift(feedback);
  saveDB(db);
  res.json({ ...feedback, class: getClassById(db, classId) });
});

app.get('/api/feedbacks', (req, res) => {
  const db = loadDB();
  const { classId, status, archived } = req.query;
  
  let feedbacks = [...db.feedbacks];
  if (classId) feedbacks = feedbacks.filter(f => f.classId === classId);
  if (status) feedbacks = feedbacks.filter(f => f.status === status);
  if (archived !== undefined) feedbacks = feedbacks.filter(f => f.archived === (archived === 'true'));
  
  const result = feedbacks.map(f => ({
    ...f,
    class: getClassById(db, f.classId)
  }));
  
  res.json(result);
});

app.get('/api/feedbacks/:id', (req, res) => {
  const db = loadDB();
  const fb = db.feedbacks.find(f => f.id === req.params.id);
  if (!fb) return res.status(404).json({ error: '反馈不存在' });
  
  let mealRecord = null;
  if (fb.mealRecordId) {
    mealRecord = db.meals.find(m => m.id === fb.mealRecordId) || null;
  }
  
  res.json({ ...fb, class: getClassById(db, fb.classId), mealRecord });
});

app.put('/api/feedbacks/:id/handle', (req, res) => {
  const db = loadDB();
  const { handledBy, handleNotes, status } = req.body;
  const idx = db.feedbacks.findIndex(f => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '反馈不存在' });
  
  db.feedbacks[idx] = {
    ...db.feedbacks[idx],
    handledBy,
    handledAt: new Date().toISOString(),
    handleNotes,
    status: status || 'RESOLVED'
  };
  saveDB(db);
  res.json({ ...db.feedbacks[idx], class: getClassById(db, db.feedbacks[idx].classId) });
});

app.post('/api/archive/meal/:id', (req, res) => {
  const db = loadDB();
  const { archivedBy } = req.body;
  const idx = db.meals.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '记录不存在' });
  
  db.meals[idx] = {
    ...db.meals[idx],
    archived: true,
    archivedAt: new Date().toISOString(),
    archivedBy
  };
  saveDB(db);
  res.json(db.meals[idx]);
});

app.post('/api/archive/feedback/:id', (req, res) => {
  const db = loadDB();
  const { archivedBy } = req.body;
  const idx = db.feedbacks.findIndex(f => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '反馈不存在' });
  
  db.feedbacks[idx] = {
    ...db.feedbacks[idx],
    archived: true,
    archivedAt: new Date().toISOString(),
    archivedBy
  };
  saveDB(db);
  res.json(db.feedbacks[idx]);
});

app.get('/api/dashboard', (req, res) => {
  const db = loadDB();
  const today = new Date().toISOString().split('T')[0];
  
  const todayMeals = db.meals.filter(m => m.mealDate >= today).length;
  const pendingFeedbacks = db.feedbacks.filter(f => f.status === 'PENDING' && !f.archived).length;
  
  res.json({
    todayMeals,
    pendingFeedbacks,
    totalClasses: db.classes.length,
    totalMeals: db.meals.length,
    totalFeedbacks: db.feedbacks.length
  });
});

app.get('/api/docs', (req, res) => {
  res.json({
    title: '学校食堂班级取餐与缺餐反馈系统 API 文档',
    version: '1.0.0',
    endpoints: [
      { method: 'GET', path: '/api/classes', desc: '获取所有班级列表' },
      { method: 'POST', path: '/api/classes', desc: '创建新班级' },
      { method: 'GET', path: '/api/meals', desc: '获取取餐记录列表，支持按班级、日期、归档状态筛选' },
      { method: 'POST', path: '/api/meals', desc: '记录班级取餐' },
      { method: 'GET', path: '/api/meals/:id', desc: '获取取餐记录详情' },
      { method: 'GET', path: '/api/feedbacks', desc: '获取缺餐反馈列表，支持按状态、班级筛选' },
      { method: 'POST', path: '/api/feedbacks', desc: '提交缺餐反馈' },
      { method: 'GET', path: '/api/feedbacks/:id', desc: '获取反馈详情' },
      { method: 'PUT', path: '/api/feedbacks/:id/handle', desc: '处理缺餐反馈' },
      { method: 'POST', path: '/api/archive/meal/:id', desc: '归档取餐记录' },
      { method: 'POST', path: '/api/archive/feedback/:id', desc: '归档反馈记录' },
      { method: 'GET', path: '/api/dashboard', desc: '获取仪表盘统计数据' },
      { method: 'GET', path: '/api/docs', desc: '获取API文档' }
    ]
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('🍱 ======================================');
  console.log('   学校食堂 - 班级取餐与缺餐反馈系统');
  console.log('   ======================================');
  console.log(`   🚀 服务地址:  http://localhost:${PORT}`);
  console.log(`   📄 API 文档:  http://localhost:${PORT}/api/docs`);
  console.log('');
  console.log('   💡 功能说明:');
  console.log('      - 班级取餐记录与详情查询');
  console.log('      - 缺餐反馈提交与处理');
  console.log('      - 数据归档与追溯');
  console.log('      - 一线与管理端数据统一');
  console.log('');
});
