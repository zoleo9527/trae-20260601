import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import {
  Project,
  ProjectStatus,
  UserRole,
  ProjectArrangement,
  ExpertSigninRecord,
  BlockAnalysis,
  SigninAnalysis,
  ResponsibilityMatrix,
  TimelineEvent,
  OperationLog,
  statusDisplay,
  arrangementStatusDisplay,
  signinStatusDisplay,
  roleNames,
} from '../types';
import {
  canTransition,
  getTransitionAction,
  analyzeBlock,
  analyzeSignin,
  getResponsibilityMatrix,
  checkAutoTriggerException,
  getRequiredHandlerRole,
} from '../utils/statusMachine';
import { logOperation, getOperationLogs, generateTimeline, parseAttachmentJson } from '../utils/operationLogger';
import { getProjectExceptions, checkAndTriggerExceptions } from '../utils/exceptionHandler';
import { convertToCamelCase, convertFields } from '../utils/fieldConverter';

const router = express.Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { status, handlerId, keyword, page, pageSize } = req.query;

    let sql = 'SELECT * FROM projects WHERE 1=1';
    const params: string[] = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status as string);
    }
    if (handlerId) {
      sql += ' AND current_handler_id = ?';
      params.push(handlerId as string);
    }

    sql += ' ORDER BY created_at DESC';

    const projects = await db.all(sql, params);

    let result = projects.map((p) => ({
      ...convertFields.project(p),
      statusDisplay: statusDisplay[p.status as ProjectStatus],
    }));

    if (keyword) {
      const kw = (keyword as string).toLowerCase();
      result = result.filter(
        (p) =>
          p.projectNo.toLowerCase().includes(kw) ||
          p.name.toLowerCase().includes(kw) ||
          p.clientName.toLowerCase().includes(kw)
      );
    }

    const total = result.length;
    const p = page ? parseInt(page as string, 10) : 1;
    const ps = pageSize ? parseInt(pageSize as string, 10) : 10;
    const start = (p - 1) * ps;
    const paginated = result.slice(start, start + ps);

    res.json({ items: paginated, total });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: '获取项目列表失败' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [req.params.id]);

    if (!project) {
      res.status(404).json({ error: '项目不存在' });
      return;
    }

    const projectObj: any = {
      ...convertFields.project(project),
      statusDisplay: statusDisplay[project.status as ProjectStatus],
    };

    const arrangement = await db.get(
      'SELECT * FROM project_arrangements WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.params.id]
    );

    const signinRecords = await db.all(
      'SELECT * FROM expert_signin_records WHERE project_id = ? ORDER BY created_at',
      [req.params.id]
    );

    const exceptions = await db.all(
      'SELECT * FROM exception_records WHERE project_id = ? ORDER BY triggered_at DESC',
      [req.params.id]
    );

    const arrangementObj = arrangement
      ? {
          ...convertFields.arrangement(arrangement),
          statusDisplay:
            arrangementStatusDisplay[arrangement.status as keyof typeof arrangementStatusDisplay],
        }
      : null;

    const signinRecordsObj = signinRecords.map((r) => ({
      ...convertFields.signinRecord(r),
      statusDisplay:
        signinStatusDisplay[r.status as keyof typeof signinStatusDisplay],
    }));

    const exceptionsObj = exceptions.map((ex) => ({
      ...convertFields.exception(ex),
    }));

    res.json({
      project: projectObj,
      arrangement: arrangementObj,
      signinRecords: signinRecordsObj,
      exceptions: exceptionsObj,
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: '获取项目详情失败' });
  }
});

router.get('/:id/analysis', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [req.params.id]);

    if (!project) {
      res.status(404).json({ error: '项目不存在' });
      return;
    }

    const projectObj: Project = convertFields.project(project);

    const arrangement = await db.get(
      'SELECT * FROM project_arrangements WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.params.id]
    );

    const signinRecords = await db.all(
      'SELECT * FROM expert_signin_records WHERE project_id = ? ORDER BY created_at',
      [req.params.id]
    );

    const arrangementObj: ProjectArrangement | null = arrangement
      ? convertFields.arrangement(arrangement)
      : null;

    const signinRecordsObj: ExpertSigninRecord[] = signinRecords.map((r) => convertFields.signinRecord(r));

    const blockAnalysis: BlockAnalysis = analyzeBlock(projectObj, arrangementObj);
    const rawSigninAnalysis: SigninAnalysis = analyzeSignin(signinRecordsObj);
    const signinAnalysis: SigninAnalysis = {
      ...rawSigninAnalysis,
      arrangementId: arrangementObj?.id,
    };
    const responsibilityMatrix: ResponsibilityMatrix = getResponsibilityMatrix(
      projectObj,
      arrangementObj,
      signinRecordsObj
    );

    const autoException = checkAutoTriggerException(projectObj, arrangementObj, signinRecordsObj);
    if (autoException) {
      await checkAndTriggerExceptions(
        projectObj,
        arrangementObj,
        signinRecordsObj,
        autoException,
        '系统自动检测'
      );
    }

    res.json({
      blockAnalysis,
      signinAnalysis,
      responsibilityMatrix,
    });
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ error: '获取分析数据失败' });
  }
});

