import { readDB, writeDB, generateId, getNow } from '../utils/storage.js';

export const getAllDeliveries = (req, res) => {
  const db = readDB();
  res.json({ code: 0, data: db.materialDeliveries || [] });
};

export const getDeliveryById = (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const delivery = (db.materialDeliveries || []).find(m => m.id === id);
  if (!delivery) {
    return res.status(404).json({ code: 1, message: '交付记录不存在' });
  }
  res.json({ code: 0, data: delivery });
};

const deliveryStatusTextMap = {
  pending: '待提交',
  submitted: '已提交',
  reviewing: '审核中',
  approved: '已通过',
  revision_requested: '待修改',
  rejected: '已驳回',
};

const projectStatusTextMap = {
  pending: '待启动',
  shooting: '拍摄中',
  editing: '剪辑中',
  delivering: '交付中',
  completed: '已完成',
};

export const submitDelivery = (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = (db.materialDeliveries || []).findIndex(m => m.id === id);

  if (index === -1) {
    return res.status(404).json({ code: 1, message: '交付记录不存在' });
  }

  const oldDelivery = { ...db.materialDeliveries[index] };
  db.materialDeliveries[index].status = 'submitted';
  db.materialDeliveries[index].submittedAt = getNow();
  db.materialDeliveries[index].updatedAt = getNow();

  const delivery = db.materialDeliveries[index];
  const typeText = delivery.type === 'video' ? '视频' : delivery.type === 'image' ? '图片' : '文案';
  const fromStatusText = deliveryStatusTextMap[oldDelivery.status] || oldDelivery.status;
  const toStatusText = deliveryStatusTextMap['submitted'];

  const timelineEvent = {
    id: generateId('tl'),
    projectId: delivery.projectId,
    type: 'delivery_update',
    title: '提交素材',
    description: `${typeText}素材 ${delivery.version} 状态从「${fromStatusText}」变更为「${toStatusText}」`,
    operator: delivery.submitter || '系统',
    operatorRole: 'director',
    createdAt: getNow(),
    metadata: { deliveryId: id, version: delivery.version, from: oldDelivery.status, to: 'submitted' },
  };
  db.timelineEvents = db.timelineEvents || [];
  db.timelineEvents.unshift(timelineEvent);

  const projIndex = (db.projects || []).findIndex(p => p.id === delivery.projectId);
  if (projIndex !== -1) {
    const oldProjectStatus = db.projects[projIndex].status;
    if (oldProjectStatus !== 'delivering') {
      db.projects[projIndex].status = 'delivering';
      db.projects[projIndex].updatedAt = getNow();

      const projFromText = projectStatusTextMap[oldProjectStatus] || oldProjectStatus;
      const projToText = projectStatusTextMap['delivering'];

      const projTimeline = {
        id: generateId('tl'),
        projectId: delivery.projectId,
        type: 'status_change',
        title: '项目状态更新',
        description: `项目状态从「${projFromText}」变更为「${projToText}」`,
        operator: delivery.submitter || '系统',
        operatorRole: 'director',
        createdAt: getNow(),
        metadata: { from: oldProjectStatus, to: 'delivering' },
      };
      db.timelineEvents.unshift(projTimeline);
    }
  }

  const recentChange = {
    id: generateId('rc'),
    title: '提交素材',
    description: `${delivery.projectName} - ${delivery.fileName} 已提交审核`,
    type: 'delivery',
    relatedId: id,
    operator: delivery.submitter || '系统',
    createdAt: getNow(),
  };
  db.recentChanges = db.recentChanges || [];
  db.recentChanges.unshift(recentChange);

  writeDB(db);
  res.json({ code: 0, data: delivery, message: '素材已提交' });
};

