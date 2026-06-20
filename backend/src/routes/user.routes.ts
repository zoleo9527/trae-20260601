import { Router, Request, Response } from 'express';
import * as userService from '../services/user.service';
import { ApiResponse, UserRole } from '../types';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const { username, name, role } = req.body;
    const user = userService.createUser(username, name, role);
    res.json({ success: true, data: user, message: '用户创建成功' } as ApiResponse<typeof user>);
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message } as ApiResponse<null>);
  }
});

router.get('/', (req: Request, res: Response) => {
  const users = userService.getAllUsers();
  res.json({ success: true, data: users } as ApiResponse<typeof users>);
});

router.get('/:id', (req: Request, res: Response) => {
  const user = userService.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, error: '用户不存在' } as ApiResponse<null>);
  }
  res.json({ success: true, data: user } as ApiResponse<typeof user>);
});

router.get('/role/:role', (req: Request, res: Response) => {
  const users = userService.getUsersByRole(req.params.role as UserRole);
  res.json({ success: true, data: users } as ApiResponse<typeof users>);
});

export default router;
