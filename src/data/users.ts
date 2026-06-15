import { User } from '@/types';

export const users: User[] = [
  {
    id: 'u001',
    name: '张建国',
    role: 'manager',
    phone: '13800138001',
  },
  {
    id: 'u002',
    name: '李明华',
    role: 'dispatcher',
    phone: '13800138002',
  },
  {
    id: 'u003',
    name: '王师傅',
    role: 'technician',
    phone: '13800138003',
  },
  {
    id: 'u004',
    name: '赵师傅',
    role: 'technician',
    phone: '13800138004',
  },
  {
    id: 'u005',
    name: '陈大勇',
    role: 'driver',
    phone: '13800138005',
  },
  {
    id: 'u006',
    name: '刘志强',
    role: 'driver',
    phone: '13800138006',
  },
];

export const roleNames: Record<string, string> = {
  manager: '租赁经理',
  dispatcher: '调度员',
  technician: '维修师傅',
  driver: '司机',
};

export const getCurrentUser = (role: string): User => {
  return users.find((u) => u.role === role) || users[0];
};
