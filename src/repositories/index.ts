import { db } from '../database/index.js';
import { v4 as uuidv4 } from 'uuid';
import type { Staff, Reservation, BeverageStorage, SingerSchedule, StatusHistory, TodoItem, IssueDetection } from '../models/schemas.js';

export class ReservationRepository {
  create(data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Reservation {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO reservations (
        id, customer_name, customer_phone, table_number, reservation_date,
        reservation_time, party_size, status, minimum_consumption_amount,
        minimum_consumption_status, reservation_staff_id, manager_id,
        notes, internal_notes, priority, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, data.customerName, data.customerPhone, data.tableNumber, 
      data.reservationDate.toISOString(), data.reservationTime, data.partySize,
      data.status, data.minimumConsumptionAmount || null, 
      data.minimumConsumptionStatus || null, data.reservationStaffId,
      data.managerId || null, data.notes || null, data.internalNotes || null,
      data.priority, now, now
    );

    return this.findById(id)!;
  }

  findById(id: string): Reservation | null {
    const stmt = db.prepare('SELECT * FROM reservations WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.mapRowToReservation(row) : null;
  }

  findAll(filters?: { status?: string; date?: string; tableNumber?: string }): Reservation[] {
    let query = 'SELECT * FROM reservations WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.date) {
      query += ' AND reservation_date = ?';
      params.push(filters.date);
    }
    if (filters?.tableNumber) {
      query += ' AND table_number = ?';
      params.push(filters.tableNumber);
    }

    query += ' ORDER BY reservation_date DESC, reservation_time DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.mapRowToReservation(row));
  }

  findDuplicates(customerPhone: string, reservationDate: string, excludeId?: string): Reservation[] {
    let query = `
      SELECT * FROM reservations 
      WHERE customer_phone = ? 
      AND reservation_date = ?
      AND status NOT IN ('cancelled', 'completed')
    `;
    const params: any[] = [customerPhone, reservationDate];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.mapRowToReservation(row));
  }

