import type { Request, Response } from 'express';
import { db } from '../data/database.js';
import { recordService } from '../services/recordService.js';

export const dockController = {
  getAllDocks(_req: Request, res: Response) {
    res.json(db.docks);
  },

  assignDock(req: Request, res: Response) {
    const { id } = req.params;
    const result = recordService.assignDock(id, req.body);
    if (!result) {
      res.status(404).json({ error: '月台或记录不存在' });
      return;
    }
    res.json(result);
  },
};
