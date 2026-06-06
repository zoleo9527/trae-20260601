import type { Request, Response } from 'express';
import { db } from '../data/database.js';

export const dashboardController = {
  getDashboardData(_req: Request, res: Response) {
    const records = db.records;
    const pendingCheckin = records.filter(r => r.status === 'pending').length;
    const pendingUnload = records.filter(r => r.status === 'checkin' || r.status === 'unloading').length;
    const pendingDiscrepancy = records.filter(r => r.status === 'finished' || r.status === 'discrepancy').length;

    const recentStatus = db.getRecentLogs(15);

    res.json({
      todoCounts: {
        pendingCheckin,
        pendingUnload,
        pendingDiscrepancy,
      },
      recentStatus,
      dockStatus: db.docks,
    });
  },
};
