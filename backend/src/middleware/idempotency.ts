import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

const IDEMPOTENCY_HEADER = 'x-idempotency-key';
const EXPIRE_HOURS = 24;

declare global {
  namespace Express {
    interface Response {
      sendIdempotent: (status: number, body: any) => void;
    }
  }
}

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const idempotencyKey = req.header(IDEMPOTENCY_HEADER);
  
  if (!idempotencyKey) {
    res.sendIdempotent = (status: number, body: any) => {
      res.status(status).json(body);
    };
    return next();
  }

  const existing = db.prepare(`
    SELECT * FROM idempotency_keys WHERE key = ? AND request_path = ?
  `).get(idempotencyKey, req.path) as any;

  if (existing) {
    return res.status(existing.response_status).json(JSON.parse(existing.response_body));
  }

  res.sendIdempotent = (status: number, body: any) => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + EXPIRE_HOURS);
    
    db.prepare(`
      INSERT INTO idempotency_keys (id, key, request_path, response_body, response_status, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      idempotencyKey,
      req.path,
      JSON.stringify(body),
      status,
      expiresAt.toISOString()
    );
    
    res.status(status).json(body);
  };

  next();
}

export function cleanupExpiredIdempotencyKeys() {
  db.prepare(`
    DELETE FROM idempotency_keys WHERE expires_at < ?
  `).run(new Date().toISOString());
}
