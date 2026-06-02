
import { Router, type Request, type Response } from 'express';
import { complaints } from '../data/store.js';
import type { Complaint, ComplaintStatus } from '../../shared/types.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { status, type } = req.query;

  let filteredComplaints = [...complaints] as Complaint[];

  if (status) {
    filteredComplaints = filteredComplaints.filter((c) => c.status === status);
  }
  if (type) {
    filteredComplaints = filteredComplaints.filter((c) => c.type === type);
  }

  res.json({
    success: true,
    data: filteredComplaints,
  });
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const complaint = complaints.find((c) => c.id === id);

  if (!complaint) {
    res.status(404).json({
      success: false,
      message: '投诉不存在',
    });
    return;
  }

  res.json({
    success: true,
    data: complaint as Complaint,
  });
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, handler, handleNotes } = req.body as {
    status?: ComplaintStatus;
    handler?: string;
    handleNotes?: string;
  };

  const complaint = complaints.find((c) => c.id === id);

  if (!complaint) {
    res.status(404).json({
      success: false,
      message: '投诉不存在',
    });
    return;
  }

  if (status) complaint.status = status;
  if (handler) complaint.handler = handler;
  if (handleNotes) complaint.handleNotes = handleNotes;
  complaint.handledAt = new Date().toISOString();

  res.json({
    success: true,
    data: complaint as Complaint,
    message: '投诉处理成功',
  });
});

export default router;
