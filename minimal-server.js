const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const soupBases = [
  { id: 's1', name: '麻辣红汤锅底', type: 'spicy', stock: 5, minStock: 10, unit: '份', status: 'pending', responsiblePerson: '李主管', notes: '需要加急准备', refundReason: '', supplementNotes: '' },
  { id: 's2', name: '清汤锅底', type: 'mild', stock: 15, minStock: 10, unit: '份', status: 'ready', responsiblePerson: '李主管', notes: '', refundReason: '', supplementNotes: '' },
];

const users = [
  { id: 'u1', name: '王经理', role: '前厅经理', phone: '13800138001' },
  { id: 'u2', name: '李主管', role: '后厨主管', phone: '13800138002' },
];

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/soupBases', (req, res) => {
  res.json(soupBases);
});

app.get('/api/users', (req, res) => {
  res.json(users);
});

app.get('/api/users/role/:role', (req, res) => {
  const roleUsers = users.filter(u => u.role === req.params.role);
  res.json(roleUsers);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
