import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

function createPersistentStore(key, initialValue) {
  const stored = browser ? localStorage.getItem(key) : null;
  const data = stored ? JSON.parse(stored) : initialValue;
  
  const store = writable(data);
  
  if (browser) {
    store.subscribe((value) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  }
  
  return store;
}

export const currentRole = createPersistentStore('currentRole', 'manager');

export const oilIntakeRecords = createPersistentStore('oilIntakeRecords', []);

export const tankVerificationRecords = createPersistentStore('tankVerificationRecords', []);

export const operationLogs = createPersistentStore('operationLogs', []);

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatDateTime(date) {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function addLog(recordId, action, operator, details) {
  const logs = get(operationLogs);
  logs.unshift({
    id: generateId(),
    recordId,
    action,
    operator,
    details,
    timestamp: new Date().toISOString()
  });
  operationLogs.set(logs);
}

export function getRoleLabel(role) {
  const labels = {
    manager: '站长',
    cashier: '收银员',
    measurer: '计量员'
  };
  return labels[role] || role;
}

export function getStatusLabel(status) {
  const labels = {
    draft: '草稿',
    pending_manager_approval: '待站长审核',
    pending_cashier: '待收银员录入',
    pending_measurer: '待计量员校验',
    manager_review: '站长复核中',
    returned_to_manager: '退回站长补充',
    returned_to_cashier: '退回收银员补充',
    returned_to_measurer: '退回计量员补充',
    supplementary: '补充资料中',
    completed: '已完成',
    closed: '已关闭'
  };
  return labels[status] || status;
}

export function getStatusTagClass(status) {
  const classes = {
    draft: 'tag-primary',
    pending_manager_approval: 'tag-warning',
    pending_cashier: 'tag-warning',
    pending_measurer: 'tag-warning',
    manager_review: 'tag-primary',
    returned_to_manager: 'tag-danger',
    returned_to_cashier: 'tag-danger',
    returned_to_measurer: 'tag-danger',
    supplementary: 'tag-warning',
    completed: 'tag-success',
    closed: 'tag-primary'
  };
  return classes[status] || 'tag-primary';
}
