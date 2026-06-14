import prisma from '~/db.server';
import type { Vehicle, InspectionReport, PreparationTask, TimelineEvent, FinanceRecord, User, StatusTransitionConfig, AccidentAnnotation, CostBudget, DocumentReminder, OperationRecord } from '~/types';

export const getVehicleById = async (id: string): Promise<Vehicle | null> => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      statusHistory: { orderBy: { changedAt: 'asc' } }
    }
  });
  return vehicle as Vehicle | null;
};

export const getReportByVehicleId = async (vehicleId: string): Promise<InspectionReport | null> => {
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
  return report as InspectionReport | null;
};

export const getTasksByVehicleId = async (vehicleId: string): Promise<PreparationTask[]> => {
  const tasks = await prisma.preparationTask.findMany({
    where: { vehicleId },
    include: {
      costHistory: { orderBy: { changedAt: 'asc' } }
    }
  });
  return tasks as PreparationTask[];
};

export const getEventsByVehicleId = async (vehicleId: string): Promise<TimelineEvent[]> => {
  const events = await prisma.timelineEvent.findMany({
    where: { vehicleId },
    orderBy: { createdAt: 'desc' }
  });
  return events as TimelineEvent[];
};

export const getFinanceRecordsByVehicleId = async (vehicleId: string): Promise<FinanceRecord[]> => {
  const records = await prisma.financeRecord.findMany({
    where: { vehicleId },
    orderBy: { updatedAt: 'desc' }
  });
  return records as FinanceRecord[];
};

export const getUserById = async (id: string): Promise<User | null> => {
  return await prisma.user.findUnique({ where: { id }) as Promise<User | null>;
};

export const getUsersByRole = async (role: string): Promise<User[]> => {
  return await prisma.user.findMany({ where: { role }) as Promise<User[]>;
};

export const getAllVehicles = async (): Promise<Vehicle[]> => {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      statusHistory: { orderBy: { changedAt: 'asc' } }
    },
    orderBy: { updatedAt: 'desc' }
  });
  return vehicles as Vehicle[];
};

export const filterVehicles = async (filters: {
  status?: string;
  managerId?: string;
  assessorId?: string;
  financeId?: string;
  search?: string;
  currentAssigneeId?: string;
  currentAssigneeRole?: string;
}): Promise<Vehicle[]> => {
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
  return vehicles as Vehicle[];
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

export const getStatusTransitionConfigs = async (): Promise<StatusTransitionConfig[]> => {
  return await prisma.statusTransitionConfig.findMany() as Promise<StatusTransitionConfig[]>;
};

export const getNextAvailableTransitions = async (currentStatus: string): Promise<StatusTransitionConfig[]> => {
  return await prisma.statusTransitionConfig.findMany({
    where: { fromStatus: currentStatus }
  }) as Promise<StatusTransitionConfig[]>;
};

export const getAccidentAnnotationsByReportId = async (reportId: string): Promise<AccidentAnnotation[]> => {
  return await prisma.accidentAnnotation.findMany({
    where: { reportId }
  }) as Promise<AccidentAnnotation[]>;
};

export const getAccidentAnnotationsByVehicleId = async (vehicleId: string): Promise<AccidentAnnotation[]> => {
  const report = await getReportByVehicleId(vehicleId);
  if (!report) return [];
  return getAccidentAnnotationsByReportId(report.id);
};

export const getCostBudgetByVehicleId = async (vehicleId: string): Promise<CostBudget | null> => {
  return await prisma.costBudget.findUnique({
    where: { vehicleId }
  }) as Promise<CostBudget | null>;
};

export const getDocumentRemindersByVehicleId = async (vehicleId: string): Promise<DocumentReminder[]> => {
  return await prisma.documentReminder.findMany({
    where: { vehicleId }
  }) as Promise<DocumentReminder[]>;
};

export const getPendingDocumentReminders = async (): Promise<DocumentReminder[]> => {
  return await prisma.documentReminder.findMany({
    where: { status: 'pending' }
  }) as Promise<DocumentReminder[]>;
};

export const getOverdueDocumentReminders = async (): Promise<DocumentReminder[]> => {
  const now = new Date();
  return await prisma.documentReminder.findMany({
    where: {
      status: 'pending',
      dueDate: { lt: now }
    }
  }) as Promise<DocumentReminder[]>;
};

export const getOperationRecordsByVehicleId = async (vehicleId: string): Promise<OperationRecord[]> => {
  return await prisma.operationRecord.findMany({
    where: { vehicleId },
    orderBy: { createdAt: 'desc' }
  }) as Promise<OperationRecord[]>;
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

export const getFinanceRecordsWithOverdueStatus = async (): Promise<FinanceRecord[]> => {
  const now = new Date();
  const records = await prisma.financeRecord.findMany();
  return records.map(fr => {
    if (fr.status === 'pending' && new Date(fr.dueDate) < now) {
      return { ...fr, status: 'overdue' as const };
    }
    return fr;
  }) as FinanceRecord[];
};

export const getVehiclesByCurrentAssignee = async (userId: string): Promise<Vehicle[]> => {
  const vehicles = await prisma.vehicle.findMany({
    where: { currentAssigneeId: userId },
    include: {
      statusHistory: { orderBy: { changedAt: 'asc' } }
    }
  });
  return vehicles as Vehicle[];
};

export const getVehiclesByRole = async (role: string): Promise<Vehicle[]> => {
  const vehicles = await prisma.vehicle.findMany({
    where: { currentAssigneeRole: role },
    include: {
      statusHistory: { orderBy: { changedAt: 'asc' } }
    }
  });
  return vehicles as Vehicle[];
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
}): Promise<OperationRecord> => {
  return await prisma.operationRecord.create({
    data: {
      ...data,
      metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null
    }
  }) as Promise<OperationRecord>;
};

export const createTimelineEvent = async (data: {
  vehicleId: string;
  type: string;
  title: string;
  description: string;
  actorId: string;
  actorName: string;
  metadata?: Record<string, unknown>;
}): Promise<TimelineEvent> => {
  return await prisma.timelineEvent.create({
    data: {
      ...data,
      metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null
    }
  }) as Promise<TimelineEvent>;
};

export const updateVehicleStatus = async (
  vehicleId: string,
  newStatus: string,
  actorId: string,
  actorName: string,
  note: string
): Promise<Vehicle> => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new Error('Vehicle not found');

  const previousStatus = vehicle.status;

  const updatedVehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
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
    },
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
    metadata: { previousStatus, newStatus }
  });

  return updatedVehicle as Vehicle;
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
}): Promise<PreparationTask> => {
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

  return task as PreparationTask;
};

export const updatePreparationTaskStatus = async (
  taskId: string,
  newStatus: string,
  actorId: string,
  actorName: string,
  note?: string
): Promise<PreparationTask> => {
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

  return updatedTask as PreparationTask;
};

export const updatePreparationTaskCost = async (
  taskId: string,
  newCost: number,
  actorId: string,
  actorName: string,
  reason: string
): Promise<PreparationTask> => {
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

  return updatedTask as PreparationTask;
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
}): Promise<FinanceRecord> => {
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

  return record as FinanceRecord;
};

export const updateFinanceRecordStatus = async (
  recordId: string,
  newStatus: string,
  actorId: string,
  actorName: string,
  note?: string
): Promise<FinanceRecord> => {
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

  return updatedRecord as FinanceRecord;
};