  findTableConflicts(tableNumber: string, reservationDate: string, reservationTime: string, excludeId?: string): Reservation[] {
    let query = `
      SELECT * FROM reservations 
      WHERE table_number = ? 
      AND reservation_date = ?
      AND reservation_time = ?
      AND status NOT IN ('cancelled', 'completed')
    `;
    const params: any[] = [tableNumber, reservationDate, reservationTime];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.mapRowToReservation(row));
  }

  update(id: string, data: Partial<Reservation>): Reservation | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    const fieldMap: Record<string, any> = {
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      tableNumber: data.tableNumber,
      reservationDate: data.reservationDate,
      reservationTime: data.reservationTime,
      partySize: data.partySize,
      status: data.status,
      minimumConsumptionAmount: data.minimumConsumptionAmount,
      minimumConsumptionStatus: data.minimumConsumptionStatus,
      reservationStaffId: data.reservationStaffId,
      managerId: data.managerId,
      notes: data.notes,
      internalNotes: data.internalNotes,
      priority: data.priority
    };

    for (const [key, value] of Object.entries(fieldMap)) {
      if (value !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updates.push(`${dbKey} = ?`);
        params.push(value instanceof Date ? value.toISOString() : value);
      }
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    const stmt = db.prepare(`UPDATE reservations SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);

    return this.findById(id);
  }

  private mapRowToReservation(row: any): Reservation {
    return {
      id: row.id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      tableNumber: row.table_number,
      reservationDate: new Date(row.reservation_date),
      reservationTime: row.reservation_time,
      partySize: row.party_size,
      status: row.status,
      minimumConsumptionAmount: row.minimum_consumption_amount,
      minimumConsumptionStatus: row.minimum_consumption_status,
      reservationStaffId: row.reservation_staff_id,
      managerId: row.manager_id,
      notes: row.notes,
      internalNotes: row.internal_notes,
      priority: row.priority,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

export class BeverageStorageRepository {
  create(data: Omit<BeverageStorage, 'id' | 'createdAt' | 'updatedAt'>): BeverageStorage {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO beverage_storage (
        id, reservation_id, beverage_name, quantity, storage_date,
        status, notes, bar_staff_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, data.reservationId, data.beverageName, data.quantity,
      data.storageDate.toISOString(), data.status, data.notes || null,
      data.barStaffId, now, now
    );

    return this.findById(id)!;
  }

  findById(id: string): BeverageStorage | null {
    const stmt = db.prepare('SELECT * FROM beverage_storage WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.mapRowToBeverageStorage(row) : null;
  }

  findByReservationId(reservationId: string): BeverageStorage[] {
    const stmt = db.prepare('SELECT * FROM beverage_storage WHERE reservation_id = ?');
    const rows = stmt.all(reservationId) as any[];
    return rows.map(row => this.mapRowToBeverageStorage(row));
  }

  findUnclearByReservationId(reservationId: string): BeverageStorage[] {
    const stmt = db.prepare('SELECT * FROM beverage_storage WHERE reservation_id = ? AND status = ?');
    const rows = stmt.all(reservationId, 'unclear') as any[];
    return rows.map(row => this.mapRowToBeverageStorage(row));
  }

  update(id: string, data: Partial<BeverageStorage>): BeverageStorage | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    const fieldMap: Record<string, any> = {
      beverageName: data.beverageName,
      quantity: data.quantity,
      storageDate: data.storageDate,
      retrieveDate: data.retrieveDate,
      status: data.status,
      notes: data.notes,
      barStaffId: data.barStaffId
    };

    for (const [key, value] of Object.entries(fieldMap)) {
      if (value !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updates.push(`${dbKey} = ?`);
        params.push(value instanceof Date ? value.toISOString() : value);
      }
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    const stmt = db.prepare(`UPDATE beverage_storage SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);

    return this.findById(id);
  }

  private mapRowToBeverageStorage(row: any): BeverageStorage {
    return {
      id: row.id,
      reservationId: row.reservation_id,
      beverageName: row.beverage_name,
      quantity: row.quantity,
      storageDate: new Date(row.storage_date),
      retrieveDate: row.retrieve_date ? new Date(row.retrieve_date) : undefined,
      status: row.status,
      notes: row.notes,
      barStaffId: row.bar_staff_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

export class SingerScheduleRepository {
  create(data: Omit<SingerSchedule, 'id' | 'createdAt' | 'updatedAt'>): SingerSchedule {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO singer_schedules (
        id, singer_name, performance_date, start_time, end_time,
        status, original_date, notes, manager_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, data.singerName, data.performanceDate.toISOString(), data.startTime,
      data.endTime, data.status, data.originalDate?.toISOString() || null,
      data.notes || null, data.managerId, now, now
    );

    return this.findById(id)!;
  }

  findById(id: string): SingerSchedule | null {
    const stmt = db.prepare('SELECT * FROM singer_schedules WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.mapRowToSingerSchedule(row) : null;
  }

  findByDate(date: string): SingerSchedule[] {
    const stmt = db.prepare('SELECT * FROM singer_schedules WHERE performance_date = ?');
    const rows = stmt.all(date) as any[];
    return rows.map(row => this.mapRowToSingerSchedule(row));
  }

  findConflicts(date: string, startTime: string, endTime: string, excludeId?: string): SingerSchedule[] {
    let query = `
      SELECT * FROM singer_schedules 
      WHERE performance_date = ?
      AND (
        (start_time <= ? AND end_time >= ?) OR
        (start_time <= ? AND end_time >= ?) OR
        (start_time >= ? AND end_time <= ?)
      )
      AND status NOT IN ('cancelled')
    `;
    const params: any[] = [date, startTime, startTime, endTime, endTime, startTime, endTime];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.mapRowToSingerSchedule(row));
  }

  update(id: string, data: Partial<SingerSchedule>): SingerSchedule | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    const fieldMap: Record<string, any> = {
      singerName: data.singerName,
      performanceDate: data.performanceDate,
      startTime: data.startTime,
      endTime: data.endTime,
      status: data.status,
      originalDate: data.originalDate,
      notes: data.notes,
      managerId: data.managerId
    };

    for (const [key, value] of Object.entries(fieldMap)) {
      if (value !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updates.push(`${dbKey} = ?`);
        params.push(value instanceof Date ? value.toISOString() : value);
      }
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    const stmt = db.prepare(`UPDATE singer_schedules SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);

    return this.findById(id);
  }

  private mapRowToSingerSchedule(row: any): SingerSchedule {
    return {
      id: row.id,
      singerName: row.singer_name,
      performanceDate: new Date(row.performance_date),
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status,
      originalDate: row.original_date ? new Date(row.original_date) : undefined,
      notes: row.notes,
      managerId: row.manager_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

export class StatusHistoryRepository {
  create(data: Omit<StatusHistory, 'id'>): StatusHistory {
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO status_history (
        id, entity_type, entity_id, previous_status, new_status,
        changed_by, changed_by_role, change_reason, notes, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, data.entityType, data.entityId, data.previousStatus || null,
      data.newStatus, data.changedBy, data.changedByRole,
      data.changeReason || null, data.notes || null, data.timestamp.toISOString()
    );

    return { id, ...data };
  }

  findByEntity(entityType: string, entityId: string): StatusHistory[] {
    const stmt = db.prepare(`
      SELECT * FROM status_history 
      WHERE entity_type = ? AND entity_id = ?
      ORDER BY timestamp DESC
    `);
    const rows = stmt.all(entityType, entityId) as any[];
    return rows.map(row => ({
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      previousStatus: row.previous_status,
      newStatus: row.new_status,
      changedBy: row.changed_by,
      changedByRole: row.changed_by_role,
      changeReason: row.change_reason,
      notes: row.notes,
      timestamp: new Date(row.timestamp)
    }));
  }
}

export class TodoItemRepository {
  create(data: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): TodoItem {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO todo_items (
        id, entity_type, entity_id, assignee_role, assignee_id,
        title, description, priority, status, due_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, data.entityType, data.entityId, data.assigneeRole,
      data.assigneeId || null, data.title, data.description || null,
      data.priority, data.status, data.dueDate?.toISOString() || null,
      now, now
    );

    return this.findById(id)!;
  }

  findById(id: string): TodoItem | null {
    const stmt = db.prepare('SELECT * FROM todo_items WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.mapRowToTodoItem(row) : null;
  }

  findByRole(role: string, status?: string): TodoItem[] {
    let query = 'SELECT * FROM todo_items WHERE assignee_role = ?';
    const params: any[] = [role];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY priority DESC, created_at ASC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.mapRowToTodoItem(row));
  }

  findByEntity(entityType: string, entityId: string): TodoItem[] {
    const stmt = db.prepare('SELECT * FROM todo_items WHERE entity_type = ? AND entity_id = ?');
    const rows = stmt.all(entityType, entityId) as any[];
    return rows.map(row => this.mapRowToTodoItem(row));
  }

  update(id: string, data: Partial<TodoItem>): TodoItem | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    const fieldMap: Record<string, any> = {
      assigneeRole: data.assigneeRole,
      assigneeId: data.assigneeId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      dueDate: data.dueDate
    };

    for (const [key, value] of Object.entries(fieldMap)) {
      if (value !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updates.push(`${dbKey} = ?`);
        params.push(value instanceof Date ? value.toISOString() : value);
      }
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    const stmt = db.prepare(`UPDATE todo_items SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);

    return this.findById(id);
  }

  private mapRowToTodoItem(row: any): TodoItem {
    return {
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      assigneeRole: row.assignee_role,
      assigneeId: row.assignee_id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      dueDate: row.due_date ? new Date(row.due_date) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

export class IssueDetectionRepository {
  create(data: Omit<IssueDetection, 'id' | 'createdAt'>): IssueDetection {
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO issue_detections (
        id, reservation_id, issue_type, severity, description,
        related_entity_id, resolved, resolved_at, resolved_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, data.reservationId, data.issueType, data.severity,
      data.description, data.relatedEntityId || null,
      data.resolved ? 1 : 0, data.resolvedAt?.toISOString() || null,
      data.resolvedBy || null, new Date().toISOString()
    );

    return { id, ...data, createdAt: new Date() };
  }

  findByReservationId(reservationId: string, unresolvedOnly = false): IssueDetection[] {
    let query = 'SELECT * FROM issue_detections WHERE reservation_id = ?';
    if (unresolvedOnly) {
      query += ' AND resolved = 0';
    }
    query += ' ORDER BY severity DESC, created_at DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(reservationId) as any[];
    return rows.map(row => this.mapRowToIssueDetection(row));
  }

  findAll(unresolvedOnly = false): IssueDetection[] {
    let query = 'SELECT * FROM issue_detections';
    if (unresolvedOnly) {
      query += ' WHERE resolved = 0';
    }
    query += ' ORDER BY severity DESC, created_at DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all() as any[];
    return rows.map(row => this.mapRowToIssueDetection(row));
  }

  resolve(id: string, resolvedBy: string): void {
    const stmt = db.prepare(`
      UPDATE issue_detections 
      SET resolved = 1, resolved_at = ?, resolved_by = ?
      WHERE id = ?
    `);
    stmt.run(new Date().toISOString(), resolvedBy, id);
  }

  private mapRowToIssueDetection(row: any): IssueDetection {
    return {
      id: row.id,
      reservationId: row.reservation_id,
      issueType: row.issue_type,
      severity: row.severity,
      description: row.description,
      relatedEntityId: row.related_entity_id,
      resolved: Boolean(row.resolved),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      resolvedBy: row.resolved_by,
      createdAt: new Date(row.created_at)
    };
  }
}

export class StaffRepository {
  create(data: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>): Staff {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO staff (id, name, role, phone, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, data.name, data.role, data.phone || null, now, now);

    return this.findById(id)!;
  }

  findById(id: string): Staff | null {
    const stmt = db.prepare('SELECT * FROM staff WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.mapRowToStaff(row) : null;
  }

  findByRole(role: string): Staff[] {
    const stmt = db.prepare('SELECT * FROM staff WHERE role = ?');
    const rows = stmt.all(role) as any[];
    return rows.map(row => this.mapRowToStaff(row));
  }

  private mapRowToStaff(row: any): Staff {
    return {
      id: row.id,
      name: row.name,
      role: row.role,
      phone: row.phone,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
