import { Request, Response, NextFunction } from 'express';
import { User, UserRole } from '../types';
export interface AuthRequest extends Request {
    user?: User;
}
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const roleMiddleware: (...allowedRoles: UserRole[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const generateToken: (userId: string) => string;
