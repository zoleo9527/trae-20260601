import { pool } from "./connection";

export async function getStudents() {
  const result = await pool.query(`
    SELECT s.*, t.status as training_status, g.status as gear_status
    FROM students s
    LEFT JOIN training_records t ON s.id = t.student_id AND t.status = 'in_progress'
    LEFT JOIN gear_issues g ON s.id = g.student_id AND g.status = 'issued'
    ORDER BY s.enrollment_date DESC
  `);
  return result.rows;
}

export async function getStudentById(id: number) {
  const result = await pool.query(`
    SELECT s.*, t.status as training_status, g.status as gear_status
    FROM students s
    LEFT JOIN training_records t ON s.id = t.student_id AND t.status = 'in_progress'
    LEFT JOIN gear_issues g ON s.id = g.student_id AND g.status = 'issued'
    WHERE s.id = $1
  `, [id]);
  return result.rows[0];
}

export async function getTrainingRecords(studentId?: number) {
  const query = studentId 
    ? `SELECT tr.*, s.name as student_name, u.name as trainer_name, u.id as trainer_id
       FROM training_records tr 
       JOIN students s ON tr.student_id = s.id 
       LEFT JOIN users u ON tr.trainer_id = u.id 
       WHERE tr.student_id = $1 
       ORDER BY tr.date DESC`
    : `SELECT tr.*, s.name as student_name, u.name as trainer_name, u.id as trainer_id
       FROM training_records tr 
       JOIN students s ON tr.student_id = s.id 
       LEFT JOIN users u ON tr.trainer_id = u.id 
       ORDER BY tr.date DESC`;
  
  const result = await pool.query(query, studentId ? [studentId] : []);
  return result.rows;
}

export async function getGearIssues(studentId?: number) {
  const query = studentId
    ? `SELECT gi.*, s.name as student_name, u.name as issuer_name, tr.date as training_date, 
              tr.content as training_content, tr.notes as training_notes, tr.trainer_id, trainer.name as trainer_name
       FROM gear_issues gi
       JOIN students s ON gi.student_id = s.id
       LEFT JOIN users u ON gi.issuer_id = u.id
       LEFT JOIN training_records tr ON gi.training_record_id = tr.id
       LEFT JOIN users trainer ON tr.trainer_id = trainer.id
       WHERE gi.student_id = $1
       ORDER BY gi.created_at DESC`
    : `SELECT gi.*, s.name as student_name, u.name as issuer_name, tr.date as training_date, 
              tr.content as training_content, tr.notes as training_notes, tr.trainer_id, trainer.name as trainer_name
       FROM gear_issues gi
       JOIN students s ON gi.student_id = s.id
       LEFT JOIN users u ON gi.issuer_id = u.id
       LEFT JOIN training_records tr ON gi.training_record_id = tr.id
       LEFT JOIN users trainer ON tr.trainer_id = trainer.id
       ORDER BY gi.created_at DESC`;
  
  const result = await pool.query(query, studentId ? [studentId] : []);
  return result.rows;
}

export async function getOperationLogs() {
  const result = await pool.query(`
    SELECT ol.*, u.name as operator_name
    FROM operation_logs ol
    LEFT JOIN users u ON ol.user_id = u.id
    ORDER BY ol.created_at DESC
    LIMIT 50
  `);
  return result.rows;
}

export async function createTrainingRecord(studentId: number, trainerId: number, date: string, duration: number, content: string) {
  const result = await pool.query(`
    INSERT INTO training_records (student_id, trainer_id, date, duration_minutes, content, status)
    VALUES ($1, $2, $3, $4, $5, 'in_progress')
    RETURNING *
  `, [studentId, trainerId, date, duration, content]);
  
  await pool.query(`
    UPDATE students SET status = 'training' WHERE id = $1
  `, [studentId]);
  
  return result.rows[0];
}

export async function updateTrainingRecord(id: number, status: string, notes?: string) {
  const result = await pool.query(`
    UPDATE training_records 
    SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *, student_id
  `, [status, notes, id]);
  
  if (result.rows.length > 0) {
    const record = result.rows[0];
    if (status === 'completed') {
      const activeGear = await pool.query(`
        SELECT * FROM gear_issues WHERE student_id = $1 AND status = 'issued'
      `, [record.student_id]);
      
      if (activeGear.rows.length > 0) {
        await pool.query(`
          UPDATE students SET status = 'gear_issued' WHERE id = $1
        `, [record.student_id]);
      } else {
        const hasCompletedTraining = await pool.query(`
          SELECT * FROM training_records WHERE student_id = $1 AND status = 'completed'
        `, [record.student_id]);
        
        const hasNoGear = await pool.query(`
          SELECT * FROM gear_issues WHERE student_id = $1 AND status = 'issued'
        `, [record.student_id]);
        
        if (hasCompletedTraining.rows.length > 0 && hasNoGear.rows.length === 0) {
          await pool.query(`
            UPDATE students SET status = 'training_done' WHERE id = $1
          `, [record.student_id]);
        }
      }
    }
  }
  
  return result.rows[0];
}

export async function createGearIssue(studentId: number, issuerId: number, trainingRecordId: number, helmet: boolean, jacket: boolean, gloves: boolean, boots: boolean) {
  const result = await pool.query(`
    INSERT INTO gear_issues (student_id, issuer_id, training_record_id, helmet, jacket, gloves, boots, status, issued_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'issued', CURRENT_TIMESTAMP)
    RETURNING *
  `, [studentId, issuerId, trainingRecordId, helmet, jacket, gloves, boots]);
  
  await pool.query(`
    UPDATE students SET status = 'gear_issued' WHERE id = $1
  `, [studentId]);
  
  return result.rows[0];
}

export async function returnGear(id: number) {
  const result = await pool.query(`
    UPDATE gear_issues
    SET status = 'returned', returned_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *, student_id
  `, [id]);
  
  if (result.rows.length > 0) {
    const gearIssue = result.rows[0];
    const activeTraining = await pool.query(`
      SELECT * FROM training_records WHERE student_id = $1 AND status = 'in_progress'
    `, [gearIssue.student_id]);
    
    const activeGear = await pool.query(`
      SELECT * FROM gear_issues WHERE student_id = $1 AND status = 'issued' AND id != $2
    `, [gearIssue.student_id, id]);
    
    if (activeTraining.rows.length > 0) {
      await pool.query(`
        UPDATE students SET status = 'training' WHERE id = $1
      `, [gearIssue.student_id]);
    } else if (activeGear.rows.length > 0) {
      await pool.query(`
        UPDATE students SET status = 'gear_issued' WHERE id = $1
      `, [gearIssue.student_id]);
    } else {
      await pool.query(`
        UPDATE students SET status = 'completed' WHERE id = $1
      `, [gearIssue.student_id]);
    }
  }
  
  return result.rows[0];
}

export async function addOperationLog(userId: number, action: string, targetType: string, targetId: number, details: object) {
  await pool.query(`
    INSERT INTO operation_logs (user_id, action, target_type, target_id, details)
    VALUES ($1, $2, $3, $4, $5)
  `, [userId, action, targetType, targetId, details]);
}

export async function getTrainingRecordById(id: number) {
  const result = await pool.query(`
    SELECT tr.*, s.name as student_name, u.name as trainer_name
    FROM training_records tr
    JOIN students s ON tr.student_id = s.id
    LEFT JOIN users u ON tr.trainer_id = u.id
    WHERE tr.id = $1
  `, [id]);
  return result.rows[0];
}
