import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from './store';
import {
  CreateOrderRequest,
  ConfirmOrderRequest,
  CreateLoadingRequest,
  UpdateLoadingRequest,
  CreateExceptionRequest,
  HandleExceptionRequest,
  OrderStatus,
  OperationLog
} from './types';

const router = Router();

const addLog = (
  operator: string,
  role: string,
  action: string,
  targetType: string,
  targetId: string,
  remark: string
) => {
  const log: OperationLog = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    operator,
    role: role as any,
    action,
    targetType,
    targetId,
    remark
  };
  store.addOperationLog(log);
};

router.get('/customers', (_req: Request, res: Response) => {
  res.json(store.getAllCustomers());
});

router.get('/customers/:id', (req: Request, res: Response) => {
  const customer = store.getCustomerById(req.params.id);
  if (customer) {
    res.json(customer);
  } else {
    res.status(404).json({ error: 'Customer not found' });
  }
});

router.get('/formulas', (_req: Request, res: Response) => {
  res.json(store.getAllFormulas());
});

router.get('/formulas/:id', (req: Request, res: Response) => {
  const formula = store.getFormulaById(req.params.id);
  if (formula) {
    res.json(formula);
  } else {
    res.status(404).json({ error: 'Formula not found' });
  }
});

router.get('/orders', (req: Request, res: Response) => {
  const { status } = req.query;
  if (status) {
    res.json(store.getOrdersByStatus(status as string));
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
  const body: CreateOrderRequest = req.body;
  const now = new Date().toISOString();
  const orderNo = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

  const customer = store.getCustomerById(body.customerId);
  if (!customer) {
    return res.status(400).json({ error: 'Customer not found' });
  }

  const items = body.items.map(item => {
    const formula = store.getFormulaById(item.formulaId);
    const batches = store.getBatchesByFormula(item.formulaId);
    return {
      itemId: uuidv4(),
      formulaId: item.formulaId,
      formulaName: formula?.formulaName || '',
      quantity: item.quantity,
      unit: item.unit,
      price: 3.0,
      totalAmount: item.quantity * 3.0,
      batches: batches.slice(0, 2)
    };
  });

  const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);

  const newOrder = {
    id: uuidv4(),
    orderId: uuidv4(),
    orderNo,
    customerId: body.customerId,
    customerName: customer.customerName,
    items,
    totalAmount,
    status: 'PENDING' as OrderStatus,
    createdAt: now,
    createdBy: body.createdBy,
    deliveryAddress: body.deliveryAddress,
    remarks: body.remarks || ''
  };

  store.addOrder(newOrder);
  addLog(body.createdBy, 'WAREHOUSE', '创建订单', 'Order', newOrder.orderId, body.remarks || '');
  res.status(201).json(newOrder);
});

