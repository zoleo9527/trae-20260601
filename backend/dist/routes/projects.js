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
        const { status, handlerId, keyword, page, pageSize } = req.query;
        let sql = 'SELECT * FROM projects WHERE 1=1';
        const params = [];
        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }
        if (handlerId) {
            sql += ' AND current_handler_id = ?';
            params.push(handlerId);
        }
        sql += ' ORDER BY created_at DESC';
        const projects = await db.all(sql, params);
        let result = projects.map((p) => ({
            ...fieldConverter_1.convertFields.project(p),
            statusDisplay: types_1.statusDisplay[p.status],
        }));
        if (keyword) {
            const kw = keyword.toLowerCase();
            result = result.filter((p) => p.projectNo.toLowerCase().includes(kw) ||
                p.name.toLowerCase().includes(kw) ||
                p.clientName.toLowerCase().includes(kw));
        }
        const total = result.length;
        const p = page ? parseInt(page, 10) : 1;
        const ps = pageSize ? parseInt(pageSize, 10) : 10;
        const start = (p - 1) * ps;
        const paginated = result.slice(start, start + ps);
        res.json({ items: paginated, total });
    }
    catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: '获取项目列表失败' });
    }
});
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const db = await (0, database_1.getDb)();
        const project = await db.get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
        if (!project) {
            res.status(404).json({ error: '项目不存在' });
            return;
        }
        const projectObj = {
            ...fieldConverter_1.convertFields.project(project),
            statusDisplay: types_1.statusDisplay[project.status],
        };
        const arrangement = await db.get('SELECT * FROM project_arrangements WHERE project_id = ? ORDER BY created_at DESC LIMIT 1', [req.params.id]);
        const signinRecords = await db.all('SELECT * FROM expert_signin_records WHERE project_id = ? ORDER BY created_at', [req.params.id]);
        const exceptions = await db.all('SELECT * FROM exception_records WHERE project_id = ? ORDER BY triggered_at DESC', [req.params.id]);
        const arrangementObj = arrangement
            ? {
                ...fieldConverter_1.convertFields.arrangement(arrangement),
                statusDisplay: types_1.arrangementStatusDisplay[arrangement.status],
            }
            : null;
        const signinRecordsObj = signinRecords.map((r) => ({
            ...fieldConverter_1.convertFields.signinRecord(r),
            statusDisplay: types_1.signinStatusDisplay[r.status],
        }));
        const exceptionsObj = exceptions.map((ex) => ({
            ...fieldConverter_1.convertFields.exception(ex),
        }));
        res.json({
            project: projectObj,
            arrangement: arrangementObj,
            signinRecords: signinRecordsObj,
            exceptions: exceptionsObj,
        });
    }
    catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: '获取项目详情失败' });
    }
});
router.get('/:id/analysis', auth_1.authMiddleware, async (req, res) => {
    try {
        const db = await (0, database_1.getDb)();
        const project = await db.get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
        if (!project) {
            res.status(404).json({ error: '项目不存在' });
            return;
        }
        const projectObj = fieldConverter_1.convertFields.project(project);
        const arrangement = await db.get('SELECT * FROM project_arrangements WHERE project_id = ? ORDER BY created_at DESC LIMIT 1', [req.params.id]);
        const signinRecords = await db.all('SELECT * FROM expert_signin_records WHERE project_id = ? ORDER BY created_at', [req.params.id]);
        const arrangementObj = arrangement
            ? fieldConverter_1.convertFields.arrangement(arrangement)
            : null;
        const signinRecordsObj = signinRecords.map((r) => fieldConverter_1.convertFields.signinRecord(r));
        const blockAnalysis = (0, statusMachine_1.analyzeBlock)(projectObj, arrangementObj);
        const rawSigninAnalysis = (0, statusMachine_1.analyzeSignin)(signinRecordsObj);
        const signinAnalysis = {
            ...rawSigninAnalysis,
            arrangementId: arrangementObj?.id,
        };
        const responsibilityMatrix = (0, statusMachine_1.getResponsibilityMatrix)(projectObj, arrangementObj, signinRecordsObj);
        const autoException = (0, statusMachine_1.checkAutoTriggerException)(projectObj, arrangementObj, signinRecordsObj);
        if (autoException) {
            await (0, exceptionHandler_1.checkAndTriggerExceptions)(projectObj, arrangementObj, signinRecordsObj, autoException, '系统自动检测');
        }
        res.json({
            blockAnalysis,
            signinAnalysis,
            responsibilityMatrix,
        });
    }
    catch (error) {
        console.error('Get analysis error:', error);
        res.status(500).json({ error: '获取分析数据失败' });
    }
});
router.get('/:id/timeline', auth_1.authMiddleware, async (req, res) => {
    try {
        const logs = await (0, operationLogger_1.getOperationLogs)('project', req.params.id);
        const exceptions = await (0, exceptionHandler_1.getProjectExceptions)(req.params.id);
        const db = await (0, database_1.getDb)();
        const project = await db.get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
        const projectObj = project ? fieldConverter_1.convertFields.project(project) : null;
        const attachments = projectObj ? projectObj.attachments : [];
        const timeline = (0, operationLogger_1.generateTimeline)(logs, exceptions, attachments);
        res.json({ events: timeline });
    }
    catch (error) {
        console.error('Get timeline error:', error);
        res.status(500).json({ error: '获取时间线失败' });
    }
});
router.post('/', auth_1.authMiddleware, (0, auth_1.roleMiddleware)('project_specialist'), async (req, res) => {
    try {
        const { name, clientName, clientContact, clientPhone, projectType, budgetAmount, biddingMethod, description, remarks, reviewSecretaryId, financeId, } = req.body;
        if (!name || !clientName || !projectType || !budgetAmount || !biddingMethod) {
            res.status(400).json({ error: '必填字段不能为空' });
            return;
        }
        const db = await (0, database_1.getDb)();
        const user = req.user;
        const projectNo = `ZB${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
        const secretary = reviewSecretaryId
            ? await db.get('SELECT id, name FROM users WHERE id = ? AND role = ?', [
                reviewSecretaryId,
                'review_secretary',
            ])
            : null;
        const finance = financeId
            ? await db.get('SELECT id, name FROM users WHERE id = ? AND role = ?', [financeId, 'finance'])
            : null;
        const secretaryObj = secretary ? fieldConverter_1.convertFields.user(secretary) : null;
        const financeObj = finance ? fieldConverter_1.convertFields.user(finance) : null;
        const projectId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        await db.run(`INSERT INTO projects (
        id, project_no, name, client_name, client_contact, client_phone,
        project_type, budget_amount, bidding_method, status,
        current_handler_id, current_handler_name, current_handler_role,
        project_specialist_id, project_specialist_name,
        review_secretary_id, review_secretary_name,
        finance_id, finance_name,
        description, remarks, attachments, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            projectId,
            projectNo,
            name,
            clientName,
            clientContact,
            clientPhone,
            projectType,
            budgetAmount,
            biddingMethod,
            'draft',
            user.id,
            user.name,
            user.role,
            user.id,
            user.name,
            secretaryObj?.id || null,
            secretaryObj?.name || null,
            financeObj?.id || null,
            financeObj?.name || null,
            description,
            remarks,
            '[]',
            now,
            now,
        ]);
        await (0, operationLogger_1.logOperation)('project', projectId, '创建项目', `创建项目「${name}」`, user.id, user.name, user.role, undefined, 'draft');
        const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
        const projectObj = fieldConverter_1.convertFields.project(project);
        res.json({
            ...projectObj,
            statusDisplay: types_1.statusDisplay.draft,
        });
    }
    catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: '创建项目失败' });
    }
});
router.post('/:id/transition', auth_1.authMiddleware, async (req, res) => {
    try {
        const { toStatus } = req.body;
        const user = req.user;
        const db = await (0, database_1.getDb)();
        const project = await db.get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
        if (!project) {
            res.status(404).json({ error: '项目不存在' });
            return;
        }
        const projectObj = fieldConverter_1.convertFields.project(project);
        if (!(0, statusMachine_1.canTransition)(projectObj.status, toStatus, user.role)) {
            res.status(403).json({ error: '无权执行此状态变更' });
            return;
        }
        const transition = (0, statusMachine_1.getTransitionAction)(projectObj.status, toStatus);
        if (!transition) {
            res.status(400).json({ error: '无效的状态转换' });
            return;
        }
        const nextHandlerRole = (0, statusMachine_1.getRequiredHandlerRole)(toStatus);
        let nextHandlerId = null;
        let nextHandlerName = null;
        if (nextHandlerRole) {
            if (nextHandlerRole === 'project_specialist') {
                nextHandlerId = projectObj.projectSpecialistId;
                nextHandlerName = projectObj.projectSpecialistName;
            }
            else if (nextHandlerRole === 'review_secretary') {
                nextHandlerId = projectObj.reviewSecretaryId;
                nextHandlerName = projectObj.reviewSecretaryName;
            }
            else if (nextHandlerRole === 'finance') {
                nextHandlerId = projectObj.financeId;
                nextHandlerName = projectObj.financeName;
            }
        }
        const now = new Date().toISOString();
        await db.run(`UPDATE projects SET 
        status = ?,
        current_handler_id = ?,
        current_handler_name = ?,
        current_handler_role = ?,
        updated_at = ?
       WHERE id = ?`, [
            toStatus,
            nextHandlerId,
            nextHandlerName,
            nextHandlerRole,
            now,
            req.params.id,
        ]);
        await (0, operationLogger_1.logOperation)('project', req.params.id, transition.action, transition.description, user.id, user.name, user.role, projectObj.status, toStatus, {
            nextHandler: nextHandlerName ? `${types_1.roleNames[nextHandlerRole]} - ${nextHandlerName}` : null,
        });
        if (transition.autoTriggerException) {
            const arrangement = await db.get('SELECT * FROM project_arrangements WHERE project_id = ? ORDER BY created_at DESC LIMIT 1', [req.params.id]);
            const arrangementObj = arrangement ? fieldConverter_1.convertFields.arrangement(arrangement) : null;
            const signinRecords = await db.all('SELECT * FROM expert_signin_records WHERE project_id = ? ORDER BY created_at', [req.params.id]);
            const signinRecordsObj = signinRecords.map((r) => fieldConverter_1.convertFields.signinRecord(r));
            await (0, exceptionHandler_1.checkAndTriggerExceptions)(projectObj, arrangementObj, signinRecordsObj, transition.autoTriggerException, `状态变更：${projectObj.status} -> ${toStatus}`);
        }
        const updated = await db.get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
        const updatedObj = fieldConverter_1.convertFields.project(updated);
        res.json({
            ...updatedObj,
            statusDisplay: types_1.statusDisplay[toStatus],
        });
    }
    catch (error) {
        console.error('Transition error:', error);
        res.status(500).json({ error: '状态变更失败' });
    }
});
exports.default = router;
//# sourceMappingURL=projects.js.map