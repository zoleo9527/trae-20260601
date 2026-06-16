import { Router, type Express } from 'express';
import { z, ZodError } from 'zod';
import { reservationService } from '../services/index.js';
import type { StaffRole, MinimumConsumptionStatus } from '../models/types.js';

const router: ReturnType<typeof Router> = Router();

const CreateReservationSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  tableNumber: z.string().min(1),
  reservationDate: z.string(),
  reservationTime: z.string(),
  partySize: z.number().int().positive(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium')
});

const ProcessReservationSchema = z.object({
  action: z.enum(['confirm', 'reject', 'return']),
  notes: z.string().optional(),
  internalNotes: z.string().optional()
});

const UpdateMinimumConsumptionSchema = z.object({
  amount: z.number().positive(),
  status: z.enum(['pending', 'confirmed', 'rejected', 'modified']),
  notes: z.string().optional()
});

router.post('/', async (req, res) => {
  try {
    const data = CreateReservationSchema.parse(req.body);
    const staffId = req.headers['x-staff-id'] as string;
    const staffRole = req.headers['x-staff-role'] as StaffRole;

    if (!staffId || !staffRole) {
      return res.status(401).json({ error: '缺少员工信息' });
    }

    const result = await reservationService.createReservation(data, staffId, staffRole);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: '参数验证失败', details: (error as ZodError).errors });
    }
    console.error('Error creating reservation:', error);
    res.status(500).json({ error: '创建预约失败' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { status, date, role } = req.query;
    const reservations = reservationService.getReservationsByFilters({
      status: status as string,
      date: date as string,
      role: role as StaffRole
    });
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: '获取预约列表失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const details = reservationService.getReservationDetails(req.params.id);
    res.json(details);
  } catch (error: any) {
    if (error.message === '预约不存在') {
      return res.status(404).json({ error: '预约不存在' });
    }
    console.error('Error fetching reservation details:', error);
    res.status(500).json({ error: '获取预约详情失败' });
  }
});

router.post('/:id/process', async (req, res) => {
  try {
    const { action, notes, internalNotes } = ProcessReservationSchema.parse(req.body);
    const staffId = req.headers['x-staff-id'] as string;
    const staffRole = req.headers['x-staff-role'] as StaffRole;

    if (!staffId || !staffRole) {
      return res.status(401).json({ error: '缺少员工信息' });
    }

    const result = await reservationService.processReservation(
      req.params.id,
      action,
      staffId,
      staffRole,
      notes,
      internalNotes
    );
    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: '参数验证失败', details: error.errors });
    }
    if (error.message === '预约不存在') {
      return res.status(404).json({ error: '预约不存在' });
    }
    console.error('Error processing reservation:', error);
    res.status(500).json({ error: '处理预约失败' });
  }
});

router.get('/:id/minimum-consumption', async (req, res) => {
  try {
    const details = reservationService.getReservationDetails(req.params.id);
    const reservation = details.reservation;
    
    const validStatusTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'rejected'],
      confirmed: ['modified', 'rejected'],
      rejected: ['pending', 'confirmed'],
      modified: ['confirmed', 'rejected']
    };

    const currentMinConsStatus = reservation.minimumConsumptionStatus as string;

    res.json({
      reservationId: reservation.id,
      customerName: reservation.customerName,
      tableNumber: reservation.tableNumber,
      reservationDate: reservation.reservationDate,
      reservationTime: reservation.reservationTime,
      partySize: reservation.partySize,
      minimumConsumptionAmount: reservation.minimumConsumptionAmount,
      minimumConsumptionStatus: reservation.minimumConsumptionStatus,
      internalNotes: reservation.internalNotes,
      currentStatus: reservation.status,
      statusHistory: details.minimumConsumptionHistory,
      allowedTransitions: currentMinConsStatus 
        ? validStatusTransitions[currentMinConsStatus] || []
        : ['confirmed', 'rejected'],
      notes: reservation.notes
    });
  } catch (error: any) {
    if (error.message === '预约不存在') {
      return res.status(404).json({ error: '预约不存在' });
    }
    console.error('Error fetching minimum consumption:', error);
    res.status(500).json({ error: '获取低消信息失败' });
  }
});

router.put('/:id/minimum-consumption', async (req, res) => {
  try {
    const { amount, status, notes } = UpdateMinimumConsumptionSchema.parse(req.body);
    const staffId = req.headers['x-staff-id'] as string;
    const staffRole = req.headers['x-staff-role'] as StaffRole;

    if (!staffId || !staffRole) {
      return res.status(401).json({ error: '缺少员工信息' });
    }

    const details = reservationService.getReservationDetails(req.params.id);
    const currentStatus = details.reservation.minimumConsumptionStatus;

    const validStatusTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'rejected'],
      confirmed: ['modified', 'rejected'],
      rejected: ['pending', 'confirmed'],
      modified: ['confirmed', 'rejected']
    };

    const allowedTransitions = currentStatus 
      ? validStatusTransitions[currentStatus] || []
      : ['confirmed', 'rejected'];

    if (!allowedTransitions.includes(status)) {
      return res.status(400).json({
        error: '无效的状态转换',
        currentStatus,
        allowedTransitions,
        attemptedStatus: status
      });
    }

    const result = await reservationService.updateMinimumConsumption(
      req.params.id,
      amount,
      status,
      staffId,
      staffRole,
      notes
    );
    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: '参数验证失败', details: error.errors });
    }
    if (error.message === '预约不存在') {
      return res.status(404).json({ error: '预约不存在' });
    }
    if (error.message === '低消只能在预约已确认后执行') {
      return res.status(400).json({ error: '低消只能在预约已确认后执行' });
    }
    console.error('Error updating minimum consumption:', error);
    res.status(500).json({ error: '更新低消信息失败' });
  }
});

router.get('/:id/check-duplicate', async (req, res) => {
  try {
    const { phone, date, table, time, excludeId } = req.query;
    const result = reservationService.checkDuplicateReservations(
      phone as string,
      date as string,
      table as string,
      time as string,
      excludeId as string
    );
    res.json(result);
  } catch (error) {
    console.error('Error checking duplicates:', error);
    res.status(500).json({ error: '检查重复预约失败' });
  }
});

router.get('/:id/issues', async (req, res) => {
  try {
    const issues = await reservationService.checkAllIssuesForReservation(req.params.id);
    res.json(issues);
  } catch (error) {
    console.error('Error checking issues:', error);
    res.status(500).json({ error: '检查问题失败' });
  }
});

router.get('/:id/status-history', async (req, res) => {
  try {
    const { entityType } = req.query;
    const history = reservationService.getStatusHistory(
      entityType as string || 'reservation',
      req.params.id
    );
    res.json(history);
  } catch (error) {
    console.error('Error fetching status history:', error);
    res.status(500).json({ error: '获取状态历史失败' });
  }
});

export default router;
