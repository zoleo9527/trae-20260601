"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gradeService_1 = require("../services/gradeService");
const router = (0, express_1.Router)();
router.post('/', async (req, res) => {
    try {
        const { batchNumber, grade, quantity, weight, breederId } = req.body;
        const record = await gradeService_1.gradeService.submitGradeRecord(batchNumber, grade, quantity, weight, breederId);
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
router.put('/:id/verify', async (req, res) => {
    try {
        const { id } = req.params;
        const { sorterId } = req.body;
        const record = await gradeService_1.gradeService.verifyGradeRecord(id, sorterId);
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
        const record = await gradeService_1.gradeService.getGradeRecordById(id);
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
        const { batchNumber, grade, status, breederId, sorterId, startDate, endDate, page, pageSize } = req.query;
        const filter = {
            batchNumber: batchNumber || undefined,
            grade: grade || undefined,
            status: status || undefined,
            breederId: breederId || undefined,
            sorterId: sorterId || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined
        };
        const pageRequest = {
            page: parseInt(page || '1'),
            pageSize: parseInt(pageSize || '10')
        };
        const result = await gradeService_1.gradeService.getGradeRecords(filter, pageRequest);
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
        const logs = await gradeService_1.gradeService.getGradeRecordLogs(id);
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
