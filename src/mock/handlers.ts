import { ServiceFactory } from './serviceFactory';
import type {
  TimeSlot,
  OrderStatus,
  ReturnReason,
  MeasureRecord,
} from '../types';

export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT';
  path: string;
  query?: Record<string, string>;
  body?: Record<string, unknown>;
}

export interface ApiResponse {
  status: number;
  data?: unknown;
  message?: string;
}

type RouteHandler = (params: Record<string, string>, query: Record<string, string>, body: Record<string, unknown>) => unknown;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}


export class ApiRouter {
  private routes: Route[] = [];

  private addRoute(method: string, pathPattern: string, handler: RouteHandler): void {
    const paramNames: string[] = [];
    const regexStr = pathPattern.replace(/:([^\/]+)/g, (_match, paramName) => {
      paramNames.push(paramName);
      return '([^\/]+)';
    });
    const pattern = new RegExp(`^${regexStr}$`);
    this.routes.push({ method, pattern, paramNames, handler });
  }


  get(pathPattern: string, handler: RouteHandler): void {
    this.addRoute('GET', pathPattern, handler);
  }

  post(pathPattern: string, handler: RouteHandler): void {
    this.addRoute('POST', pathPattern, handler);
  }

  put(pathPattern: string, handler: RouteHandler): void {
    this.addRoute('PUT', pathPattern, handler);
  }

  invoke(req: ApiRequest): ApiResponse {
    for (const route of this.routes) {
      if (route.method !== req.method) continue;
      const match = req.path.match(route.pattern);
      if (!match) continue;
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });
      try {
        const result = route.handler(params, req.query || {}, req.body || {});
        return { status: 200, data: result };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { status: 400, message };
      }
    }
    return { status: 404, message: `Route not found: ${req.method} ${req.path}` };
  }
}

