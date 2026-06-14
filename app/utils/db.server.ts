import prisma from '~/db.server';

export const getVehicleById = async (id: string) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      statusHistory: { orderBy: { changedAt: 'asc' } }
    }
  });
  return vehicle;
};

export const getReportByVehicleId = async (vehicleId: string) => {
  const report = await prisma.inspectionReport.findFirst({
    where: { vehicleId },
    include: {
      items: {
        include: {
          accidentAnnotations: true
        }
      }
    }
  });
  return report;
};

export const getTasksByVehicleId = async (vehicleId: string) => {
  const tasks = await prisma.preparationTask.findMany({
    where: { vehicleId },
    include: {
      costHistory: { orderBy: { changedAt: 'asc' } }
    }
  });
  return tasks;
};

export const getEventsByVehicleId = async (vehicleId: string) => {
  const events = await prisma.timelineEvent.findMany({
    where: { vehicleId },
    orderBy: { createdAt: 'desc' }
  });
  return events;
};

export const getFinanceRecordsByVehicleId = async (vehicleId: string) => {
  const records = await prisma.financeRecord.findMany({
    where: { vehicleId },
    orderBy: { updatedAt: 'desc' }
  });
  return records;
};

export const getUserById = async (id: string) => {
  return await prisma.user.findUnique({ where: { id } });
};

export const getUsersByRole = async (role: string) => {
  return await prisma.user.findMany({ where: { role } });
};

export const getAllUsers = async () => {
  return await prisma.user.findMany();
};

export const getAllVehicles = async () => {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      statusHistory: { orderBy: { changedAt: 'asc' } }
    },
    orderBy: { updatedAt: 'desc' }
  });
  return vehicles;
};

export const filterVehicles = async (filters: {
  status?: string;
  managerId?: string;
  assessorId?: string;
  financeId?: string;
  search?: string;
  currentAssigneeId?: string;
  currentAssigneeRole?: string;
}) => {
  const vehicles = await prisma.vehicle.findMany({
    where: {
      AND: [
        filters.status ? { status: filters.status } : {},
        filters.managerId ? { managerId: filters.managerId } : {},
        filters.assessorId ? { assessorId: filters.assessorId } : {},
        filters.financeId ? { financeId: filters.financeId } : {},
        filters.currentAssigneeId ? { currentAssigneeId: filters.currentAssigneeId } : {},
        filters.currentAssigneeRole ? { currentAssigneeRole: filters.currentAssigneeRole } : {},
        filters.search ? {
          OR: [
            { licensePlate: { contains: filters.search, mode: 'insensitive' } },
            { brand: { contains: filters.search, mode: 'insensitive' } },
            { model: { contains: filters.search, mode: 'insensitive' } }
          ]
        } : {}
      ]
    },
    include: {
      statusHistory: { orderBy: { changedAt: 'asc' } }
    },
    orderBy: { updatedAt: 'desc' }
  });
  return vehicles;
};

export const getTotalCostByVehicleId = async (vehicleId: string): Promise<number> => {
  const tasks = await getTasksByVehicleId(vehicleId);
  return tasks.reduce((sum, t) => sum + t.cost, 0);
};

export const getCompletedTaskCount = async (vehicleId: string): Promise<number> => {
  const tasks = await getTasksByVehicleId(vehicleId);
  return tasks.filter(t => t.status === 'completed').length;
};

export const getTotalTaskCount = async (vehicleId: string): Promise<number> => {
  return await prisma.preparationTask.count({ where: { vehicleId } });
};

export const getStatusTransitionConfigs = async () => {
  return await prisma.statusTransitionConfig.findMany();
};

export const getNextAvailableTransitions = async (currentStatus: string) => {
  return await prisma.statusTransitionConfig.findMany({
    where: { fromStatus: currentStatus }
  });
};

export const getAccidentAnnotationsByReportId = async (reportId: string) => {
  return await prisma.accidentAnnotation.findMany({
    where: { reportId }
  });
};

