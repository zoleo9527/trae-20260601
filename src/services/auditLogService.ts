import { MockDatabase } from '../mock/database';
import {
  AuditLog,
  AuditAction,
  UserRole,
  Order,
  User,
} from '../types';

export class AuditLogService {
  constructor(private db: MockDatabase) {}

  private createLog(
    orderId: string,
    action: AuditAction,
    operator: User,
    payload: Record<string, unknown>
  ): AuditLog {
    return {
      id: this.db.generateId('AUDIT'),
      orderId,
      action,
      operatorId: operator.id,
      operatorRole: operator.role,
      operatorName: operator.name,
      payload,
      timestamp: new Date().toISOString(),
    };
  }

  appendLog(order: Order, action: AuditAction, operatorId: string, payload: Record<string, unknown>): Order {
    const operator = this.db.getUser(operatorId);
    if (!operator) {
      throw new Error(`Operator ${operatorId} not found`);
    }
    const log = this.createLog(order.id, action, operator, payload);
    order.auditLogs = [...order.auditLogs, log];
    return order;
  }

  getOrderAuditLogs(orderId: string): AuditLog[] {
    const order = this.db.getOrder(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    return [...order.auditLogs].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  getAuditLogsByAction(orderId: string, action: AuditAction): AuditLog[] {
    return this.getOrderAuditLogs(orderId).filter(log => log.action === action);
  }

  getAuditLogsByOperator(operatorId: string): AuditLog[] {
    const logs: AuditLog[] = [];
    for (const order of this.db.getAllOrders()) {
      logs.push(...order.auditLogs.filter(log => log.operatorId === operatorId));
    }
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getAuditLogsByRole(role: UserRole): AuditLog[] {
    const logs: AuditLog[] = [];
    for (const order of this.db.getAllOrders()) {
      logs.push(...order.auditLogs.filter(log => log.operatorRole === role));
    }
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getRecentLogs(hours: number = 24): AuditLog[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const logs: AuditLog[] = [];
    for (const order of this.db.getAllOrders()) {
      logs.push(...order.auditLogs.filter(log => log.timestamp >= cutoff));
    }
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
