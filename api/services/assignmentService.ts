import { db, generateId } from '../database';
import { Assignment } from '../types';

export const assignmentService = {
  getAllAssignments: (): Assignment[] => {
    return db.getAllAssignments();
  },

  getAssignmentsByQueueId: (queueId: string): Assignment[] => {
    const allAssignments = db.getAllAssignments();
    return allAssignments.filter(a => a.queueId === queueId);
  },

  getAssignmentsByTableId: (tableId: string): Assignment[] => {
    const allAssignments = db.getAllAssignments();
    return allAssignments.filter(a => a.tableId === tableId);
  },

  createAssignment: (queueId: string, tableId: string, assignedBy: string): Assignment => {
    return db.createAssignment(queueId, tableId, assignedBy);
  },
};
