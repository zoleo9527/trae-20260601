"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userService_1 = require("../services/userService");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const { role } = req.query;
        const users = await userService_1.userService.getUsersByRole(role || undefined);
        res.json({
            success: true,
            data: users
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userService_1.userService.getUserById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
exports.default = router;
