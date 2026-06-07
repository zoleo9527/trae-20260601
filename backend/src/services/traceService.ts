import { db } from '../db';

export function getMedicationTraceByPond(pondId: string, startDate?: string, endDate?: string) {
  let sql = `
    SELECT mr.*, m.name as medicine_name, m.specification, m.unit, m.manufacturer,
           u.name as operator_name, dc.case_no, dc.disease_name, dc.severity,
           p.name as pond_name
    FROM medication_records mr
    JOIN medicines m ON mr.medicine_id = m.id
    JOIN users u ON mr.operator_id = u.id
    JOIN disease_cases dc ON mr.disease_case_id = dc.id
    JOIN ponds p ON mr.pond_id = p.id
    WHERE mr.pond_id = ?
  `;
  const params: any[] = [pondId];

  if (startDate) {
    sql += ' AND mr.medication_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND mr.medication_date <= ?';
    params.push(endDate);
  }

  sql += ' ORDER BY mr.medication_date DESC';
  return db.prepare(sql).all(...params);
}

export function getMedicationTraceByDiseaseCase(caseId: string) {
  const records = db.prepare(`
    SELECT mr.*, m.name as medicine_name, m.specification, m.unit, m.manufacturer,
           u.name as operator_name, p.name as pond_name
    FROM medication_records mr
    JOIN medicines m ON mr.medicine_id = m.id
    JOIN users u ON mr.operator_id = u.id
    JOIN ponds p ON mr.pond_id = p.id
    WHERE mr.disease_case_id = ?
    ORDER BY mr.medication_date DESC
  `).all(caseId);

  const diseaseCase = db.prepare(`
    SELECT dc.*, u.name as reporter_name, p.name as pond_name,
           rejector.name as rejected_by_name,
           allocator.name as medicine_allocated_by_name,
           approver.name as approved_by_name,
           medicator.name as medicated_by_name,
           closer.name as closed_by_name
    FROM disease_cases dc
    JOIN users u ON dc.reporter_id = u.id
    JOIN ponds p ON dc.pond_id = p.id
    LEFT JOIN users rejector ON dc.rejected_by = rejector.id
    LEFT JOIN users allocator ON dc.medicine_allocated_by = allocator.id
    LEFT JOIN users approver ON dc.approved_by = approver.id
    LEFT JOIN users medicator ON dc.medicated_by = medicator.id
    LEFT JOIN users closer ON dc.closed_by = closer.id
    WHERE dc.id = ?
  `).get(caseId);

  const audits = db.prepare(`
    SELECT dca.*, u.name as operator_name
    FROM disease_case_audits dca
    JOIN users u ON dca.operator_id = u.id
    WHERE dca.disease_case_id = ?
    ORDER BY dca.created_at ASC
  `).all(caseId);

  const caseMedicines = db.prepare(`
    SELECT dcm.*, m.name as medicine_name, m.specification, m.unit, m.manufacturer
    FROM disease_case_medicines dcm
    JOIN medicines m ON dcm.medicine_id = m.id
    WHERE dcm.disease_case_id = ?
  `).all(caseId);

  return { diseaseCase, medicationRecords: records, audits, caseMedicines };
}

export function getMedicationTraceByMedicine(medicineId: string, startDate?: string, endDate?: string) {
  let sql = `
    SELECT mr.*, m.name as medicine_name, m.specification, m.unit, m.manufacturer,
           u.name as operator_name, dc.case_no, dc.disease_name, p.name as pond_name
    FROM medication_records mr
    JOIN medicines m ON mr.medicine_id = m.id
    JOIN users u ON mr.operator_id = u.id
    JOIN disease_cases dc ON mr.disease_case_id = dc.id
    JOIN ponds p ON mr.pond_id = p.id
    WHERE mr.medicine_id = ?
  `;
  const params: any[] = [medicineId];

  if (startDate) {
    sql += ' AND mr.medication_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND mr.medication_date <= ?';
    params.push(endDate);
  }

  sql += ' ORDER BY mr.medication_date DESC';
  return db.prepare(sql).all(...params);
}

export function getPondMedicationSummary(pondId: string) {
  return db.prepare(`
    SELECT
      m.id as medicine_id,
      m.name as medicine_name,
      SUM(mr.quantity) as total_used_quantity,
      m.unit,
      COUNT(DISTINCT mr.disease_case_id) as case_count,
      MIN(mr.medication_date) as first_used_date,
      MAX(mr.medication_date) as last_used_date
    FROM medication_records mr
    JOIN medicines m ON mr.medicine_id = m.id
    WHERE mr.pond_id = ?
    GROUP BY m.id, m.name, m.unit
    ORDER BY total_used_quantity DESC
  `).all(pondId);
}
