import { db } from '../database';
import { User } from '../types';

export const userService = {
  login: (username: string, password: string): User | null => {
    return db.getUserByCredentials(username, password);
  },

  getUserById: (id: string): User | null => {
    return db.getUserById(id);
  },

  getAllUsers: (): User[] => {
    return db.getAllUsers();
  },
};
