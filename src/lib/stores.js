import { writable } from 'svelte/store';
import { ROLES } from './constants.js';

const initialRole = typeof localStorage !== 'undefined' ? localStorage.getItem('current_role') || 'APPRAISER' : 'APPRAISER';

export const currentRole = writable(initialRole);
export const currentRoleName = writable(ROLES[initialRole].name);
export const currentUserName = writable({
  APPRAISER: '李评估',
  STORAGE: '王库管',
  FINANCE: '陈财务'
});

export function setRole(roleKey) {
  if (ROLES[roleKey]) {
    currentRole.set(roleKey);
    currentRoleName.set(ROLES[roleKey].name);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('current_role', roleKey);
    }
  }
}

export const toastMessages = writable([]);

export function showToast(message, type = 'info') {
  const id = Date.now();
  toastMessages.update(msgs => [...msgs, { id, message, type }]);
  setTimeout(() => {
    toastMessages.update(msgs => msgs.filter(m => m.id !== id));
  }, 4000);
}
