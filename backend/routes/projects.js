import { readDB, writeDB, generateId, getNow } from '../utils/storage.js';

export const getAllProjects = (req, res) => {
  const db = readDB();
  res.json({ code: 0, data: db.projects || [] });
};

export const getProjectById = (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const project = (db.projects || []).find(p => p.id === id);
  if (!project) {
    return res.status(404).json({ code: 1, message: '项目不存在' });
  }
  res.json({ code: 0, data: project });
};

export const updateProject = (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = (db.projects || []).findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ code: 1, message: '项目不存在' });
  }

  const oldProject = db.projects[index];
  const updates = {
    ...oldProject,
    ...req.body,
    updatedAt: getNow(),
  };

  db.projects[index] = updates;

  if (req.body.status && req.body.status !== oldProject.status) {
    const statusMap = {
      pending: '待启动',
      shooting: '拍摄中',
      editing: '剪辑中',
      delivering: '交付中',
      completed: '已完成',
    };

    const timelineEvent = {
      id: generateId('tl'),
      projectId: id,
      type: 'status_change',
      title: '项目状态更新',
      description: `项目状态从「${statusMap[oldProject.status]}」变更为「${statusMap[req.body.status]}」`,
      operator: '系统',
      operatorRole: 'director',
      createdAt: getNow(),
      metadata: { from: oldProject.status, to: req.body.status },
    };
    db.timelineEvents = db.timelineEvents || [];
    db.timelineEvents.unshift(timelineEvent);
  }

  writeDB(db);
  res.json({ code: 0, data: updates, message: '项目更新成功' });
};

export const getProjectSchedules = (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const schedules = (db.shootingSchedules || []).filter(s => s.projectId === id);
  res.json({ code: 0, data: schedules });
};

export const getProjectDeliveries = (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const deliveries = (db.materialDeliveries || []).filter(m => m.projectId === id);
  res.json({ code: 0, data: deliveries });
};
