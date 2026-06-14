import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../database';
import { stateMachine } from '../services/stateMachine';
import {
  ExamTrackStatus,
  OperationType,
  UserRole,
  ExamTrackRecord,
  CreateRecordRequest,
  UpdateRecordRequest,
  RejectRequest,
  SupplementRequest,
  ConfirmExamRequest,
  UpdateProgressRequest
} from '../types';

const router = express.Router();

router.use((req: Request, res: Response, next) => {
  const role = (req.headers['x-role'] as UserRole) || UserRole.TEACHER;
  const userId = req.headers['x-user-id'] as string || 'default-user';
  const userName = req.headers['x-user-name'] as string || '默认用户';
  
  (req as any).role = role;
  (req as any).userId = userId;
  (req as any).userName = userName;
  
  next();
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const role = (req as any).role as UserRole;
    const userId = (req as any).userId as string;
    
    let records = await dbService.getRecords(role, role === UserRole.TEACHER ? userId : undefined);
    
    if (role !== UserRole.TEACHER) {
      const todoStatuses = stateMachine.getTodoStatusesForRole(role);
      records = records.filter(r => todoStatuses.includes(r.status));
    }
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const record = await dbService.getRecordById(id);
    
    if (!record) {
      res.status(404).json({ error: '记录不存在' });
      return;
    }
    
    const logs = await dbService.getOperationLogsByRecordId(id);
    res.json({ record, logs });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const role = (req as any).role as UserRole;
    const userId = (req as any).userId as string;
    const userName = (req as any).userName as string;
    
    if (!stateMachine.canPerformOperation(role, OperationType.CREATE)) {
      res.status(403).json({ error: '无权限创建记录' });
      return;
    }
    
    const data: CreateRecordRequest = req.body;
    
    const practicePlan = {
      ...data.practicePlan,
      id: uuidv4(),
      recordId: '',
      progress: 0
    };
    
    const record: Omit<ExamTrackRecord, 'createdAt' | 'updatedAt'> = {
      id: uuidv4(),
      studentId: data.studentId,
      studentName: data.studentName,
      instrument: data.instrument,
      examLevel: data.examLevel,
      trackName: data.trackName,
      trackType: data.trackType,
      practicePlan: { ...practicePlan, recordId: record.id },
      status: ExamTrackStatus.DRAFT,
      createdBy: userId
    };
    
    record.practicePlan = { ...practicePlan, recordId: record.id };
    
    const createdRecord = await dbService.createRecord(record);
    
    await dbService.createOperationLog({
      id: uuidv4(),
      recordId: record.id,
      operatorId: userId,
      operatorName: userName,
      operatorRole: role,
      operationType: OperationType.CREATE,
      newStatus: ExamTrackStatus.DRAFT
    });
    
    res.status(201).json(createdRecord);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const role = (req as any).role as UserRole;
    const userId = (req as any).userId as string;
    const userName = (req as any).userName as string;
    const { id } = req.params;
    const data: UpdateRecordRequest = req.body;
    
    if (!stateMachine.canPerformOperation(role, OperationType.UPDATE_PLAN)) {
      res.status(403).json({ error: '无权限更新记录' });
      return;
    }
    
    const record = await dbService.getRecordById(id);
    if (!record) {
      res.status(404).json({ error: '记录不存在' });
      return;
    }
    
    if (role === UserRole.TEACHER && record.createdBy !== userId) {
      res.status(403).json({ error: '只能修改自己创建的记录' });
      return;
    }
    
    const updates: Partial<ExamTrackRecord> = {};
    if (data.studentName) updates.studentName = data.studentName;
    if (data.instrument) updates.instrument = data.instrument;
    if (data.examLevel) updates.examLevel = data.examLevel;
    if (data.trackName) updates.trackName = data.trackName;
    if (data.trackType) updates.trackType = data.trackType;
    if (data.practicePlan) updates.practicePlan = data.practicePlan;
    
    const updatedRecord = await dbService.updateRecord(id, updates);
    
    if (updatedRecord) {
      await dbService.createOperationLog({
        id: uuidv4(),
        recordId: id,
        operatorId: userId,
        operatorName: userName,
        operatorRole: role,
        operationType: OperationType.UPDATE_PLAN,
        previousStatus: record.status,
        newStatus: record.status
      });
    }
    
    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:id/submit', async (req: Request, res: Response) => {
  try {
    const role = (req as any).role as UserRole;
    const userId = (req as any).userId as string;
    const userName = (req as any).userName as string;
    const { id } = req.params;
    
    if (!stateMachine.canPerformOperation(role, OperationType.SUBMIT)) {
      res.status(403).json({ error: '无权限提交审核' });
      return;
    }
    
    const record = await dbService.getRecordById(id);
    if (!record) {
      res.status(404).json({ error: '记录不存在' });
      return;
    }
    
    if (role === UserRole.TEACHER && record.createdBy !== userId) {
      res.status(403).json({ error: '只能提交自己创建的记录' });
      return;
    }
    
    const nextStatus = stateMachine.getNextStatus(record.status, OperationType.SUBMIT);
    if (!nextStatus) {
      res.status(400).json({ error: '当前状态不允许提交' });
      return;
    }
    
    const updatedRecord = await dbService.updateRecord(id, { status: nextStatus });
    
    if (updatedRecord) {
      await dbService.createOperationLog({
        id: uuidv4(),
        recordId: id,
        operatorId: userId,
        operatorName: userName,
        operatorRole: role,
        operationType: OperationType.SUBMIT,
        previousStatus: record.status,
        newStatus: nextStatus
      });
    }
    
    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const role = (req as any).role as UserRole;
    const userId = (req as any).userId as string;
    const userName = (req as any).userName as string;
    const { id } = req.params;
    
    if (!stateMachine.canPerformOperation(role, OperationType.APPROVE)) {
      res.status(403).json({ error: '无权限审核通过' });
      return;
    }
    
    const record = await dbService.getRecordById(id);
    if (!record) {
      res.status(404).json({ error: '记录不存在' });
      return;
    }
    
    const nextStatus = stateMachine.getNextStatus(record.status, OperationType.APPROVE);
    if (!nextStatus) {
      res.status(400).json({ error: '当前状态不允许审核通过' });
      return;
    }
    
    const updatedRecord = await dbService.updateRecord(id, { status: nextStatus });
    
    if (updatedRecord) {
      await dbService.createOperationLog({
        id: uuidv4(),
        recordId: id,
        operatorId: userId,
        operatorName: userName,
        operatorRole: role,
        operationType: OperationType.APPROVE,
        previousStatus: record.status,
        newStatus: nextStatus
      });
    }
    
    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const role = (req as any).role as UserRole;
    const userId = (req as any).userId as string;
    const userName = (req as any).userName as string;
    const { id } = req.params;
    const data: RejectRequest = req.body;
    
    if (!stateMachine.canPerformOperation(role, OperationType.REJECT)) {
      res.status(403).json({ error: '无权限退回' });
      return;
    }
    
    const record = await dbService.getRecordById(id);
    if (!record) {
      res.status(404).json({ error: '记录不存在' });
      return;
    }
    
    const nextStatus = stateMachine.getNextStatus(record.status, OperationType.REJECT);
    if (!nextStatus) {
      res.status(400).json({ error: '当前状态不允许退回' });
      return;
    }
    
    const updatedRecord = await dbService.updateRecord(id, {
      status: nextStatus,
      rejectReason: data.reason
    });
    
    if (updatedRecord) {
      await dbService.createOperationLog({
        id: uuidv4(),
        recordId: id,
        operatorId: userId,
        operatorName: userName,
        operatorRole: role,
        operationType: OperationType.REJECT,
        previousStatus: record.status,
        newStatus: nextStatus,
        comment: data.reason
      });
    }
    
    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:id/supplement', async (req: Request, res: Response) => {
  try {
    const role = (req as any).role as UserRole;
    const userId = (req as any).userId as string;
    const userName = (req as any).userName as string;
    const { id } = req.params;
    const data: SupplementRequest = req.body;
    
    if (!stateMachine.canPerformOperation(role, OperationType.SUPPLEMENT)) {
      res.status(403).json({ error: '无权限补充修改' });
      return;
    }
    
    const record = await dbService.getRecordById(id);
    if (!record) {
      res.status(404).json({ error: '记录不存在' });
      return;
    }
    
    if (role === UserRole.TEACHER && record.createdBy !== userId) {
      res.status(403).json({ error: '只能补充自己创建的记录' });
      return;
    }
    
    const nextStatus = stateMachine.getNextStatus(record.status, OperationType.SUPPLEMENT);
    if (!nextStatus) {
      res.status(400).json({ error: '当前状态不允许补充' });
      return;
    }
    
    const updates: Partial<ExamTrackRecord> = {
      status: nextStatus,
      supplementNotes: data.supplementNotes
    };
    if (data.practicePlan) {
      updates.practicePlan = data.practicePlan;
    }
    
    const updatedRecord = await dbService.updateRecord(id, updates);
    
    if (updatedRecord) {
      await dbService.createOperationLog({
        id: uuidv4(),
        recordId: id,
        operatorId: userId,
        operatorName: userName,
        operatorRole: role,
        operationType: OperationType.SUPPLEMENT,
        previousStatus: record.status,
        newStatus: nextStatus,
        comment: data.supplementNotes
      });
    }
    
    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:id/start-practice', async (req: Request, res: Response) => {
  try {
    const role = (req as any).role as UserRole;
    const userId = (req as any).userId as string;
    const userName = (req as any).userName as string;
    const { id } = req.params;
    
    const record = await dbService.getRecordById(id);
    if (!record) {
      res.status(404).json({ error: '记录不存在' });
      return;
    }
    
    if (!stateMachine.isValidTransition(record.status, ExamTrackStatus.IN_PRACTICE)) {
      res.status(400).json({ error: '当前状态不允许开始练习' });
      return;
    }
    
    const updatedRecord = await dbService.updateRecord(id, { status: ExamTrackStatus.IN_PRACTICE });
    
    if (updatedRecord) {
      await dbService.createOperationLog({
        id: uuidv4(),
        recordId: id,
        operatorId: userId,
        operatorName: userName,
        operatorRole: role,
        operationType: OperationType.UPDATE_PROGRESS,
        previousStatus: record.status,
        newStatus: ExamTrackStatus.IN_PRACTICE,
        comment: '开始练习'
      });
    }
    
    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:id/progress', async (req: Request, res: Response) => {
  try {
    const role = (req as any).role as UserRole;
    const userId = (req as any).userId as string;
    const userName = (req as any).userName as string;
    const { id } = req.params;
    const data: UpdateProgressRequest = req.body;
    
    if (!stateMachine.canPerformOperation(role, OperationType.UPDATE_PROGRESS)) {
      res.status(403).json({ error: '无权限更新进度' });
      return;
    }
    
    const record = await dbService.getRecordById(id);
    if (!record) {
      res.status(404).json({ error: '记录不存在' });
      return;
    }
    
    if (role === UserRole.TEACHER && record.createdBy !== userId) {
      res.status(403).json({ error: '只能更新自己创建的记录' });
      return;
    }
    
    if (record.status !== ExamTrackStatus.IN_PRACTICE) {
      res.status(400).json({ error: '只能在练习中状态更新进度' });
      return;
    }
    
    const updatedPlan = { ...record.practicePlan, progress: data.progress };
    const updatedRecord = await dbService.updateRecord(id, { practicePlan: updatedPlan });
    
    if (updatedRecord) {
      await dbService.createOperationLog({
        id: uuidv4(),
        recordId: id,
        operatorId: userId,
        operatorName: userName,
        operatorRole: role,
        operationType: OperationType.UPDATE_PROGRESS,
        previousStatus: record.status,
        newStatus: record.status,
        comment: `进度更新至 ${data.progress}%`
      });
    }
    
    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const role = (req as any).role as UserRole;
    const userId = (req as any).userId as string;
    const userName = (req as any).userName as string;
    const { id } = req.params;
    
    if (!stateMachine.canPerformOperation(role, OperationType.COMPLETE)) {
      res.status(403).json({ error: '无权限标记完成' });
      return;
    }
    
    const record = await dbService.getRecordById(id);
    if (!record) {
      res.status(404).json({ error: '记录不存在' });
      return;
    }
    
    if (role === UserRole.TEACHER && record.createdBy !== userId) {
      res.status(403).json({ error: '只能完成自己创建的记录' });
      return;
    }
    
    const nextStatus = stateMachine.getNextStatus(record.status, OperationType.COMPLETE);
    if (!nextStatus) {
      res.status(400).json({ error: '当前状态不允许标记完成' });
      return;
    }
    
    const updatedRecord = await dbService.updateRecord(id, { status: nextStatus });
    
    if (updatedRecord) {
      await dbService.createOperationLog({
        id: uuidv4(),
        recordId: id,
        operatorId: userId,
        operatorName: userName,
        operatorRole: role,
        operationType: OperationType.COMPLETE,
        previousStatus: record.status,
        newStatus: nextStatus
      });
    }
    
    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:id/confirm-exam', async (req: Request, res: Response) => {
  try {
    const role = (req as any).role as UserRole;
    const userId = (req as any).userId as string;
    const userName = (req as any).userName as string;
    const { id } = req.params;
    const data: ConfirmExamRequest = req.body;
    
    if (!stateMachine.canPerformOperation(role, OperationType.CONFIRM_EXAM_RESULT)) {
      res.status(403).json({ error: '无权限确认考级结果' });
      return;
    }
    
    const record = await dbService.getRecordById(id);
    if (!record) {
      res.status(404).json({ error: '记录不存在' });
      return;
    }
    
    const nextStatus = data.passed ? ExamTrackStatus.EXAM_PASSED : ExamTrackStatus.EXAM_FAILED;
    
    if (!stateMachine.isValidTransition(record.status, nextStatus)) {
      res.status(400).json({ error: '当前状态不允许确认考级结果' });
      return;
    }
    
    const updatedRecord = await dbService.updateRecord(id, { status: nextStatus });
    
    if (updatedRecord) {
      await dbService.createOperationLog({
        id: uuidv4(),
        recordId: id,
        operatorId: userId,
        operatorName: userName,
        operatorRole: role,
        operationType: OperationType.CONFIRM_EXAM_RESULT,
        previousStatus: record.status,
        newStatus: nextStatus,
        comment: data.passed ? '考级通过' : '考级未通过'
      });
    }
    
    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id/logs', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const logs = await dbService.getOperationLogsByRecordId(id);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
