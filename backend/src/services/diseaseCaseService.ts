import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

export type DiseaseCaseStatus = 'DRAFT' | 'SUBMITTED' | 'REJECTED' | 'MEDICINE_ALLOCATED' | 'APPROVED' | 'MEDICATED' | 'CLOSED';
export type UserRole = 'TECHNICIAN' | 'WAREHOUSE_KEEPER' | 'FIELD_MANAGER';
export type Severity = 'MILD' | 'MODERATE' | 'SEVERE';

export interface CreateDiseaseCaseRequest {
  pondId: string;
  reporterId: string;
  diseaseName: string;
  diseaseDescription: string;
  severity: Severity;
  suggestedMedication?: string;
  medicines: { medicineId: string; suggestedQuantity: number; dosage?: string; usageMethod?: string }[];
}

export interface RejectRequest {
  caseId: string;
  operatorId: string;
  rejectReason: string;
}

export interface AllocateMedicineRequest {
  caseId: string;
  operatorId: string;
  medicines: { id: string; actualQuantity: number }[];
}

export interface ApproveRequest {
  caseId: string;
  operatorId: string;
  remark?: string;
}

export interface RecordMedicationRequest {
  caseId: string;
  operatorId: string;
  medicationDate: string;
  notes?: string;
}

function generateCaseNo(): string {
  const date = new Date();
  const prefix = `DH${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const count = db.prepare(`
    SELECT COUNT(*) as cnt FROM disease_cases WHERE case_no LIKE ?
  `).get(`${prefix}%`) as any;
  return `${prefix}${String(count.cnt + 1).padStart(4, '0')}`;
}

function createAudit(
  caseId: string,
  operatorId: string,
  operatorRole: UserRole,
  action: string,
  remark?: string,
  oldStatus?: string,
  newStatus?: string
) {
  db.prepare(`
    INSERT INTO disease_case_audits (id, disease_case_id, operator_id, operator_role, action, remark, old_status, new_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), caseId, operatorId, operatorRole, action, remark || null, oldStatus || null, newStatus || null);
}

function getUserRole(userId: string): UserRole {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
  if (!user) throw new Error('用户不存在');
  return user.role;
}

