"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../database");
const auth_1 = require("../middleware/auth");
const types_1 = require("../types");
const exceptionHandler_1 = require("../utils/exceptionHandler");
const operationLogger_1 = require("../utils/operationLogger");
const fieldConverter_1 = require("../utils/fieldConverter");
const router = express_1.default.Router();
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const db = await (0, database_1.getDb)();
        const { projectId, status, severity, type, page, pageSize } = req.query;
        let sql = 'SELECT * FROM exception_records WHERE 1=1';
        const params = [];
        if (projectId) {
            sql += ' AND project_id = ?';
            params.push(projectId);
        }
        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }
        if (severity) {
            sql += ' AND severity = ?';
            params.push(severity);
        }
        if (type) {
            sql += ' AND type = ?';
            params.push(type);
        }
        sql += ' ORDER BY triggered_at DESC';
        const exceptions = await db.all(sql, params);
        let result = exceptions.map((ex) => {
            const exObj = fieldConverter_1.convertFields.exception(ex);
            return {
                ...exObj,
                typeName: types_1.exceptionTypeNames[exObj.type],
                severityName: exObj.severity === 'critical'
                    ? '严重'
                    : exObj.severity === 'high'
                        ? '高'
                        : exObj.severity === 'medium'
                            ? '中'
                            : '低',
                statusName: exObj.status === 'open'
                    ? '待处理'
                    : exObj.status === 'processing'
                        ? '处理中'
                        : exObj.status === 'resolved'
                            ? '已解决'
                            : '已关闭',
            };
        });
        const total = result.length;
        const p = page ? parseInt(page, 10) : 1;
        const ps = pageSize ? parseInt(pageSize, 10) : 10;
        const start = (p - 1) * ps;
        const paginated = result.slice(start, start + ps);
        res.json({ items: paginated, total });
    }
    catch (error) {
        console.error('Get exceptions error:', error);
        res.status(500).json({ error: '获取异常列表失败' });
    }
});
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const db = await (0, database_1.getDb)();
        const exception = await db.get('SELECT * FROM exception_records WHERE id = ?', [req.params.id]);
        if (!exception) {
            res.status(404).json({ error: '异常记录不存在' });
            return;
        }
        const exceptionObj = fieldConverter_1.convertFields.exception(exception);
        const result = {
            ...exceptionObj,
            typeName: types_1.exceptionTypeNames[exceptionObj.type],
            severityName: exceptionObj.severity === 'critical'
                ? '严重'
                : exceptionObj.severity === 'high'
                    ? '高'
                    : exceptionObj.severity === 'medium'
                        ? '中'
                        : '低',
            statusName: exceptionObj.status === 'open'
                ? '待处理'
                : exceptionObj.status === 'processing'
                    ? '处理中'
                    : exceptionObj.status === 'resolved'
                        ? '已解决'
                        : '已关闭',
        };
        res.json(result);
    }
    catch (error) {
        console.error('Get exception error:', error);
        res.status(500).json({ error: '获取异常详情失败' });
    }
});
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { projectId, type, title, description, severity } = req.body;
        const user = req.user;
        if (!projectId || !type || !title || !description) {
            res.status(400).json({ error: '必填字段不能为空' });
            return;
        }
        const db = await (0, database_1.getDb)();
        const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
        if (!project) {
            res.status(404).json({ error: '项目不存在' });
            return;
        }
        const projectObj = fieldConverter_1.convertFields.project(project);
        const exception = await (0, exceptionHandler_1.createException)(projectId, projectObj.projectNo, projectObj.name, type, title, description, user.id, 'manual', undefined, user.id, user.name, user.role);
        res.json({
            ...exception,
            typeName: types_1.exceptionTypeNames[type],
            severityName: severity === 'critical'
                ? '严重'
                : severity === 'high'
                    ? '高'
                    : severity === 'medium'
                        ? '中'
                        : '低',
            statusName: '待处理',
        });
    }
    catch (error) {
        console.error('Create exception error:', error);
        res.status(500).json({ error: '创建异常记录失败' });
    }
});
router.post('/:id/handle', auth_1.authMiddleware, async (req, res) => {
    try {
        const { resolution } = req.body;
        const user = req.user;
        if (!resolution) {
            res.status(400).json({ error: '请填写处理方案' });
            return;
        }
        const result = await (0, exceptionHandler_1.handleException)(req.params.id, user.id, user.name, user.role, resolution);
        if (!result) {
            res.status(404).json({ error: '异常记录不存在' });
            return;
        }
        res.json({
            ...result,
            typeName: types_1.exceptionTypeNames[result.type],
            severityName: result.severity === 'critical'
                ? '严重'
                : result.severity === 'high'
                    ? '高'
                    : result.severity === 'medium'
                        ? '中'
                        : '低',
            statusName: '已解决',
        });
    }
    catch (error) {
        console.error('Handle exception error:', error);
        res.status(500).json({ error: '处理异常失败' });
    }
});
router.post('/:id/reject', auth_1.authMiddleware, async (req, res) => {
    try {
        const { rejectReason } = req.body;
        const user = req.user;
        if (!rejectReason) {
            res.status(400).json({ error: '请填写退回原因' });
            return;
        }
        const result = await (0, exceptionHandler_1.rejectException)(req.params.id, user.id, user.name, user.role, rejectReason);
        if (!result) {
            res.status(404).json({ error: '异常记录不存在' });
            return;
        }
        res.json({
            ...result,
            typeName: types_1.exceptionTypeNames[result.type],
            severityName: result.severity === 'critical'
                ? '严重'
                : result.severity === 'high'
                    ? '高'
                    : result.severity === 'medium'
                        ? '中'
                        : '低',
            statusName: '已关闭',
        });
    }
    catch (error) {
        console.error('Reject exception error:', error);
        res.status(500).json({ error: '退回异常失败' });
    }
});
router.post('/trigger-sample', auth_1.authMiddleware, async (req, res) => {
    try {
        const { projectId, exceptionType, sampleType } = req.body;
        const user = req.user;
        const type = (exceptionType || sampleType);
        if (!projectId || !type) {
            res.status(400).json({ error: '请指定项目和异常类型' });
            return;
        }
        const db = await (0, database_1.getDb)();
        const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
        if (!project) {
            res.status(404).json({ error: '项目不存在' });
            return;
        }
        const projectObj = fieldConverter_1.convertFields.project(project);
        const sampleTitles = {
            arrangement_timeout: '开评标安排审核超时',
            expert_absent: '专家缺席异常',
            expert_late: '专家迟到预警',
            signin_incomplete: '专家签到未完成',
            room_conflict: '会议室时间冲突',
            document_missing: '招标文件缺失',
            financial_issue: '财务确认异常',
            other: '其他异常情况',
        };
        const sampleDescriptions = {
            arrangement_timeout: '开评标安排提交审核已超过24小时，评审秘书尚未处理。请及时审核，避免影响开标进度。',
            expert_absent: '在专家签到过程中，发现有专家未按时到场且无法联系。需要立即协调更换替补专家。',
            expert_late: '部分专家签到时间比预计时间晚30分钟以上，可能影响评标进度。',
            signin_incomplete: '开标时间已到，但仍有专家未完成签到。请尽快确认签到情况。',
            room_conflict: '预约的开标会议室与其他项目存在时间冲突。请立即协调调整。',
            document_missing: '检查发现缺少必要的招标文件或资质证明。请立即补充。',
            financial_issue: '投标押金未按时到账，或代理费用计算存在问题。请财务确认。',
            other: '系统检测到其他异常情况，请相关责任人及时处理。',
        };
        const exception = await (0, exceptionHandler_1.createException)(projectId, projectObj.projectNo, projectObj.name, type, sampleTitles[type] || '异常样例', sampleDescriptions[type] || '系统检测到异常情况，请相关责任人及时处理。', 'system', 'system', `异常样例触发 - ${type}`, user.id, user.name, user.role);
        await (0, operationLogger_1.logOperation)('exception', exception.id, '触发异常样例', `手动触发异常样例：${sampleTitles[type] || type}`, user.id, user.name, user.role, undefined, 'open');
        res.json({
            message: '异常样例已成功触发',
            exception: {
                ...exception,
                typeName: types_1.exceptionTypeNames[type] || type,
                statusName: '待处理',
            },
        });
    }
    catch (error) {
        console.error('Trigger sample exception error:', error);
        res.status(500).json({ error: '触发异常样例失败' });
    }
});
exports.default = router;
//# sourceMappingURL=exceptions.js.map