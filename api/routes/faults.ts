
import { Router, type Request, type Response } from 'express';
import { faults, faultTimelines, orders, workOrders } from '../data/store.js';
import type { Fault, FaultTimeline, Order, WorkOrder } from '../../shared/types.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { status, severity, type } = req.query;

  let filteredFaults = [...faults] as Fault[];

  if (status) {
    filteredFaults = filteredFaults.filter((f) => f.status === status);
  }
  if (severity) {
    filteredFaults = filteredFaults.filter((f) => f.severity === severity);
  }
  if (type) {
    filteredFaults = filteredFaults.filter((f) => f.type === type);
  }

  res.json({
    success: true,
    data: filteredFaults,
  });
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const fault = faults.find((f) => f.id === id);

  if (!fault) {
    res.status(404).json({
      success: false,
      message: '故障不存在',
    });
    return;
  }

  res.json({
    success: true,
    data: fault as Fault,
  });
});

router.get('/:id/timeline', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const timeline = faultTimelines.filter((t) => t.faultId === id);

  res.json({
    success: true,
    data: timeline as FaultTimeline[],
  });
});

router.get('/:id/orders', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const affectedOrders = orders.filter((o) => o.faultId === id);

  res.json({
    success: true,
    data: affectedOrders as Order[],
  });
});

router.get('/:id/workorder', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const fault = faults.find((f) => f.id === id);

  if (!fault) {
    res.status(404).json({
      success: false,
      message: '故障不存在',
    });
    return;
  }

  let workOrder: WorkOrder | undefined;

  if (fault.workOrderId) {
    workOrder = workOrders.find((w) => w.id === fault.workOrderId);
  }

  if (!workOrder) {
    workOrder = workOrders.find((w) => w.faultId === id);
  }

  if (!workOrder) {
    res.status(404).json({
      success: false,
      message: '工单不存在',
    });
    return;
  }

  if (!fault.workOrderId) {
    fault.workOrderId = workOrder.id;
  }

  res.json({
    success: true,
    data: workOrder as WorkOrder,
  });
});

export default router;
