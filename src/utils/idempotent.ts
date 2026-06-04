const IDEMPOTENCY_KEY_PREFIX = 'idem_key_';
const IDEMPOTENCY_CACHE_TTL = 24 * 60 * 60 * 1000;

interface IdempotencyRecord {
  key: string;
  timestamp: number;
  result: unknown;
}

const idempotencyCache = new Map<string, IdempotencyRecord>();

export function generateIdempotencyKey(): string {
  return `${IDEMPOTENCY_KEY_PREFIX}${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function checkIdempotency(key: string): { exists: boolean; result?: unknown } {
  const record = idempotencyCache.get(key);
  if (!record) {
    return { exists: false };
  }

  if (Date.now() - record.timestamp > IDEMPOTENCY_CACHE_TTL) {
    idempotencyCache.delete(key);
    return { exists: false };
  }

  return { exists: true, result: record.result };
}

export function storeIdempotencyResult(key: string, result: unknown): void {
  idempotencyCache.set(key, {
    key,
    timestamp: Date.now(),
    result,
  });
}

export function clearExpiredIdempotencyKeys(): void {
  const now = Date.now();
  for (const [key, record] of idempotencyCache.entries()) {
    if (now - record.timestamp > IDEMPOTENCY_CACHE_TTL) {
      idempotencyCache.delete(key);
    }
  }
}
