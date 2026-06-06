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

function buildTimeline(meal, feedbacks) {
  const events = [];
  
  events.push({
    type: 'MEAL_DELIVERED',
    time: meal.receivedAt,
    title: '取餐完成',
    content: `${meal.receivedBy} 领取了 ${meal.quantity} 份${meal.mealType}${meal.notes ? '，备注：' + meal.notes : ''}`,
    operator: meal.receivedBy
  });
  
  feedbacks.forEach(fb => {
    events.push({
      type: 'FEEDBACK_SUBMITTED',
      time: fb.reportedAt,
      title: '问题反馈',
      content: `${fb.reportedBy} 提交${getFeedbackTypeLabel(fb.feedbackType)}：${fb.description}`,
      operator: fb.reportedBy,
      feedbackId: fb.id
    });
    
    if (fb.handledAt) {
      events.push({
        type: 'FEEDBACK_HANDLED',
        time: fb.handledAt,
        title: '反馈已处理',
        content: `${fb.handledBy} 处理结果：${fb.handleNotes}（${getStatusLabel(fb.status)}）`,
        operator: fb.handledBy,
        feedbackId: fb.id
      });
    }
    
    if (fb.archivedAt) {
      events.push({
        type: 'FEEDBACK_ARCHIVED',
        time: fb.archivedAt,
        title: '反馈已归档',
        content: `${fb.archivedBy} 归档了此反馈记录`,
        operator: fb.archivedBy,
        feedbackId: fb.id
      });
    }
  });
  
  if (meal.archivedAt) {
    events.push({
      type: 'MEAL_ARCHIVED',
      time: meal.archivedAt,
      title: '取餐记录已归档',
      content: `${meal.archivedBy} 归档了此取餐记录及关联反馈`,
      operator: meal.archivedBy
    });
  }
  
  return events.sort((a, b) => new Date(a.time) - new Date(b.time));
}

function getFeedbackTypeLabel(type) {
  const map = { MISSING: '缺餐/少餐', QUALITY: '质量问题', LATE: '送餐延迟', OTHER: '其他' };
  return map[type] || type;
}

function getStatusLabel(status) {
  const map = { PENDING: '待处理', RESOLVED: '已解决', REJECTED: '已驳回' };
  return map[status] || status;
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

app.get('/api/classes/:id/available-meals', (req, res) => {
  const db = loadDB();
  const meals = db.meals.filter(m => m.classId === req.params.id && !m.archived);
  res.json(meals);
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
  
  const feedbacks = db.feedbacks.filter(f => f.mealRecordId === meal.id);
  const timeline = buildTimeline(meal, feedbacks);
  
  res.json({
    ...meal,
    class: getClassById(db, meal.classId),
    feedbacks,
    timeline
  });
});

app.post('/api/feedbacks', (req, res) => {
  const db = loadDB();
  const { mealRecordId, feedbackType, description, reportedBy } = req.body;
  
  if (!mealRecordId) {
    return res.status(400).json({ error: '必须关联对应的取餐记录' });
  }
  
  const meal = db.meals.find(m => m.id === mealRecordId);
  if (!meal) {
    return res.status(400).json({ error: '关联的取餐记录不存在' });
  }
  
  if (meal.archived) {
    return res.status(400).json({ error: '该取餐记录已归档，不能再提交反馈' });
  }
  
  const now = new Date().toISOString();
  const feedback = {
    id: uuidv4(),
    classId: meal.classId,
    mealRecordId,
    mealDate: meal.mealDate,
    mealType: meal.mealType,
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
  res.json({ ...feedback, class: getClassById(db, meal.classId), mealRecord: meal });
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
    class: getClassById(db, f.classId),
    mealRecord: db.meals.find(m => m.id === f.mealRecordId) || null
  }));
  
  res.json(result);
});

