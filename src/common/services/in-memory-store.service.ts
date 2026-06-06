import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { TalentArchive } from '../../archive/interfaces/archive.interface';
import { Contract } from '../../contract/interfaces/contract.interface';
import { Talent } from '../../talent/interfaces/talent.interface';
import { NotificationType } from '../enums';
import { IdempotentRequest, Notification, OperationLog, User } from '../interfaces';

@Injectable()
export class InMemoryStore {
  private talents: Map<string, Talent> = new Map();
  private contracts: Map<string, Contract> = new Map();
  private archives: Map<string, TalentArchive> = new Map();
  private users: Map<string, User> = new Map();
  private idempotentRequests: Map<string, IdempotentRequest> = new Map();
  private notifications: Map<string, Notification> = new Map();

  generateId(): string {
    return uuidv4();
  }

  createOperationLog(operator: User, action: string, remark: string, previousState?: any, newState?: any): OperationLog {
    return {
      id: this.generateId(),
      operatorId: operator.id,
      operatorName: operator.name,
      operatorRole: operator.role,
      action,
      remark,
      timestamp: new Date(),
      previousState,
      newState,
    };
  }

  getTalents(): Talent[] {
    return Array.from(this.talents.values());
  }

  getTalent(id: string): Talent | undefined {
    return this.talents.get(id);
  }

  saveTalent(talent: Talent): void {
    this.talents.set(talent.id, talent);
  }

  getContracts(): Contract[] {
    return Array.from(this.contracts.values());
  }

  getContract(id: string): Contract | undefined {
    return this.contracts.get(id);
  }

  saveContract(contract: Contract): void {
    this.contracts.set(contract.id, contract);
  }

  getContractsByTalent(talentId: string): Contract[] {
    return Array.from(this.contracts.values()).filter(c => c.talentId === talentId);
  }

  getArchives(): TalentArchive[] {
    return Array.from(this.archives.values());
  }

  getArchive(id: string): TalentArchive | undefined {
    return this.archives.get(id);
  }

  getArchiveByTalent(talentId: string): TalentArchive | undefined {
    return Array.from(this.archives.values()).find(a => a.talentId === talentId);
  }

  saveArchive(archive: TalentArchive): void {
    this.archives.set(archive.id, archive);
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

  getIdempotentRequest(requestId: string): IdempotentRequest | undefined {
    return this.idempotentRequests.get(requestId);
  }

  saveIdempotentRequest(request: IdempotentRequest): void {
    this.idempotentRequests.set(request.requestId, request);
  }

  createNotification(type: NotificationType, title: string, content: string, recipientRole: string, relatedId?: string, relatedType?: string): Notification {
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
    this.talents.clear();
    this.contracts.clear();
    this.archives.clear();
    this.users.clear();
    this.idempotentRequests.clear();
    this.notifications.clear();
  }
}
