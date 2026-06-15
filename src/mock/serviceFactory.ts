import type {
  User,
  UserRole,
  Order,
  OrderStatus,
  TodoItem,
  AuditLog,
  AuditAction,
  ScheduleRecord,
  TimeSlot,
  ReturnReason,
  MeasureRecord,
  PaginationParams,
  PaginationResult,
} from '../types';

import { MockDatabase } from './database';
import { AuditLogService } from '../services/auditLogService';
import { OrderService } from '../services/orderService';
import { ScheduleService } from '../services/scheduleService';
import type { ScheduleQueryParams, AssignScheduleParams, ReassignScheduleParams } from '../services/scheduleService';

export interface ServiceContext {
  operatorId: string;
  operatorRole?: UserRole;
  ip?: string;
}

export class ServiceFactory {
  private static db: MockDatabase;
  private static auditLogService: AuditLogService;
  private static orderService: OrderService;
  private static scheduleService: ScheduleService;

  private static ensureInitialized(): void {
    if (!ServiceFactory.db) {
      ServiceFactory.db = new MockDatabase();
      ServiceFactory.auditLogService = new AuditLogService(ServiceFactory.db);
      ServiceFactory.orderService = new OrderService(ServiceFactory.db, ServiceFactory.auditLogService);
      ServiceFactory.scheduleService = new ScheduleService(ServiceFactory.db, ServiceFactory.auditLogService);
    }
  }

  static getAuditLogService(): AuditLogService {
    ServiceFactory.ensureInitialized();
    return ServiceFactory.auditLogService;
  }

  static getOrderService(): OrderService {
    ServiceFactory.ensureInitialized();
    return ServiceFactory.orderService;
  }

  static getScheduleService(): ScheduleService {
    ServiceFactory.ensureInitialized();
    return ServiceFactory.scheduleService;
  }

  static getDatabase(): MockDatabase {
    ServiceFactory.ensureInitialized();
    return ServiceFactory.db;
  }

  static reset(): void {
    ServiceFactory.db = new MockDatabase();
    ServiceFactory.auditLogService = new AuditLogService(ServiceFactory.db);
    ServiceFactory.orderService = new OrderService(ServiceFactory.db, ServiceFactory.auditLogService);
    ServiceFactory.scheduleService = new ScheduleService(ServiceFactory.db, ServiceFactory.auditLogService);
  }
}

export {
  MockDatabase,
  AuditLogService,
  OrderService,
  ScheduleService,
};

export type {
  ScheduleQueryParams,
  AssignScheduleParams,
  ReassignScheduleParams,
  User,
  UserRole,
  Order,
  OrderStatus,
  TodoItem,
  AuditLog,
  AuditAction,
  ScheduleRecord,
  TimeSlot,
  ReturnReason,
  MeasureRecord,
  PaginationParams,
  PaginationResult,
};
