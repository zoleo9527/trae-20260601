import type { Request, Response } from 'express';
import { recordService } from '../services/recordService.js';
import type { RecordStatus } from '../../shared/types.js';

export const recordController = {
  getAllRecords(req: Request, res: Response) {
    const { status, plateNumber } = req.query;
    const filters: { status?: RecordStatus; plateNumber?: string } = {};
    if (status && typeof status === 'string') {
      filters.status = status as RecordStatus;
    }
    if (plateNumber && typeof plateNumber === 'string') {
      filters.plateNumber = plateNumber;
    }
    res.json(recordService.getAllRecords(filters));
  },

  getRecordById(req: Request, res: Response) {
    const { id } = req.params;
    const record = recordService.getRecordById(id);
    if (!record) {
      res.status(404).json({ error: '记录不存在' });
      return;
    }
    res.json(record);
  },

  createRecord(req: Request, res: Response) {
    try {
      const record = recordService.createRecord(req.body);
      res.status(201).json(record);
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  },

  updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const updated = recordService.updateStatus(id, req.body);
      if (!updated) {
        res.status(404).json({ error: '记录不存在' });
        return;
      }
      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  },

  registerDiscrepancy(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const updated = recordService.registerDiscrepancy(id, req.body);
      if (!updated) {
        res.status(404).json({ error: '记录不存在' });
        return;
      }
      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  },

  getOperationLogs(req: Request, res: Response) {
    const { id } = req.params;
    res.json(recordService.getOperationLogs(id));
  },
};
