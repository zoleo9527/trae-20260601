import { Request, Response } from 'express';
import AuthService from '../services/AuthService';

class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login({ username, password });
      res.json({
        success: true,
        data: {
          user: {
            id: result.user.id,
            username: result.user.username,
            realName: result.user.realName,
            role: result.user.role,
            storeId: result.user.storeId,
          },
          token: result.token,
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const user = await AuthService.register(req.body);
      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          realName: user.realName,
          role: user.role,
          storeId: user.storeId,
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export default new AuthController();