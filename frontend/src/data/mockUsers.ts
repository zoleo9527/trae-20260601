import { User } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'user_001',
    name: '张明',
    email: 'zhangming@museum.com',
    phone: '13800138001',
    role: 'EDUCATION_TEACHER',
    roleName: '社教老师',
    department: '社会教育部',
    createdAt: '2024-01-01',
  },
  {
    id: 'user_002',
    name: '李华',
    email: 'lihua@museum.com',
    phone: '13800138002',
    role: 'EDUCATION_TEACHER',
    roleName: '社教老师',
    department: '社会教育部',
    createdAt: '2024-01-01',
  },
  {
    id: 'user_003',
    name: '王芳',
    email: 'wangfang@museum.com',
    phone: '13800138003',
    role: 'EDUCATION_TEACHER',
    roleName: '社教老师',
    department: '社会教育部',
    createdAt: '2024-01-01',
  },
  {
    id: 'user_004',
    name: '刘伟',
    email: 'liuwei@museum.com',
    phone: '13800138004',
    role: 'ACTIVITY_MANAGER',
    roleName: '活动主管',
    department: '综合管理部',
    createdAt: '2024-01-01',
  },
  {
    id: 'user_005',
    name: '陈静',
    email: 'chenjing@museum.com',
    phone: '13800138005',
    role: 'ACTIVITY_MANAGER',
    roleName: '活动主管',
    department: '综合管理部',
    createdAt: '2024-01-01',
  },
  {
    id: 'user_006',
    name: '赵军',
    email: 'zhaojun@museum.com',
    phone: '13800138006',
    role: 'MATERIAL_MANAGER',
    roleName: '教具管理员',
    department: '后勤保障部',
    createdAt: '2024-01-01',
  },
  {
    id: 'user_007',
    name: '孙丽',
    email: 'sunli@museum.com',
    phone: '13800138007',
    role: 'MATERIAL_MANAGER',
    roleName: '教具管理员',
    department: '后勤保障部',
    createdAt: '2024-01-01',
  },
  {
    id: 'user_008',
    name: '周洋',
    email: 'zhouyang@museum.com',
    phone: '13800138008',
    role: 'VOLUNTEER',
    roleName: '志愿者',
    department: '志愿者服务部',
    createdAt: '2024-01-15',
  },
  {
    id: 'user_009',
    name: '吴敏',
    email: 'wumin@museum.com',
    phone: '13800138009',
    role: 'VOLUNTEER',
    roleName: '志愿者',
    department: '志愿者服务部',
    createdAt: '2024-01-15',
  },
  {
    id: 'user_010',
    name: '郑强',
    email: 'zhengqiang@museum.com',
    phone: '13800138010',
    role: 'VOLUNTEER',
    roleName: '志愿者',
    department: '志愿者服务部',
    createdAt: '2024-02-01',
  },
];

export const getCurrentUser = (): User => {
  return mockUsers[0];
};

export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id);
};

export const getUsersByRole = (role: string): User[] => {
  return mockUsers.filter(user => user.role === role);
};