export const reviewDelivery = (req, res) => {
  const { id } = req.params;
  const { status, feedback, reviewer } = req.body;
  const db = readDB();
  const index = (db.materialDeliveries || []).findIndex(m => m.id === id);

  if (index === -1) {
    return res.status(404).json({ code: 1, message: '交付记录不存在' });
  }

  const oldDelivery = { ...db.materialDeliveries[index] };

  db.materialDeliveries[index].status = status;
  db.materialDeliveries[index].feedback = feedback;
  db.materialDeliveries[index].reviewer = reviewer || '审核人员';
  db.materialDeliveries[index].reviewedAt = getNow();
  db.materialDeliveries[index].updatedAt = getNow();

  const delivery = db.materialDeliveries[index];
  const typeText = delivery.type === 'video' ? '视频' : delivery.type === 'image' ? '图片' : '文案';
  const fromStatusText = deliveryStatusTextMap[oldDelivery.status] || oldDelivery.status;
  const toStatusText = deliveryStatusTextMap[status] || status;

  const timelineTitle = status === 'approved' ? '素材通过' : status === 'rejected' ? '素材驳回' : '素材审核意见';
  const timelineDesc = `${typeText}素材 ${delivery.version} 状态从「${fromStatusText}」变更为「${toStatusText}」${feedback ? ' - ' + feedback : ''}`;

  const timelineEvent = {
    id: generateId('tl'),
    projectId: delivery.projectId,
    type: 'delivery_update',
    title: timelineTitle,
    description: timelineDesc,
    operator: reviewer || '审核人员',
    operatorRole: 'business',
    createdAt: getNow(),
    metadata: { deliveryId: id, from: oldDelivery.status, to: status },
  };
  db.timelineEvents = db.timelineEvents || [];
  db.timelineEvents.unshift(timelineEvent);

  const projIndex = (db.projects || []).findIndex(p => p.id === delivery.projectId);
  if (projIndex !== -1) {
    const oldProjectStatus = db.projects[projIndex].status;
    let newProjectStatus = oldProjectStatus;
    let shouldUpdateProject = false;

    if (status === 'approved') {
      const allDeliveries = (db.materialDeliveries || []).filter(m => m.projectId === delivery.projectId);
      const allApproved = allDeliveries.every(m => m.status === 'approved');
      if (allApproved) {
        newProjectStatus = 'completed';
        shouldUpdateProject = oldProjectStatus !== 'completed';
      } else {
        newProjectStatus = 'delivering';
        shouldUpdateProject = oldProjectStatus !== 'delivering';
      }
    } else {
      newProjectStatus = 'delivering';
      shouldUpdateProject = oldProjectStatus !== 'delivering';
    }

    if (shouldUpdateProject) {
      db.projects[projIndex].status = newProjectStatus;
      db.projects[projIndex].updatedAt = getNow();

      const projFromText = projectStatusTextMap[oldProjectStatus] || oldProjectStatus;
      const projToText = projectStatusTextMap[newProjectStatus] || newProjectStatus;

      const projTimeline = {
        id: generateId('tl'),
        projectId: delivery.projectId,
        type: 'status_change',
        title: '项目状态更新',
        description: `项目状态从「${projFromText}」变更为「${projToText}」`,
        operator: reviewer || '审核人员',
        operatorRole: 'business',
        createdAt: getNow(),
        metadata: { from: oldProjectStatus, to: newProjectStatus },
      };
      db.timelineEvents.unshift(projTimeline);
    }
  }

  const recentChange = {
    id: generateId('rc'),
    title: timelineTitle,
    description: `${delivery.projectName} - ${timelineDesc}`,
    type: 'delivery',
    relatedId: id,
    operator: reviewer || '审核人员',
    createdAt: getNow(),
  };
  db.recentChanges = db.recentChanges || [];
  db.recentChanges.unshift(recentChange);

  writeDB(db);
  res.json({ code: 0, data: delivery, message: '审核完成' });
};

export const createDelivery = (req, res) => {
  const db = readDB();
  const { projectId, type, version, fileName, fileUrl, size, submitter, deadline } = req.body;

  const project = (db.projects || []).find(p => p.id === projectId);
  if (!project) {
    return res.status(400).json({ code: 1, message: '关联项目不存在' });
  }

  const newDelivery = {
    id: generateId('m'),
    projectId,
    projectName: project.name,
    brandName: project.brandName,
    talentName: project.talentName,
    type,
    version,
    fileUrl: fileUrl || '',
    fileName,
    size: size || 0,
    status: 'pending',
    submitter,
    deadline,
    createdAt: getNow(),
    updatedAt: getNow(),
  };

  db.materialDeliveries = db.materialDeliveries || [];
  db.materialDeliveries.unshift(newDelivery);

  const timelineEvent = {
    id: generateId('tl'),
    projectId,
    type: 'delivery_update',
    title: '新建交付任务',
    description: `新建${type === 'video' ? '视频' : type === 'image' ? '图片' : '文案'}交付任务：${fileName}`,
    operator: submitter || '系统',
    operatorRole: 'director',
    createdAt: getNow(),
    metadata: { deliveryId: newDelivery.id },
  };
  db.timelineEvents = db.timelineEvents || [];
  db.timelineEvents.unshift(timelineEvent);

  writeDB(db);
  res.json({ code: 0, data: newDelivery, message: '交付任务创建成功' });
};

export const updateDelivery = (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = (db.materialDeliveries || []).findIndex(m => m.id === id);

  if (index === -1) {
    return res.status(404).json({ code: 1, message: '交付记录不存在' });
  }

  const oldDelivery = db.materialDeliveries[index];
  const updates = {
    ...oldDelivery,
    ...req.body,
    updatedAt: getNow(),
  };

  db.materialDeliveries[index] = updates;
  writeDB(db);

  res.json({ code: 0, data: updates, message: '更新成功' });
};