export const getAccidentAnnotationsByVehicleId = async (vehicleId: string) => {
  const report = await getReportByVehicleId(vehicleId);
  if (!report) return [];
  return getAccidentAnnotationsByReportId(report.id);
};

export const getCostBudgetByVehicleId = async (vehicleId: string) => {
  return await prisma.costBudget.findUnique({
    where: { vehicleId }
  });
};

export const getDocumentRemindersByVehicleId = async (vehicleId: string) => {
  return await prisma.documentReminder.findMany({
    where: { vehicleId }
  });
};

export const getPendingDocumentReminders = async () => {
  return await prisma.documentReminder.findMany({
    where: { status: 'pending' }
  });
};

export const getOverdueDocumentReminders = async () => {
  const now = new Date();
  return await prisma.documentReminder.findMany({
    where: {
      status: 'pending',
      dueDate: { lt: now }
    }
  });
};

export const getOperationRecordsByVehicleId = async (vehicleId: string) => {
  return await prisma.operationRecord.findMany({
    where: { vehicleId },
    orderBy: { createdAt: 'desc' }
  });
};

export const getVehicleStatusHistory = async (vehicleId: string) => {
  const vehicle = await getVehicleById(vehicleId);
  return vehicle?.statusHistory || [];
};

export const getTasksCostSummary = async (vehicleId: string) => {
  const tasks = await getTasksByVehicleId(vehicleId);
  return {
    totalEstimated: tasks.reduce((sum, t) => sum + t.estimatedCost, 0),
    totalActual: tasks.reduce((sum, t) => sum + t.cost, 0),
    completedCost: tasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.cost, 0),
    pendingCost: tasks.filter(t => t.status !== 'completed').reduce((sum, t) => sum + t.estimatedCost, 0)
  };
};

export const getFinanceRecordsWithOverdueStatus = async () => {
  const now = new Date();
  const records = await prisma.financeRecord.findMany();
  return records.map(fr => {
    if (fr.status === 'pending' && new Date(fr.dueDate) < now) {
      return { ...fr, status: 'overdue' as const };
    }
    return fr;
  });
};

export const getVehiclesByCurrentAssignee = async (userId: string) => {
  const vehicles = await prisma.vehicle.findMany({
    where: { currentAssigneeId: userId },
    include: {
      statusHistory: { orderBy: { changedAt: 'asc' } }
    }
  });
  return vehicles;
};

export const getVehiclesByRole = async (role: string) => {
  const vehicles = await prisma.vehicle.findMany({
    where: { currentAssigneeRole: role },
    include: {
      statusHistory: { orderBy: { changedAt: 'asc' } }
    }
  });
  return vehicles;
};

export const createOperationRecord = async (data: {
  vehicleId: string;
  type: string;
  action: string;
  previousValue?: string | null;
  newValue?: string | null;
  actorId: string;
  actorName: string;
  actorRole: string;
  note: string;
  metadata?: Record<string, unknown>;
}) => {
  return await prisma.operationRecord.create({
    data: {
      ...data,
      metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined
    }
  });
};

export const createTimelineEvent = async (data: {
  vehicleId: string;
  type: string;
  title: string;
  description: string;
  actorId: string;
  actorName: string;
  metadata?: Record<string, unknown>;
}) => {
  return await prisma.timelineEvent.create({
    data: {
      ...data,
      metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined
    }
  });
};

