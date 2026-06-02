
import { Router, type Request, type Response } from 'express';
import { workOrders, faults, faultTimelines } from '../data/store.js';
import type { WorkOrder, WorkOrderStatus, Fault, FaultTimeline } from '../../shared/types.js';

const router = Router();

const timelineTypeMap: Record<WorkOrderStatus, { type: string; title: string }> = {
  pending: { type: 'assigned', title: '工单派发' },
  accepted: { type: 'assigned', title: '维修商接单' },
  arrived: { type: 'arrived', title: '到达现场' },
  processing: { type: 'repaired', title: '开始维修' },
  completed: { type: 'repaired', title: '维修完成' },
  timeout: { type: 'assigned', title: '工单超时' },
};

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

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const {
    faultId,
    maintenanceId,
    maintenanceName,
    priority,
    expectedDuration,
    operator,
  } = req.body as {
    faultId: string;
    maintenanceId: string;
    maintenanceName: string;
    priority: 'normal' | 'urgent';
    expectedDuration: number;
    operator?: string;
  };

  const fault = faults.find((f) => f.id === faultId);

  if (!fault) {
    res.status(404).json({
      success: false,
      message: '故障不存在',
    });
    return;
  }

  if (fault.status === 'resolved' || fault.status === 'closed') {
    res.status(400).json({
      success: false,
      message: '故障已解决，无需派单',
    });
    return;
  }

  if (fault.workOrderId) {
    res.status(400).json({
      success: false,
      message: '该故障已有派单工单',
    });
    return;
  }

  const existingWorkOrder = workOrders.find((w) => w.faultId === faultId);
  if (existingWorkOrder) {
    fault.workOrderId = existingWorkOrder.id;
    res.status(400).json({
      success: false,
      message: '该故障已有派单工单',
    });
    return;
  }

  const newWorkOrderId = `wo${workOrders.length + 1}`;
  const now = new Date().toISOString();

  const newWorkOrder: WorkOrder = {
    id: newWorkOrderId,
    faultId: fault.id,
    stationId: fault.stationId,
    stationName: fault.stationName,
    deviceName: fault.deviceName,
    maintenanceId,
    maintenanceName,
    status: 'pending',
    priority,
    assignedAt: now,
    expectedDuration,
  };

  workOrders.push(newWorkOrder);

  fault.workOrderId = newWorkOrderId;
  fault.status = 'processing';

  const newTimeline: FaultTimeline = {
    id: `ft${faultTimelines.length + 1}`,
    faultId: fault.id,
    type: 'assigned',
    title: '工单派发',
    description: `已派单给维修商${maintenanceName}，预计${expectedDuration}分钟内完成`,
    createdAt: now,
    operator: operator || '系统',
  };

  faultTimelines.push(newTimeline);

  res.json({
    success: true,
    data: newWorkOrder,
    message: '工单派发成功',
  });
});

router.put('/:id/status', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, operator } = req.body as { status: WorkOrderStatus; operator?: string };

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
    if (workOrder.arrivedAt) {
      const arrived = new Date(workOrder.arrivedAt).getTime();
      const completed = new Date(workOrder.completedAt).getTime();
      workOrder.actualDuration = Math.round((completed - arrived) / 60000);
    }
  }

  const fault = faults.find((f) => f.id === workOrder.faultId);
  if (fault) {
    const timelineConfig = timelineTypeMap[status];
    if (timelineConfig) {
      const statusDescriptions: Record<WorkOrderStatus, string> = {
        pending: `工单已派发，等待${workOrder.maintenanceName}接单`,
        accepted: `${workOrder.maintenanceName}已接单，正在赶往现场`,
        arrived: `${workOrder.maintenanceName}已到达现场开始排查`,
        processing: `${workOrder.maintenanceName}正在进行维修作业`,
        completed: `${workOrder.maintenanceName}已完成维修，设备恢复正常`,
        timeout: `工单已超时，${workOrder.maintenanceName}未在承诺时间内完成`,
      };

      const newTimeline: FaultTimeline = {
        id: `ft${faultTimelines.length + 1}`,
        faultId: fault.id,
        type: timelineConfig.type as FaultTimeline['type'],
        title: timelineConfig.title,
        description: statusDescriptions[status],
        createdAt: new Date().toISOString(),
        operator: operator || workOrder.maintenanceName,
      };

      faultTimelines.push(newTimeline);

      if (status === 'completed') {
        fault.status = 'resolved';
        fault.resolvedAt = new Date().toISOString();
      }
    }
  }

  res.json({
    success: true,
    data: workOrder as WorkOrder,
    message: '状态更新成功',
  });
});

export default router;