export function createApiRouter(): ApiRouter {
  const router = new ApiRouter();
  const orderService = ServiceFactory.getOrderService();
  const scheduleService = ServiceFactory.getScheduleService();
  const auditLogService = ServiceFactory.getAuditLogService();

  router.get('/api/orders/:id', (params) => {
    return orderService.getOrderDetail(params.id);
  });

  router.get('/api/orders', (_params, query) => {
    const page = parseInt(query.page || '1', 10);
    const pageSize = parseInt(query.pageSize || '10', 10);
    if (query.status) {
      return orderService.listOrdersByStatus(query.status as OrderStatus, { page, pageSize });
    }
    return orderService.listOrders({ page, pageSize });
  });

  router.get('/api/users/:id/todos', (params) => {
    return orderService.getTodosForUser(params.id);
  });

  router.post('/api/orders/:id/measure', (params, _query, body) => {
    orderService.submitMeasureRecord(params.id, {
      measurerId: body.measurerId as string,
      windows: body.windows as MeasureRecord['windows'],
      notes: body.notes as string | undefined,
    });
    return orderService.getOrderDetail(params.id);
  });

  router.post('/api/orders/:id/appointment', (params, _query, body) => {
    orderService.createAppointment(params.id, {
      preferredDate: body.preferredDate as string,
      preferredTimeSlot: body.preferredTimeSlot as TimeSlot,
      createdBy: body.createdBy as string,
      notes: body.notes as string | undefined,
    });
    return orderService.getOrderDetail(params.id);
  });

  router.put('/api/orders/:id/appointment', (params, _query, body) => {
    orderService.updateAppointment(params.id, {
      preferredDate: body.preferredDate as string | undefined,
      preferredTimeSlot: body.preferredTimeSlot as TimeSlot | undefined,
      updatedBy: body.updatedBy as string,
      notes: body.notes as string | undefined,
    });
    return orderService.getOrderDetail(params.id);
  });

  router.post('/api/orders/:id/schedule', (params, _query, body) => {
    scheduleService.assignSchedule({
      orderId: params.id,
      installerId: body.installerId as string,
      scheduledDate: body.scheduledDate as string,
      timeSlot: body.timeSlot as TimeSlot,
      assignedBy: body.assignedBy as string,
      estimatedDurationHours: body.estimatedDurationHours as number,
    });
    return orderService.getOrderDetail(params.id);
  });

  router.put('/api/orders/:id/schedule/reassign', (params, _query, body) => {
    scheduleService.reassignSchedule({
      orderId: params.id,
      newInstallerId: body.newInstallerId as string,
      reassignedBy: body.reassignedBy as string,
      reason: body.reason as string,
      scheduledDate: body.scheduledDate as string | undefined,
      timeSlot: body.timeSlot as TimeSlot | undefined,
      estimatedDurationHours: body.estimatedDurationHours as number | undefined,
    });
    return orderService.getOrderDetail(params.id);
  });


  router.get('/api/schedules/installer/:id', (params, query) => {
    if (query.startDate && query.endDate) {
      return scheduleService.getInstallerScheduleRange(params.id, query.startDate, query.endDate);
    }
    if (query.date) {
      return scheduleService.getInstallerSchedule(params.id, query.date);
    }
    return scheduleService.getSchedulesByQuery({ installerId: params.id });
  });

  router.get('/api/schedules/available', (_params, query) => {
    return scheduleService.getAvailableInstallers(query.date, query.timeSlot as TimeSlot);
  });

  router.get('/api/schedules/daily', (_params, query) => {
    return scheduleService.getDailyScheduleOverview(query.date);
  });

  router.get('/api/orders/:id/schedule-history', (params) => {
    return scheduleService.getScheduleHistory(params.id);
  });

  router.post('/api/orders/:id/start-installation', (params, _query, body) => {
    orderService.startInstallation(params.id, body.installerId as string);
    return orderService.getOrderDetail(params.id);
  });

  router.post('/api/orders/:id/return', (params, _query, body) => {
    orderService.returnInstallation(params.id, {
      returnedBy: body.returnedBy as string,
      reason: body.reason as ReturnReason,
      detailedReason: body.detailedReason as string,
      images: body.images as string[] | undefined,
    });
    return orderService.getOrderDetail(params.id);
  });

  router.post('/api/orders/:id/handle-return', (params, _query, body) => {
    orderService.handleReturn(params.id, {
      handledBy: body.handledBy as string,
      handlingNotes: body.handlingNotes as string,
    });
    return orderService.getOrderDetail(params.id);
  });

  router.post('/api/orders/:id/supplement', (params, _query, body) => {
    orderService.requestSupplement(params.id, {
      requestedBy: body.requestedBy as string,
      items: body.items as any[],
      urgency: body.urgency as any,
      notes: body.notes as string | undefined,
    });
    return orderService.getOrderDetail(params.id);
  });

  router.post('/api/orders/:id/supplement/:supplementId/fulfill', (params, _query, body) => {
    orderService.fulfillSupplement(params.id, params.supplementId, {
      fulfilledBy: body.fulfilledBy as string,
    });
    return orderService.getOrderDetail(params.id);
  });

  router.post('/api/orders/:id/supplement/:supplementId/receive', (params, _query, body) => {
    orderService.receiveSupplement(params.id, params.supplementId, {
      receivedBy: body.receivedBy as string,
    });
    return orderService.getOrderDetail(params.id);
  });

  router.post('/api/orders/:id/complete', (params, _query, body) => {
    orderService.completeInstallation(params.id, body.installerId as string);
    return orderService.getOrderDetail(params.id);
  });

  router.post('/api/orders/:id/archive', (params, _query, body) => {
    orderService.archiveOrder(params.id, body.operatorId as string);
    return orderService.getOrderDetail(params.id);
  });

  router.post('/api/orders/:id/remind', (params, _query, body) => {
    orderService.remindOrder(params.id, body.operatorId as string, body.reason as string);
    return orderService.getOrderDetail(params.id);
  });

  router.post('/api/orders/:id/remark', (params, _query, body) => {
    orderService.addRemark(params.id, {
      createdBy: body.createdBy as string,
      content: body.content as string,
      attachments: body.attachments as string[] | undefined,
    });
    return orderService.getOrderDetail(params.id);
  });

  router.get('/api/orders/:id/audit-logs', (params, query) => {
    const logs = auditLogService.getOrderAuditLogs(params.id);
    if (query.action) {
      return logs.filter(l => l.action === query.action);
    }
    return logs;
  });

  router.get('/api/audit-logs/recent', (_params, query) => {
    return auditLogService.getRecentLogs(parseInt(query.hours || '24', 10));
  });

  router.get('/api/audit-logs/operator/:id', (params) => {
    return auditLogService.getAuditLogsByOperator(params.id);
  });

  return router;
}
