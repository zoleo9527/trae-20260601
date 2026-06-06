import { Response } from 'express';
import { AuthenticatedRequest, getRoleMenu } from '../middleware/auth';
import { ApiResponse } from '../types';

export function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  const response: ApiResponse = {
    code: 200,
    message: 'success',
    data: {
      user: req.user,
      menus: req.user ? getRoleMenu(req.user.role) : []
    }
  };
  res.json(response);
}
