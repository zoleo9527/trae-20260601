export type UserRole = 'dorm_manager' | 'logistics_supervisor' | 'maintenance_worker';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
  department?: string;
}
