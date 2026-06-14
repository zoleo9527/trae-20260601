export enum UserRole {
  CLAIMS_SPECIALIST = 'claims_specialist',
  SURVEYOR = 'surveyor',
  REVIEW_SUPERVISOR = 'review_supervisor',
  ADMIN = 'admin'
}

export interface User {
  userId: string;
  username: string;
  realName: string;
  phone: string;
  email: string;
  role: UserRole;
  department: string;
  active: boolean;
  createdTime: string;
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.CLAIMS_SPECIALIST]: '理赔专员',
  [UserRole.SURVEYOR]: '查勘员',
  [UserRole.REVIEW_SUPERVISOR]: '核赔主管',
  [UserRole.ADMIN]: '管理员'
};

export const USER_ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.CLAIMS_SPECIALIST]: 'bg-blue-100 text-blue-700',
  [UserRole.SURVEYOR]: 'bg-green-100 text-green-700',
  [UserRole.REVIEW_SUPERVISOR]: 'bg-purple-100 text-purple-700',
  [UserRole.ADMIN]: 'bg-red-100 text-red-700'
};
