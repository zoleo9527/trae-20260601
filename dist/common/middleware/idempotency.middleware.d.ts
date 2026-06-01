import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export declare class IdempotencyMiddleware implements NestMiddleware {
    private cache;
    private readonly TTL;
    use(req: Request, res: Response, next: NextFunction): any;
    private attachContext;
    cleanup(): void;
}
