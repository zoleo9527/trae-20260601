import { db } from '../database';
import { Assignment } from '../types';

export const assignmentService = {
  getAllAssignments: (): Assignment[] => {
    return db.getAllAssignments();
  },

  createAssignment: (queueId: string, tableId: string, assignedBy: string): Assignment => {
    return db.createAssignment(queueId, tableId, assignedBy);
  },
};
