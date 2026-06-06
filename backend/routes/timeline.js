import { readDB, writeDB, generateId, getNow } from '../utils/storage.js';

export const getTimelineByProjectId = (req, res) => {
  const { projectId } = req.params;
  const db = readDB();
  const events = (db.timelineEvents || [])
    .filter(e => e.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ code: 0, data: events });
};

export const addTimelineEvent = (req, res) => {
  const db = readDB();
  const { projectId, type, title, description, operator, operatorRole, metadata } = req.body;

  const newEvent = {
    id: generateId('tl'),
    projectId,
    type,
    title,
    description,
    operator: operator || '系统',
    operatorRole: operatorRole || 'director',
    createdAt: getNow(),
    metadata: metadata || {},
  };

  db.timelineEvents = db.timelineEvents || [];
  db.timelineEvents.unshift(newEvent);

  writeDB(db);
  res.json({ code: 0, data: newEvent, message: '事件添加成功' });
};

export const getScriptVersions = (req, res) => {
  const { projectId } = req.params;
  const db = readDB();
  const scripts = (db.scriptVersions || []).filter(s => s.projectId === projectId);
  res.json({ code: 0, data: scripts });
};
