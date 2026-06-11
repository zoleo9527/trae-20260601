import { writable } from 'svelte/store';

export const currentUser = writable({
  id: 5,
  name: '刘建国',
  role: 'supervisor',
  roleLabel: '维保主管',
  phone: '13700137001',
  department: '维保部'
});

export const ROLE_CONFIG = {
  inspector: {
    label: '巡检工程师',
    viewFields: ['building', 'inspectionDate', 'equipment', 'problems', 'suggestions'],
    allowedActions: ['submit_report', 'reedit_report']
  },
  property: {
    label: '物业联系人',
    viewFields: ['building', 'inspectionDate', 'problems', 'suggestions', 'signature'],
    allowedActions: ['sign', 'dispute']
  },
  supervisor: {
    label: '维保主管',
    viewFields: ['building', 'inspectionDate', 'equipment', 'problems', 'suggestions', 'signature', 'timeline'],
    allowedActions: ['approve_report', 'reject_report', 'push_to_signature', 'handle_dispute']
  }
};
