import { get } from 'svelte/store';
import { oilIntakeRecords, generateId, addLog, currentRole } from '$lib/stores';

export const WorkflowStatus = {
  DRAFT: 'draft',
  PENDING_MANAGER_APPROVAL: 'pending_manager_approval',
  PENDING_CASHIER: 'pending_cashier',
  PENDING_MEASURER: 'pending_measurer',
  MANAGER_REVIEW: 'manager_review',
  RETURNED: 'returned',
  SUPPLEMENTARY: 'supplementary',
  COMPLETED: 'completed',
  CLOSED: 'closed'
};

export const WorkflowActions = {
  SUBMIT_FOR_APPROVAL: 'submit_for_approval',
  MANAGER_APPROVE: 'manager_approve',
  MANAGER_RETURN: 'manager_return',
  CASHIER_ENTER: 'cashier_enter',
  MEASURER_VERIFY: 'measurer_verify',
  MEASURER_FLAG_DISPUTE: 'measurer_flag_dispute',
  MANAGER_FINAL_REVIEW: 'manager_final_review',
  SUPPLEMENT_INFO: 'supplement_info',
  CLOSE: 'close',
  REOPEN: 'reopen'
};

const workflowTransitions = {
  [WorkflowStatus.DRAFT]: {
    [WorkflowActions.SUBMIT_FOR_APPROVAL]: WorkflowStatus.PENDING_MANAGER_APPROVAL
  },
  [WorkflowStatus.PENDING_MANAGER_APPROVAL]: {
    [WorkflowActions.MANAGER_APPROVE]: WorkflowStatus.PENDING_CASHIER,
    [WorkflowActions.MANAGER_RETURN]: WorkflowStatus.RETURNED
  },
  [WorkflowStatus.PENDING_CASHIER]: {
    [WorkflowActions.CASHIER_ENTER]: WorkflowStatus.PENDING_MEASURER
  },
  [WorkflowStatus.PENDING_MEASURER]: {
    [WorkflowActions.MEASURER_VERIFY]: WorkflowStatus.MANAGER_REVIEW,
    [WorkflowActions.MEASURER_FLAG_DISPUTE]: WorkflowStatus.MANAGER_REVIEW
  },
  [WorkflowStatus.MANAGER_REVIEW]: {
    [WorkflowActions.MANAGER_FINAL_REVIEW]: WorkflowStatus.COMPLETED,
    [WorkflowActions.MANAGER_RETURN]: WorkflowStatus.SUPPLEMENTARY
  },
  [WorkflowStatus.RETURNED]: {
    [WorkflowActions.SUPPLEMENT_INFO]: WorkflowStatus.PENDING_MANAGER_APPROVAL
  },
  [WorkflowStatus.SUPPLEMENTARY]: {
    [WorkflowActions.SUPPLEMENT_INFO]: WorkflowStatus.MANAGER_REVIEW
  },
  [WorkflowStatus.COMPLETED]: {
    [WorkflowActions.CLOSE]: WorkflowStatus.CLOSED
  },
  [WorkflowStatus.CLOSED]: {
    [WorkflowActions.REOPEN]: WorkflowStatus.MANAGER_REVIEW
  }
};

export function canPerformAction(record, action) {
  const currentStatus = record.status;
  const allowedTransitions = workflowTransitions[currentStatus];
  if (!allowedTransitions) return false;
  return action in allowedTransitions;
}

export function getNextStatus(currentStatus, action) {
  const allowedTransitions = workflowTransitions[currentStatus];
  if (!allowedTransitions || !(action in allowedTransitions)) {
    return null;
  }
  return allowedTransitions[action];
}

export function getAvailableActions(record) {
  const role = get(currentRole);
  const status = record.status;
  const actions = [];
  
  if (status === WorkflowStatus.DRAFT) {
    actions.push({ action: WorkflowActions.SUBMIT_FOR_APPROVAL, label: '提交审核', role: 'manager' });
  }
  
  if (status === WorkflowStatus.PENDING_MANAGER_APPROVAL && role === 'manager') {
    actions.push({ action: WorkflowActions.MANAGER_APPROVE, label: '审核通过', style: 'primary' });
    actions.push({ action: WorkflowActions.MANAGER_RETURN, label: '退回修改', style: 'danger' });
  }
  
  if (status === WorkflowStatus.PENDING_CASHIER && role === 'cashier') {
    actions.push({ action: WorkflowActions.CASHIER_ENTER, label: '录入收银数据', style: 'primary' });
  }
  
  if (status === WorkflowStatus.PENDING_MEASURER && role === 'measurer') {
    actions.push({ action: WorkflowActions.MEASURER_VERIFY, label: '校验通过', style: 'primary' });
    actions.push({ action: WorkflowActions.MEASURER_FLAG_DISPUTE, label: '标记差异/争议', style: 'warning' });
  }
  
  if (status === WorkflowStatus.MANAGER_REVIEW && role === 'manager') {
    actions.push({ action: WorkflowActions.MANAGER_FINAL_REVIEW, label: '最终确认完成', style: 'success' });
    actions.push({ action: WorkflowActions.MANAGER_RETURN, label: '退回补充', style: 'danger' });
  }
  
  if (status === WorkflowStatus.RETURNED) {
    actions.push({ action: WorkflowActions.SUPPLEMENT_INFO, label: '补充后重新提交', style: 'primary' });
  }
  
  if (status === WorkflowStatus.SUPPLEMENTARY) {
    actions.push({ action: WorkflowActions.SUPPLEMENT_INFO, label: '补充后提交复核', style: 'primary' });
  }
  
  if (status === WorkflowStatus.COMPLETED && role === 'manager') {
    actions.push({ action: WorkflowActions.CLOSE, label: '关闭单据', style: 'secondary' });
  }
  
  if (status === WorkflowStatus.CLOSED && role === 'manager') {
    actions.push({ action: WorkflowActions.REOPEN, label: '重新打开', style: 'secondary' });
  }
  
  return actions;
}

