const express = require('express');
const cors = require('cors');
const data = require('./data');

const app = express();
const PORT = 3003;

const SHIFT_ORDER = ['morning', 'evening', 'night'];

const getPreviousShift = (shift) => {
  const idx = SHIFT_ORDER.indexOf(shift);
  return SHIFT_ORDER[(idx - 1 + SHIFT_ORDER.length) % SHIFT_ORDER.length];
};

app.use(cors());
app.use(express.json());

app.get('/api/rooms', (req, res) => {
  const roomsWithDetails = data.rooms.map(room => {
    const mother = data.mothers.find(m => m.roomId === room.id);
    const baby = data.babies.find(b => b.roomId === room.id);
    const roomRecords = data.records.filter(r => r.roomId === room.id);
    const roomTasks = data.tasks.filter(t => t.roomId === room.id);

    return {
      ...room,
      mother,
      baby,
      records: roomRecords,
      tasks: roomTasks,
      hasRisk: mother && mother.risks && mother.risks.length > 0
    };
  });
  res.json(roomsWithDetails);
});

app.get('/api/rooms/:id', (req, res) => {
  const room = data.rooms.find(r => r.id === req.params.id);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  const mother = data.mothers.find(m => m.roomId === room.id);
  const baby = data.babies.find(b => b.roomId === room.id);
  const roomRecords = data.records.filter(r => r.roomId === room.id);
  const roomTasks = data.tasks.filter(t => t.roomId === room.id);

  const getSortTime = (item) => {
    if (item.source === 'record') {
      return new Date(item.time).getTime();
    }
    const today = new Date();
    const [hour, minute] = item.time.split(':').map(Number);
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (item.shift === 'night' && hour < 12) {
      date.setDate(date.getDate() + 1);
    }
    date.setHours(hour, minute, 0, 0);
    return date.getTime();
  };

  const timeline = [
    ...roomRecords.map(r => ({
      id: r.id,
      type: r.type,
      title: r.title,
      description: r.description,
      time: r.time,
      operator: r.operator,
      shift: r.shift,
      source: 'record',
      riskLevel: r.riskLevel,
      compensation: r.compensation,
      status: r.status
    })),
    ...roomTasks.map(t => ({
      id: t.id,
      type: t.type,
      title: t.title,
      description: `${t.assignee} ${t.time}`,
      time: t.time,
      operator: t.assignee,
      shift: t.shift,
      source: 'task',
      taskStatus: t.status
    }))
  ].sort((a, b) => getSortTime(b) - getSortTime(a));

  let jaundiceFollowUpInfo = null;
  if (baby && baby.jaundice) {
    const jaundiceTask = data.tasks.find(t => t.roomId === room.id && t.type === 'jaundiceTest');
    const jaundiceRecord = data.records.find(r => r.roomId === room.id && (r.type === 'jaundiceDelay' || r.type === 'babyCheck'));
    jaundiceFollowUpInfo = {
      followUpDate: baby.jaundiceFollowUp,
      delayed: baby.jaundiceDelayed || false,
      delayReason: baby.delayReason || null,
      responsiblePerson: jaundiceTask ? jaundiceTask.assignee : '待安排',
      lastCheck: jaundiceRecord ? { time: jaundiceRecord.time, operator: jaundiceRecord.operator, description: jaundiceRecord.description } : null
    };
  }

  res.json({
    ...room,
    mother,
    baby,
    records: roomRecords,
    tasks: roomTasks,
    timeline,
    jaundiceFollowUpInfo
  });
});

app.get('/api/records', (req, res) => {
  const { shift, type, roomId } = req.query;
  let filtered = [...data.records];

  if (shift) filtered = filtered.filter(r => r.shift === shift);
  if (type) filtered = filtered.filter(r => r.type === type);
  if (roomId) filtered = filtered.filter(r => r.roomId === roomId);

  res.json(filtered.sort((a, b) => new Date(b.time) - new Date(a.time)));
});

app.post('/api/records', (req, res) => {
  const newRecord = {
    id: `r${Date.now()}`,
    ...req.body,
    time: new Date().toISOString()
  };
  data.records.push(newRecord);
  res.status(201).json(newRecord);
});

app.get('/api/tasks', (req, res) => {
  const { shift, status, roomId } = req.query;
  let filtered = [...data.tasks];

  if (shift) filtered = filtered.filter(t => t.shift === shift);
  if (status) filtered = filtered.filter(t => t.status === status);
  if (roomId) filtered = filtered.filter(t => t.roomId === roomId);

  res.json(filtered);
});

app.put('/api/tasks/:id', (req, res) => {
  const index = data.tasks.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  data.tasks[index] = { ...data.tasks[index], ...req.body };
  res.json(data.tasks[index]);
});

app.get('/api/nurses', (req, res) => {
  res.json(data.nurses);
});

app.get('/api/summary', (req, res) => {
  const { shift = 'morning' } = req.query;

  const totalRooms = data.rooms.length;
  const occupiedRooms = data.rooms.filter(r => r.status === 'occupied').length;
  const highRiskRooms = data.mothers.filter(m => m.risks && m.risks.length > 0).length;
  const pendingTasks = data.tasks.filter(t => t.shift === shift && t.status === 'pending').length;
  const complaints = data.records.filter(r => r.type === 'complaint' && r.status === 'processing').length;
  const newAdmissions = data.records.filter(r => r.type === 'admission' && r.shift === shift).length;
  const jaundiceBabies = data.babies.filter(b => b.jaundice).length;

  res.json({
    totalRooms,
    occupiedRooms,
    highRiskRooms,
    pendingTasks,
    complaints,
    newAdmissions,
    jaundiceBabies,
    shift
  });
});

app.get('/api/shift-context/:shift', (req, res) => {
  const { shift } = req.params;
  const prevShift = getPreviousShift(shift);

  const currentShiftRecords = data.records.filter(r => r.shift === shift);
  const previousShiftRecords = data.records.filter(r => r.shift === prevShift);

  const previousHandoverNotes = previousShiftRecords.filter(r => r.type === 'handover');

  const processingComplaints = data.records.filter(r => r.type === 'complaint' && r.status === 'processing');

  const activeAlerts = data.records.filter(r =>
    (r.type === 'breastEngorgement' || r.type === 'jaundiceDelay' || r.riskLevel === 'high')
  );

  const carriedOverTasks = data.tasks.filter(t =>
    t.status === 'pending' && SHIFT_ORDER.indexOf(t.shift) <= SHIFT_ORDER.indexOf(shift)
  );

  const riskRooms = data.mothers
    .filter(m => m.risks && m.risks.length > 0)
    .map(m => {
      const room = data.rooms.find(r => r.id === m.roomId);
      const baby = data.babies.find(b => b.roomId === m.roomId);
      return { roomId: m.roomId, motherName: m.name, risks: m.risks, babyName: baby?.name };
    });

  res.json({
    shift,
    previousShift: prevShift,
    previousHandoverNotes: previousHandoverNotes.sort((a, b) => new Date(b.time) - new Date(a.time)),
    processingComplaints,
    activeAlerts: activeAlerts.sort((a, b) => new Date(b.time) - new Date(a.time)),
    carriedOverTasks,
    currentShiftRecords: currentShiftRecords.sort((a, b) => new Date(b.time) - new Date(a.time)),
    riskRooms
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
