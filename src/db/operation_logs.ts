import { db } from './init';
import type { OperationLog } from './types';

export function getAllLogs(): OperationLog[] {
  return db.prepare(`
    SELECT * FROM operation_logs ORDER BY created_at DESC
  `).all() as OperationLog[];
}

export function getLogsByTable(tableName: string): OperationLog[] {
  return db.prepare(`
    SELECT * FROM operation_logs WHERE table_name = ? ORDER BY created_at DESC
  `).all(tableName) as OperationLog[];
}

export function getLogsByRecord(tableName: string, recordId: number): OperationLog[] {
  return db.prepare(`
    SELECT * FROM operation_logs WHERE table_name = ? AND record_id = ? ORDER BY created_at DESC
  `).all(tableName, recordId) as OperationLog[];
}

export function createLog(data: Omit<OperationLog, 'id' | 'created_at'>): void {
  const stmt = db.prepare(`
    INSERT INTO operation_logs (table_name, record_id, operation, field_name, old_value, new_value, operator_id, operator_name, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    data.table_name,
    data.record_id,
    data.operation,
    data.field_name,
    data.old_value,
    data.new_value,
    data.operator_id,
    data.operator_name,
    data.notes
  );
}

export function createUpdateLogs(
  tableName: string,
  recordId: number,
  changes: { field_name: string; old_value: string | null; new_value: string | null }[],
  operatorId: number,
  operatorName: string,
  notes?: string
): void {
  for (const change of changes) {
    createLog({
      table_name: tableName,
      record_id: recordId,
      operation: 'update',
      field_name: change.field_name,
      old_value: change.old_value,
      new_value: change.new_value,
      operator_id: operatorId,
      operator_name: operatorName,
      notes
    });
  }
}
