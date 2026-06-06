import { Role, User } from '../types';
import { db } from '../db/database';
import { BusinessError, ErrorCode } from '../common/errorCode';

export class UserService {
  async getAllUsers(): Promise<User[]> {
    return [...db.users].sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    );
  }

  async getUsersByRole(role: Role): Promise<User[]> {
    return db.users.filter(u => u.role === role).sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    );
  }

  async getUserById(id: string): Promise<User> {
    const user = db.users.find(u => u.id === id);
    if (!user) {
      throw new BusinessError(ErrorCode.USER_NOT_FOUND);
    }
    return user;
  }

  async createUser(data: { name: string; role: Role; phone?: string }): Promise<User> {
    const user: User = {
      id: db.generateId(),
      name: data.name,
      role: data.role,
      phone: data.phone,
      createdAt: db.now(),
      updatedAt: db.now(),
    };
    db.users.push(user);
    db.save();
    return user;
  }
}

export const userService = new UserService();
