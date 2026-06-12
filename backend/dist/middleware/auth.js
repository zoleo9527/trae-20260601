"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.roleMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../database");
const JWT_SECRET = process.env.JWT_SECRET || 'tender-bid-secret-key-2026';
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: '未提供认证令牌' });
        return;
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const db = await (0, database_1.getDb)();
        const user = await db.get('SELECT * FROM users WHERE id = ?', [decoded.userId]);
        if (!user) {
            res.status(401).json({ error: '用户不存在' });
            return;
        }
        req.user = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            phone: user.phone,
            email: user.email,
            department: user.department,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
        };
        next();
    }
    catch (error) {
        res.status(401).json({ error: '认证令牌无效或已过期' });
    }
};
exports.authMiddleware = authMiddleware;
const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: '未登录' });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ error: '权限不足，无法执行此操作' });
            return;
        }
        next();
    };
};
exports.roleMiddleware = roleMiddleware;
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};
exports.generateToken = generateToken;
//# sourceMappingURL=auth.js.map