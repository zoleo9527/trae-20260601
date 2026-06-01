import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AuditLogService } from '@/modules/audit/audit-log.service';
import { RequestContext } from '../decorators/request-context.decorator';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const userContext = (request as any).context as RequestContext;

    const method = request.method;
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return next.handle();
    }

    const action = this.extractAction(request);
    const module = this.extractModule(request);
    const entityId = this.extractEntityId(request);
    const requestBody = { ...request.body };
    if (requestBody.password) requestBody.password = '***';

    return next.handle().pipe(
      tap({
        next: (data) => {
          if (AuditLogService.instance) {
            const responseData = data?.data;
            const state = responseData?.currentStatus ?? responseData?.status ?? null;
            AuditLogService.instance.log({
              module,
              action,
              entityId,
              beforeState: null,
              afterState: state,
              remark: `${method} ${request.originalUrl} 成功`,
              operatorId: userContext?.userId,
              operatorName: userContext?.userName,
              operatorRole: userContext?.userRole,
              storeId: userContext?.storeId,
              storeName: userContext?.storeName,
              requestId: userContext?.requestId,
              success: true,
              requestData: requestBody,
              responseData: data,
            });
          }
        },
        error: (error) => {
          if (AuditLogService.instance) {
            AuditLogService.instance.log({
              module,
              action,
              entityId,
              beforeState: null,
              afterState: null,
              remark: `${method} ${request.originalUrl} 失败: ${error.message}`,
              operatorId: userContext?.userId,
              operatorName: userContext?.userName,
              operatorRole: userContext?.userRole,
              storeId: userContext?.storeId,
              storeName: userContext?.storeName,
              requestId: userContext?.requestId,
              success: false,
              requestData: requestBody,
              responseData: { error: error.message },
            });
          }
        },
      }),
    );
  }

  private extractModule(request: Request): string {
    const path = request.originalUrl;
    if (path.includes('/prescriptions')) return 'PRESCRIPTION';
    if (path.includes('/off-shelf')) return 'OFF_SHELF';
    if (path.includes('/transfers')) return 'TRANSFER';
    if (path.includes('/inventory')) return 'INVENTORY';
    if (path.includes('/alerts')) return 'ALERT';
    if (path.includes('/audit')) return 'AUDIT';
    return 'OTHER';
  }

  private extractAction(request: Request): string {
    const path = request.originalUrl;
    const method = request.method;

    if (path.includes('/submit')) return 'SUBMIT';
    if (path.includes('/approve')) return 'APPROVE';
    if (path.includes('/reject')) return 'REJECT';
    if (path.includes('/confirm')) return 'CONFIRM';
    if (path.includes('/supplement')) return 'SUPPLEMENT';
    if (path.includes('/acknowledge')) return 'ACKNOWLEDGE';
    if (path.includes('/resolve')) return 'RESOLVE';
    if (path.includes('/batch')) return 'BATCH_OPERATION';

    if (method === 'POST') return 'CREATE';
    if (method === 'PUT') return 'UPDATE';
    if (method === 'DELETE') return 'DELETE';
    return method;
  }

  private extractEntityId(request: Request): string {
    const match = request.originalUrl.match(/\/([a-f0-9-]{36})/i);
    return match ? match[1] : null;
  }
}
