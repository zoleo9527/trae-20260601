import express from 'express';
import { assignmentService } from '../services/assignmentService';
import { logService } from '../services/logService';
import { userService } from '../services/userService';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { queueId, tableId } = req.query;
    let assignments = assignmentService.getAllAssignments();
    
    if (queueId) {
      assignments = assignments.filter(a => a.queueId === queueId);
    } else if (tableId) {
      assignments = assignments.filter(a => a.tableId === tableId);
    }
    
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: '获取分配记录失败', error });
  }
});

router.post('/', (req, res) => {
  try {
    const { queueId, tableId, assignedBy, assignedByName } = req.body;
    const assignment = assignmentService.createAssignment(queueId, tableId, assignedBy);

    logService.createLog(
      assignedBy,
      assignedByName,
      '确认桌台分配',
      '分配记录',
      assignment.id,
      `排号: ${queueId}, 桌台: ${tableId}`
    );

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: '创建分配记录失败', error });
  }
});

export default router;
