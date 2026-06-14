import express from 'express';
import { communications, communicationHistory } from '../data/mockData';

const router = express.Router();

router.get('/', (req, res) => {
  const { status, priority, studentName } = req.query;
  
  let filtered = [...communications];
  
  if (status) {
    filtered = filtered.filter(c => c.status === status);
  }
  
  if (priority) {
    filtered = filtered.filter(c => c.priority === priority);
  }
  
  if (studentName) {
    filtered = filtered.filter(c => 
      c.studentName.includes(studentName as string)
    );
  }
  
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const communication = communications.find(c => c.id === id);
  
  if (!communication) {
    return res.status(404).json({ error: 'Communication not found' });
  }
  
  const history = communicationHistory.filter(h => h.communicationId === id);
  
  res.json({
    ...communication,
    history
  });
});

router.post('/:id/history', (req, res) => {
  const { id } = req.params;
  const { type, content } = req.body;
  
  const communicationIndex = communications.findIndex(c => c.id === id);
  
  if (communicationIndex === -1) {
    return res.status(404).json({ error: 'Communication not found' });
  }
  
  const newHistory = {
    id: `ch${Date.now()}`,
    communicationId: id,
    type,
    content,
    operator: '当前用户',
    operatorRole: 'consultant',
    createdAt: new Date().toLocaleString('zh-CN')
  };
  
  communicationHistory.push(newHistory);
  
  communications[communicationIndex] = {
    ...communications[communicationIndex],
    status: type === 'meeting' && content.includes('完成') ? 'completed' : 'ongoing',
    lastContactAt: new Date().toLocaleString('zh-CN'),
    updatedAt: new Date().toISOString().split('T')[0]
  };
  
  res.json({
    ...communications[communicationIndex],
    history: [...communicationHistory.filter(h => h.communicationId === id)]
  });
});

router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, result } = req.body;
  
  const communicationIndex = communications.findIndex(c => c.id === id);
  
  if (communicationIndex === -1) {
    return res.status(404).json({ error: 'Communication not found' });
  }
  
  const newHistory = {
    id: `ch${Date.now()}`,
    communicationId: id,
    type: 'message',
    content: status === 'completed' 
      ? `【状态变更】完成沟通: ${result || '已完成'}` 
      : `【状态变更】${status === 'pending' ? '待处理' : status === 'ongoing' ? '进行中' : status}`,
    operator: '当前用户',
    operatorRole: 'consultant',
    createdAt: new Date().toLocaleString('zh-CN')
  };
  
  communicationHistory.push(newHistory);
  
  communications[communicationIndex] = {
    ...communications[communicationIndex],
    status,
    result: status === 'completed' ? result : undefined,
    lastContactAt: new Date().toLocaleString('zh-CN'),
    updatedAt: new Date().toISOString().split('T')[0]
  };
  
  res.json({
    communication: communications[communicationIndex],
    history: [...communicationHistory.filter(h => h.communicationId === id)]
  });
});

router.post('/:id/exception', (req, res) => {
  const { id } = req.params;
  const { reason, description, nextFollowUp } = req.body;
  
  const communicationIndex = communications.findIndex(c => c.id === id);
  
  if (communicationIndex === -1) {
    return res.status(404).json({ error: 'Communication not found' });
  }
  
  const reasonLabels: Record<string, string> = {
    no_response: '家长未回应',
    refuse: '拒绝沟通',
    schedule_conflict: '时间冲突',
    emergency: '紧急情况',
    other: '其他'
  };
  
  const newHistory = {
    id: `ch${Date.now()}`,
    communicationId: id,
    type: 'message',
    content: `【异常处理】${reasonLabels[reason] || reason}: ${description}`,
    operator: '当前用户',
    operatorRole: 'consultant',
    createdAt: new Date().toLocaleString('zh-CN')
  };
  
  communicationHistory.push(newHistory);
  
  communications[communicationIndex] = {
    ...communications[communicationIndex],
    status: 'ongoing',
    exceptionReason: reason,
    exceptionDescription: description,
    nextFollowUpAt: nextFollowUp,
    updatedAt: new Date().toISOString().split('T')[0]
  };
  
  res.json({
    ...communications[communicationIndex],
    history: [...communicationHistory.filter(h => h.communicationId === id)]
  });
});

export default router;
