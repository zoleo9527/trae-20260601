import sqlite3 from 'sqlite3';
import { ExamTrackRecord, OperationLog, User, ExamTrackStatus, UserRole, OperationType } from './types';

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('数据库连接成功');
    initDatabase();
  }
});

function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'consultant')),
      created_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS exam_track_records (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      instrument TEXT NOT NULL,
      exam_level TEXT NOT NULL,
      track_name TEXT NOT NULL,
      track_type TEXT NOT NULL CHECK(track_type IN ('required', 'optional')),
      practice_plan TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN (
        'draft', 'submitted_by_teacher', 'reviewing_by_admin', 
        'approved', 'rejected', 'supplemented', 'in_practice', 
        'completed', 'exam_passed', 'exam_failed'
      )),
      reject_reason TEXT,
      supplement_notes TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      record_id TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      operator_name TEXT NOT NULL,
      operator_role TEXT NOT NULL CHECK(operator_role IN ('admin', 'teacher', 'consultant')),
      operation_type TEXT NOT NULL CHECK(operation_type IN (
        'create', 'submit', 'review', 'approve', 'reject', 
        'supplement', 'update_plan', 'update_progress', 
        'complete', 'confirm_exam_result'
      )),
      previous_status TEXT CHECK(previous_status IN (
        'draft', 'submitted_by_teacher', 'reviewing_by_admin', 
        'approved', 'rejected', 'supplemented', 'in_practice', 
        'completed', 'exam_passed', 'exam_failed'
      )),
      new_status TEXT NOT NULL CHECK(new_status IN (
        'draft', 'submitted_by_teacher', 'reviewing_by_admin', 
        'approved', 'rejected', 'supplemented', 'in_practice', 
        'completed', 'exam_passed', 'exam_failed'
      )),
      comment TEXT,
      created_at TEXT NOT NULL
    )
  `);
}

export const dbService = {
  createUser: (user: Omit<User, 'createdAt'>): Promise<User> => {
    return new Promise((resolve, reject) => {
      const createdAt = new Date().toISOString();
      db.run(
        'INSERT INTO users (id, name, role, created_at) VALUES (?, ?, ?, ?)',
        [user.id, user.name, user.role, createdAt],
        function(err) {
          if (err) reject(err);
          else resolve({ ...user, createdAt });
        }
      );
    });
  },

  getUserById: (id: string): Promise<User | null> => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else if (!row) resolve(null);
        else resolve({
          id: row.id,
          name: row.name,
          role: row.role as UserRole,
          createdAt: row.created_at
        });
      });
    });
  },

  getUsers: (): Promise<User[]> => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM users', (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => ({
          id: row.id,
          name: row.name,
          role: row.role as UserRole,
          createdAt: row.created_at
        })));
      });
    });
  },

  createRecord: (record: Omit<ExamTrackRecord, 'createdAt' | 'updatedAt'>): Promise<ExamTrackRecord> => {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.run(
        'INSERT INTO exam_track_records (id, student_id, student_name, instrument, exam_level, track_name, track_type, practice_plan, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          record.id,
          record.studentId,
          record.studentName,
          record.instrument,
          record.examLevel,
          record.trackName,
          record.trackType,
          JSON.stringify(record.practicePlan),
          record.status,
          record.createdBy,
          now,
          now
        ],
        function(err) {
          if (err) reject(err);
          else resolve({ ...record, createdAt: now, updatedAt: now });
        }
      );
    });
  },

  getRecords: (role?: UserRole, operatorId?: string): Promise<ExamTrackRecord[]> => {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM exam_track_records';
      let params: any[] = [];

      if (role === UserRole.TEACHER && operatorId) {
        query += ' WHERE created_by = ?';
        params.push(operatorId);
      }

      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => ({
          id: row.id,
          studentId: row.student_id,
          studentName: row.student_name,
          instrument: row.instrument,
          examLevel: row.exam_level,
          trackName: row.track_name,
          trackType: row.track_type as 'required' | 'optional',
          practicePlan: JSON.parse(row.practice_plan),
          status: row.status as ExamTrackStatus,
          rejectReason: row.reject_reason,
          supplementNotes: row.supplement_notes,
          createdBy: row.created_by,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        })));
      });
    });
  },

  getRecordById: (id: string): Promise<ExamTrackRecord | null> => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM exam_track_records WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else if (!row) resolve(null);
        else resolve({
          id: row.id,
          studentId: row.student_id,
          studentName: row.student_name,
          instrument: row.instrument,
          examLevel: row.exam_level,
          trackName: row.track_name,
          trackType: row.track_type as 'required' | 'optional',
          practicePlan: JSON.parse(row.practice_plan),
          status: row.status as ExamTrackStatus,
          rejectReason: row.reject_reason,
          supplementNotes: row.supplement_notes,
          createdBy: row.created_by,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        });
      });
    });
  },

  updateRecord: (id: string, updates: Partial<ExamTrackRecord>): Promise<ExamTrackRecord | null> => {
    return new Promise((resolve, reject) => {
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (updates.studentName !== undefined) {
        updateFields.push('student_name = ?');
        updateValues.push(updates.studentName);
      }
      if (updates.instrument !== undefined) {
        updateFields.push('instrument = ?');
        updateValues.push(updates.instrument);
      }
      if (updates.examLevel !== undefined) {
        updateFields.push('exam_level = ?');
        updateValues.push(updates.examLevel);
      }
      if (updates.trackName !== undefined) {
        updateFields.push('track_name = ?');
        updateValues.push(updates.trackName);
      }
      if (updates.trackType !== undefined) {
        updateFields.push('track_type = ?');
        updateValues.push(updates.trackType);
      }
      if (updates.practicePlan !== undefined) {
        updateFields.push('practice_plan = ?');
        updateValues.push(JSON.stringify(updates.practicePlan));
      }
      if (updates.status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(updates.status);
      }
      if (updates.rejectReason !== undefined) {
        updateFields.push('reject_reason = ?');
        updateValues.push(updates.rejectReason);
      }
      if (updates.supplementNotes !== undefined) {
        updateFields.push('supplement_notes = ?');
        updateValues.push(updates.supplementNotes);
      }

      updateFields.push('updated_at = ?');
      updateValues.push(new Date().toISOString());
      updateValues.push(id);

      if (updateFields.length === 0) {
        resolve(null);
        return;
      }

      const query = `UPDATE exam_track_records SET ${updateFields.join(', ')} WHERE id = ?`;
      db.run(query, updateValues, function(err) {
        if (err) reject(err);
        else if (this.changes === 0) resolve(null);
        else dbService.getRecordById(id).then(resolve).catch(reject);
      });
    });
  },

  deleteRecord: (id: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM exam_track_records WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  },

  createOperationLog: (log: Omit<OperationLog, 'createdAt'>): Promise<OperationLog> => {
    return new Promise((resolve, reject) => {
      const createdAt = new Date().toISOString();
      db.run(
        'INSERT INTO operation_logs (id, record_id, operator_id, operator_name, operator_role, operation_type, previous_status, new_status, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          log.id,
          log.recordId,
          log.operatorId,
          log.operatorName,
          log.operatorRole,
          log.operationType,
          log.previousStatus || null,
          log.newStatus,
          log.comment || null,
          createdAt
        ],
        function(err) {
          if (err) reject(err);
          else resolve({ ...log, createdAt });
        }
      );
    });
  },

  getOperationLogsByRecordId: (recordId: string): Promise<OperationLog[]> => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM operation_logs WHERE record_id = ? ORDER BY created_at DESC',
        [recordId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => ({
            id: row.id,
            recordId: row.record_id,
            operatorId: row.operator_id,
            operatorName: row.operator_name,
            operatorRole: row.operator_role as UserRole,
            operationType: row.operation_type as OperationType,
            previousStatus: row.previous_status ? (row.previous_status as ExamTrackStatus) : undefined,
            newStatus: row.new_status as ExamTrackStatus,
            comment: row.comment,
            createdAt: row.created_at
          })));
        }
      );
    });
  }
};

export default db;
