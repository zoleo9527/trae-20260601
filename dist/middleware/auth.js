"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requirePermission = requirePermission;
exports.requireRole = requireRole;
const database_1 = require("../database");
const ROLE_PERMISSIONS = {
    WINDOW_STAFF: [
        'view_application',
        'submit_materials',
        'register_payment',
        'view_payment',
        'issue_supplement_notice',
        'view_operation_logs',
    ],
    NOTARY: [
        'view_application',
        'review_materials',
        'confirm_payment',
        'view_payment',
        'issue_supplement_notice',
        'view_operation_logs',
        'view_certificate',
    ],
    ARCHIVIST: [
        'view_application',
        'arrange_certificate',
        'confirm_certificate_issue',
        'view_certificate',
        'view_payment',
        'view_operation_logs',
    ],
};
function authenticate(req, res, next) {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        res.status(401).json({ error: '未提供用户ID，请在Header中设置x-user-id' });
        return;
    }
    const user = database_1.db.getUserById(userId) || database_1.db.getUserByEmployeeId(userId);
    if (!user) {
        res.status(401).json({ error: '用户不存在' });
        return;
    }
    req.currentUser = user;
    next();
}
function requirePermission(permission) {
    return (req, res, next) => {
        const user = req.currentUser;
        if (!user) {
            res.status(401).json({ error: '未登录' });
            return;
        }
        const permissions = ROLE_PERMISSIONS[user.role];
        if (!permissions.includes(permission)) {
            res.status(403).json({
                error: '权限不足',
                userRole: user.role,
                requiredPermission: permission,
                availablePermissions: permissions
            });
            return;
        }
        next();
    };
}
function requireRole(...roles) {
    return (req, res, next) => {
        const user = req.currentUser;
        if (!user) {
            res.status(401).json({ error: '未登录' });
            return;
        }
        if (!roles.includes(user.role)) {
            res.status(403).json({
                error: '角色权限不足',
                userRole: user.role,
                requiredRoles: roles
            });
            return;
        }
        next();
    };
}
//# sourceMappingURL=auth.js.map