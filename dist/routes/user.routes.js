"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const database_1 = require("../database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/me', auth_1.authenticate, (req, res) => {
    res.json({ user: req.currentUser });
});
router.get('/users', auth_1.authenticate, (0, auth_1.requirePermission)('view_application'), (req, res) => {
    const users = database_1.db.getUsers().map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        employeeId: u.employeeId,
    }));
    res.json({ users });
});
router.get('/users/:id', auth_1.authenticate, (0, auth_1.requirePermission)('view_application'), (req, res) => {
    const user = database_1.db.getUserById(req.params.id) || database_1.db.getUserByEmployeeId(req.params.id);
    if (!user) {
        res.status(404).json({ error: '用户不存在' });
        return;
    }
    res.json({
        id: user.id,
        name: user.name,
        role: user.role,
        employeeId: user.employeeId,
    });
});
exports.userRoutes = router;
//# sourceMappingURL=user.routes.js.map