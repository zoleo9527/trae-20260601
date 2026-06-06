import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { MealSummary, PurchaseOrder } from '../../purchase/interfaces/purchase.interface';
import { SampleRecord } from '../../sample/interfaces/sample.interface';
import { SpecialMealTag, SpecialTagLog } from '../../special-meal/interfaces/special-meal.interface';
import { StudentMealOrder } from '../../student-meal/interfaces/student-meal.interface';
import { NotificationType, TimelineBusinessType, UserRole } from '../enums';
import { ClassInfo, IdempotentRequest, Notification, OperationTimeline, Student, User } from '../interfaces';

@Injectable()
export class InMemoryStore {
  private users: Map<string, User> = new Map();
  private students: Map<string, Student> = new Map();
  private classes: Map<string, ClassInfo> = new Map();
  private mealOrders: Map<string, StudentMealOrder> = new Map();
  private specialTags: Map<string, SpecialMealTag> = new Map();
  private specialTagLogs: Map<string, SpecialTagLog> = new Map();
  private mealSummaries: Map<string, MealSummary> = new Map();
  private purchaseOrders: Map<string, PurchaseOrder> = new Map();
  private sampleRecords: Map<string, SampleRecord> = new Map();
  private timelines: Map<string, OperationTimeline> = new Map();
  private idempotentRequests: Map<string, IdempotentRequest> = new Map();
  private notifications: Map<string, Notification> = new Map();

  generateId(): string {
    return uuidv4();
  }

  createTimeline(
    businessType: TimelineBusinessType,
    businessId: string,
    action: string,
    operator: User,
    detail?: Record<string, any>
  ): OperationTimeline {
    const timeline: OperationTimeline = {
      id: this.generateId(),
      businessType,
      businessId,
      action,
      operatorId: operator.id,
      operatorName: operator.name,
      operatorRole: operator.role as UserRole,
      operateTime: new Date(),
      detail,
    };
    this.timelines.set(timeline.id, timeline);
    return timeline;
  }

  getUsers(): User[] {
    return Array.from(this.users.values());
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  saveUser(user: User): void {
    this.users.set(user.id, user);
  }

  getStudents(): Student[] {
    return Array.from(this.students.values());
  }

  getStudent(id: string): Student | undefined {
    return this.students.get(id);
  }

  saveStudent(student: Student): void {
    this.students.set(student.id, student);
  }

  getClasses(): ClassInfo[] {
    return Array.from(this.classes.values());
  }

  getClass(id: string): ClassInfo | undefined {
    return this.classes.get(id);
  }

  saveClass(cls: ClassInfo): void {
    this.classes.set(cls.id, cls);
  }

  getMealOrders(): StudentMealOrder[] {
    return Array.from(this.mealOrders.values());
  }

  getMealOrder(id: string): StudentMealOrder | undefined {
    return this.mealOrders.get(id);
  }

  saveMealOrder(order: StudentMealOrder): void {
    this.mealOrders.set(order.id, order);
  }

  getSpecialTags(): SpecialMealTag[] {
    return Array.from(this.specialTags.values());
  }

  getSpecialTag(id: string): SpecialMealTag | undefined {
    return this.specialTags.get(id);
  }

  saveSpecialTag(tag: SpecialMealTag): void {
    this.specialTags.set(tag.id, tag);
  }

  getSpecialTagLogs(): SpecialTagLog[] {
    return Array.from(this.specialTagLogs.values());
  }

  saveSpecialTagLog(log: SpecialTagLog): void {
    this.specialTagLogs.set(log.id, log);
  }

  getMealSummaries(): MealSummary[] {
    return Array.from(this.mealSummaries.values());
  }

  getMealSummary(date: string): MealSummary | undefined {
    return Array.from(this.mealSummaries.values()).find(s => s.date === date);
  }

  saveMealSummary(summary: MealSummary): void {
    this.mealSummaries.set(summary.id, summary);
  }

  getPurchaseOrders(): PurchaseOrder[] {
    return Array.from(this.purchaseOrders.values());
  }

  getPurchaseOrder(id: string): PurchaseOrder | undefined {
    return this.purchaseOrders.get(id);
  }

  savePurchaseOrder(order: PurchaseOrder): void {
    this.purchaseOrders.set(order.id, order);
  }

  getSampleRecords(): SampleRecord[] {
    return Array.from(this.sampleRecords.values());
  }

  getSampleRecord(id: string): SampleRecord | undefined {
    return this.sampleRecords.get(id);
  }

  saveSampleRecord(record: SampleRecord): void {
    this.sampleRecords.set(record.id, record);
  }

  getTimelines(): OperationTimeline[] {
    return Array.from(this.timelines.values());
  }

  getIdempotentRequest(requestId: string): IdempotentRequest | undefined {
    return this.idempotentRequests.get(requestId);
  }

  saveIdempotentRequest(request: IdempotentRequest): void {
    this.idempotentRequests.set(request.requestId, request);
  }

  createNotification(
    type: NotificationType,
    title: string,
    content: string,
    recipientRole: string,
    relatedId?: string,
    relatedType?: string
  ): Notification {
    const notification: Notification = {
      id: this.generateId(),
      type,
      title,
      content,
      recipientRole,
      relatedId,
      relatedType,
      read: false,
      createdAt: new Date(),
    };
    this.notifications.set(notification.id, notification);
    return notification;
  }

  getNotificationsByRole(role: string): Notification[] {
    return Array.from(this.notifications.values())
      .filter(n => n.recipientRole === role)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  markNotificationRead(id: string): boolean {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  clearAll(): void {
    this.users.clear();
    this.students.clear();
    this.classes.clear();
    this.mealOrders.clear();
    this.specialTags.clear();
    this.specialTagLogs.clear();
    this.mealSummaries.clear();
    this.purchaseOrders.clear();
    this.sampleRecords.clear();
    this.timelines.clear();
    this.idempotentRequests.clear();
    this.notifications.clear();
  }
}
