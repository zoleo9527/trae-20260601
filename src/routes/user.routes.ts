import { Router, Request, Response } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess, sendFail } from '../common/response';
import { ErrorCode, BusinessError } from '../common/errorCode';
import { Role } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const role = req.query.role as Role | undefined;
    let users;
    
    if (role) {
      users = await userService.getUsersByRole(role);
    } else {
      users = await userService.getAllUsers();
    }
    
    sendSuccess(res, users);
  } catch (error) {
    if (error instanceof BusinessError) {
      sendFail(res, error.code, error.message);
    } else {
      sendFail(res, ErrorCode.INTERNAL_ERROR);
    }
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.id);
    sendSuccess(res, user);
  } catch (error) {
    if (error instanceof BusinessError) {
      sendFail(res, error.code, error.message);
    } else {
      sendFail(res, ErrorCode.INTERNAL_ERROR);
    }
  }
});

export default router;
