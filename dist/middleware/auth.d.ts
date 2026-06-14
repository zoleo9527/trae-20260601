import { Request, Response, NextFunction } from 'express';
import { UserRole, User } from '../types';
export interface AuthRequest extends Request {
    currentUser?: User;
}
export declare function authenticate(req: AuthRequest, res: Response, next: NextFunction): void;
export declare function requirePermission(permission: string): (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare function requireRole(...roles: UserRole[]): (req: AuthRequest, res: Response, next: NextFunction) => void;
