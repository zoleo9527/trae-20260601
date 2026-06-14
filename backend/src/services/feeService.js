const { getDB, newId, assertFound, logOperation } = require('../db');
const { AppError } = require('../errors');
const {
  FEE_STATUS_TRANSITIONS,
  canTransition,
} = require('../statusConstraints');
const { checkPermission, getFeeTypeName } = require('./userService');

function createFeeRecord(data, operatorId) {
  const dbi = getDB();
  const operator = checkPermission(operatorId, 'fees', 'create');

  if (!data.student_id || !data.type || !data.amount) {
    throw new AppError('VALIDATION_ERROR', {
      required: ['student_id', 'type', 'amount'],
    });
  }

  const id = newId();
  dbi.prepare(`
    INSERT INTO fee_records
    (id, student_id, type, amount, paid_amount, status, related_id, remark, created_by)
    VALUES (?, ?, ?, ?, 0, 'unpaid', ?, ?, ?)
  `).run(
    id,
    data.student_id,
    data.type,
    data.amount,
    data.related_id || null,
    data.remark || null,
    operatorId
  );

  logOperation({
    operatorId,
    operatorName: operator.name,
    operatorRole: operator.role,
    action: 'create',
    targetType: 'fee_record',
    targetId: id,
    detail: `创建费用记录: ${getFeeTypeName(data.type)} ¥${data.amount}`,
  });

  return getFeeRecordDetail(id);
}

function listFeeRecords(params = {}) {
  const dbi = getDB();
  const { status, type, student_id, offset = 0, limit = 20 } = params;

  let sql = `
    SELECT fr.*, s.name as student_name, s.phone as student_phone,
           u.name as created_by_name
    FROM fee_records fr
    JOIN students s ON fr.student_id = s.id
    JOIN users u ON fr.created_by = u.id
    WHERE 1=1
  `;
  let countSql = 'SELECT COUNT(*) as total FROM fee_records WHERE 1=1';
  const paramsArr = [];
  const countParams = [];

  if (status) {
    sql += ' AND fr.status = ?';
    countSql += ' AND status = ?';
    paramsArr.push(status);
    countParams.push(status);
  }
  if (type) {
    sql += ' AND fr.type = ?';
    countSql += ' AND type = ?';
    paramsArr.push(type);
    countParams.push(type);
  }
  if (student_id) {
    sql += ' AND fr.student_id = ?';
    countSql += ' AND student_id = ?';
    paramsArr.push(student_id);
    countParams.push(student_id);
  }

  sql += ' ORDER BY fr.created_at DESC LIMIT ? OFFSET ?';
  paramsArr.push(limit, offset);

  const { total } = dbi.prepare(countSql).get(...countParams);
  const list = dbi.prepare(sql).all(...paramsArr);

  return {
    total,
    list: list.map(f => enrichFeeRecord(f)),
  };
}

function getFeeRecordDetail(id) {
  const dbi = getDB();
  const fee = dbi.prepare(`
    SELECT fr.*, s.name as student_name, s.phone as student_phone,
           u.name as created_by_name
    FROM fee_records fr
    JOIN students s ON fr.student_id = s.id
    JOIN users u ON fr.created_by = u.id
    WHERE fr.id = ?
  `).get(id);

  assertFound(fee, 'FEE_RECORD_NOT_FOUND');

  return enrichFeeRecord(fee);
}

function recordPayment(id, data, operatorId) {
  const dbi = getDB();
  const operator = checkPermission(operatorId, 'fees', 'update');
  const fee = assertFound(dbi.prepare('SELECT * FROM fee_records WHERE id = ?').get(id), 'FEE_RECORD_NOT_FOUND');

  const { amount } = data;
  if (!amount || amount <= 0) {
    throw new AppError('VALIDATION_ERROR', { required: ['amount'] });
  }

  const newPaidAmount = Math.min(fee.paid_amount + amount, fee.amount);
  let newStatus = fee.status;

  if (newPaidAmount >= fee.amount) {
    newStatus = 'paid';
  } else if (newPaidAmount > 0) {
    newStatus = 'partial';
  }

  if (!canTransition(FEE_STATUS_TRANSITIONS, fee.status, newStatus, operator.role)) {
    throw new AppError('INVALID_STATUS_TRANSITION', {
      from: fee.status,
      to: newStatus,
      role: operator.role,
    });
  }

  dbi.prepare(`
    UPDATE fee_records SET
      paid_amount = ?,
      status = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(newPaidAmount, newStatus, id);

  logOperation({
    operatorId,
    operatorName: operator.name,
    operatorRole: operator.role,
    action: 'record_payment',
    targetType: 'fee_record',
    targetId: id,
    fromStatus: fee.status,
    toStatus: newStatus,
    detail: `登记缴费: ¥${amount}，已缴: ¥${newPaidAmount}/${fee.amount}`,
  });

  return getFeeRecordDetail(id);
}

function enrichFeeRecord(f) {
  return {
    ...f,
    type_name: getFeeTypeName(f.type),
    status_name: FEE_STATUS_TRANSITIONS[f.status]?.description || f.status,
    remaining_amount: f.amount - f.paid_amount,
    is_paid: f.status === 'paid',
  };
}

module.exports = {
  createFeeRecord,
  listFeeRecords,
  getFeeRecordDetail,
  recordPayment,
  enrichFeeRecord,
};
