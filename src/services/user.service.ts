import { BaseService } from './BaseService';
import { STORAGE_KEYS } from '../utils/storage';
import type { User } from '../types/user.types';
import { UserRole } from '../types/user.types';
import { mockUsers, currentUser } from '../data/mockTasks';
import { getStorageData, setStorageData } from '../utils/storage';

export class UserService extends BaseService<User> {
  constructor() {
    super(STORAGE_KEYS.USERS);
    this.initializeData();
  }

  private initializeData(): void {
    const existingData = getStorageData<User[]>(this.storageKey);
    if (!existingData) {
      setStorageData(this.storageKey, mockUsers);
    }
  }

  getCurrentUser(): User {
    const user = getStorageData<User>(STORAGE_KEYS.CURRENT_USER);
    return user || currentUser;
  }

  setCurrentUser(user: User): void {
    setStorageData(STORAGE_KEYS.CURRENT_USER, user);
  }

  getUsers(role?: UserRole): User[] {
    const users = this.getAll();
    if (role) {
      return users.filter(user => user.role === role && user.active);
    }
    return users.filter(user => user.active);
  }

  getUserById(userId: string): User | undefined {
    const users = this.getAll();
    return users.find(user => user.userId === userId);
  }

  getSurveyors(): User[] {
    return this.getUsers(UserRole.SURVEYOR);
  }

  getReviewSupervisors(): User[] {
    return this.getUsers(UserRole.REVIEW_SUPERVISOR);
  }
}