router.get('/:id/timeline', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const projectId = req.params.id;

    const projectLogs = await getOperationLogs('project', projectId);

    const arrangements = await db.all(
      'SELECT id FROM project_arrangements WHERE project_id = ?',
      [projectId]
    );
    const arrangementLogs: OperationLog[] = [];
    for (const arr of arrangements) {
      const logs = await getOperationLogs('arrangement', arr.id);
      arrangementLogs.push(...logs);
    }

    const signinRecords = await db.all(
      'SELECT id FROM expert_signin_records WHERE project_id = ?',
      [projectId]
    );
    const signinLogs: OperationLog[] = [];
    for (const rec of signinRecords) {
      const logs = await getOperationLogs('signin', rec.id);
      signinLogs.push(...logs);
    }

    const allLogs = [...projectLogs, ...arrangementLogs, ...signinLogs];

    const exceptions = await getProjectExceptions(projectId);

    const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    const projectObj = project ? convertFields.project(project) : null;
    const attachments = projectObj ? projectObj.attachments : [];

    const timeline: TimelineEvent[] = generateTimeline(allLogs, exceptions, attachments);

    res.json({ events: timeline });
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({ error: '获取时间线失败' });
  }
});

router.post('/', authMiddleware, roleMiddleware('project_specialist'), async (req: AuthRequest, res) => {
  try {
    const {
      name,
      clientName,
      clientContact,
      clientPhone,
      projectType,
      budgetAmount,
      biddingMethod,
      description,
      remarks,
      reviewSecretaryId,
      financeId,
    } = req.body;

    if (!name || !clientName || !projectType || !budgetAmount || !biddingMethod) {
      res.status(400).json({ error: '必填字段不能为空' });
      return;
    }

    const db = await getDb();
    const user = req.user!;

    const projectNo = `ZB${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(
      Math.floor(Math.random() * 1000)
    ).padStart(3, '0')}`;

    const secretary = reviewSecretaryId
      ? await db.get('SELECT id, name FROM users WHERE id = ? AND role = ?', [
          reviewSecretaryId,
          'review_secretary',
        ])
      : null;

    const finance = financeId
      ? await db.get('SELECT id, name FROM users WHERE id = ? AND role = ?', [financeId, 'finance'])
      : null;

    const secretaryObj = secretary ? convertFields.user(secretary) : null;
    const financeObj = finance ? convertFields.user(finance) : null;

    const projectId = uuidv4();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO projects (
        id, project_no, name, client_name, client_contact, client_phone,
        project_type, budget_amount, bidding_method, status,
        current_handler_id, current_handler_name, current_handler_role,
        project_specialist_id, project_specialist_name,
        review_secretary_id, review_secretary_name,
        finance_id, finance_name,
        description, remarks, attachments, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      ]
    );

    await logOperation(
      'project',
      projectId,
      '创建项目',
      `创建项目「${name}」`,
      user.id,
      user.name,
      user.role,
      undefined,
      'draft'
    );

    const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    const projectObj = convertFields.project(project);
    res.json({
      ...projectObj,
      statusDisplay: statusDisplay.draft,
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: '创建项目失败' });
  }
});

