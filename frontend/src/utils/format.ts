import type { ReplacementStatus, UserRole } from '../types/index';
import {
  STATUS_LABEL,
  STATUS_CLASS,
  ROLE_LABEL,
} from '../types/enums';

function padZero(num: number, len: number = 2): string {
  return String(num).padStart(len, '0');
}

export function formatMoney(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0.00';
  }
  const fixed = Number(amount).toFixed(2);
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return '¥' + parts.join('.');
}

export function formatDateTime(dateStr: string | Date): string {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return '';
  return (
    date.getFullYear() +
    '-' +
    padZero(date.getMonth() + 1) +
    '-' +
    padZero(date.getDate()) +
    ' ' +
    padZero(date.getHours()) +
    ':' +
    padZero(date.getMinutes())
  );
}

export function formatDate(dateStr: string | Date): string {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return '';
  return (
    date.getFullYear() +
    '-' +
    padZero(date.getMonth() + 1) +
    '-' +
    padZero(date.getDate())
  );
}

let idCounter = 0;
export function generateId(): string {
  const now = new Date();
  const datePart =
    now.getFullYear().toString() +
    padZero(now.getMonth() + 1) +
    padZero(now.getDate());
  idCounter = (idCounter + 1) % 1000;
  const seqPart = padZero(idCounter, 3);
  return `BJ-${datePart}-${seqPart}`;
}

export function statusLabel(status: ReplacementStatus): string {
  return STATUS_LABEL[status] || status;
}

export function statusClass(status: ReplacementStatus): string {
  return STATUS_CLASS[status] || 'status-default';
}

export function roleLabel(role: UserRole): string {
  return ROLE_LABEL[role] || role;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
