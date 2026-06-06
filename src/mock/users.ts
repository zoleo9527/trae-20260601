import { User } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'u001',
    name: '张志愿',
    role: 'volunteer',
    phone: '138****1234',
  },
  {
    id: 'u002',
    name: '李医生',
    role: 'veterinarian',
    phone: '139****5678',
  },
  {
    id: 'u003',
    name: '王审核',
    role: 'adoption_officer',
    phone: '137****9012',
  },
  {
    id: 'u004',
    name: '赵物资',
    role: 'supply_manager',
    phone: '136****3456',
  },
];

export const getUserName = (userId: string): string => {
  const user = mockUsers.find(u => u.id === userId);
  return user?.name || '未知用户';
};
