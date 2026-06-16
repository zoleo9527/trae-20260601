import { db } from '../database';
import { SystemLog } from '../types';

export const logService = {
  getAllLogs: (): SystemLog[] => {
    return db.getAllLogs();
  },

  createLog: (userId: string, userName: string, action: string, targetType: string, targetId?: string, details?: string): SystemLog => {
    return db.createLog(userId, userName, action, targetType, targetId, details);
  },
};
