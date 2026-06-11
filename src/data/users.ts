import { User } from '../types';
import { ROLE_MAP } from '../utils/status';
import { generateId } from '../utils/id';

export const user_zhangwei = 'u_zhangwei';
export const user_lina = 'u_lina';
export const user_wangqiang = 'u_wangqiang';
export const user_liufang = 'u_liufang';
export const user_chenming = 'u_chenming';
export const user_zhaojing = 'u_zhaojing';

export const users: User[] = [
  {
    id: user_zhangwei,
    name: '张伟',
    role: 'consultant',
    roleName: ROLE_MAP.consultant,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangwei',
    department: '销售一部',
  },
  {
    id: user_lina,
    name: '李娜',
    role: 'consultant',
    roleName: ROLE_MAP.consultant,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lina',
    department: '销售一部',
  },
  {
    id: user_wangqiang,
    name: '王强',
    role: 'consultant',
    roleName: ROLE_MAP.consultant,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangqiang',
    department: '销售二部',
  },
  {
    id: user_liufang,
    name: '刘芳',
    role: 'manager',
    roleName: ROLE_MAP.manager,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liufang',
    department: '案场管理',
  },
  {
    id: user_chenming,
    name: '陈明',
    role: 'manager',
    roleName: ROLE_MAP.manager,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenming',
    department: '案场管理',
  },
  {
    id: user_zhaojing,
    name: '赵静',
    role: 'controller',
    roleName: ROLE_MAP.controller,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaojing',
    department: '销控部',
  },
];

export const getUserById = (id: string): User | undefined => {
  return users.find(u => u.id === id);
};

export const getUsersByRole = (role: User['role']): User[] => {
  return users.filter(u => u.role === role);
};