export function createDiseaseCase(req: CreateDiseaseCaseRequest) {
  const caseNo = generateCaseNo();
  const caseId = uuidv4();

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO disease_cases (
        id, case_no, pond_id, reporter_id, report_date, disease_name, disease_description,
        severity, suggested_medication, status, current_handler_role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      caseId,
      caseNo,
      req.pondId,
      req.reporterId,
      new Date().toISOString().split('T')[0],
      req.diseaseName,
      req.diseaseDescription,
      req.severity,
      req.suggestedMedication || null,
      'DRAFT',
      'TECHNICIAN'
    );

    for (const med of req.medicines) {
      db.prepare(`
        INSERT INTO disease_case_medicines (id, disease_case_id, medicine_id, suggested_quantity, dosage, usage_method)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), caseId, med.medicineId, med.suggestedQuantity, med.dosage || null, med.usageMethod || null);
    }

    createAudit(caseId, req.reporterId, 'TECHNICIAN', 'CREATE_DRAFT', '创建病害处理单草稿', undefined, 'DRAFT');
  });

  tx();
  return getDiseaseCaseById(caseId);
}

export function submitDiseaseCase(caseId: string, operatorId: string) {
  const caseData = db.prepare('SELECT * FROM disease_cases WHERE id = ?').get(caseId) as any;
  if (!caseData) throw new Error('病害单不存在');
  if (!['DRAFT', 'REJECTED'].includes(caseData.status)) {
    throw new Error(`当前状态 ${caseData.status} 不允许提交`);
  }

  const operatorRole = getUserRole(operatorId);
  if (operatorRole !== 'TECHNICIAN') {
    throw new Error('只有养殖技术员可以提交');
  }

  const oldStatus = caseData.status;

  db.prepare(`
    UPDATE disease_cases
    SET status = 'SUBMITTED', current_handler_role = 'WAREHOUSE_KEEPER', updated_at = CURRENT_TIMESTAMP,
        reject_reason = NULL, rejected_by = NULL, rejected_at = NULL
    WHERE id = ?
  `).run(caseId);

  createAudit(caseId, operatorId, operatorRole, 'SUBMIT', oldStatus === 'REJECTED' ? '补录后重新提交' : '提交审核', oldStatus, 'SUBMITTED');

  return getDiseaseCaseById(caseId);
}

export function rejectDiseaseCase(req: RejectRequest) {
  const caseData = db.prepare('SELECT * FROM disease_cases WHERE id = ?').get(req.caseId) as any;
  if (!caseData) throw new Error('病害单不存在');
  if (caseData.status !== 'MEDICINE_ALLOCATED') {
    throw new Error(`当前状态 ${caseData.status} 不允许驳回，需等待仓管配药完成后再审批`);
  }

  const operatorRole = getUserRole(req.operatorId);
  if (operatorRole !== 'FIELD_MANAGER') {
    throw new Error('只有场长可以驳回');
  }

  if (!req.rejectReason || req.rejectReason.trim().length < 5) {
    throw new Error('驳回理由不得少于5个字');
  }

  const oldStatus = caseData.status;

  db.prepare(`
    UPDATE disease_cases
    SET status = 'REJECTED', current_handler_role = 'TECHNICIAN', updated_at = CURRENT_TIMESTAMP,
        reject_reason = ?, rejected_by = ?, rejected_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.rejectReason, req.operatorId, req.caseId);

  createAudit(req.caseId, req.operatorId, operatorRole, 'REJECT', req.rejectReason, oldStatus, 'REJECTED');

  return getDiseaseCaseById(req.caseId);
}

export function allocateMedicine(req: AllocateMedicineRequest) {
  const caseData = db.prepare('SELECT * FROM disease_cases WHERE id = ?').get(req.caseId) as any;
  if (!caseData) throw new Error('病害单不存在');
  if (caseData.status !== 'SUBMITTED') {
    throw new Error(`当前状态 ${caseData.status} 不允许配药`);
  }

  const operatorRole = getUserRole(req.operatorId);
  if (operatorRole !== 'WAREHOUSE_KEEPER') {
    throw new Error('只有饲料仓管可以配药');
  }

  const oldStatus = caseData.status;

  const tx = db.transaction(() => {
    for (const med of req.medicines) {
      const medicine = db.prepare('SELECT * FROM medicines WHERE id = ?').get(med.id) as any;
      if (!medicine) throw new Error(`药品 ${med.id} 不存在`);
      if (medicine.stock_quantity < med.actualQuantity) {
        throw new Error(`药品 ${medicine.name} 库存不足`);
      }

      db.prepare(`
        UPDATE disease_case_medicines
        SET actual_quantity = ?
        WHERE disease_case_id = ? AND medicine_id = ?
      `).run(med.actualQuantity, req.caseId, med.id);

      db.prepare(`
        UPDATE medicines SET stock_quantity = stock_quantity - ? WHERE id = ?
      `).run(med.actualQuantity, med.id);
    }

    db.prepare(`
      UPDATE disease_cases
      SET status = 'MEDICINE_ALLOCATED', current_handler_role = 'FIELD_MANAGER', updated_at = CURRENT_TIMESTAMP,
          medicine_allocated_by = ?, medicine_allocated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.operatorId, req.caseId);

    createAudit(req.caseId, req.operatorId, operatorRole, 'ALLOCATE_MEDICINE', '完成药品配货出库', oldStatus, 'MEDICINE_ALLOCATED');
  });

  tx();
  return getDiseaseCaseById(req.caseId);
}

export function approveDiseaseCase(req: ApproveRequest) {
  const caseData = db.prepare('SELECT * FROM disease_cases WHERE id = ?').get(req.caseId) as any;
  if (!caseData) throw new Error('病害单不存在');
  if (caseData.status !== 'MEDICINE_ALLOCATED') {
    throw new Error(`当前状态 ${caseData.status} 不允许审批`);
  }

  const operatorRole = getUserRole(req.operatorId);
  if (operatorRole !== 'FIELD_MANAGER') {
    throw new Error('只有场长可以审批');
  }

  const oldStatus = caseData.status;

  db.prepare(`
    UPDATE disease_cases
    SET status = 'APPROVED', current_handler_role = 'TECHNICIAN', updated_at = CURRENT_TIMESTAMP,
        approved_by = ?, approved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.operatorId, req.caseId);

  createAudit(req.caseId, req.operatorId, operatorRole, 'APPROVE', req.remark || '审批通过', oldStatus, 'APPROVED');

  return getDiseaseCaseById(req.caseId);
}

export function recordMedication(req: RecordMedicationRequest) {
  const caseData = db.prepare('SELECT * FROM disease_cases WHERE id = ?').get(req.caseId) as any;
  if (!caseData) throw new Error('病害单不存在');
  if (caseData.status !== 'APPROVED') {
    throw new Error(`当前状态 ${caseData.status} 不允许记录用药`);
  }

  const operatorRole = getUserRole(req.operatorId);
  if (operatorRole !== 'TECHNICIAN') {
    throw new Error('只有养殖技术员可以记录用药');
  }

  const oldStatus = caseData.status;
  const caseMedicines = db.prepare('SELECT * FROM disease_case_medicines WHERE disease_case_id = ?').all(req.caseId) as any[];

  const tx = db.transaction(() => {
    for (const cm of caseMedicines) {
      db.prepare(`
        INSERT INTO medication_records (id, disease_case_id, pond_id, medicine_id, quantity, operator_id, medication_date, usage_method, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        req.caseId,
        caseData.pond_id,
        cm.medicine_id,
        cm.actual_quantity,
        req.operatorId,
        req.medicationDate,
        cm.usage_method,
        req.notes || null
      );
    }

    db.prepare(`
      UPDATE disease_cases
      SET status = 'MEDICATED', current_handler_role = 'FIELD_MANAGER', updated_at = CURRENT_TIMESTAMP,
          medicated_by = ?, medicated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.operatorId, req.caseId);

    createAudit(req.caseId, req.operatorId, operatorRole, 'RECORD_MEDICATION', req.notes || '完成用药', oldStatus, 'MEDICATED');
  });

  tx();
  return getDiseaseCaseById(req.caseId);
}

export function closeDiseaseCase(caseId: string, operatorId: string, remark?: string) {
  const caseData = db.prepare('SELECT * FROM disease_cases WHERE id = ?').get(caseId) as any;
  if (!caseData) throw new Error('病害单不存在');
  if (caseData.status !== 'MEDICATED') {
    throw new Error(`当前状态 ${caseData.status} 不允许结案`);
  }

  const operatorRole = getUserRole(operatorId);
  if (operatorRole !== 'FIELD_MANAGER') {
    throw new Error('只有场长可以结案');
  }

  const oldStatus = caseData.status;

  db.prepare(`
    UPDATE disease_cases
    SET status = 'CLOSED', current_handler_role = 'TECHNICIAN', updated_at = CURRENT_TIMESTAMP,
        closed_by = ?, closed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(operatorId, caseId);

  createAudit(caseId, operatorId, operatorRole, 'CLOSE', remark || '结案归档', oldStatus, 'CLOSED');

  return getDiseaseCaseById(caseId);
}

export function getDiseaseCaseById(caseId: string) {
  const caseData = db.prepare('SELECT * FROM disease_cases WHERE id = ?').get(caseId) as any;
  if (!caseData) return null;

  const medicines = db.prepare(`
    SELECT dcm.*, m.name as medicine_name, m.specification, m.unit, m.manufacturer
    FROM disease_case_medicines dcm
    JOIN medicines m ON dcm.medicine_id = m.id
    WHERE dcm.disease_case_id = ?
  `).all(caseId);

  const audits = db.prepare(`
    SELECT dca.*, u.name as operator_name
    FROM disease_case_audits dca
    JOIN users u ON dca.operator_id = u.id
    WHERE dca.disease_case_id = ?
    ORDER BY dca.created_at ASC
  `).all(caseId);

  const reporter = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(caseData.reporter_id);
  const pond = db.prepare('SELECT * FROM ponds WHERE id = ?').get(caseData.pond_id);

  return { ...caseData, medicines, audits, reporter, pond };
}

export function getDiseaseCases(filters?: { status?: string; handlerRole?: string; pondId?: string }) {
  let sql = 'SELECT * FROM disease_cases WHERE 1=1';
  const params: any[] = [];

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters?.handlerRole) {
    sql += ' AND current_handler_role = ?';
    params.push(filters.handlerRole);
  }
  if (filters?.pondId) {
    sql += ' AND pond_id = ?';
    params.push(filters.pondId);
  }

  sql += ' ORDER BY updated_at DESC';

  const cases = db.prepare(sql).all(...params) as any[];
  return cases.map(c => {
    const reporter = db.prepare('SELECT name FROM users WHERE id = ?').get(c.reporter_id) as any;
    const pond = db.prepare('SELECT name FROM ponds WHERE id = ?').get(c.pond_id) as any;
    return { ...c, reporter_name: reporter?.name, pond_name: pond?.name };
  });
}

export function updateDiseaseCaseDraft(caseId: string, updates: Partial<CreateDiseaseCaseRequest> & { medicines?: { medicineId: string; suggestedQuantity: number; dosage?: string; usageMethod?: string }[] }) {
  const caseData = db.prepare('SELECT * FROM disease_cases WHERE id = ?').get(caseId) as any;
  if (!caseData) throw new Error('病害单不存在');
  if (!['DRAFT', 'REJECTED'].includes(caseData.status)) {
    throw new Error(`当前状态 ${caseData.status} 不允许修改`);
  }

  const tx = db.transaction(() => {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.diseaseName !== undefined) { fields.push('disease_name = ?'); params.push(updates.diseaseName); }
    if (updates.diseaseDescription !== undefined) { fields.push('disease_description = ?'); params.push(updates.diseaseDescription); }
    if (updates.severity !== undefined) { fields.push('severity = ?'); params.push(updates.severity); }
    if (updates.suggestedMedication !== undefined) { fields.push('suggested_medication = ?'); params.push(updates.suggestedMedication); }
    if (updates.pondId !== undefined) { fields.push('pond_id = ?'); params.push(updates.pondId); }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(caseId);
      db.prepare(`UPDATE disease_cases SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    }

    if (updates.medicines) {
      db.prepare('DELETE FROM disease_case_medicines WHERE disease_case_id = ?').run(caseId);
      for (const med of updates.medicines) {
        db.prepare(`
          INSERT INTO disease_case_medicines (id, disease_case_id, medicine_id, suggested_quantity, dosage, usage_method)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), caseId, med.medicineId, med.suggestedQuantity, med.dosage || null, med.usageMethod || null);
      }
    }

    createAudit(caseId, updates.reporterId || caseData.reporter_id, 'TECHNICIAN', 'UPDATE_DRAFT', caseData.status === 'REJECTED' ? '根据驳回意见补录修改' : '修改草稿', caseData.status, caseData.status);
  });

  tx();
  return getDiseaseCaseById(caseId);
}
