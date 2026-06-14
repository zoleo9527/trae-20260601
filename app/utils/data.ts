import { vehicles, inspectionReports, preparationTasks, timelineEvents, financeRecords, users, statusTransitionConfigs, accidentAnnotations, costBudgets, documentReminders, operationRecords } from '~/db/mockData';
import type { Vehicle, InspectionReport, PreparationTask, TimelineEvent, FinanceRecord, User, StatusTransitionConfig, AccidentAnnotation, CostBudget, DocumentReminder, OperationRecord } from '~/types';

export const getVehicleById = (id: string): Vehicle | undefined => {
  return vehicles.find(v => v.id === id);
};

export const getReportByVehicleId = (vehicleId: string): InspectionReport | undefined => {
  return inspectionReports.find(r => r.vehicleId === vehicleId);
};

export const getTasksByVehicleId = (vehicleId: string): PreparationTask[] => {
  return preparationTasks.filter(t => t.vehicleId === vehicleId);
};

export const getEventsByVehicleId = (vehicleId: string): TimelineEvent[] => {
  return timelineEvents.filter(e => e.vehicleId === vehicleId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getFinanceRecordsByVehicleId = (vehicleId: string): FinanceRecord[] => {
  return financeRecords.filter(f => f.vehicleId === vehicleId);
};

export const getUserById = (id: string): User | undefined => {
  return users.find(u => u.id === id);
};

export const getUsersByRole = (role: string): User[] => {
  return users.filter(u => u.role === role);
};

export const getAllVehicles = (): Vehicle[] => {
  return vehicles;
};

export const filterVehicles = (filters: {
  status?: string;
  managerId?: string;
  assessorId?: string;
  financeId?: string;
  search?: string;
  currentAssigneeId?: string;
  currentAssigneeRole?: string;
}): Vehicle[] => {
  return vehicles.filter(v => {
    if (filters.status && v.status !== filters.status) return false;
    if (filters.managerId && v.managerId !== filters.managerId) return false;
    if (filters.assessorId && v.assessorId !== filters.assessorId) return false;
    if (filters.financeId && v.financeId !== filters.financeId) return false;
    if (filters.currentAssigneeId && v.currentAssigneeId !== filters.currentAssigneeId) return false;
    if (filters.currentAssigneeRole && v.currentAssigneeRole !== filters.currentAssigneeRole) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        v.licensePlate.toLowerCase().includes(searchLower) ||
        v.brand.toLowerCase().includes(searchLower) ||
        v.model.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });
};

export const getTotalCostByVehicleId = (vehicleId: string): number => {
  const tasks = getTasksByVehicleId(vehicleId);
  return tasks.reduce((sum, t) => sum + t.cost, 0);
};

export const getCompletedTaskCount = (vehicleId: string): number => {
  const tasks = getTasksByVehicleId(vehicleId);
  return tasks.filter(t => t.status === 'completed').length;
};

export const getTotalTaskCount = (vehicleId: string): number => {
  return getTasksByVehicleId(vehicleId).length;
};

export const getStatusTransitionConfigs = (): StatusTransitionConfig[] => {
  return statusTransitionConfigs;
};

export const getNextAvailableTransitions = (currentStatus: string): StatusTransitionConfig[] => {
  return statusTransitionConfigs.filter(stc => stc.fromStatus === currentStatus);
};

export const getAccidentAnnotationsByReportId = (reportId: string): AccidentAnnotation[] => {
  return accidentAnnotations.filter(aa => aa.reportId === reportId);
};

export const getAccidentAnnotationsByVehicleId = (vehicleId: string): AccidentAnnotation[] => {
  const report = getReportByVehicleId(vehicleId);
  if (!report) return [];
  return getAccidentAnnotationsByReportId(report.id);
};

export const getCostBudgetByVehicleId = (vehicleId: string): CostBudget | undefined => {
  return costBudgets.find(cb => cb.vehicleId === vehicleId);
};

export const getDocumentRemindersByVehicleId = (vehicleId: string): DocumentReminder[] => {
  return documentReminders.filter(dr => dr.vehicleId === vehicleId);
};

export const getPendingDocumentReminders = (): DocumentReminder[] => {
  return documentReminders.filter(dr => dr.status === 'pending');
};

export const getOverdueDocumentReminders = (): DocumentReminder[] => {
  const now = new Date();
  return documentReminders.filter(dr => dr.status === 'pending' && new Date(dr.dueDate) < now);
};

export const getOperationRecordsByVehicleId = (vehicleId: string): OperationRecord[] => {
  return operationRecords.filter(or => or.vehicleId === vehicleId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getVehicleStatusHistory = (vehicleId: string): Array<{ status: string; changedBy: string; changedByName: string; changedAt: Date; note: string }> => {
  const vehicle = getVehicleById(vehicleId);
  return vehicle?.statusHistory || [];
};

export const getTasksCostSummary = (vehicleId: string): { totalEstimated: number; totalActual: number; completedCost: number; pendingCost: number } => {
  const tasks = getTasksByVehicleId(vehicleId);
  return {
    totalEstimated: tasks.reduce((sum, t) => sum + t.estimatedCost, 0),
    totalActual: tasks.reduce((sum, t) => sum + t.cost, 0),
    completedCost: tasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.cost, 0),
    pendingCost: tasks.filter(t => t.status !== 'completed').reduce((sum, t) => sum + t.estimatedCost, 0)
  };
};

export const getFinanceRecordsWithOverdueStatus = (): FinanceRecord[] => {
  const now = new Date();
  return financeRecords.map(fr => {
    if (fr.status === 'pending' && new Date(fr.dueDate) < now) {
      return { ...fr, status: 'overdue' as const };
    }
    return fr;
  });
};

export const getVehiclesByCurrentAssignee = (userId: string): Vehicle[] => {
  return vehicles.filter(v => v.currentAssigneeId === userId);
};

export const getVehiclesByRole = (role: string): Vehicle[] => {
  return vehicles.filter(v => v.currentAssigneeRole === role);
};
