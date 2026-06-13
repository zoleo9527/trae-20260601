const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const DATA_PATH = path.join(__dirname, 'data', 'sample_data.json');

function loadData() {
  const data = fs.readFileSync(DATA_PATH, 'utf8');
  return JSON.parse(data);
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

const STATUS_FLOW = {
  draft: ['received'],
  received: ['assessing', 'assessing_missing_items'],
  assessing: ['quoted', 'assessing'],
  quoted: ['approved', 'rejected'],
  approved: ['assigned'],
  assigned: ['translating'],
  translating: ['translated'],
  translated: ['reviewing'],
  reviewing: ['completed', 'reviewing'],
  completed: []
};

const ROLE_PERMISSIONS = {
  项目经理: [
    'receive_manuscripts',
    'view_received_manuscripts',
    'start_assessment',
    'assess_quotes',
    'approve_quotes',
    'reject_quotes',
    'assign_translator',
    'assign_reviewer',
    'view_all_manuscripts'
  ],
  译员: [
    'view_assigned_manuscripts',
    'start_translation',
    'update_translation_progress',
    'submit_translation'
  ],
  审校: [
    'view_assigned_reviews',
    'start_review',
    'update_review_progress',
    'submit_review'
  ],
  管理员: ['all']
};

function hasPermission(role, action) {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  if (permissions.includes('all')) return true;
  return permissions.includes(action);
}

function validateStatusTransition(fromStatus, toStatus) {
  const allowedTransitions = STATUS_FLOW[fromStatus];
  return allowedTransitions && allowedTransitions.includes(toStatus);
}

app.get('/api/today-tasks/:userId', (req, res) => {
  const { userId } = req.params;
  const data = loadData();
  const user = data.users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const todayTasks = data.manuscripts.filter(m => 
    m.current_handler_id === userId && 
    !['completed', 'draft'].includes(m.status)
  );

  const taskDetails = todayTasks.map(task => {
    const quote = data.quotes.find(q => q.manuscript_id === task.id);
    const history = data.workflow_history
      .filter(h => h.manuscript_id === task.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 3);

    return {
      ...task,
      quote,
      recent_history: history
    };
  });

  res.json({
    user,
    tasks: taskDetails,
    summary: {
      total: taskDetails.length,
      received: taskDetails.filter(t => t.status === 'received').length,
      assessing: taskDetails.filter(t => t.status === 'assessing').length,
      translating: taskDetails.filter(t => t.status === 'translating').length,
      reviewing: taskDetails.filter(t => t.status === 'reviewing').length
    }
  });
});

app.get('/api/manuscripts/:id', (req, res) => {
  const { id } = req.params;
  const data = loadData();
  
  const manuscript = data.manuscripts.find(m => m.id === id);
  if (!manuscript) {
    return res.status(404).json({ error: '稿件不存在' });
  }

  const quote = data.quotes.find(q => q.manuscript_id === id);
  const history = data.workflow_history
    .filter(h => h.manuscript_id === id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  const glossary = manuscript.glossary_id ? 
    data.glossaries.find(g => g.id === manuscript.glossary_id) : null;
  
  const feedbacks = manuscript.client_feedback_ids.map(fid => 
    data.client_feedbacks.find(cf => cf.id === fid)
  ).filter(Boolean);

  res.json({
    manuscript,
    quote,
    history,
    glossary,
    feedbacks
  });
});

app.post('/api/manuscripts/:id/receive', (req, res) => {
  const { id } = req.params;
  const { operator_id, notes, glossary_id, client_feedback_ids } = req.body;
  const data = loadData();

  const manuscript = data.manuscripts.find(m => m.id === id);
  if (!manuscript) {
    return res.status(404).json({ error: '稿件不存在' });
  }

  if (!validateStatusTransition(manuscript.status, 'received')) {
    return res.status(400).json({ 
      error: '状态流转不合规',
      current_status: manuscript.status,
      allowed_next: STATUS_FLOW[manuscript.status]
    });
  }

  const operator = data.users.find(u => u.id === operator_id);
  if (!operator || !hasPermission(operator.role, 'receive_manuscripts')) {
    return res.status(403).json({ error: '无接收权限' });
  }

  const oldStatus = manuscript.status;
  manuscript.status = 'received';
  manuscript.received_at = new Date().toISOString();
  manuscript.received_by = operator.name;
  manuscript.current_handler_id = operator_id;
  manuscript.current_handler_role = operator.role;
  manuscript.reception_notes = notes;
  
  if (glossary_id) {
    manuscript.glossary_id = glossary_id;
    manuscript.terms_connected = true;
  }
  
  if (client_feedback_ids && client_feedback_ids.length > 0) {
    manuscript.client_feedback_ids = client_feedback_ids;
    manuscript.feedback_connected = true;
  }

  const historyEntry = {
    id: `WH${Date.now()}`,
    manuscript_id: id,
    operator_id,
    operator_name: operator.name,
    operator_role: operator.role,
    action: 'receive',
    from_status: oldStatus,
    to_status: 'received',
    notes,
    context_passed: {
      to_module: 'quote_assessment',
      has_glossary: !!glossary_id,
      has_feedback: client_feedback_ids && client_feedback_ids.length > 0
    },
    created_at: new Date().toISOString()
  };

  data.workflow_history.push(historyEntry);
  saveData(data);

  res.json({
    success: true,
    manuscript,
    history: historyEntry
  });
});

app.post('/api/manuscripts/:id/connect-glossary', (req, res) => {
  const { id } = req.params;
  const { operator_id, glossary_id } = req.body;
  const data = loadData();

  const manuscript = data.manuscripts.find(m => m.id === id);
  if (!manuscript) {
    return res.status(404).json({ error: '稿件不存在' });
  }

  const operator = data.users.find(u => u.id === operator_id);
  if (!operator || !hasPermission(operator.role, 'assess_quotes')) {
    return res.status(403).json({ error: '无操作权限' });
  }

  const glossary = data.glossaries.find(g => g.id === glossary_id);
  if (!glossary) {
    return res.status(404).json({ error: '术语表不存在' });
  }

  manuscript.glossary_id = glossary_id;
  manuscript.terms_connected = true;

  const historyEntry = {
    id: `WH${Date.now()}`,
    manuscript_id: id,
    operator_id,
    operator_name: operator.name,
    operator_role: operator.role,
    action: 'connect_glossary',
    notes: `关联客户提供的术语表${glossary.version}，共${glossary.term_count}条专业术语`,
    context_passed: {
      glossary_id,
      glossary_version: glossary.version,
      term_count: glossary.term_count
    },
    created_at: new Date().toISOString()
  };

  data.workflow_history.push(historyEntry);
  saveData(data);

  res.json({
    success: true,
    manuscript,
    glossary,
    history: historyEntry
  });
});

app.post('/api/manuscripts/:id/connect-feedback', (req, res) => {
  const { id } = req.params;
  const { operator_id, feedback_ids } = req.body;
  const data = loadData();

  const manuscript = data.manuscripts.find(m => m.id === id);
  if (!manuscript) {
    return res.status(404).json({ error: '稿件不存在' });
  }

  const operator = data.users.find(u => u.id === operator_id);
  if (!operator || !hasPermission(operator.role, 'assess_quotes')) {
    return res.status(403).json({ error: '无操作权限' });
  }

  manuscript.client_feedback_ids = [...new Set([
    ...(manuscript.client_feedback_ids || []),
    ...feedback_ids
  ])];
  manuscript.feedback_connected = true;

  const feedbacks = manuscript.client_feedback_ids.map(fid => 
    data.client_feedbacks.find(cf => cf.id === fid)
  ).filter(Boolean);

  const historyEntry = {
    id: `WH${Date.now()}`,
    manuscript_id: id,
    operator_id,
    operator_name: operator.name,
    operator_role: operator.role,
    action: 'connect_feedback',
    notes: `关联客户历史反馈：${feedbacks.map(f => f.summary).join('; ')}`,
    context_passed: {
      feedback_ids,
      feedback_summary: feedbacks.map(f => ({ id: f.id, summary: f.summary }))
    },
    created_at: new Date().toISOString()
  };

  data.workflow_history.push(historyEntry);
  saveData(data);

  res.json({
    success: true,
    manuscript,
    feedbacks,
    history: historyEntry
  });
});

app.post('/api/manuscripts/:id/start-assessment', (req, res) => {
  const { id } = req.params;
  const { operator_id, notes } = req.body;
  const data = loadData();

  const manuscript = data.manuscripts.find(m => m.id === id);
  if (!manuscript) {
    return res.status(404).json({ error: '稿件不存在' });
  }

  if (!validateStatusTransition(manuscript.status, 'assessing')) {
    return res.status(400).json({ 
      error: '状态流转不合规',
      current_status: manuscript.status,
      allowed_next: STATUS_FLOW[manuscript.status]
    });
  }

  const operator = data.users.find(u => u.id === operator_id);
  if (!operator || !hasPermission(operator.role, 'start_assessment')) {
    return res.status(403).json({ error: '无启动评估权限' });
  }

  const oldStatus = manuscript.status;
  manuscript.status = 'assessing';
  manuscript.current_handler_id = operator_id;
  manuscript.current_handler_role = operator.role;

  const pendingItems = [];
  if (!manuscript.terms_connected) {
    pendingItems.push({
      item: '术语表',
      status: 'missing',
      required: true,
      message: '建议客户提供术语表以确保报价准确性'
    });
  }
  if (!manuscript.feedback_connected) {
    pendingItems.push({
      item: '客户反馈',
      status: 'missing',
      required: false,
      message: '如有历史反馈可提高翻译质量'
    });
  }

  const quote = {
    id: `QT${Date.now()}`,
    manuscript_id: id,
    status: 'pending_assessment',
    assessor_id: operator_id,
    assessor_name: operator.name,
    pending_items: pendingItems,
    created_at: new Date().toISOString()
  };

  data.quotes.push(quote);
  manuscript.quote_id = quote.id;
  manuscript.quote_status = 'pending_assessment';

  const contextSummary = [
    manuscript.terms_connected ? '术语表已关联' : '术语表缺失',
    manuscript.feedback_connected ? '客户偏好已记录' : '无客户偏好记录'
  ].join('，');

  const historyEntry = {
    id: `WH${Date.now()}`,
    manuscript_id: id,
    operator_id,
    operator_name: operator.name,
    operator_role: operator.role,
    action: 'start_assessment',
    from_status: oldStatus,
    to_status: 'assessing',
    notes: notes || '开始报价评估',
    context_passed: {
      from_module: 'reception',
      has_glossary: manuscript.terms_connected,
      has_feedback: manuscript.feedback_connected,
      context_summary: contextSummary
    },
    created_at: new Date().toISOString()
  };

  data.workflow_history.push(historyEntry);
  saveData(data);

  res.json({
    success: true,
    manuscript,
    quote,
    history: historyEntry
  });
});

app.post('/api/quotes/:id/assess', (req, res) => {
  const { id } = req.params;
  const { operator_id, base_price, final_price, discount, delivery_days, assessment_notes } = req.body;
  const data = loadData();

  const quote = data.quotes.find(q => q.id === id);
  if (!quote) {
    return res.status(404).json({ error: '报价单不存在' });
  }

  const operator = data.users.find(u => u.id === operator_id);
  if (!operator || !hasPermission(operator.role, 'assess_quotes')) {
    return res.status(403).json({ error: '无评估权限' });
  }

  const manuscript = data.manuscripts.find(m => m.id === quote.manuscript_id);
  if (!manuscript) {
    return res.status(404).json({ error: '关联稿件不存在' });
  }

  const calculatedPrice = manuscript.word_count * base_price;

  quote.status = 'assessing';
  quote.assessed_at = new Date().toISOString();
  quote.base_price = base_price;
  quote.calculated_price = calculatedPrice;
  quote.final_price = final_price !== undefined ? final_price : calculatedPrice;
  quote.discount = discount || 0;
  quote.delivery_days = delivery_days;
  quote.assessment_notes = assessment_notes;
  quote.pending_items = quote.pending_items.filter(p => p.status !== 'resolved');

  manuscript.quote_status = 'assessing';

  const historyEntry = {
    id: `WH${Date.now()}`,
    manuscript_id: manuscript.id,
    operator_id,
    operator_name: operator.name,
    operator_role: operator.role,
    action: 'assess_quote',
    notes: assessment_notes || '完成报价评估',
    context_passed: {
      quote_id: id,
      final_price: quote.final_price,
      delivery_days
    },
    created_at: new Date().toISOString()
  };

  data.workflow_history.push(historyEntry);
  saveData(data);

  res.json({
    success: true,
    quote,
    manuscript,
    history: historyEntry
  });
});

app.post('/api/quotes/:id/submit', (req, res) => {
  const { id } = req.params;
  const { operator_id, notes } = req.body;
  const data = loadData();

  const quote = data.quotes.find(q => q.id === id);
  if (!quote) {
    return res.status(404).json({ error: '报价单不存在' });
  }

  const operator = data.users.find(u => u.id === operator_id);
  if (!operator || !hasPermission(operator.role, 'approve_quotes')) {
    return res.status(403).json({ error: '无提交权限' });
  }

  if (quote.final_price === null || quote.final_price === undefined) {
    return res.status(400).json({ error: '请先完成报价评估' });
  }

  const manuscript = data.manuscripts.find(m => m.id === quote.manuscript_id);
  manuscript.status = 'quoted';
  manuscript.quote_status = 'quoted';
  quote.status = 'quoted';

  const historyEntry = {
    id: `WH${Date.now()}`,
    manuscript_id: manuscript.id,
    operator_id,
    operator_name: operator.name,
    operator_role: operator.role,
    action: 'submit_quote',
    from_status: 'assessing',
    to_status: 'quoted',
    notes: notes || '报价已提交，等待客户确认',
    context_passed: {
      quote_id: id,
      final_price: quote.final_price,
      delivery_days: quote.delivery_days
    },
    created_at: new Date().toISOString()
  };

  data.workflow_history.push(historyEntry);
  saveData(data);

  res.json({
    success: true,
    quote,
    manuscript,
    history: historyEntry
  });
});

app.get('/api/manuscripts', (req, res) => {
  const { status, handler_id, role } = req.query;
  const data = loadData();
  
  let manuscripts = [...data.manuscripts];

  if (status) {
    manuscripts = manuscripts.filter(m => m.status === status);
  }

  if (handler_id) {
    manuscripts = manuscripts.filter(m => m.current_handler_id === handler_id);
  }

  if (role) {
    manuscripts = manuscripts.filter(m => m.current_handler_role === role);
  }

  manuscripts = manuscripts.map(m => {
    const quote = data.quotes.find(q => q.manuscript_id === m.id);
    return { ...m, quote };
  });

  res.json({ manuscripts });
});

app.get('/api/glossaries', (req, res) => {
  const { client_id } = req.query;
  const data = loadData();
  
  let glossaries = [...data.glossaries];

  if (client_id) {
    glossaries = glossaries.filter(g => g.client_id === client_id);
  }

  res.json({ glossaries });
});

app.get('/api/client-feedbacks', (req, res) => {
  const { client_id } = req.query;
  const data = loadData();
  
  let feedbacks = [...data.client_feedbacks];

  if (client_id) {
    feedbacks = feedbacks.filter(f => f.client_id === client_id);
  }

  res.json({ feedbacks });
});

app.listen(PORT, () => {
  console.log(`翻译公司稿件管理系统运行在 http://localhost:${PORT}`);
});
