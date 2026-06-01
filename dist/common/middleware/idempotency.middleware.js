"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyMiddleware = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const business_exception_1 = require("../exceptions/business.exception");
const error_codes_1 = require("../error-codes");
let IdempotencyMiddleware = class IdempotencyMiddleware {
    constructor() {
        this.cache = new Map();
        this.TTL = 24 * 60 * 60 * 1000;
    }
    use(req, res, next) {
        const method = req.method;
        const idempotencyKey = req.headers['x-request-id'];
        if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
            this.attachContext(req);
            return next();
        }
        if (!idempotencyKey) {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.IDEMPOTENCY_KEY_REQUIRED);
        }
        const cacheKey = `${method}:${req.originalUrl}:${idempotencyKey}`;
        const record = this.cache.get(cacheKey);
        if (record && Date.now() - record.timestamp < this.TTL) {
            return res.json(record.response);
        }
        this.attachContext(req);
        const originalSend = res.json.bind(res);
        res.json = (body) => {
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
    attachContext(req) {
        const decode = (val) => {
            if (!val)
                return undefined;
            try {
                return decodeURIComponent(val);
            }
            catch {
                return val;
            }
        };
        const context = {
            requestId: req.headers['x-request-id'] || (0, uuid_1.v4)(),
            userId: req.headers['x-user-id'] || 'anonymous',
            userName: decode(req.headers['x-user-name']) || '匿名用户',
            userRole: req.headers['x-user-role'] || 'STAFF',
            storeId: req.headers['x-store-id'] || 'default',
            storeName: decode(req.headers['x-store-name']) || '默认门店',
        };
        req.context = context;
    }
    cleanup() {
        const now = Date.now();
        for (const [key, record] of this.cache.entries()) {
            if (now - record.timestamp > this.TTL) {
                this.cache.delete(key);
            }
        }
    }
};
exports.IdempotencyMiddleware = IdempotencyMiddleware;
exports.IdempotencyMiddleware = IdempotencyMiddleware = __decorate([
    (0, common_1.Injectable)()
], IdempotencyMiddleware);
//# sourceMappingURL=idempotency.middleware.js.map