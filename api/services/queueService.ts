import { db } from '../database';
import { Queue, QueueStatus } from '../types';
import { userService } from './userService';
import { tableService } from './tableService';

export const queueService = {
  getAllQueues: (): Queue[] => {
    return db.getAllQueues();
  },

  getQueueById: (id: string): Queue | null => {
    return db.getQueueById(id);
  },

  createQueue: (customerName: string, phone: string, partySize: number, submittedBy: string): Queue => {
    return db.createQueue(customerName, phone, partySize, submittedBy);
  },

  updateQueueStatus: (id: string, status: QueueStatus): Queue | null => {
    return db.updateQueueStatus(id, status);
  },

  assignTable: (queueId: string, tableId: string): Queue | null => {
    return db.assignTable(queueId, tableId);
  },

  deleteQueue: (id: string): boolean => {
    return db.deleteQueue(id);
  },
};
