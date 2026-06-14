import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../database';
import { User } from '../types';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await dbService.getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await dbService.getUserById(id);
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, role } = req.body;
    
    if (!name || !role) {
      res.status(400).json({ error: '缺少必要参数' });
      return;
    }
    
    const user: Omit<User, 'createdAt'> = {
      id: uuidv4(),
      name,
      role
    };
    
    const createdUser = await dbService.createUser(user);
    res.status(201).json(createdUser);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
