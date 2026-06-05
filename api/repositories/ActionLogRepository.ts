import { db } from '../db/memoryDb.js';
import type { ActionLog, ActionRequest } from '../../shared/types.js';

export class ActionLogRepository {
  create(complaintId: string, data: ActionRequest): ActionLog {
    return db.actionLogs.create(complaintId, data);
  }

  findById(id: string): ActionLog | null {
    return null;
  }

  findByComplaintId(complaintId: string): ActionLog[] {
    return db.actionLogs.findByComplaintId(complaintId);
  }
}

export default new ActionLogRepository();
