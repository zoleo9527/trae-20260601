import type { User } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'u001',
    name: '张敏',
    role: 'receiver',
    employeeId: 'EMP-2024-001',
  },
  {
    id: 'u002',
    name: '李鉴定',
    role: 'appraiser',
    employeeId: 'EMP-2024-002',
  },
  {
    id: 'u003',
    name: '王资深',
    role: 'appraiser',
    employeeId: 'EMP-2023-008',
  },
  {
    id: 'u004',
    name: '陈运营',
    role: 'operator',
    employeeId: 'EMP-2024-004',
  },
  {
    id: 'u005',
    name: '刘财务',
    role: 'finance',
    employeeId: 'EMP-2023-015',
  },
  {
    id: 'u006',
    name: '赵客服',
    role: 'cs',
    employeeId: 'EMP-2024-006',
  },
];

export const currentUser: User = mockUsers[0];
