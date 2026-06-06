import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse } from '../types';
import { getRoleMenusWithStats } from '../services/menuService';

export function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  const response: ApiResponse = {
    code: 200,
    message: 'success',
    data: {
      user: req.user,
      menus: req.user ? getRoleMenusWithStats(req.user.role) : []
    }
  };
  res.json(response);
}
