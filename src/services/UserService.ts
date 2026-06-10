import { User, Role } from '../types';
import { getUserById, getUsersByRole } from '../database/repository';
export class UserService {
 async getUserById(id: string): Promise<User | null> {
 return await getUserById(id);
 }
 async getUsersByRole(role?: string): Promise<User[]> {
 return await getUsersByRole(role);
 }
 async getAllUsers(): Promise<User[]> {
 return await getUsersByRole();
 }
}
export const userService = new UserService();