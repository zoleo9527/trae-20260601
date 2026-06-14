import { pool } from "./connection";

export async function getStudents() {
  return pool.query(`
    SELECT s.*, t.status as training_status, g.status as gear_status
    FROM students s
    LEFT JOIN training_records t ON s.id = t.student_id AND t.status = 'in_progress'
    LEFT JOIN gear_issues g ON s.id = g.student_id AND g.status = 'issued'
    ORDER BY s.enrollment_date DESC
  `);
}

export async function getStudentById(id: number) {
  return pool.query(`
    SELECT s.*, t.status as training_status, g.status as gear_status
    FROM students s
    LEFT JOIN training_records t ON s.id = t.student_id AND t.status = 'in_progress'
    LEFT JOIN gear_issues g ON s.id = g.student_id AND g.status = 'issued'
    WHERE s.id = $1
  `, [id]);
}

export async function getTrainingRecords(studentId?: number) {
  const query = studentId 
    ? `SELECT tr.*, s.name as student_name, u.name as trainer_name 
       FROM training_records tr 
       JOIN students s ON tr.student_id = s.id 
       LEFT JOIN users u ON tr.trainer_id = u.id 
       WHERE tr.student_id = $1 
       ORDER BY tr.date DESC`
    : `SELECT tr.*, s.name as student_name, u.name as trainer_name 
       FROM training_records tr 
       JOIN students s ON tr.student_id = s.id 
       LEFT JOIN users u ON tr.trainer_id = u.id 
       ORDER BY tr.date DESC`;
  
  return pool.query(query, studentId ? [studentId] : []);
}

export async function getGearIssues(studentId?: number) {
  const query = studentId
    ? `SELECT gi.*, s.name as student_name, u.name as issuer_name, tr.date as training_date
       FROM gear_issues gi
       JOIN students s ON gi.student_id = s.id
       LEFT JOIN users u ON gi.issuer_id = u.id
       LEFT JOIN training_records tr ON gi.training_record_id = tr.id
       WHERE gi.student_id = $1
       ORDER BY gi.created_at DESC`
    : `SELECT gi.*, s.name as student_name, u.name as issuer_name, tr.date as training_date
       FROM gear_issues gi
       JOIN students s ON gi.student_id = s.id
       LEFT JOIN users u ON gi.issuer_id = u.id
       LEFT JOIN training_records tr ON gi.training_record_id = tr.id
       ORDER BY gi.created_at DESC`;
  
  return pool.query(query, studentId ? [studentId] : []);
}

export async function getOperationLogs() {
  return pool.query(`
    SELECT ol.*, u.name as operator_name
    FROM operation_logs ol
    LEFT JOIN users u ON ol.user_id = u.id
    ORDER BY ol.created_at DESC
    LIMIT 50
  `);
}

export async function createTrainingRecord(studentId: number, trainerId: number, date: string, duration: number, content: string) {
  return pool.query(`
    INSERT INTO training_records (student_id, trainer_id, date, duration_minutes, content, status)
    VALUES ($1, $2, $3, $4, $5, 'in_progress')
    RETURNING *
  `, [studentId, trainerId, date, duration, content]);
}

export async function updateTrainingRecord(id: number, status: string, notes?: string) {
  return pool.query(`
    UPDATE training_records 
    SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `, [status, notes, id]);
}

export async function createGearIssue(studentId: number, issuerId: number, trainingRecordId: number, helmet: boolean, jacket: boolean, gloves: boolean, boots: boolean) {
  return pool.query(`
    INSERT INTO gear_issues (student_id, issuer_id, training_record_id, helmet, jacket, gloves, boots, status, issued_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'issued', CURRENT_TIMESTAMP)
    RETURNING *
  `, [studentId, issuerId, trainingRecordId, helmet, jacket, gloves, boots]);
}

export async function returnGear(id: number) {
  return pool.query(`
    UPDATE gear_issues
    SET status = 'returned', returned_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `, [id]);
}

export async function addOperationLog(userId: number, action: string, targetType: string, targetId: number, details: object) {
  return pool.query(`
    INSERT INTO operation_logs (user_id, action, target_type, target_id, details)
    VALUES ($1, $2, $3, $4, $5)
  `, [userId, action, targetType, targetId, details]);
}
