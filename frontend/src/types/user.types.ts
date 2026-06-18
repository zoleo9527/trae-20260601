export type UserRole = 'EDUCATION_TEACHER' | 'VOLUNTEER' | 'ACTIVITY_MANAGER' | 'MATERIAL_MANAGER';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  roleName: string;
  department?: string;
  avatar?: string;
  createdAt: string;
}
