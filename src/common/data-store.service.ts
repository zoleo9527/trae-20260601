import { Injectable } from '@nestjs/common';
import { RepairOrder } from '../repair/interfaces/repair.interface';
import { DispatchRecord } from '../dispatch/interfaces/dispatch.interface';
import { User } from './interfaces/user.interface';
import { HistoryNote } from './interfaces/history-note.interface';

@Injectable()
export class DataStoreService {
  private users: User[] = [];
  private repairOrders: RepairOrder[] = [];
  private dispatchRecords: DispatchRecord[] = [];
  private historyNotes: Map<string, HistoryNote[]> = new Map();

  constructor() {}

  getUsers(): User[] {
    return this.users;
  }

  setUsers(users: User[]): void {
    this.users = users;
  }

  getRepairOrders(): RepairOrder[] {
    return this.repairOrders;
  }

  setRepairOrders(orders: RepairOrder[]): void {
    this.repairOrders = orders;
  }

  getDispatchRecords(): DispatchRecord[] {
    return this.dispatchRecords;
  }

  setDispatchRecords(records: DispatchRecord[]): void {
    this.dispatchRecords = records;
  }

  getHistoryNotes(orderId: string): HistoryNote[] {
    return this.historyNotes.get(orderId) || [];
  }

  addHistoryNote(orderId: string, note: HistoryNote): void {
    const notes = this.historyNotes.get(orderId) || [];
    notes.push(note);
    this.historyNotes.set(orderId, notes);
  }

  setHistoryNotes(orderId: string, notes: HistoryNote[]): void {
    this.historyNotes.set(orderId, notes);
  }
}