app.get('/api/feedbacks/:id', (req, res) => {
  const db = loadDB();
  const fb = db.feedbacks.find(f => f.id === req.params.id);
  if (!fb) return res.status(404).json({ error: '反馈不存在' });
  
  const meal = db.meals.find(m => m.id === fb.mealRecordId) || null;
  const allFeedbacksForMeal = meal ? db.feedbacks.filter(f => f.mealRecordId === meal.id) : [fb];
  const timeline = meal ? buildTimeline(meal, allFeedbacksForMeal) : [];
  
  res.json({ 
    ...fb, 
    class: getClassById(db, fb.classId), 
    mealRecord: meal,
    timeline
  });
});

app.put('/api/feedbacks/:id/handle', (req, res) => {
  const db = loadDB();
  const { handledBy, handleNotes, status } = req.body;
  const idx = db.feedbacks.findIndex(f => f.id === req.params.id);
  
  if (idx === -1) return res.status(404).json({ error: '反馈不存在' });
  
  const feedback = db.feedbacks[idx];
  
  if (feedback.archived) {
    return res.status(400).json({ error: '该反馈已归档，不能再处理' });
  }
  
  const meal = db.meals.find(m => m.id === feedback.mealRecordId);
  if (meal && meal.archived) {
    return res.status(400).json({ error: '关联的取餐记录已归档，不能再处理此反馈' });
  }
  
  db.feedbacks[idx] = {
    ...feedback,
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
  
  const meal = db.meals[idx];
  if (meal.archived) {
    return res.status(400).json({ error: '该取餐记录已归档' });
  }
  
  const now = new Date().toISOString();
  db.meals[idx] = {
    ...meal,
    archived: true,
    archivedAt: now,
    archivedBy
  };
  
  db.feedbacks.forEach((fb, fbIdx) => {
    if (fb.mealRecordId === meal.id && !fb.archived) {
      db.feedbacks[fbIdx] = {
        ...fb,
        archived: true,
        archivedAt: now,
        archivedBy
      };
    }
  });
  
  saveDB(db);
  res.json(db.meals[idx]);
});

app.post('/api/archive/feedback/:id', (req, res) => {
  const db = loadDB();
  const { archivedBy } = req.body;
  const idx = db.feedbacks.findIndex(f => f.id === req.params.id);
  
  if (idx === -1) return res.status(404).json({ error: '反馈不存在' });
  
  const feedback = db.feedbacks[idx];
  if (feedback.archived) {
    return res.status(400).json({ error: '该反馈已归档' });
  }
  
  if (feedback.status === 'PENDING') {
    return res.status(400).json({ error: '待处理的反馈不能归档，请先处理' });
  }
  
  db.feedbacks[idx] = {
    ...feedback,
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
    version: '2.0.0',
    features: [
      '提交反馈必须关联取餐记录',
      '归档后只读约束，禁止修改',
      '完整时间线追溯'
    ],
    endpoints: [
      { method: 'GET', path: '/api/classes', desc: '获取所有班级列表' },
      { method: 'GET', path: '/api/classes/:id/available-meals', desc: '获取班级可关联的未归档取餐记录' },
      { method: 'GET', path: '/api/meals', desc: '获取取餐记录列表' },
      { method: 'POST', path: '/api/meals', desc: '记录班级取餐' },
      { method: 'GET', path: '/api/meals/:id', desc: '取餐详情（含完整时间线）' },
      { method: 'GET', path: '/api/feedbacks', desc: '获取反馈列表' },
      { method: 'POST', path: '/api/feedbacks', desc: '提交反馈（必须关联mealRecordId）' },
      { method: 'GET', path: '/api/feedbacks/:id', desc: '反馈详情（含完整时间线）' },
      { method: 'PUT', path: '/api/feedbacks/:id/handle', desc: '处理反馈（已归档禁止）' },
      { method: 'POST', path: '/api/archive/meal/:id', desc: '归档取餐（同时归档其下所有反馈）' },
      { method: 'POST', path: '/api/archive/feedback/:id', desc: '归档反馈（待处理禁止归档）' },
      { method: 'GET', path: '/api/dashboard', desc: '仪表盘统计' }
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
  console.log('   ✅ 追溯闭环已启用:');
  console.log('      - 反馈必须关联取餐记录');
  console.log('      - 详情展示完整时间线');
  console.log('      - 归档后只读不可修改');
  console.log('');
});
