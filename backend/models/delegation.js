import db from './database.js';
import { canTransition } from './auth.js';

function generateDelegationNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `DEL-${year}${month}${day}-${random}`;
}

export const delegationService = {
  create(data, operator) {
    const delegationNumber = generateDelegationNumber();
    
    const stmt = db.prepare(`
      INSERT INTO delegations (
        delegation_number, status, applicant_name, applicant_organization,
        applicant_contact, applicant_id_card, case_type, case_description,
        incident_date, incident_location, appraisal_items, expected_completion_date,
        current_assignee, created_by, is_abnormal, abnormal_type, abnormal_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      delegationNumber,
      'PENDING_ACCEPTANCE',
      data.applicantName,
      data.applicantOrganization,
      data.applicantContact,
      data.applicantIdCard,
      data.caseType,
      data.caseDescription,
      data.incidentDate,
      data.incidentLocation,
      JSON.stringify(data.appraisalItems || []),
      data.expectedCompletionDate,
      operator.username,
      operator.username,
      data.isAbnormal ? 1 : 0,
      data.abnormalType || null,
      data.abnormalReason || null
    );

    const delegationId = result.lastInsertRowid;

    if (data.materials && data.materials.length > 0) {
      const materialStmt = db.prepare(`
        INSERT INTO materials (delegation_id, material_name, material_type, is_required, is_provided)
        VALUES (?, ?, ?, ?, ?)
      `);

      data.materials.forEach(material => {
        materialStmt.run(
          delegationId,
          material.name,
          material.type || '其他',
          material.required ? 1 : 0,
          material.provided ? 1 : 0
        );
      });
    }

    const auditStmt = db.prepare(`
      INSERT INTO audit_logs (delegation_id, action_type, previous_status, new_status, operator_username, operator_role, operator_name, remarks, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    auditStmt.run(
      delegationId,
      'CREATE',
      null,
      'PENDING_ACCEPTANCE',
      operator.username,
      operator.role,
      operator.name,
      '创建委托单',
      JSON.stringify({ delegationNumber })
    );

    return delegationId;
  },

  findAll(filters = {}) {
    let query = 'SELECT * FROM delegations WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.isAbnormal !== undefined) {
      query += ' AND is_abnormal = ?';
      params.push(filters.isAbnormal ? 1 : 0);
    }

    if (filters.currentAssignee) {
      query += ' AND current_assignee = ?';
      params.push(filters.currentAssignee);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      if (filters.page) {
        query += ' OFFSET ?';
        params.push((filters.page - 1) * filters.limit);
      }
    }

    return db.prepare(query).all(...params);
  },

  findById(id) {
    const delegation = db.prepare('SELECT * FROM delegations WHERE id = ?').get(id);
    if (!delegation) return null;

    delegation.appraisal_items = JSON.parse(delegation.appraisal_items || '[]');
    delegation.materials = db.prepare('SELECT * FROM materials WHERE delegation_id = ?').all(id);
    delegation.audit_logs = db.prepare('SELECT * FROM audit_logs WHERE delegation_id = ? ORDER BY operate_time DESC').all(id);
    
    delegation.audit_logs = delegation.audit_logs.map(log => ({
      ...log,
      details: JSON.parse(log.details || '{}')
    }));

    return delegation;
  },

  update(id, data, operator) {
    const delegation = this.findById(id);
    if (!delegation) {
      throw new Error('委托单不存在');
    }

    const updates = [];
    const params = [];

    if (data.applicantName !== undefined) {
      updates.push('applicant_name = ?');
      params.push(data.applicantName);
    }
    if (data.applicantOrganization !== undefined) {
      updates.push('applicant_organization = ?');
      params.push(data.applicantOrganization);
    }
    if (data.applicantContact !== undefined) {
      updates.push('applicant_contact = ?');
      params.push(data.applicantContact);
    }
    if (data.applicantIdCard !== undefined) {
      updates.push('applicant_id_card = ?');
      params.push(data.applicantIdCard);
    }
    if (data.caseType !== undefined) {
      updates.push('case_type = ?');
      params.push(data.caseType);
    }
    if (data.caseDescription !== undefined) {
      updates.push('case_description = ?');
      params.push(data.caseDescription);
    }
    if (data.incidentDate !== undefined) {
      updates.push('incident_date = ?');
      params.push(data.incidentDate);
    }
    if (data.incidentLocation !== undefined) {
      updates.push('incident_location = ?');
      params.push(data.incidentLocation);
    }
    if (data.appraisalItems !== undefined) {
      updates.push('appraisal_items = ?');
      params.push(JSON.stringify(data.appraisalItems));
    }
    if (data.expectedCompletionDate !== undefined) {
      updates.push('expected_completion_date = ?');
      params.push(data.expectedCompletionDate);
    }
    if (data.currentAssignee !== undefined) {
      updates.push('current_assignee = ?');
      params.push(data.currentAssignee);
    }
    if (data.isAbnormal !== undefined) {
      updates.push('is_abnormal = ?');
      params.push(data.isAbnormal ? 1 : 0);
    }
    if (data.abnormalType !== undefined) {
      updates.push('abnormal_type = ?');
      params.push(data.abnormalType);
    }
    if (data.abnormalReason !== undefined) {
      updates.push('abnormal_reason = ?');
      params.push(data.abnormalReason);
    }

    if (updates.length === 0) return delegation;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    const query = `UPDATE delegations SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...params);

    if (data.materials !== undefined) {
      db.prepare('DELETE FROM materials WHERE delegation_id = ?').run(id);
      
      const materialStmt = db.prepare(`
        INSERT INTO materials (delegation_id, material_name, material_type, is_required, is_provided)
        VALUES (?, ?, ?, ?, ?)
      `);

      data.materials.forEach(material => {
        materialStmt.run(
          id,
          material.name,
          material.type || '其他',
          material.required ? 1 : 0,
          material.provided ? 1 : 0
        );
      });

      const auditStmt = db.prepare(`
        INSERT INTO audit_logs (delegation_id, action_type, operator_username, operator_role, operator_name, remarks, details)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      auditStmt.run(
        id,
        'MATERIAL_UPDATE',
        operator.username,
        operator.role,
        operator.name,
        '更新材料清单',
        JSON.stringify({ materials: data.materials })
      );
    }

    return this.findById(id);
  },

  updateStatus(id, newStatus, remarks, operator) {
    const delegation = this.findById(id);
    if (!delegation) {
      throw new Error('委托单不存在');
    }

    if (!canTransition(delegation.status, newStatus, operator.role)) {
      throw new Error(`不允许从状态 [${delegation.status}] 转换到 [${newStatus}]`);
    }

    let currentAssignee = delegation.current_assignee;
    let isAbnormal = delegation.is_abnormal;
    let abnormalType = delegation.abnormal_type;
    let abnormalReason = delegation.abnormal_reason;
    let completionDate = delegation.completion_date;

    switch (newStatus) {
      case 'MATERIAL_VERIFICATION':
        currentAssignee = 'appraiser01';
        break;
      case 'QC_REVIEW_PENDING':
        currentAssignee = 'qc01';
        break;
      case 'COMPLETED':
        completionDate = new Date().toISOString();
        isAbnormal = 0;
        break;
      case 'MATERIAL_INCOMPLETE':
        isAbnormal = 1;
        abnormalType = '缺材料';
        abnormalReason = remarks;
        break;
      case 'VERIFICATION_FAILED':
        isAbnormal = 1;
        abnormalType = '核验不通过';
        abnormalReason = remarks;
        break;
      case 'QC_REJECTED':
        isAbnormal = 1;
        abnormalType = '复核不通过';
        abnormalReason = remarks;
        break;
      case 'ON_HOLD':
        isAbnormal = 1;
        abnormalType = '超时';
        abnormalReason = remarks;
        break;
      default:
        if (delegation.is_abnormal && ['MATERIAL_VERIFICATION', 'ACCEPTANCE_IN_PROGRESS', 'PENDING_ACCEPTANCE'].includes(newStatus)) {
          isAbnormal = 0;
          abnormalType = null;
          abnormalReason = null;
        }
    }

    const query = `
      UPDATE delegations 
      SET status = ?, current_assignee = ?, is_abnormal = ?, abnormal_type = ?, abnormal_reason = ?, 
          completion_date = ?, updated_at = ?
      WHERE id = ?
    `;

    db.prepare(query).run(
      newStatus,
      currentAssignee,
      isAbnormal,
      abnormalType,
      abnormalReason,
      completionDate,
      new Date().toISOString(),
      id
    );

    const auditStmt = db.prepare(`
      INSERT INTO audit_logs (delegation_id, action_type, previous_status, new_status, operator_username, operator_role, operator_name, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    auditStmt.run(
      id,
      'STATUS_CHANGE',
      delegation.status,
      newStatus,
      operator.username,
      operator.role,
      operator.name,
      remarks || ''
    );

    return this.findById(id);
  }
};

export const materialService = {
  updateVerification(id, verificationStatus, verificationNotes, operator) {
    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(id);
    if (!material) {
      throw new Error('材料不存在');
    }

    const verifiedAt = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE materials 
      SET verification_status = ?, verification_notes = ?, verified_by = ?, verified_at = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      verificationStatus,
      verificationNotes,
      operator.username,
      verifiedAt,
      verifiedAt,
      id
    );

    const auditStmt = db.prepare(`
      INSERT INTO audit_logs (delegation_id, action_type, operator_username, operator_role, operator_name, remarks, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const details = {
      materialId: id,
      materialName: material.material_name,
      status: verificationStatus,
      notes: verificationNotes,
      verifiedBy: operator.username,
      verifiedAt: verifiedAt
    };

    auditStmt.run(
      material.delegation_id,
      'VERIFY',
      operator.username,
      operator.role,
      operator.name,
      `核验材料：${material.material_name} - ${verificationStatus === 'passed' ? '通过' : '不通过'}`,
      JSON.stringify(details)
    );

    return db.prepare('SELECT * FROM materials WHERE id = ?').get(id);
  },

  findByDelegationId(delegationId) {
    return db.prepare('SELECT * FROM materials WHERE delegation_id = ?').all(delegationId);
  }
};