router.post('/:id/transition', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { toStatus } = req.body;
    const user = req.user!;

    const db = await getDb();
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [req.params.id]);

    if (!project) {
      res.status(404).json({ error: '项目不存在' });
      return;
    }

    const projectObj = convertFields.project(project);

    if (!canTransition(projectObj.status as ProjectStatus, toStatus as ProjectStatus, user.role)) {
      res.status(403).json({ error: '无权执行此状态变更' });
      return;
    }

    const transition = getTransitionAction(projectObj.status as ProjectStatus, toStatus as ProjectStatus);
    if (!transition) {
      res.status(400).json({ error: '无效的状态转换' });
      return;
    }

    const nextHandlerRole = getRequiredHandlerRole(toStatus as ProjectStatus);
    let nextHandlerId: string | null = null;
    let nextHandlerName: string | null = null;

    if (nextHandlerRole) {
      if (nextHandlerRole === 'project_specialist') {
        nextHandlerId = projectObj.projectSpecialistId;
        nextHandlerName = projectObj.projectSpecialistName;
      } else if (nextHandlerRole === 'review_secretary') {
        nextHandlerId = projectObj.reviewSecretaryId;
        nextHandlerName = projectObj.reviewSecretaryName;
      } else if (nextHandlerRole === 'finance') {
        nextHandlerId = projectObj.financeId;
        nextHandlerName = projectObj.financeName;
      }
    }

    const now = new Date().toISOString();

    await db.run(
      `UPDATE projects SET 
        status = ?,
        current_handler_id = ?,
        current_handler_name = ?,
        current_handler_role = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        toStatus,
        nextHandlerId,
        nextHandlerName,
        nextHandlerRole,
        now,
        req.params.id,
      ]
    );

    await logOperation(
      'project',
      req.params.id,
      transition.action,
      transition.description,
      user.id,
      user.name,
      user.role,
      projectObj.status,
      toStatus,
      {
        nextHandler: nextHandlerName ? `${roleNames[nextHandlerRole!]} - ${nextHandlerName}` : null,
      }
    );

    if (toStatus === 'expert_signin_pending') {
      const arrangement = await db.get(
        'SELECT * FROM project_arrangements WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
        [req.params.id]
      );
      const arrangementObj = arrangement ? convertFields.arrangement(arrangement) : null;

      if (arrangementObj) {
        const expertIds = arrangementObj.expertIds || [];
        const scheduledArrivalTime = `${arrangementObj.biddingDate}T${arrangementObj.biddingStartTime || '09:00:00'}`;

        for (const expertId of expertIds) {
          const existing = await db.get(
            'SELECT id FROM expert_signin_records WHERE arrangement_id = ? AND expert_id = ?',
            [arrangementObj.id, expertId]
          );
          if (existing) continue;

          const expert = await db.get('SELECT * FROM experts WHERE id = ?', [expertId]);
          const expertObj = expert ? convertFields.expert(expert) : null;

          const isSupervision = arrangementObj.supervisionExpertId && expertId === arrangementObj.supervisionExpertId ? 1 : 0;

          const signinId = uuidv4();
          await db.run(
            `INSERT INTO expert_signin_records (
              id, project_id, project_no, project_name, arrangement_id,
              expert_id, expert_name, expertise, status, scheduled_arrival_time,
              is_supervision, attachments, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              signinId,
              projectObj.id,
              projectObj.projectNo,
              projectObj.name,
              arrangementObj.id,
              expertId,
              expertObj?.name || `专家-${expertId.slice(0, 6)}`,
              expertObj?.expertise?.[0] || '未分类',
              'pending',
              scheduledArrivalTime,
              isSupervision,
              '[]',
              now,
              now,
            ]
          );

          await logOperation(
            'signin',
            signinId,
            '初始化签到记录',
            `准备专家签到，创建专家「${expertObj?.name || expertId}」签到记录`,
            user.id,
            user.name,
            user.role,
            undefined,
            'pending'
          );
        }

        await logOperation(
          'project',
          req.params.id,
          '初始化签到记录',
          `已为 ${expertIds.length} 位专家创建签到记录`,
          user.id,
          user.name,
          user.role,
          undefined,
          undefined
        );
      }
    }

    if (toStatus === 'bidding_in_progress') {
      await db.run(
        `UPDATE projects SET actual_bidding_date = ? WHERE id = ?`,
        [now, req.params.id]
      );
    }

    if (transition.autoTriggerException) {
      const arrangement = await db.get(
        'SELECT * FROM project_arrangements WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
        [req.params.id]
      );
      const arrangementObj = arrangement ? convertFields.arrangement(arrangement) : null;
      const signinRecords = await db.all(
        'SELECT * FROM expert_signin_records WHERE project_id = ? ORDER BY created_at',
        [req.params.id]
      );
      const signinRecordsObj = signinRecords.map((r) => convertFields.signinRecord(r));

      await checkAndTriggerExceptions(
        projectObj,
        arrangementObj,
        signinRecordsObj,
        transition.autoTriggerException,
        `状态变更：${projectObj.status} -> ${toStatus}`
      );
    }

    const updated = await db.get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    const updatedObj = convertFields.project(updated);
    res.json({
      ...updatedObj,
      statusDisplay: statusDisplay[toStatus as ProjectStatus],
    });
  } catch (error) {
    console.error('Transition error:', error);
    res.status(500).json({ error: '状态变更失败' });
  }
});

export default router;
