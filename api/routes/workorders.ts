
import { Router, type Request, type Response } from 'express';
import { workOrders } from '../data/store.js';
import type { WorkOrder, WorkOrderStatus } from '../../shared/types.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { status, maintenanceId } = req.query;

  let filteredWorkOrders = [...workOrders] as WorkOrder[];

  if (status) {
    filteredWorkOrders = filteredWorkOrders.filter((w) => w.status === status);
  }
  if (maintenanceId) {
    filteredWorkOrders = filteredWorkOrders.filter((w) => w.maintenanceId === maintenanceId);
  }

  res.json({
    success: true,
    data: filteredWorkOrders,
  });
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const workOrder = workOrders.find((w) => w.id === id);

  if (!workOrder) {
    res.status(404).json({
      success: false,
      message: '工单不存在',
    });
    return;
  }

  res.json({
    success: true,
    data: workOrder as WorkOrder,
  });
});

router.put('/:id/status', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body as { status: WorkOrderStatus };

  const workOrder = workOrders.find((w) => w.id === id);

  if (!workOrder) {
    res.status(404).json({
      success: false,
      message: '工单不存在',
    });
    return;
  }

  workOrder.status = status;

  if (status === 'arrived') {
    workOrder.arrivedAt = new Date().toISOString();
  } else if (status === 'completed') {
    workOrder.completedAt = new Date().toISOString();
  }

  res.json({
    success: true,
    data: workOrder as WorkOrder,
    message: '状态更新成功',
  });
});

export default router;
