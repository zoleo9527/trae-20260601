import { User } from '../types';
import { users } from '../data/database';

export const getAllUsers = (): User[] => {
  return users;
};

export const getUserById = (id: number): User | undefined => {
  return users.find(u => u.id === id);
};

export const getUsersByRole = (role: User['role']): User[] => {
  return users.filter(u => u.role === role);
};