router.post('/orders/:id/confirm', (req: Request, res: Response) => {
  const { id } = req.params;
  const body: ConfirmOrderRequest = req.body;
  const order = store.getOrderById(id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const updated = store.updateOrder(id, {
    status: 'CONFIRMED',
    confirmedAt: new Date().toISOString(),
    confirmedBy: body.confirmedBy
  });

  addLog(body.confirmedBy, 'MANAGER', '确认订单', 'Order', id, '订单已确认');
  res.json(updated);
});

router.post('/orders/:id/ready', (req: Request, res: Response) => {
  const { id } = req.params;
  const { operator } = req.body;
  const order = store.getOrderById(id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const updated = store.updateOrder(id, {
    status: 'READY',
    currentHandler: operator,
    currentHandlerRole: 'WAREHOUSE'
  });

  addLog(operator, 'WAREHOUSE', '订单准备就绪', 'Order', id, '订单已准备好装车');
  res.json(updated);
});

router.get('/batches', (req: Request, res: Response) => {
  const { formulaId } = req.query;
  if (formulaId) {
    res.json(store.getBatchesByFormula(formulaId as string));
  } else {
    res.json(store.getAllBatches());
  }
});

router.get('/batches/:id', (req: Request, res: Response) => {
  const batch = store.getBatchById(req.params.id);
  if (batch) {
    res.json(batch);
  } else {
    res.status(404).json({ error: 'Batch not found' });
  }
});

router.get('/feeding-records', (req: Request, res: Response) => {
  const { batchId } = req.query;
  if (batchId) {
    res.json(store.getFeedingRecordsByBatch(batchId as string));
  } else {
    res.json(store.getAllFeedingRecords());
  }
});

router.get('/loading-records', (req: Request, res: Response) => {
  const { orderId } = req.query;
  if (orderId) {
    res.json(store.getLoadingRecordsByOrder(orderId as string));
  } else {
    res.json(store.getAllLoadingRecords());
  }
});

router.get('/loading-records/:id', (req: Request, res: Response) => {
  const record = store.getLoadingRecordById(req.params.id);
  if (record) {
    res.json(record);
  } else {
    res.status(404).json({ error: 'Loading record not found' });
  }
});

router.post('/loading-records', (req: Request, res: Response) => {
  const body: CreateLoadingRequest = req.body;
  const order = store.getOrderById(body.orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const items = order.items.map(item => ({
    itemId: item.itemId,
    formulaName: item.formulaName,
    batchId: item.batches[0]?.batchId || '',
    batchNo: item.batches[0]?.batchId ? `${item.batches[0].batchId}-${item.batches[0].productionDate}` : '',
    quantity: item.quantity,
    unit: item.unit,
    checked: false
  }));

  const newRecord = {
    loadingId: uuidv4(),
    orderId: body.orderId,
    orderNo: order.orderNo,
    customerId: order.customerId,
    customerName: order.customerName,
    items,
    vehicleNo: body.vehicleNo,
    driverName: body.driverName,
    driverPhone: body.driverPhone,
    loadingTime: new Date().toISOString(),
    checker: body.checker,
    status: 'CHECKING' as const,
    remarks: '',
    discrepancies: []
  };

  store.addLoadingRecord(newRecord);
  addLog(body.checker, 'QUALITY', '开始装车复核', 'LoadingRecord', newRecord.loadingId, `订单: ${order.orderNo}`);
  res.status(201).json(newRecord);
});

router.put('/loading-records/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const body: UpdateLoadingRequest = req.body;

  const record = store.getLoadingRecordById(id);
  if (!record) {
    return res.status(404).json({ error: 'Loading record not found' });
  }

  const updatedItems = record.items.map(item => {
    const update = body.items.find(i => i.itemId === item.itemId);
    return update ? { ...item, ...update } : item;
  });

  const discrepancies = updatedItems
    .filter(item => item.discrepancy)
    .map(item => `${item.formulaName}: ${item.discrepancy}`);

  const updated = store.updateLoadingRecord(id, {
    items: updatedItems,
    status: body.status,
    remarks: body.remarks,
    discrepancies
  });

  const order = store.getOrderById(record.orderId);
  if (order && body.status === 'PASSED') {
    store.updateOrder(record.orderId, {
      status: 'LOADED',
      loadingAt: new Date().toISOString(),
      loadedBy: record.checker,
      vehicleNo: record.vehicleNo,
      driverName: record.driverName,
      driverPhone: record.driverPhone
    });
  }

  const action = body.status === 'PASSED' ? '复核通过' : '复核驳回';
  addLog(record.checker, 'QUALITY', action, 'LoadingRecord', id, body.remarks);
  res.json(updated);
});

router.get('/exceptions', (_req: Request, res: Response) => {
  res.json(store.getAllExceptions());
});

router.get('/exceptions/:id', (req: Request, res: Response) => {
  const exception = store.getExceptionById(req.params.id);
  if (exception) {
    res.json(exception);
  } else {
    res.status(404).json({ error: 'Exception not found' });
  }
});

router.post('/exceptions', (req: Request, res: Response) => {
  const body: CreateExceptionRequest = req.body;

  const newException = {
    exceptionId: uuidv4(),
    orderId: body.orderId,
    batchId: body.batchId,
    customerId: body.customerId,
    type: body.type,
    title: body.title,
    description: body.description,
    severity: body.severity,
    status: 'REPORTED',
    reportedBy: body.reportedBy,
    reportedAt: new Date().toISOString(),
    relatedOrders: body.orderId ? [body.orderId] : [],
    relatedBatches: body.batchId ? [body.batchId] : []
  };

  store.addException(newException);
  addLog(body.reportedBy, 'MANAGER', '上报异常', 'Exception', newException.exceptionId, body.title);
  res.status(201).json(newException);
});

router.put('/exceptions/:id/handle', (req: Request, res: Response) => {
  const { id } = req.params;
  const body: HandleExceptionRequest = req.body;

  const exception = store.getExceptionById(id);
  if (!exception) {
    return res.status(404).json({ error: 'Exception not found' });
  }

  const updated = store.updateException(id, {
    status: 'RESOLVED',
    handledBy: body.handledBy,
    handledAt: new Date().toISOString(),
    resolution: body.resolution
  });

  addLog(body.handledBy, 'MANAGER', '处理异常', 'Exception', id, body.resolution);
  res.json(updated);
});

router.get('/operation-logs', (req: Request, res: Response) => {
  const { targetId } = req.query;
  res.json(store.getOperationLogs(targetId as string));
});

router.get('/stats/summary', (_req: Request, res: Response) => {
  const orders = store.getAllOrders();
  const exceptions = store.getAllExceptions();

  res.json({
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'PENDING').length,
    readyOrders: orders.filter(o => o.status === 'READY').length,
    loadedOrders: orders.filter(o => o.status === 'LOADED').length,
    deliveredOrders: orders.filter(o => o.status === 'DELIVERED').length,
    totalExceptions: exceptions.length,
    pendingExceptions: exceptions.filter(e => e.status === 'REPORTED' || e.status === 'PROCESSING').length,
    resolvedExceptions: exceptions.filter(e => e.status === 'RESOLVED' || e.status === 'CLOSED').length
  });
});

export default router;