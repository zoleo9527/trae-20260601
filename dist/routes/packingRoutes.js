"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const packingService_1 = require("../services/packingService");
const router = (0, express_1.Router)();
router.post('/', async (req, res) => {
    try {
        const { eggGradeRecordId, boxCount, eggsPerBox, destination, transporter, managerId } = req.body;
        const record = await packingService_1.packingService.confirmPacking(eggGradeRecordId, boxCount, eggsPerBox, destination, transporter, managerId);
        res.status(201).json({
            success: true,
            data: record
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
router.put('/:id/ship', async (req, res) => {
    try {
        const { id } = req.params;
        const { operatorId } = req.body;
        const record = await packingService_1.packingService.shipPacking(id, operatorId);
        res.json({
            success: true,
            data: record
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
        const record = await packingService_1.packingService.getPackingRecordById(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: '记录不存在'
            });
        }
        res.json({
            success: true,
            data: record
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
router.get('/', async (req, res) => {
    try {
        const { batchNumber, destination, status, managerId, startDate, endDate, page, pageSize } = req.query;
        const filter = {
            batchNumber: batchNumber || undefined,
            destination: destination || undefined,
            status: status || undefined,
            managerId: managerId || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined
        };
        const pageRequest = {
            page: parseInt(page || '1'),
            pageSize: parseInt(pageSize || '10')
        };
        const result = await packingService_1.packingService.getPackingRecords(filter, pageRequest);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
router.get('/:id/logs', async (req, res) => {
    try {
        const { id } = req.params;
        const logs = await packingService_1.packingService.getPackingRecordLogs(id);
        res.json({
            success: true,
            data: logs
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
