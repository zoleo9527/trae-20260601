const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { ROLES, ROLE_NAMES, TICKET_TYPES, TICKET_TYPE_NAMES, STATUS_NAMES, DEMO_USERS, createInitialTickets } = require('./constants');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let tickets = createInitialTickets();

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = DEMO_USERS.find(u => u.username === username && u.password === password);
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } else {
    res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
});

app.get('/api/tickets', (req, res) => {
  const { type, status } = req.query;
  let filtered = [...tickets];
  if (type) filtered = filtered.filter(t => t.type === type);
  if (status) filtered = filtered.filter(t => t.status === status);
  res.json(filtered);
});

app.get('/api/tickets/:id', (req, res) => {
  const ticket = tickets.find(t => t.id === req.params.id);
  ticket ? res.json(ticket) : res.status(404).json({ message: '工单不存在' });
});

app.post('/api/tickets', (req, res) => {
  const { type, orderNo, productName, amount, customerName, customerPhone, reason, operatorName, operatorRole } = req.body;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const newTicket = {
    id: uuidv4(), type, orderNo, productName,
    amount: parseFloat(amount), customerName, customerPhone, reason,
    status: 'pending_review', createdAt: now, createdBy: 'demo',
    logs: [{ id: uuidv4(), action: '创建工单', status: 'pending_review', operator: operatorName, operatorRole, time: now, remark: reason }]
  };
  tickets.unshift(newTicket);
  res.json(newTicket);
});

app.post('/api/tickets/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, action, operatorName, operatorRole, remark } = req.body;
  const ticketIndex = tickets.findIndex(t => t.id === id);
  if (ticketIndex === -1) return res.status(404).json({ message: '工单不存在' });
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const ticket = tickets[ticketIndex];
  ticket.logs.push({ id: uuidv4(), action, status, operator: operatorName, operatorRole, time: now, remark });
  ticket.status = status;
  res.json(ticket);
});

app.get('/api/constants', (req, res) => {
  res.json({ ROLES, ROLE_NAMES, TICKET_TYPES, TICKET_TYPE_NAMES, STATUS_NAMES });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
