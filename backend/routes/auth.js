import { Router } from 'express';
import { authService } from '../models/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: '用户名和密码不能为空' }
      });
    }

    const result = await authService.login(username, password);

    res.json({
      success: true,
      data: result,
      message: '登录成功'
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { code: 'LOGIN_FAILED', message: error.message }
    });
  }
});

router.get('/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '未提供认证令牌' }
      });
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    res.json({
      success: true,
      data: decoded,
      message: 'Token有效'
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: error.message }
    });
  }
});

export default router;
