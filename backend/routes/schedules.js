import { readDB, writeDB, generateId, getNow } from '../utils/storage.js';

export const getAllSchedules = (req, res) => {
  const db = readDB();
  res.json({ code: 0, data: db.shootingSchedules || [] });
};

export const getScheduleById = (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const schedule = (db.shootingSchedules || []).find(s => s.id === id);
  if (!schedule) {
    return res.status(404).json({ code: 1, message: '排期不存在' });
  }
  res.json({ code: 0, data: schedule });
};

export const createSchedule = (req, res) => {
  const db = readDB();
  const { projectId, shootDate, shootTime, location, equipment, notes, assignee } = req.body;

  const project = (db.projects || []).find(p => p.id === projectId);
  if (!project) {
    return res.status(400).json({ code: 1, message: '关联项目不存在' });
  }

  const newSchedule = {
    id: generateId('sh'),
    projectId,
    projectName: project.name,
    brandName: project.brandName,
    talentName: project.talentName,
    shootDate,
    shootTime: shootTime + '-18:00',
    location,
    status: 'scheduled',
    equipment: equipment || [],
    notes: notes || '',
    assignee,
    createdAt: getNow(),
    updatedAt: getNow(),
  };

  db.shootingSchedules = db.shootingSchedules || [];
  db.shootingSchedules.unshift(newSchedule);

  const timelineEvent = {
    id: generateId('tl'),
    projectId,
    type: 'schedule_update',
    title: '新建拍摄排期',
    description: `新建拍摄排期：${shootDate} ${shootTime}，地点：${location}`,
    operator: assignee || '系统',
    operatorRole: 'director',
    createdAt: getNow(),
    metadata: { scheduleId: newSchedule.id },
  };
  db.timelineEvents = db.timelineEvents || [];
  db.timelineEvents.unshift(timelineEvent);

  const recentChange = {
    id: generateId('rc'),
    title: '新建拍摄排期',
    description: `${project.name} - ${shootDate} ${shootTime}`,
    type: 'schedule',
    relatedId: newSchedule.id,
    operator: assignee || '系统',
    createdAt: getNow(),
  };
  db.recentChanges = db.recentChanges || [];
  db.recentChanges.unshift(recentChange);

  writeDB(db);
  res.json({ code: 0, data: newSchedule, message: '排期创建成功' });
};

export const updateSchedule = (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = (db.shootingSchedules || []).findIndex(s => s.id === id);

  if (index === -1) {
    return res.status(404).json({ code: 1, message: '排期不存在' });
  }

  const oldSchedule = db.shootingSchedules[index];
  const { projectId, shootDate, shootTime, location, equipment, notes, assignee, status } = req.body;

  const updates = {
    ...oldSchedule,
    shootDate: shootDate || oldSchedule.shootDate,
    shootTime: shootTime ? shootTime + (shootTime.includes('-') ? '' : '-18:00') : oldSchedule.shootTime,
    location: location || oldSchedule.location,
    equipment: equipment !== undefined ? equipment : oldSchedule.equipment,
    notes: notes !== undefined ? notes : oldSchedule.notes,
    assignee: assignee || oldSchedule.assignee,
    status: status || oldSchedule.status,
    updatedAt: getNow(),
  };

  db.shootingSchedules[index] = updates;

  let timelineTitle = '';
  let timelineDesc = '';

  if (status && status !== oldSchedule.status) {
    const statusMap = {
      scheduled: '已排期',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    };
    timelineTitle = status === 'in_progress' ? '开始拍摄' : status === 'completed' ? '完成拍摄' : '排期状态更新';
    timelineDesc = `排期状态从「${statusMap[oldSchedule.status]}」变更为「${statusMap[status]}」`;
  } else {
    timelineTitle = '更新拍摄排期';
    timelineDesc = `更新拍摄排期信息：${shootDate || oldSchedule.shootDate} ${shootTime || oldSchedule.shootTime}`;
  }

  const timelineEvent = {
    id: generateId('tl'),
    projectId: oldSchedule.projectId,
    type: 'schedule_update',
    title: timelineTitle,
    description: timelineDesc,
    operator: assignee || oldSchedule.assignee || '系统',
    operatorRole: 'director',
    createdAt: getNow(),
    metadata: { scheduleId: id, from: oldSchedule.status, to: updates.status },
  };
  db.timelineEvents = db.timelineEvents || [];
  db.timelineEvents.unshift(timelineEvent);

  const recentChange = {
    id: generateId('rc'),
    title: timelineTitle,
    description: `${oldSchedule.projectName} - ${timelineDesc}`,
    type: 'schedule',
    relatedId: id,
    operator: assignee || oldSchedule.assignee || '系统',
    createdAt: getNow(),
  };
  db.recentChanges = db.recentChanges || [];
  db.recentChanges.unshift(recentChange);

  if (status === 'in_progress') {
    const projIndex = (db.projects || []).findIndex(p => p.id === oldSchedule.projectId);
    if (projIndex !== -1) {
      db.projects[projIndex].status = 'shooting';
      db.projects[projIndex].updatedAt = getNow();
    }
  }
  if (status === 'completed') {
    const projIndex = (db.projects || []).findIndex(p => p.id === oldSchedule.projectId);
    if (projIndex !== -1) {
      const allCompleted = (db.shootingSchedules || [])
        .filter(s => s.projectId === oldSchedule.projectId && s.id !== id)
        .every(s => s.status === 'completed' || s.status === 'cancelled');
      if (allCompleted) {
        db.projects[projIndex].status = 'editing';
        db.projects[projIndex].updatedAt = getNow();
      }
    }
  }

  writeDB(db);
  res.json({ code: 0, data: updates, message: '排期更新成功' });
};