export const updateVehicleStatus = async (
  vehicleId: string,
  newStatus: string,
  actorId: string,
  actorName: string,
  note: string,
  nextAssigneeId?: string,
  nextAssigneeRole?: string
) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new Error('Vehicle not found');

  const previousStatus = vehicle.status;

  const updateData: any = {
    status: newStatus,
    updatedAt: new Date(),
    statusHistory: {
      create: {
        status: newStatus,
        changedBy: actorId,
        changedByName: actorName,
        changedAt: new Date(),
        note
      }
    }
  };

  if (nextAssigneeId && nextAssigneeRole) {
    updateData.currentAssigneeId = nextAssigneeId;
    updateData.currentAssigneeRole = nextAssigneeRole;
  }

  const updatedVehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: updateData,
    include: {
      statusHistory: { orderBy: { changedAt: 'asc' } }
    }
  });

  await createOperationRecord({
    vehicleId,
    type: 'status_change',
    action: 'status_changed',
    previousValue: previousStatus,
    newValue: newStatus,
    actorId,
    actorName,
    actorRole: vehicle.currentAssigneeRole,
    note
  });

  await createTimelineEvent({
    vehicleId,
    type: 'status_change',
    title: '状态变更',
    description: `车辆状态从 ${previousStatus} 变更为 ${newStatus}`,
    actorId,
    actorName,
    metadata: { previousStatus, newStatus, nextAssigneeId, nextAssigneeRole }
  });

  return updatedVehicle;
};

export const createPreparationTask = async (data: {
  vehicleId: string;
  title: string;
  description: string;
  cost: number;
  estimatedCost: number;
  estimatedHours: number;
  assigneeId: string;
  assigneeName: string;
  dueDate: Date;
  note?: string;
  createdBy: string;
  createdByName: string;
}) => {
  const task = await prisma.preparationTask.create({
    data: {
      ...data,
      status: 'pending',
      actualHours: 0,
      completedAt: null,
      note: data.note || '',
      costHistory: {
        create: {
          cost: data.cost,
          changedBy: data.createdBy,
          changedByName: data.createdByName,
          changedAt: new Date(),
          reason: '初始预估成本'
        }
      }
    },
    include: {
      costHistory: { orderBy: { changedAt: 'asc' } }
    }
  });

  await createOperationRecord({
    vehicleId: data.vehicleId,
    type: 'task',
    action: 'task_created',
    newValue: task.id,
    actorId: data.createdBy,
    actorName: data.createdByName,
    actorRole: 'assessor',
    note: `创建整备任务: ${data.title}`,
    metadata: { taskId: task.id, taskTitle: data.title }
  });

  await createTimelineEvent({
    vehicleId: data.vehicleId,
    type: 'task',
    title: '任务创建',
    description: `创建整备任务: ${data.title}`,
    actorId: data.createdBy,
    actorName: data.createdByName,
    metadata: { taskId: task.id, taskTitle: data.title }
  });

  return task;
};

export const updatePreparationTaskStatus = async (
  taskId: string,
  newStatus: string,
  actorId: string,
  actorName: string,
  note?: string
) => {
  const task = await prisma.preparationTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('Task not found');

  const previousStatus = task.status;

  const updatedTask = await prisma.preparationTask.update({
    where: { id: taskId },
    data: {
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date() : null,
      note: note || task.note,
      updatedAt: new Date()
    },
    include: {
      costHistory: { orderBy: { changedAt: 'asc' } }
    }
  });

  await createOperationRecord({
    vehicleId: task.vehicleId,
    type: 'task',
    action: 'task_status_changed',
    previousValue: previousStatus,
    newValue: newStatus,
    actorId,
    actorName,
    actorRole: 'assessor',
    note: `任务状态变更: ${task.title}`,
    metadata: { taskId, taskTitle: task.title }
  });

  if (newStatus === 'completed') {
    await createTimelineEvent({
      vehicleId: task.vehicleId,
      type: 'task',
      title: '任务完成',
      description: `整备任务完成: ${task.title}`,
      actorId,
      actorName,
      metadata: { taskId, taskTitle: task.title }
    });
  }

  return updatedTask;
};

export const updatePreparationTaskCost = async (
  taskId: string,
  newCost: number,
  actorId: string,
  actorName: string,
  reason: string
) => {
  const task = await prisma.preparationTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('Task not found');

  const previousCost = task.cost;

  const updatedTask = await prisma.preparationTask.update({
    where: { id: taskId },
    data: {
      cost: newCost,
      updatedAt: new Date(),
      costHistory: {
        create: {
          cost: newCost,
          changedBy: actorId,
          changedByName: actorName,
          changedAt: new Date(),
          reason
        }
      }
    },
    include: {
      costHistory: { orderBy: { changedAt: 'asc' } }
    }
  });

  await createOperationRecord({
    vehicleId: task.vehicleId,
    type: 'task',
    action: 'task_cost_changed',
    previousValue: previousCost.toString(),
    newValue: newCost.toString(),
    actorId,
    actorName,
    actorRole: 'assessor',
    note: `任务成本变更: ${task.title} (${previousCost} → ${newCost})`,
    metadata: { taskId, taskTitle: task.title, previousCost, newCost }
  });

  return updatedTask;
};

