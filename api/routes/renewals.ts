import express from 'express';
import { renewals, renewalHistory } from '../data/mockData';

const router = express.Router();

router.get('/', (req, res) => {
  const { status, startDate, endDate, studentName } = req.query;
  
  let filtered = [...renewals];
  
  if (status) {
    filtered = filtered.filter(r => r.status === status);
  }
  
  if (studentName) {
    filtered = filtered.filter(r => 
      r.studentName.includes(studentName as string)
    );
  }
  
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const renewal = renewals.find(r => r.id === id);
  
  if (!renewal) {
    return res.status(404).json({ error: 'Renewal not found' });
  }
  
  const history = renewalHistory.filter(h => h.renewalId === id);
  
  res.json({
    ...renewal,
    history
  });
});

router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;
  
  const renewalIndex = renewals.findIndex(r => r.id === id);
  
  if (renewalIndex === -1) {
    return res.status(404).json({ error: 'Renewal not found' });
  }
  
  renewals[renewalIndex] = {
    ...renewals[renewalIndex],
    status,
    notes: note || renewals[renewalIndex].notes,
    updatedAt: new Date().toISOString().split('T')[0]
  };
  
  const newHistory = {
    id: `rh${Date.now()}`,
    renewalId: id,
    action: status === 'completed' ? '完成续费' : status === 'risk' ? '标记风险' : '状态更新',
    operator: '当前用户',
    operatorRole: 'admin',
    description: note || `状态变更为${status}`,
    createdAt: new Date().toLocaleString('zh-CN')
  };
  
  renewalHistory.push(newHistory);
  
  res.json({
    ...renewals[renewalIndex],
    history: [...renewalHistory.filter(h => h.renewalId === id), newHistory]
  });
});

export default router;