export const startShooting = (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = (db.shootingSchedules || []).findIndex(s => s.id === id);

  if (index === -1) {
    return res.status(404).json({ code: 1, message: '排期不存在' });
  }

  db.shootingSchedules[index].status = 'in_progress';
  db.shootingSchedules[index].updatedAt = getNow();

  const schedule = db.shootingSchedules[index];

  const timelineEvent = {
    id: generateId('tl'),
    projectId: schedule.projectId,
    type: 'schedule_update',
    title: '开始拍摄',
    description: `拍摄排期已开始，地点：${schedule.location}`,
    operator: schedule.assignee || '系统',
    operatorRole: 'director',
    createdAt: getNow(),
    metadata: { scheduleId: id },
  };
  db.timelineEvents = db.timelineEvents || [];
  db.timelineEvents.unshift(timelineEvent);

  const projIndex = (db.projects || []).findIndex(p => p.id === schedule.projectId);
  if (projIndex !== -1) {
    db.projects[projIndex].status = 'shooting';
    db.projects[projIndex].updatedAt = getNow();

    const projTimeline = {
      id: generateId('tl'),
      projectId: schedule.projectId,
      type: 'status_change',
      title: '项目状态更新',
      description: '项目状态变更为「拍摄中」',
      operator: schedule.assignee || '系统',
      operatorRole: 'director',
      createdAt: getNow(),
      metadata: { from: 'pending', to: 'shooting' },
    };
    db.timelineEvents.unshift(projTimeline);
  }

  const recentChange = {
    id: generateId('rc'),
    title: '开始拍摄',
    description: `${schedule.projectName} 已开始拍摄`,
    type: 'schedule',
    relatedId: id,
    operator: schedule.assignee || '系统',
    createdAt: getNow(),
  };
  db.recentChanges = db.recentChanges || [];
  db.recentChanges.unshift(recentChange);

  writeDB(db);
  res.json({ code: 0, data: schedule, message: '已开始拍摄' });
};

export const completeShooting = (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = (db.shootingSchedules || []).findIndex(s => s.id === id);

  if (index === -1) {
    return res.status(404).json({ code: 1, message: '排期不存在' });
  }

  db.shootingSchedules[index].status = 'completed';
  db.shootingSchedules[index].updatedAt = getNow();

  const schedule = db.shootingSchedules[index];

  const timelineEvent = {
    id: generateId('tl'),
    projectId: schedule.projectId,
    type: 'schedule_update',
    title: '完成拍摄',
    description: `拍摄排期已完成，地点：${schedule.location}`,
    operator: schedule.assignee || '系统',
    operatorRole: 'director',
    createdAt: getNow(),
    metadata: { scheduleId: id },
  };
  db.timelineEvents = db.timelineEvents || [];
  db.timelineEvents.unshift(timelineEvent);

  const projIndex = (db.projects || []).findIndex(p => p.id === schedule.projectId);
  if (projIndex !== -1) {
    const allSchedules = (db.shootingSchedules || []).filter(s => s.projectId === schedule.projectId);
    const allCompleted = allSchedules.every(s => s.status === 'completed' || s.status === 'cancelled');
    if (allCompleted) {
      db.projects[projIndex].status = 'editing';
      db.projects[projIndex].updatedAt = getNow();

      const projTimeline = {
        id: generateId('tl'),
        projectId: schedule.projectId,
        type: 'status_change',
        title: '项目状态更新',
        description: '项目状态变更为「剪辑中」',
        operator: schedule.assignee || '系统',
        operatorRole: 'director',
        createdAt: getNow(),
        metadata: { from: 'shooting', to: 'editing' },
      };
      db.timelineEvents.unshift(projTimeline);
    }
  }

  const recentChange = {
    id: generateId('rc'),
    title: '完成拍摄',
    description: `${schedule.projectName} 拍摄已完成`,
    type: 'schedule',
    relatedId: id,
    operator: schedule.assignee || '系统',
    createdAt: getNow(),
  };
  db.recentChanges = db.recentChanges || [];
  db.recentChanges.unshift(recentChange);

  writeDB(db);
  res.json({ code: 0, data: schedule, message: '拍摄已完成' });
};
