import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

export const AUDIT_LOG_TOKEN = 'AUDIT_LOG_TOKEN';

export interface AuditLogEntry {
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId: string;
  before: any;
  after: any;
  timestamp: Date;
}

export interface AuditService {
  log(entry: AuditLogEntry): void;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @Inject(AUDIT_LOG_TOKEN) private auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();

    const user = request.user || {};
    const action = handler.name;
    const entity = controller.name.replace('Controller', '');
    const params = request.params || {};
    const entityId = params.id || params.entityId || '';

    return next.handle().pipe(
      tap((response) => {
        this.auditService.log({
          userId: user.sub || user.id || '',
          userName: user.name || user.username || '',
          userRole: user.role || '',
          action,
          entity,
          entityId,
          before: null,
          after: response || null,
          timestamp: new Date(),
        });
      }),
    );
  }
}
