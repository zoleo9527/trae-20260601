import { writable } from 'svelte/store';

export interface User {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
}

export const currentUser = writable<User | null>(null);

export const roles = [
  { value: 'EXAM_OFFICER', label: '考务专员' },
  { value: 'INVIGILATOR', label: '监考老师' },
  { value: 'TECH_SUPPORT', label: '技术支持' }
];

export function getRoleLabel(role: string): string {
  return roles.find(r => r.value === role)?.label || role;
}