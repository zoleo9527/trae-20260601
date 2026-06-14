export enum UserRole {
  TEACHER = 'TEACHER',
  AFFAIRS = 'AFFAIRS',
  ADVISOR = 'ADVISOR',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  department?: string;
}
