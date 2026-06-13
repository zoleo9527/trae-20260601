import { User } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'user-001',
    name: '吴九',
    role: 'operator',
    avatar: 'W',
  },
  {
    id: 'user-002',
    name: '张三',
    role: 'recruiter',
    avatar: 'Z',
  },
  {
    id: 'user-003',
    name: '王五',
    role: 'hr',
    avatar: 'W',
    company: '深圳XX电子科技有限公司',
  },
  {
    id: 'user-004',
    name: '赵六',
    role: 'recruiter',
    avatar: 'Z',
  },
  {
    id: 'user-005',
    name: '周八',
    role: 'hr',
    avatar: 'Z',
    company: '广州XX物流有限公司',
  },
];

export const getUsersByRole = (role: string): User[] => {
  return mockUsers.filter(u => u.role === role);
};
