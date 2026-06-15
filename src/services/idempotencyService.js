const { store } = require('../data/store');

class IdempotencyService {
  static check(idempotencyKey) {
    if (!idempotencyKey) return null;
    const cached = store.idempotency[idempotencyKey];
    if (cached) {
      return {
        isDuplicate: true,
        cachedResult: cached.result,
        cachedAt: cached.createdAt
      };
    }
    return { isDuplicate: false };
  }

  static save(idempotencyKey, result, ttlMs = 86400000) {
    if (!idempotencyKey) return;
    store.idempotency[idempotencyKey] = {
      result,
      createdAt: new Date().toISOString(),
      expireAt: new Date(Date.now() + ttlMs).toISOString()
    };
  }

  static wrap(idempotencyKey, fn) {
    const check = this.check(idempotencyKey);
    if (check && check.isDuplicate) {
      return {
        ...check.cachedResult,
        _idempotent: true,
        _idempotentAt: check.cachedAt
      };
    }
    const result = fn();
    this.save(idempotencyKey, result);
    return result;
  }
}

module.exports = IdempotencyService;