export function performAction(recordId, action, data = {}) {
  const records = get(oilIntakeRecords);
  const index = records.findIndex(r => r.id === recordId);
  if (index === -1) return null;
  
  const record = records[index];
  const nextStatus = getNextStatus(record.status, action);
  if (!nextStatus) return null;
  
  const role = get(currentRole);
  const timestamp = new Date().toISOString();
  
  const updatedRecord = {
    ...record,
    status: nextStatus,
    updatedAt: timestamp,
    ...data
  };
  
  if (action === WorkflowActions.MANAGER_APPROVE) {
    updatedRecord.managerApprovedAt = timestamp;
    updatedRecord.managerApprovedBy = role;
  }
  
  if (action === WorkflowActions.CASHIER_ENTER) {
    updatedRecord.cashierEnteredAt = timestamp;
    updatedRecord.cashierEnteredBy = role;
  }
  
  if (action === WorkflowActions.MEASURER_VERIFY || action === WorkflowActions.MEASURER_FLAG_DISPUTE) {
    updatedRecord.measurerVerifiedAt = timestamp;
    updatedRecord.measurerVerifiedBy = role;
    if (action === WorkflowActions.MEASURER_FLAG_DISPUTE) {
      updatedRecord.hasDispute = true;
    }
  }
  
  if (action === WorkflowActions.MANAGER_FINAL_REVIEW) {
    updatedRecord.completedAt = timestamp;
    updatedRecord.completedBy = role;
  }
  
  if (action === WorkflowActions.CLOSE) {
    updatedRecord.closedAt = timestamp;
    updatedRecord.closedBy = role;
  }
  
  records[index] = updatedRecord;
  oilIntakeRecords.set(records);
  
  addLog(recordId, action, role, data.comment || '');
  
  return updatedRecord;
}

export function createOilIntakeRecord(data) {
  const now = new Date().toISOString();
  const record = {
    id: generateId(),
    orderNo: 'RK' + new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, '0') + String(Date.now()).slice(-6),
    status: WorkflowStatus.DRAFT,
    oilType: data.oilType || '92#汽油',
    quantity: data.quantity || 0,
    tankerNo: data.tankerNo || '',
    driverName: data.driverName || '',
    sourceDepot: data.sourceDepot || '',
    deliveryOrderNo: data.deliveryOrderNo || '',
    tankNo: data.tankNo || '',
    hasDispute: false,
    createdAt: now,
    updatedAt: now,
    createdBy: get(currentRole),
    history: [{
      status: WorkflowStatus.DRAFT,
      timestamp: now,
      operator: get(currentRole),
      comment: '创建单据'
    }]
  };
  
  const records = get(oilIntakeRecords);
  records.unshift(record);
  oilIntakeRecords.set(records);
  
  addLog(record.id, 'create', get(currentRole), '创建油品入库单');
  
  return record;
}

export function updateOilIntakeRecord(recordId, data) {
  const records = get(oilIntakeRecords);
  const index = records.findIndex(r => r.id === recordId);
  if (index === -1) return null;
  
  records[index] = {
    ...records[index],
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  oilIntakeRecords.set(records);
  return records[index];
}

export function getWorkflowSteps(record) {
  return [
    { key: 'draft', label: '创建单据', completed: true, active: record.status === WorkflowStatus.DRAFT },
    { key: 'manager_approval', label: '站长审核', completed: record.status !== WorkflowStatus.DRAFT && record.status !== WorkflowStatus.RETURNED, active: record.status === WorkflowStatus.PENDING_MANAGER_APPROVAL },
    { key: 'cashier', label: '收银员录入', completed: record.status !== WorkflowStatus.DRAFT && record.status !== WorkflowStatus.RETURNED && record.status !== WorkflowStatus.PENDING_MANAGER_APPROVAL, active: record.status === WorkflowStatus.PENDING_CASHIER },
    { key: 'measurer', label: '计量员校验', completed: [WorkflowStatus.MANAGER_REVIEW, WorkflowStatus.SUPPLEMENTARY, WorkflowStatus.COMPLETED, WorkflowStatus.CLOSED].includes(record.status), active: record.status === WorkflowStatus.PENDING_MEASURER },
    { key: 'final_review', label: '站长复核', completed: [WorkflowStatus.COMPLETED, WorkflowStatus.CLOSED].includes(record.status), active: record.status === WorkflowStatus.MANAGER_REVIEW || record.status === WorkflowStatus.SUPPLEMENTARY },
    { key: 'completed', label: '完成/关闭', completed: [WorkflowStatus.COMPLETED, WorkflowStatus.CLOSED].includes(record.status), active: false }
  ];
}