export const createFinanceRecord = async (data: {
  vehicleId: string;
  type: string;
  documentName: string;
  status: string;
  assigneeId: string;
  assigneeName: string;
  dueDate: Date;
  note?: string;
  createdBy: string;
  createdByName: string;
}) => {
  const record = await prisma.financeRecord.create({
    data: {
      ...data,
      remindedCount: 0,
      lastRemindedAt: null,
      note: data.note || ''
    }
  });

  await createOperationRecord({
    vehicleId: data.vehicleId,
    type: 'finance',
    action: 'finance_record_created',
    newValue: record.id,
    actorId: data.createdBy,
    actorName: data.createdByName,
    actorRole: 'finance',
    note: `创建金融记录: ${data.documentName}`,
    metadata: { recordId: record.id, documentName: data.documentName }
  });

  await createTimelineEvent({
    vehicleId: data.vehicleId,
    type: 'finance',
    title: '金融记录创建',
    description: `创建金融记录: ${data.documentName}`,
    actorId: data.createdBy,
    actorName: data.createdByName,
    metadata: { recordId: record.id, documentName: data.documentName }
  });

  return record;
};

export const updateFinanceRecordStatus = async (
  recordId: string,
  newStatus: string,
  actorId: string,
  actorName: string,
  note?: string
) => {
  const record = await prisma.financeRecord.findUnique({ where: { id: recordId } });
  if (!record) throw new Error('Finance record not found');

  const previousStatus = record.status;

  const updatedRecord = await prisma.financeRecord.update({
    where: { id: recordId },
    data: {
      status: newStatus,
      note: note || record.note,
      updatedAt: new Date()
    }
  });

  await createOperationRecord({
    vehicleId: record.vehicleId,
    type: 'finance',
    action: 'finance_status_changed',
    previousValue: previousStatus,
    newValue: newStatus,
    actorId,
    actorName,
    actorRole: 'finance',
    note: `金融记录状态变更: ${record.documentName}`,
    metadata: { recordId, documentName: record.documentName }
  });

  return updatedRecord;
};

export const getVehiclesWithDetails = async (filters?: {
  status?: string;
  managerId?: string;
  assessorId?: string;
  financeId?: string;
  search?: string;
  currentAssigneeRole?: string;
}) => {
  const vehicles = await filterVehicles(filters || {});

  const vehiclesWithDetails = await Promise.all(
    vehicles.map(async (vehicle) => {
      const tasks = await getTasksByVehicleId(vehicle.id);
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const totalCost = tasks.reduce((sum, t) => sum + t.cost, 0);
      return {
        ...vehicle,
        taskCount: tasks.length,
        completedTasks,
        totalCost
      };
    })
  );

  return vehiclesWithDetails;
};

export const getNextAssigneeForStatus = (currentStatus: string, vehicle: any) => {
  const transitions: Record<string, { nextAssigneeId: string; nextAssigneeRole: string } | null> = {
    'pending': vehicle.assessorId ? { nextAssigneeId: vehicle.assessorId, nextAssigneeRole: 'assessor' } : null,
    'inspected': vehicle.managerId ? { nextAssigneeId: vehicle.managerId, nextAssigneeRole: 'manager' } : null,
    'preparing': vehicle.financeId ? { nextAssigneeId: vehicle.financeId, nextAssigneeRole: 'finance' } : null,
    'completed': vehicle.managerId ? { nextAssigneeId: vehicle.managerId, nextAssigneeRole: 'manager' } : null,
  };

  return transitions[currentStatus] || null;
};