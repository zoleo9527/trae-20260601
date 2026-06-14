import db from '$lib/server/db.js';
import { v4 as uuidv4 } from 'uuid';

export function createSample(sampleData) {
  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO samples (
      id, case_number, case_name, client_name, client_phone,
      sample_type, sample_count, sample_description, priority, due_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const daysMap = {
    low: '+30 days',
    normal: '+14 days',
    high: '+7 days',
    urgent: '+3 days'
  };

  stmt.run(
    id,
    sampleData.caseNumber,
    sampleData.caseName,
    sampleData.clientName,
    sampleData.clientPhone,
    sampleData.sampleType,
    sampleData.sampleCount || 1,
    sampleData.sampleDescription,
    sampleData.priority || 'normal',
    daysMap[sampleData.priority] || '+14 days'
  );

  addFlowRecord(id, 'pending', 'pending', 'receive', sampleData.operatorId, sampleData.operatorName, sampleData.operatorRole, '创建样本登记');

  return id;
}

export function getSampleById(id) {
  const sample = db.prepare(`
    SELECT s.*, u.real_name as appraiser_name
    FROM samples s
    LEFT JOIN users u ON s.assigned_appraiser_id = u.id
    WHERE s.id = ?
  `).get(id);

  if (!sample) return null;

  return {
    ...sample,
    flows: getSampleFlows(id)
  };
}

export function getAllSamples(filters = {}) {
  let query = `
    SELECT s.*, u.real_name as appraiser_name
    FROM samples s
    LEFT JOIN users u ON s.assigned_appraiser_id = u.id
    WHERE 1=1
  `;
  
  const params = [];

  if (filters.status) {
    query += ' AND s.reception_status = ?';
    params.push(filters.status);
  }

  if (filters.priority) {
    query += ' AND s.priority = ?';
    params.push(filters.priority);
  }

  if (filters.assignedAppraiserId) {
    query += ' AND s.assigned_appraiser_id = ?';
    params.push(filters.assignedAppraiserId);
  }

  if (filters.keyword) {
    query += ' AND (s.case_number LIKE ? OR s.case_name LIKE ? OR s.client_name LIKE ?)';
    const kw = `%${filters.keyword}%`;
    params.push(kw, kw, kw);
  }

  query += ' ORDER BY s.created_at DESC';

  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  return db.prepare(query).all(...params);
}

export function updateSampleStatus(sampleId, newStatus, operatorId, operatorName, operatorRole, remarks, actionType) {
  const sample = db.prepare('SELECT * FROM samples WHERE id = ?').get(sampleId);
  if (!sample) {
    throw new Error('样本不存在');
  }

  const oldStatus = sample.reception_status;
  
  let updateFields = 'reception_status = ?, updated_at = CURRENT_TIMESTAMP';
  let updateParams = [newStatus];
  
  if (actionType === 'receive') {
    updateFields += ', accepted_by = ?, accepted_at = CURRENT_TIMESTAMP';
    updateParams.push(operatorId);
  }
  
  updateParams.push(sampleId);
  
  db.prepare(`UPDATE samples SET ${updateFields} WHERE id = ?`)
    .run(...updateParams);

  addFlowRecord(sampleId, oldStatus, newStatus, actionType, operatorId, operatorName, operatorRole, remarks);

  return true;
}

export function assignAppraiser(sampleId, appraiserId, operatorId, operatorName, operatorRole, remarks) {
  const sample = db.prepare('SELECT * FROM samples WHERE id = ?').get(sampleId);
  if (!sample) {
    throw new Error('样本不存在');
  }

  const appraiser = db.prepare('SELECT real_name FROM users WHERE id = ?').get(appraiserId);
  
  db.prepare('UPDATE samples SET assigned_appraiser_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(appraiserId, sampleId);

  addFlowRecord(sampleId, sample.reception_status, sample.reception_status, 'assign', operatorId, operatorName, operatorRole, remarks || `分配给 ${appraiser?.real_name || '鉴定人'}`);

  return true;
}

export function addFlowRecord(sampleId, fromStatus, toStatus, actionType, operatorId, operatorName, operatorRole, remarks, attachments = null) {
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO sample_flows (id, sample_id, from_status, to_status, action_type, operator_id, operator_name, operator_role, remarks, attachments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, sampleId, fromStatus, toStatus, actionType, operatorId, operatorName, operatorRole, remarks, attachments ? JSON.stringify(attachments) : null);

  return id;
}

export function getSampleFlows(sampleId) {
  return db.prepare('SELECT * FROM sample_flows WHERE sample_id = ? ORDER BY created_at DESC').all(sampleId);
}

export function getSampleFlowsDetailed(sampleId) {
  const flows = db.prepare('SELECT * FROM sample_flows WHERE sample_id = ? ORDER BY created_at ASC').all(sampleId);
  
  return flows.map(flow => {
    const attachments = flow.attachments ? JSON.parse(flow.attachments) : null;
    return {
      ...flow,
      attachments
    };
  });
}

export function createSupplementaryRequest(sampleId, data) {
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO supplementary_requests (id, sample_id, requested_by, requested_by_name, reason, required_items, due_date)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+7 days'))
  `).run(id, sampleId, data.requestedBy, data.requestedByName, data.reason, data.requiredItems);

  updateSampleStatus(sampleId, 'supplementary', data.requestedBy, data.requestedByName, data.operatorRole, data.reason, 'supplementary');

  addFlowRecord(sampleId, 'processing', 'supplementary', 'supplementary', data.requestedBy, data.requestedByName, data.operatorRole, `发起补充材料请求：${data.reason}`, null);

  return id;
}

export function getSupplementaryRequests(sampleId) {
  return db.prepare('SELECT * FROM supplementary_requests WHERE sample_id = ? ORDER BY created_at DESC').all(sampleId);
}

export function updateSupplementaryStatus(requestId, status, operatorId, operatorName) {
  db.prepare('UPDATE supplementary_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status, requestId);

  if (status === 'received') {
    const request = db.prepare('SELECT sample_id FROM supplementary_requests WHERE id = ?').get(requestId);
    if (request) {
      updateSampleStatus(request.sample_id, 'processing', operatorId, operatorName, 'appraiser', '补充材料已收到', 'supplementary');
    }
  }

  return true;
}

export function getAllAppraisers() {
  return db.prepare("SELECT id, username, real_name, department FROM users WHERE role = 'appraiser'").all();
}

export function getStatistics() {
  const total = db.prepare('SELECT COUNT(*) as count FROM samples').get().count;
  const pending = db.prepare("SELECT COUNT(*) as count FROM samples WHERE reception_status = 'pending'").get().count;
  const processing = db.prepare("SELECT COUNT(*) as count FROM samples WHERE reception_status = 'processing'").get().count;
  const completed = db.prepare("SELECT COUNT(*) as count FROM samples WHERE reception_status = 'completed'").get().count;
  const supplementary = db.prepare("SELECT COUNT(*) as count FROM samples WHERE reception_status = 'supplementary'").get().count;
  const urgent = db.prepare("SELECT COUNT(*) as count FROM samples WHERE priority = 'urgent' AND reception_status NOT IN ('completed', 'returned')").get().count;

  const today = new Date().toISOString().split('T')[0];
  const dueSoon = db.prepare(`
    SELECT COUNT(*) as count FROM samples 
    WHERE date(due_date) <= date('now', '+3 days') 
    AND reception_status NOT IN ('completed', 'returned')
  `).get().count;

  const overdue = db.prepare(`
    SELECT COUNT(*) as count FROM samples 
    WHERE date(due_date) < date('now') 
    AND reception_status NOT IN ('completed', 'returned')
  `).get().count;

  const abnormalities = db.prepare("SELECT COUNT(*) as count FROM sample_abnormalities WHERE status IN ('pending', 'handling')").get().count;

  return {
    total,
    pending,
    processing,
    completed,
    supplementary,
    urgent,
    dueSoon,
    overdue,
    abnormalities
  };
}

export function getRoleSpecificData(userId, role) {
  let urgentSamples = [];
  let myTasks = [];
  let reminders = [];

  if (role === 'acceptor') {
    urgentSamples = db.prepare(`
      SELECT s.*, u.real_name as appraiser_name,
        CASE 
          WHEN date(s.due_date) < date('now') THEN 'overdue'
          WHEN date(s.due_date) <= date('now', '+1 day') THEN 'critical'
          WHEN date(s.due_date) <= date('now', '+3 days') THEN 'urgent'
          ELSE 'normal'
        END as urgency_level
      FROM samples s
      LEFT JOIN users u ON s.assigned_appraiser_id = u.id
      WHERE s.reception_status = 'pending'
      ORDER BY 
        CASE WHEN s.priority = 'urgent' THEN 0
             WHEN s.priority = 'high' THEN 1
             ELSE 2 END,
        s.due_date ASC
    `).all();

    myTasks = db.prepare(`
      SELECT s.*, u.real_name as appraiser_name
      FROM samples s
      LEFT JOIN users u ON s.assigned_appraiser_id = u.id
      WHERE s.reception_status IN ('pending', 'received')
      AND (s.assigned_appraiser_id IS NULL OR s.accepted_by = ?)
      ORDER BY s.created_at DESC
      LIMIT 20
    `).all(userId);

    reminders = db.prepare(`
      SELECT r.*, s.case_number, s.case_name
      FROM urgency_reminders r
      JOIN samples s ON r.sample_id = s.id
      WHERE r.target_user_id = ? AND r.is_acknowledged = 0
      ORDER BY r.created_at DESC
    `).all(userId);
  } else if (role === 'appraiser') {
    urgentSamples = db.prepare(`
      SELECT s.*, u.real_name as appraiser_name,
        CASE 
          WHEN date(s.due_date) < date('now') THEN 'overdue'
          WHEN date(s.due_date) <= date('now', '+1 day') THEN 'critical'
          WHEN date(s.due_date) <= date('now', '+3 days') THEN 'urgent'
          ELSE 'normal'
        END as urgency_level
      FROM samples s
      LEFT JOIN users u ON s.assigned_appraiser_id = u.id
      WHERE s.assigned_appraiser_id = ?
      AND s.reception_status NOT IN ('completed', 'returned')
      ORDER BY 
        CASE WHEN s.priority = 'urgent' THEN 0
             WHEN s.priority = 'high' THEN 1
             ELSE 2 END,
        s.due_date ASC
    `).all(userId);

    myTasks = db.prepare(`
      SELECT s.*, u.real_name as appraiser_name
      FROM samples s
      LEFT JOIN users u ON s.assigned_appraiser_id = u.id
      WHERE s.assigned_appraiser_id = ?
      AND s.reception_status IN ('received', 'processing', 'supplementary')
      ORDER BY s.due_date ASC
      LIMIT 20
    `).all(userId);

    reminders = db.prepare(`
      SELECT r.*, s.case_number, s.case_name
      FROM urgency_reminders r
      JOIN samples s ON r.sample_id = s.id
      WHERE r.target_user_id = ? AND r.is_acknowledged = 0
      ORDER BY r.created_at DESC
    `).all(userId);
  } else if (role === 'quality_controller') {
    urgentSamples = db.prepare(`
      SELECT s.*, u.real_name as appraiser_name,
        CASE 
          WHEN date(s.due_date) < date('now') THEN 'overdue'
          WHEN date(s.due_date) <= date('now', '+1 day') THEN 'critical'
          WHEN date(s.due_date) <= date('now', '+3 days') THEN 'urgent'
          ELSE 'normal'
        END as urgency_level
      FROM samples s
      LEFT JOIN users u ON s.assigned_appraiser_id = u.id
      WHERE s.reception_status = 'processing'
      AND EXISTS (
        SELECT 1 FROM opinion_documents od 
        WHERE od.sample_id = s.id 
        AND od.status = 'reviewing'
      )
      ORDER BY s.due_date ASC
    `).all();

    myTasks = db.prepare(`
      SELECT s.*, u.real_name as appraiser_name,
        od.id as document_id, od.version_number, od.document_title, od.status as doc_status
      FROM samples s
      LEFT JOIN users u ON s.assigned_appraiser_id = u.id
      JOIN opinion_documents od ON od.sample_id = s.id
      WHERE od.status = 'reviewing'
      ORDER BY s.due_date ASC
      LIMIT 20
    `).all();

    reminders = db.prepare(`
      SELECT r.*, s.case_number, s.case_name
      FROM urgency_reminders r
      JOIN samples s ON r.sample_id = s.id
      WHERE r.target_user_id = ? AND r.is_acknowledged = 0
      ORDER BY r.created_at DESC
    `).all(userId);
  }

  return {
    urgentSamples,
    myTasks,
    reminders
  };
}

export function addReceptionCheck(sampleId, checkItem, checkResult, remarks, operatorId, operatorName) {
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO sample_reception_checks (id, sample_id, check_item, check_result, remarks, checked_by, checked_by_name)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, sampleId, checkItem, checkResult, remarks, operatorId, operatorName);

  addFlowRecord(sampleId, 'pending', 'pending', 'receive', operatorId, operatorName, 'acceptor', `检查项：${checkItem} - ${checkResult === 'pass' ? '通过' : '不合格'}`);

  return id;
}

export function getReceptionChecks(sampleId) {
  return db.prepare('SELECT * FROM sample_reception_checks WHERE sample_id = ? ORDER BY checked_at ASC').all(sampleId);
}

export function addSamplePhoto(sampleId, photoType, photoPath, description, operatorId, operatorName) {
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO sample_photos (id, sample_id, photo_type, photo_path, description, uploaded_by, uploaded_by_name)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, sampleId, photoType, photoPath, description, operatorId, operatorName);

  addFlowRecord(sampleId, 'pending', 'pending', 'receive', operatorId, operatorName, 'acceptor', `上传照片：${photoType}`);

  return id;
}

export function getSamplePhotos(sampleId) {
  return db.prepare('SELECT * FROM sample_photos WHERE sample_id = ? ORDER BY uploaded_at DESC').all(sampleId);
}

export function reportAbnormality(sampleId, abnormalityType, description, severity, operatorId, operatorName) {
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO sample_abnormalities (id, sample_id, abnormality_type, description, severity, reported_by, reported_by_name)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, sampleId, abnormalityType, description, severity, operatorId, operatorName);

  addFlowRecord(sampleId, 'pending', 'pending', 'receive', operatorId, operatorName, 'acceptor', `报告异常：${abnormalityType} - ${description}`);

  return id;
}

export function getAbnormalities(sampleId) {
  return db.prepare('SELECT * FROM sample_abnormalities WHERE sample_id = ? ORDER BY created_at DESC').all(sampleId);
}

export function handleAbnormality(abnormalityId, handlingResult, operatorId, operatorName) {
  db.prepare(`
    UPDATE sample_abnormalities 
    SET status = 'resolved', handled_by = ?, handled_by_name = ?, handling_result = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(operatorId, operatorName, handlingResult, abnormalityId);

  const abnormality = db.prepare('SELECT sample_id FROM sample_abnormalities WHERE id = ?').get(abnormalityId);
  if (abnormality) {
    addFlowRecord(abnormality.sample_id, 'pending', 'pending', 'receive', operatorId, operatorName, 'acceptor', `处理异常：${handlingResult}`);
  }

  return true;
}

export function createOpinionDocument(sampleId, documentTitle, documentContent, operatorId, operatorName) {
  const id = uuidv4();
  
  const latestVersion = db.prepare(`
    SELECT MAX(version_number) as max_version FROM opinion_documents WHERE sample_id = ?
  `).get(sampleId);
  
  const versionNumber = (latestVersion?.max_version || 0) + 1;

  db.prepare(`
    INSERT INTO opinion_documents (id, sample_id, version_number, document_title, document_content, created_by, created_by_name)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, sampleId, versionNumber, documentTitle, documentContent, operatorId, operatorName);

  addFlowRecord(sampleId, 'processing', 'processing', 'process', operatorId, operatorName, 'appraiser', `创建意见书版本 ${versionNumber}`);

  return id;
}

export function getOpinionDocuments(sampleId) {
  return db.prepare(`
    SELECT od.*, 
      u1.real_name as created_by_name,
      u2.real_name as reviewed_by_name
    FROM opinion_documents od
    LEFT JOIN users u1 ON od.created_by = u1.id
    LEFT JOIN users u2 ON od.reviewed_by = u2.id
    WHERE od.sample_id = ?
    ORDER BY od.version_number DESC
  `).all(sampleId);
}

export function submitOpinionDocumentForReview(documentId, operatorId, operatorName) {
  db.prepare(`
    UPDATE opinion_documents 
    SET status = 'reviewing', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(documentId);

  const doc = db.prepare('SELECT sample_id, version_number FROM opinion_documents WHERE id = ?').get(documentId);
  if (doc) {
    addFlowRecord(doc.sample_id, 'processing', 'processing', 'quality_check', operatorId, operatorName, 'appraiser', `提交意见书版本 ${doc.version_number} 审核`);
  }

  return true;
}

export function reviewOpinionDocument(documentId, status, reviewComments, operatorId, operatorName) {
  db.prepare(`
    UPDATE opinion_documents 
    SET status = ?, review_comments = ?, reviewed_by = ?, reviewed_by_name = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, reviewComments, operatorId, operatorName, documentId);

  const doc = db.prepare('SELECT sample_id, version_number FROM opinion_documents WHERE id = ?').get(documentId);
  if (doc) {
    addFlowRecord(doc.sample_id, 'processing', 'processing', 'quality_check', operatorId, operatorName, 'quality_controller', 
      `审核意见书版本 ${doc.version_number} - ${status === 'approved' ? '通过' : status === 'rejected' ? '驳回' : '待修改'}`);
  }

  return true;
}

export function createUrgencyReminder(sampleId, reminderType, title, message, targetUserId, operatorId, operatorName) {
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO urgency_reminders (id, sample_id, reminder_type, title, message, target_user_id, created_by, created_by_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, sampleId, reminderType, title, message, targetUserId, operatorId, operatorName);

  addFlowRecord(sampleId, 'pending', 'pending', 'supplementary', operatorId, operatorName, 'appraiser', `发送催办：${title}`);

  return id;
}

export function getUrgencyReminders(userId) {
  return db.prepare(`
    SELECT r.*, s.case_number, s.case_name
    FROM urgency_reminders r
    JOIN samples s ON r.sample_id = s.id
    WHERE r.target_user_id = ? AND r.is_acknowledged = 0
    ORDER BY r.created_at DESC
  `).all(userId);
}

export function acknowledgeReminder(reminderId) {
  db.prepare(`
    UPDATE urgency_reminders 
    SET is_acknowledged = 1, acknowledged_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(reminderId);

  return true;
}

export function getOverdueSamples() {
  return db.prepare(`
    SELECT s.*, u.real_name as appraiser_name,
      CAST((julianday('now') - julianday(s.due_date)) AS INTEGER) as days_overdue
    FROM samples s
    LEFT JOIN users u ON s.assigned_appraiser_id = u.id
    WHERE date(s.due_date) < date('now')
    AND s.reception_status NOT IN ('completed', 'returned')
    ORDER BY s.due_date ASC
  `).all();
}
