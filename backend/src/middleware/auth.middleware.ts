import { Request, Response, NextFunction } from 'express';
import { dataStore } from '../utils/dataStore.js';

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '请先登录',
      },
    });
  }

  (req as any).userId = userId;
  next();
};
