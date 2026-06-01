import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCode } from '../error-codes';
import { RequestContext } from '../decorators/request-context.decorator';

interface IdempotencyRecord {
  response: any;
  timestamp: number;
}

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  private cache = new Map<string, IdempotencyRecord>();
  private readonly TTL = 24 * 60 * 60 * 1000;

  use(req: Request, res: Response, next: NextFunction) {
    const method = req.method;
    const idempotencyKey = req.headers['x-request-id'] as string;

    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      this.attachContext(req);
      return next();
    }

    if (!idempotencyKey) {
      throw new BusinessException(ErrorCode.IDEMPOTENCY_KEY_REQUIRED);
    }

    const cacheKey = `${method}:${req.originalUrl}:${idempotencyKey}`;
    const record = this.cache.get(cacheKey);

    if (record && Date.now() - record.timestamp < this.TTL) {
      return res.json(record.response);
    }

    this.attachContext(req);

    const originalSend = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode < 400) {
        this.cache.set(cacheKey, {
          response: body,
          timestamp: Date.now(),
        });
      }
      return originalSend(body);
    };

    next();
  }

  private attachContext(req: Request) {
    const decode = (val: string | undefined): string | undefined => {
      if (!val) return undefined;
      try {
        return decodeURIComponent(val);
      } catch {
        return val;
      }
    };
    const context: RequestContext = {
      requestId: (req.headers['x-request-id'] as string) || uuidv4(),
      userId: (req.headers['x-user-id'] as string) || 'anonymous',
      userName: decode(req.headers['x-user-name'] as string) || '匿名用户',
      userRole: (req.headers['x-user-role'] as string) || 'STAFF',
      storeId: (req.headers['x-store-id'] as string) || 'default',
      storeName: decode(req.headers['x-store-name'] as string) || '默认门店',
    };
    (req as any).context = context;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.cache.entries()) {
      if (now - record.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }
}
