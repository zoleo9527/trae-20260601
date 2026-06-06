import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { InMemoryStore } from '../services/in-memory-store.service';

@Injectable()
export class UserContextMiddleware implements NestMiddleware {
  constructor(private readonly store: InMemoryStore) {}

  use(req: Request, res: Response, next: NextFunction) {
    const userId = req.headers['x-user-id'] as string;
    if (userId) {
      const user = this.store.getUser(userId);
      if (user) {
        (req as any).user = user;
      }
    }
    next();
  }
}
