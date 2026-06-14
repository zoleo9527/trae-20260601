import { Request, Response, NextFunction } from 'express';
import { getDatabase, User } from '../database';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: '未授权' });
    }

    const token = authHeader.replace('Bearer ', '');
    const match = token.match(/token_(\d+)_/);
    
    if (!match) {
      return res.status(401).json({ success: false, error: '无效的令牌' });
    }

    const userId = parseInt(match[1]);
    const db = await getDatabase();
    const user = await db.get<User>('SELECT * FROM users WHERE id = ?', [userId]);

    if (user) {
      req.user = user;
      next();
    } else {
      res.status(404).json({ success: false, error: '用户不存在' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
}