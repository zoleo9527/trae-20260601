import { Role, User } from '../types';
import { db as defaultDb, Database } from '../db/database';
import { BusinessError, ErrorCode } from '../common/errorCode';

export class UserService {
  private db: Database;

  constructor(db?: Database) {
    this.db = db || defaultDb;
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.db.users].sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    );
  }

  async getUsersByRole(role: Role): Promise<User[]> {
    return this.db.users.filter(u => u.role === role).sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    );
  }

  async getUserById(id: string): Promise<User> {
    const user = this.db.users.find(u => u.id === id);
    if (!user) {
      throw new BusinessError(ErrorCode.USER_NOT_FOUND);
    }
    return user;
  }

  async createUser(data: { name: string; role: Role; phone?: string }): Promise<User> {
    const user: User = {
      id: this.db.generateId(),
      name: data.name,
      role: data.role,
      phone: data.phone,
      createdAt: this.db.now(),
      updatedAt: this.db.now(),
    };
    this.db.users.push(user);
    this.db.save();
    return user;
  }
}

export const userService = new UserService();
