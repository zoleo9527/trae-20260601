"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../database");
const auth_1 = require("../middleware/auth");
const fieldConverter_1 = require("../utils/fieldConverter");
const router = express_1.default.Router();
const hashPassword = (password) => {
    return Buffer.from(password).toString('base64');
};
const verifyPassword = (password, hash) => {
    return hashPassword(password) === hash;
};
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: '用户名和密码不能为空' });
        return;
    }
    try {
        const db = await (0, database_1.getDb)();
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) {
            res.status(401).json({ error: '用户名或密码错误' });
            return;
        }
        const userObj = fieldConverter_1.convertFields.user(user);
        if (!verifyPassword(password, user.password)) {
            res.status(401).json({ error: '用户名或密码错误' });
            return;
        }
        const token = (0, auth_1.generateToken)(userObj.id);
        const authUser = {
            id: userObj.id,
            username: userObj.username,
            name: userObj.name,
            role: userObj.role,
            phone: userObj.phone,
            email: userObj.email,
            department: userObj.department,
            createdAt: userObj.createdAt,
            updatedAt: userObj.updatedAt,
            token,
        };
        res.json(authUser);
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: '登录失败' });
    }
});
router.post('/logout', auth_1.authMiddleware, (req, res) => {
    res.json({ message: '登出成功' });
});
router.get('/me', auth_1.authMiddleware, (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: '未登录' });
        return;
    }
    res.json(req.user);
});
exports.default = router;
//# sourceMappingURL=auth.js.map