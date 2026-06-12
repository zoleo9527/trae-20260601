"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const database_1 = require("../database");
const auth_1 = require("../middleware/auth");
const types_1 = require("../types");
const statusMachine_1 = require("../utils/statusMachine");
const operationLogger_1 = require("../utils/operationLogger");
const exceptionHandler_1 = require("../utils/exceptionHandler");
const fieldConverter_1 = require("../utils/fieldConverter");
const router = express_1.default.Router();
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const db = await (0, database_1.getDb)();
        const { projectId, arrangementId, expertId, status } = req.query;
        let sql = 'SELECT * FROM expert_signin_records WHERE 1=1';
        const params = [];
        if (projectId) {
            sql += ' AND project_id = ?';
            params.push(projectId);
        }
        if (arrangementId) {
            sql += ' AND arrangement_id = ?';
            params.push(arrangementId);
        }
        if (expertId) {
            sql += ' AND expert_id = ?';
            params.push(expertId);
        }
        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }
        sql += ' ORDER BY created_at';
        const records = await db.all(sql, params);
        const result = records.map((r) => ({
            ...fieldConverter_1.convertFields.signinRecord(r),
            statusDisplay: types_1.signinStatusDisplay[r.status],
        }));
        res.json(result);
    }
    catch (error) {
        console.error('Get signin records error:', error);
        res.status(500).json({ error: '获取签到记录失败' });
    }
});
router.get('/analysis/:arrangementId', auth_1.authMiddleware, async (req, res) => {
    try {
        const db = await (0, database_1.getDb)();
        const records = await db.all('SELECT * FROM expert_signin_records WHERE arrangement_id = ? ORDER BY created_at', [req.params.arrangementId]);
        const recordsObj = records.map((r) => fieldConverter_1.convertFields.signinRecord(r));
        const rawAnalysis = (0, statusMachine_1.analyzeSignin)(recordsObj);
        const analysis = {
            ...rawAnalysis,
            arrangementId: req.params.arrangementId,
        };
        res.json(analysis);
    }
    catch (error) {
        console.error('Get signin analysis error:', error);
        res.status(500).json({ error: '获取签到分析失败' });
    }
});
router.post('/:id/confirm', auth_1.authMiddleware, (0, auth_1.roleMiddleware)('review_secretary'), async (req, res) => {
    try {
        const { signinMethod, seatNumber } = req.body;
        const db = await (0, database_1.getDb)();
        const user = req.user;
        const record = await db.get('SELECT * FROM expert_signin_records WHERE id = ?', [req.params.id]);
        if (!record) {
            res.status(404).json({ error: '签到记录不存在' });
            return;
        }
        const recordObj = fieldConverter_1.convertFields.signinRecord(record);
        if (recordObj.status !== 'pending') {
            res.status(400).json({ error: '当前状态不允许确认签到' });
            return;
        }
        const now = new Date().toISOString();
        await db.run(`UPDATE expert_signin_records SET 
        status = 'confirmed',
        actual_arrival_time = ?,
        signin_time = ?,
        signin_method = ?,
        seat_number = ?,
        handler_id = ?,
        handler_name = ?,
        handler_role = ?,
        updated_at = ?
       WHERE id = ?`, [now, now, signinMethod || 'manual', seatNumber, user.id, user.name, user.role, now, req.params.id]);
        await (0, operationLogger_1.logOperation)('signin', req.params.id, '确认签到', `专家「${recordObj.expertName}」已确认签到`, user.id, user.name, user.role, 'pending', 'confirmed', { signinMethod, seatNumber });
        const project = await db.get('SELECT * FROM projects WHERE id = ?', [recordObj.projectId]);
        if (project) {
            const projectObj = fieldConverter_1.convertFields.project(project);
            const allRecords = await db.all('SELECT * FROM expert_signin_records WHERE project_id = ?', [recordObj.projectId]);
            const allRecordsObj = allRecords.map((r) => fieldConverter_1.convertFields.signinRecord(r));
            const analysis = (0, statusMachine_1.analyzeSignin)(allRecordsObj);
            if (analysis.signinRate === 100) {
                await db.run(`UPDATE projects SET status = 'expert_signin_completed', updated_at = ? WHERE id = ?`, [now, recordObj.projectId]);
                await (0, operationLogger_1.logOperation)('project', recordObj.projectId, '更新项目状态', '所有专家已签到，项目状态变更为：签到完成', user.id, user.name, user.role, projectObj.status, 'expert_signin_completed');
            }
        }
        const updated = await db.get('SELECT * FROM expert_signin_records WHERE id = ?', [req.params.id]);
        const updatedObj = fieldConverter_1.convertFields.signinRecord(updated);
        res.json({
            ...updatedObj,
            statusDisplay: types_1.signinStatusDisplay.confirmed,
        });
    }
    catch (error) {
        console.error('Confirm signin error:', error);
        res.status(500).json({ error: '确认签到失败' });
    }
});
router.post('/:id/absent', auth_1.authMiddleware, (0, auth_1.roleMiddleware)('review_secretary'), async (req, res) => {
    try {
        const { reason } = req.body;
        const db = await (0, database_1.getDb)();
        const user = req.user;
        const record = await db.get('SELECT * FROM expert_signin_records WHERE id = ?', [req.params.id]);
        if (!record) {
            res.status(404).json({ error: '签到记录不存在' });
            return;
        }
        const recordObj = fieldConverter_1.convertFields.signinRecord(record);
        if (recordObj.status !== 'pending') {
            res.status(400).json({ error: '当前状态不允许标记缺席' });
            return;
        }
        const now = new Date().toISOString();
        await db.run(`UPDATE expert_signin_records SET 
        status = 'absent',
        signin_complete_reason = ?,
        handler_id = ?,
        handler_name = ?,
        handler_role = ?,
        updated_at = ?
       WHERE id = ?`, [reason || '未按时到场，无法联系', user.id, user.name, user.role, now, req.params.id]);
        await (0, operationLogger_1.logOperation)('signin', req.params.id, '标记缺席', `专家「${recordObj.expertName}」标记为缺席。${reason ? '原因：' + reason : ''}`, user.id, user.name, user.role, 'pending', 'absent', { reason });
        const project = await db.get('SELECT * FROM projects WHERE id = ?', [recordObj.projectId]);
        if (project) {
            const projectObj = fieldConverter_1.convertFields.project(project);
            const arrangement = await db.get('SELECT * FROM project_arrangements WHERE project_id = ? ORDER BY created_at DESC LIMIT 1', [recordObj.projectId]);
            const arrangementObj = arrangement ? fieldConverter_1.convertFields.arrangement(arrangement) : null;
            const allRecords = await db.all('SELECT * FROM expert_signin_records WHERE project_id = ?', [recordObj.projectId]);
            const allRecordsObj = allRecords.map((r) => fieldConverter_1.convertFields.signinRecord(r));
            await (0, exceptionHandler_1.createException)(projectObj.id, projectObj.projectNo, projectObj.name, 'expert_absent', '专家缺席', `专家「${recordObj.expertName}」缺席，${reason || '未按时到场'}`, user.id, 'manual', '专家签到时标记缺席', user.id, user.name, user.role);
            await (0, exceptionHandler_1.checkAndTriggerExceptions)(projectObj, arrangementObj, allRecordsObj, 'signin_incomplete', '专家签到未完成');
        }
        const updated = await db.get('SELECT * FROM expert_signin_records WHERE id = ?', [req.params.id]);
        const updatedObj = fieldConverter_1.convertFields.signinRecord(updated);
        res.json({
            ...updatedObj,
            statusDisplay: types_1.signinStatusDisplay.absent,
        });
    }
    catch (error) {
        console.error('Mark absent error:', error);
        res.status(500).json({ error: '标记缺席失败' });
    }
});
router.post('/:id/leave', auth_1.authMiddleware, (0, auth_1.roleMiddleware)('review_secretary'), async (req, res) => {
    try {
        const { leaveReason, substituteExpertId, substituteExpertName } = req.body;
        const db = await (0, database_1.getDb)();
        const user = req.user;
        const record = await db.get('SELECT * FROM expert_signin_records WHERE id = ?', [req.params.id]);
        if (!record) {
            res.status(404).json({ error: '签到记录不存在' });
            return;
        }
        const recordObj = fieldConverter_1.convertFields.signinRecord(record);
        if (recordObj.status !== 'pending') {
            res.status(400).json({ error: '当前状态不允许标记请假' });
            return;
        }
        if (!leaveReason) {
            res.status(400).json({ error: '请填写请假原因' });
            return;
        }
        const now = new Date().toISOString();
        await db.run(`UPDATE expert_signin_records SET 
        status = 'leave',
        leave_reason = ?,
        substitute_expert_id = ?,
        substitute_expert_name = ?,
        handler_id = ?,
        handler_name = ?,
        handler_role = ?,
        updated_at = ?
       WHERE id = ?`, [
            leaveReason,
            substituteExpertId || null,
            substituteExpertName || null,
            user.id,
            user.name,
            user.role,
            now,
            req.params.id,
        ]);
        await (0, operationLogger_1.logOperation)('signin', req.params.id, '标记请假', `专家「${recordObj.expertName}」请假。原因：${leaveReason}${substituteExpertName ? `，已更换为：${substituteExpertName}` : ''}`, user.id, user.name, user.role, 'pending', 'leave', { leaveReason, substituteExpertId, substituteExpertName });
        if (substituteExpertId && substituteExpertName) {
            const newRecordId = (0, uuid_1.v4)();
            await db.run(`INSERT INTO expert_signin_records (
          id, project_id, project_no, project_name, arrangement_id,
          expert_id, expert_name, expertise, status, scheduled_arrival_time,
          is_supervision, attachments, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                newRecordId,
                recordObj.projectId,
                recordObj.projectNo,
                recordObj.projectName,
                recordObj.arrangementId,
                substituteExpertId,
                substituteExpertName,
                recordObj.expertise,
                'pending',
                recordObj.scheduledArrivalTime,
                recordObj.isSupervision,
                '[]',
                now,
                now,
            ]);
            await db.run(`UPDATE expert_signin_records SET status = 'substituted', updated_at = ? WHERE id = ?`, [now, req.params.id]);
            await (0, operationLogger_1.logOperation)('signin', newRecordId, '创建替补签到记录', `替补专家「${substituteExpertName}」签到记录已创建`, user.id, user.name, user.role, undefined, 'pending');
        }
        const updated = await db.get('SELECT * FROM expert_signin_records WHERE id = ?', [req.params.id]);
        const updatedObj = fieldConverter_1.convertFields.signinRecord(updated);
        res.json({
            ...updatedObj,
            statusDisplay: types_1.signinStatusDisplay.leave,
        });
    }
    catch (error) {
        console.error('Mark leave error:', error);
        res.status(500).json({ error: '标记请假失败' });
    }
});
exports.default = router;
//# sourceMappingURL=signin.js.map