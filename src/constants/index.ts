import type { EmployeeStatus, RiskFlagType, UserRole, DocumentType } from '@/types';

export const STATUS_OWNER_MAP: Record<EmployeeStatus, UserRole> = {
  pending_training: 'recruiter',
  in_training: 'site_supervisor',
  training_exception: 'site_supervisor',
  pending_documents: 'site_supervisor',
  collecting_documents: 'site_supervisor',
  completed: 'payroll_accountant',
};

export const VALID_TRANSITIONS: Record<EmployeeStatus, EmployeeStatus[]> = {
  pending_training: ['in_training'],
  in_training: ['training_exception', 'pending_documents'],
  training_exception: ['in_training', 'pending_documents'],
  pending_documents: ['collecting_documents', 'completed'],
  collecting_documents: ['completed', 'pending_documents'],
  completed: [],
};

export const STATUS_LABEL: Record<EmployeeStatus, string> = {
  pending_training: '待入场培训',
  in_training: '培训中',
  training_exception: '培训异常',
  pending_documents: '待证件收集',
  collecting_documents: '证件收集中',
  completed: '已完成',
};

export const STATUS_COLOR: Record<EmployeeStatus, string> = {
  pending_training: 'bg-brand-50 text-brand-700 border-brand-200',
  in_training: 'bg-amber/10 text-amber border-amber/30',
  training_exception: 'bg-rose/10 text-rose border-rose/30',
  pending_documents: 'bg-brand-50 text-brand-600 border-brand-200',
  collecting_documents: 'bg-amber/10 text-amber border-amber/30',
  completed: 'bg-emerald/10 text-emerald border-emerald/30',
};

export const RISK_LABEL: Record<RiskFlagType, string> = {
  temporary_absence: '临时缺岗',
  attendance_dispute: '考勤争议',
  salary_deduction: '工资扣款',
};

export const RISK_COLOR: Record<RiskFlagType, string> = {
  temporary_absence: 'bg-amber text-white border-amber',
  attendance_dispute: 'bg-amber text-white border-amber',
  salary_deduction: 'bg-rose text-white border-rose',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  recruiter: '招聘专员',
  site_supervisor: '驻场主管',
  payroll_accountant: '薪酬会计',
};

export const ROLE_AVATAR_COLOR: Record<UserRole, string> = {
  recruiter: 'bg-brand-600',
  site_supervisor: 'bg-amber',
  payroll_accountant: 'bg-emerald',
};

export const DOCUMENT_LABEL: Record<DocumentType, string> = {
  id_card: '身份证',
  health_cert: '健康证',
  labor_contract: '劳动合同',
  social_security: '社保证明',
  photo: '一寸照片',
  background_check: '背景调查证明',
};

export const DOCUMENT_TYPES: DocumentType[] = [
  'id_card',
  'health_cert',
  'labor_contract',
  'social_security',
  'photo',
  'background_check',
];

export const USER_NAMES: Record<UserRole, string> = {
  recruiter: '林晓晴',
  site_supervisor: '陈志远',
  payroll_accountant: '周慧敏',
};
