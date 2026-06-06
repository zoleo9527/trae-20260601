import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from './store';
import { 
  CreateLockOrderRequest, 
  ReviewRequest, 
  GiftConfigRequest, 
  ReturnRequest,
  OperationLog,
  InventoryStatus
} from './types';

const router = Router();

const addOperationLog = (
  orderId: string, 
  operator: string, 
  role: string, 
  action: string, 
  remark: string,
  fromStatus?: InventoryStatus,
  toStatus?: InventoryStatus
): OperationLog => {
  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    operator,
    role: role as any,
    action,
    remark,
    fromStatus,
    toStatus
  };
};

router.get('/orders', (req: Request, res: Response) => {
  const { role } = req.query;
  if (role) {
    res.json(store.getOrdersByRole(role as any));
  } else {
    res.json(store.getAllOrders());
  }
});

router.get('/orders/:id', (req: Request, res: Response) => {
  const order = store.getOrderById(req.params.id);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

router.post('/orders', (req: Request, res: Response) => {
  const body: CreateLockOrderRequest = req.body;
  const now = new Date().toISOString();
  const orderNo = `INV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  
  const skuListWithLocked = body.skuList.map(sku => ({
    ...sku,
    stockLocked: 0
  }));
  
  const totalLockedAmount = skuListWithLocked.reduce(
    (sum, sku) => sum + sku.stockAvailable * sku.livePrice, 0
  );

  const newOrder = {
    id: uuidv4(),
    orderNo,
    liveSessionId: body.liveSessionId,
    liveSessionName: body.liveSessionName,
    skuList: skuListWithLocked,
    totalLockedAmount,
    priority: body.priority,
    status: 'PENDING_LOCK' as InventoryStatus,
    createdBy: body.createdBy,
    createdByRole: 'ASSISTANT' as const,
    createdAt: now,
    updatedAt: now,
    currentHandler: body.createdBy,
    currentHandlerRole: 'ASSISTANT' as const,
    giftList: [],
    priceRemark: body.priceRemark,
    operationLogs: [
      addOperationLog('', body.createdBy, 'ASSISTANT', '创建库存锁定单', '', undefined, 'PENDING_LOCK')
    ],
    expectedLiveTime: body.expectedLiveTime
  };

  newOrder.operationLogs[0].id = uuidv4();
  store.addOrder(newOrder);
  res.status(201).json(newOrder);
});

router.post('/orders/:id/submit-lock', (req: Request, res: Response) => {
  const { id } = req.params;
  const { operator, skuList } = req.body;
  const order = store.getOrderById(id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const updatedSkus = order.skuList.map(sku => {
    const updated = skuList.find((s: any) => s.skuId === sku.skuId);
    return updated ? { ...sku, stockLocked: updated.stockLocked } : sku;
  });

  const totalLockedAmount = updatedSkus.reduce(
    (sum, sku) => sum + sku.stockLocked * sku.livePrice, 0
  );

  const log = addOperationLog(
    id, operator, 'ASSISTANT', '提交锁定', 
    '已确认SKU数量和价格，提交场控审核',
    order.status, 'PENDING_REVIEW'
  );

  const updated = store.updateOrder(id, {
    skuList: updatedSkus,
    totalLockedAmount,
    status: 'PENDING_REVIEW',
    currentHandler: '王芳',
    currentHandlerRole: 'STAGE_CONTROL',
    operationLogs: [...order.operationLogs, log]
  });

  res.json(updated);
});

router.post('/orders/:id/review', (req: Request, res: Response) => {
  const { id } = req.params;
  const body: ReviewRequest = req.body;
  const order = store.getOrderById(id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const newStatus: InventoryStatus = body.approved ? 'GIFT_CONFIGURING' : 'REVIEW_REJECTED';
  const action = body.approved ? '审核通过' : '审核驳回';
  const nextHandler = body.approved ? '赵敏' : order.createdBy;
  const nextRole = body.approved ? 'AFTER_SALES_LEAD' : 'ASSISTANT';

  const log = addOperationLog(
    id, body.reviewer, 'STAGE_CONTROL', action,
    body.remark + (body.rejectReason ? ` 驳回原因: ${body.rejectReason}` : ''),
    order.status, newStatus
  );

  const updated = store.updateOrder(id, {
    status: newStatus,
    currentHandler: nextHandler,
    currentHandlerRole: nextRole as any,
    operationLogs: [...order.operationLogs, log],
    rejectReason: body.rejectReason
  });

  res.json(updated);
});

router.post('/orders/:id/gift-config', (req: Request, res: Response) => {
  const { id } = req.params;
  const body: GiftConfigRequest = req.body;
  const order = store.getOrderById(id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const log = addOperationLog(
    id, body.operator, 'AFTER_SALES_LEAD', '配置赠品',
    body.remark,
    order.status, 'GIFT_CONFIGURED'
  );

  const updated = store.updateOrder(id, {
    giftList: body.giftList,
    status: 'GIFT_CONFIGURED',
    currentHandler: body.operator,
    currentHandlerRole: 'AFTER_SALES_LEAD',
    operationLogs: [...order.operationLogs, log]
  });

  res.json(updated);
});

router.post('/orders/:id/complete', (req: Request, res: Response) => {
  const { id } = req.params;
  const { operator } = req.body;
  const order = store.getOrderById(id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const log = addOperationLog(
    id, operator, 'AFTER_SALES_LEAD', '完成配置',
    '所有配置已确认，等待直播执行',
    order.status, 'COMPLETED'
  );

  const updated = store.updateOrder(id, {
    status: 'COMPLETED',
    operationLogs: [...order.operationLogs, log]
  });

  res.json(updated);
});

router.post('/orders/:id/return', (req: Request, res: Response) => {
  const { id } = req.params;
  const body: ReturnRequest = req.body;
  const order = store.getOrderById(id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const log = addOperationLog(
    id, body.operator, 'STAGE_CONTROL', '退回订单',
    body.reason,
    order.status, 'RETURNED'
  );

  const updated = store.updateOrder(id, {
    status: 'RETURNED',
    currentHandler: order.createdBy,
    currentHandlerRole: 'ASSISTANT',
    returnReason: body.reason,
    operationLogs: [...order.operationLogs, log]
  });

  res.json(updated);
});

router.post('/orders/:id/re-edit', (req: Request, res: Response) => {
  const { id } = req.params;
  const { operator } = req.body;
  const order = store.getOrderById(id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const log = addOperationLog(
    id, operator, 'ASSISTANT', '重新编辑',
    '根据审核意见修改后重新提交',
    order.status, 'PENDING_LOCK'
  );

  const updated = store.updateOrder(id, {
    status: 'PENDING_LOCK',
    currentHandler: operator,
    currentHandlerRole: 'ASSISTANT',
    operationLogs: [...order.operationLogs, log],
    rejectReason: undefined
  });

  res.json(updated);
});

router.get('/stats/summary', (req: Request, res: Response) => {
  const orders = store.getAllOrders();
  const summary = {
    total: orders.length,
    pendingReview: orders.filter(o => o.status === 'PENDING_REVIEW').length,
    giftConfiguring: orders.filter(o => o.status === 'GIFT_CONFIGURING').length,
    rejected: orders.filter(o => o.status === 'REVIEW_REJECTED').length,
    completed: orders.filter(o => o.status === 'COMPLETED').length,
    urgent: orders.filter(o => o.priority === 'URGENT' || o.priority === 'EXTREME').length
  };
  res.json(summary);
});

export default router;
