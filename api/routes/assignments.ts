import express from 'express';
import { assignmentService } from '../services/assignmentService';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const assignments = assignmentService.getAllAssignments();
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: '获取分配记录失败', error });
  }
});

router.post('/', (req, res) => {
  try {
    const { queueId, tableId, assignedBy } = req.body;
    const assignment = assignmentService.createAssignment(queueId, tableId, assignedBy);
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: '创建分配记录失败', error });
  }
});

export default router;
