import { Router } from 'express';
import complaintService from '../services/ComplaintService.js';

const router = Router();

router.get('/', (req, res) => {
  const { status, type } = req.query;
  const complaints = complaintService.getAllComplaints({
    status: status as string | undefined,
    type: type as string | undefined,
  });
  res.json(complaints);
});

router.get('/:id', (req, res) => {
  const complaint = complaintService.getComplaintWithDetails(req.params.id);
  if (!complaint) {
    res.status(404).json({ error: '投诉记录不存在' });
    return;
  }
  res.json(complaint);
});

router.post('/', (req, res) => {
  const { handlerRole, handlerName, ...data } = req.body;
  const complaint = complaintService.createComplaint(
    data,
    handlerRole,
    handlerName
  );
  res.status(201).json(complaint);
});

router.put('/:id', (req, res) => {
  const complaint = complaintService.updateComplaint(req.params.id, req.body);
  if (!complaint) {
    res.status(404).json({ error: '投诉记录不存在' });
    return;
  }
  res.json(complaint);
});

router.post('/:id/actions', (req, res) => {
  try {
    const complaint = complaintService.executeAction(req.params.id, req.body);
    if (!complaint) {
      res.status(404).json({ error: '投诉记录不存在' });
      return;
    }
    res.json(complaint);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/:id/compensations', (req, res) => {
  const { operatorRole, operatorName, ...data } = req.body;
  const complaint = complaintService.proposeCompensation(
    req.params.id,
    data,
    operatorRole,
    operatorName
  );
  if (!complaint) {
    res.status(404).json({ error: '投诉记录不存在' });
    return;
  }
  res.json(complaint);
});

export default router;
