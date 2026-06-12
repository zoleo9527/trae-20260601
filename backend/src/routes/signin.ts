import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import { SigninStatus, signinStatusDisplay } from '../types';
import { analyzeSignin, checkAutoTriggerException } from '../utils/statusMachine';
import { logOperation, parseAttachmentJson } from '../utils/operationLogger';
import { createException, checkAndTriggerExceptions } from '../utils/exceptionHandler';
import { convertToCamelCase, convertFields } from '../utils/fieldConverter';

const router = express.Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { projectId, arrangementId, expertId, status } = req.query;

    let sql = 'SELECT * FROM expert_signin_records WHERE 1=1';
    const params: string[] = [];

    if (projectId) {
      sql += ' AND project_id = ?';
      params.push(projectId as string);
    }
    if (arrangementId) {
      sql += ' AND arrangement_id = ?';
      params.push(arrangementId as string);
    }
    if (expertId) {
      sql += ' AND expert_id = ?';
      params.push(expertId as string);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status as string);
    }

    sql += ' ORDER BY created_at';

    const records = await db.all(sql, params);

    const result = records.map((r) => ({
      ...convertFields.signinRecord(r),
      statusDisplay: signinStatusDisplay[r.status as SigninStatus],
    }));

    res.json(result);
  } catch (error) {
    console.error('Get signin records error:', error);
    res.status(500).json({ error: '获取签到记录失败' });
  }
});

router.get('/analysis/:arrangementId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const records = await db.all(
      'SELECT * FROM expert_signin_records WHERE arrangement_id = ? ORDER BY created_at',
      [req.params.arrangementId]
    );

    const recordsObj = records.map((r) => convertFields.signinRecord(r));

    const rawAnalysis = analyzeSignin(recordsObj);
    const analysis = {
      ...rawAnalysis,
      arrangementId: req.params.arrangementId,
    };

    res.json(analysis);
  } catch (error) {
    console.error('Get signin analysis error:', error);
    res.status(500).json({ error: '获取签到分析失败' });
  }
});

router.post('/:id/confirm', authMiddleware, roleMiddleware('review_secretary'), async (req: AuthRequest, res) => {
  try {
    const { signinMethod, seatNumber } = req.body;
    const db = await getDb();
    const user = req.user!;
    const record = await db.get('SELECT * FROM expert_signin_records WHERE id = ?', [req.params.id]);

    if (!record) {
      res.status(404).json({ error: '签到记录不存在' });
      return;
    }

    const recordObj = convertFields.signinRecord(record);

    if (recordObj.status !== 'pending') {
      res.status(400).json({ error: '当前状态不允许确认签到' });
      return;
    }

    const now = new Date().toISOString();

    await db.run(
      `UPDATE expert_signin_records SET 
        status = 'confirmed',
        actual_arrival_time = ?,
        signin_time = ?,
        signin_method = ?,
        seat_number = ?,
        handler_id = ?,
        handler_name = ?,
        handler_role = ?,
        updated_at = ?
       WHERE id = ?`,
      [now, now, signinMethod || 'manual', seatNumber, user.id, user.name, user.role, now, req.params.id]
    );

    await logOperation(
      'signin',
      req.params.id,
      '确认签到',
      `专家「${recordObj.expertName}」已确认签到`,
      user.id,
      user.name,
      user.role,
      'pending',
      'confirmed',
      { signinMethod, seatNumber }
    );

    const project = await db.get('SELECT * FROM projects WHERE id = ?', [recordObj.projectId]);
    if (project) {
      const projectObj = convertFields.project(project);
      const arrangement = await db.get(
        'SELECT * FROM project_arrangements WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
        [recordObj.projectId]
      );
      const arrangementObj = arrangement ? convertFields.arrangement(arrangement) : null;
      const allRecords = await db.all(
        'SELECT * FROM expert_signin_records WHERE project_id = ?',
        [recordObj.projectId]
      );
      const allRecordsObj = allRecords.map((r) => convertFields.signinRecord(r));
      const analysis = analyzeSignin(allRecordsObj);
      if (analysis.signinRate === 100) {
        await db.run(
          `UPDATE projects SET status = 'expert_signin_completed', updated_at = ? WHERE id = ?`,
          [now, recordObj.projectId]
        );
        await logOperation(
          'project',
          recordObj.projectId,
          '更新项目状态',
          '所有专家已签到，项目状态变更为：签到完成',
          user.id,
          user.name,
          user.role,
          projectObj.status,
          'expert_signin_completed'
        );
      }

      const autoException = checkAutoTriggerException(projectObj, arrangementObj, allRecordsObj);
      if (autoException) {
        await checkAndTriggerExceptions(
          projectObj,
          arrangementObj,
          allRecordsObj,
          autoException,
          '签到确认时系统自动检测'
        );
      }
    }

    const updated = await db.get('SELECT * FROM expert_signin_records WHERE id = ?', [req.params.id]);
    const updatedObj = convertFields.signinRecord(updated);
    res.json({
      ...updatedObj,
      statusDisplay: signinStatusDisplay.confirmed,
    });
  } catch (error) {
    console.error('Confirm signin error:', error);
    res.status(500).json({ error: '确认签到失败' });
  }
});

router.post('/:id/absent', authMiddleware, roleMiddleware('review_secretary'), async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;
    const db = await getDb();
    const user = req.user!;
    const record = await db.get('SELECT * FROM expert_signin_records WHERE id = ?', [req.params.id]);

    if (!record) {
      res.status(404).json({ error: '签到记录不存在' });
      return;
    }

    const recordObj = convertFields.signinRecord(record);

    if (recordObj.status !== 'pending') {
      res.status(400).json({ error: '当前状态不允许标记缺席' });
      return;
    }

    const now = new Date().toISOString();

    await db.run(
      `UPDATE expert_signin_records SET 
        status = 'absent',
        signin_complete_reason = ?,
        handler_id = ?,
        handler_name = ?,
        handler_role = ?,
        updated_at = ?
       WHERE id = ?`,
      [reason || '未按时到场，无法联系', user.id, user.name, user.role, now, req.params.id]
    );

    await logOperation(
      'signin',
      req.params.id,
      '标记缺席',
      `专家「${recordObj.expertName}」标记为缺席。${reason ? '原因：' + reason : ''}`,
      user.id,
      user.name,
      user.role,
      'pending',
      'absent',
      { reason }
    );

    const project = await db.get('SELECT * FROM projects WHERE id = ?', [recordObj.projectId]);
    if (project) {
      const projectObj = convertFields.project(project);
      const arrangement = await db.get(
        'SELECT * FROM project_arrangements WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
        [recordObj.projectId]
      );
      const arrangementObj = arrangement ? convertFields.arrangement(arrangement) : null;
      const allRecords = await db.all(
        'SELECT * FROM expert_signin_records WHERE project_id = ?',
        [recordObj.projectId]
      );
      const allRecordsObj = allRecords.map((r) => convertFields.signinRecord(r));

      const autoException = checkAutoTriggerException(projectObj, arrangementObj, allRecordsObj);
      if (autoException) {
        await checkAndTriggerExceptions(
          projectObj,
          arrangementObj,
          allRecordsObj,
          autoException,
          '标记专家缺席时系统自动检测'
        );
      }
    }

    const updated = await db.get('SELECT * FROM expert_signin_records WHERE id = ?', [req.params.id]);
    const updatedObj = convertFields.signinRecord(updated);
    res.json({
      ...updatedObj,
      statusDisplay: signinStatusDisplay.absent,
    });
  } catch (error) {
    console.error('Mark absent error:', error);
    res.status(500).json({ error: '标记缺席失败' });
  }
});

router.post('/:id/leave', authMiddleware, roleMiddleware('review_secretary'), async (req: AuthRequest, res) => {
  try {
    const { leaveReason, substituteExpertId, substituteExpertName } = req.body;
    const db = await getDb();
    const user = req.user!;
    const record = await db.get('SELECT * FROM expert_signin_records WHERE id = ?', [req.params.id]);

    if (!record) {
      res.status(404).json({ error: '签到记录不存在' });
      return;
    }

    const recordObj = convertFields.signinRecord(record);

    if (recordObj.status !== 'pending') {
      res.status(400).json({ error: '当前状态不允许标记请假' });
      return;
    }

    if (!leaveReason) {
      res.status(400).json({ error: '请填写请假原因' });
      return;
    }

    const now = new Date().toISOString();

    await db.run(
      `UPDATE expert_signin_records SET 
        status = 'leave',
        leave_reason = ?,
        substitute_expert_id = ?,
        substitute_expert_name = ?,
        handler_id = ?,
        handler_name = ?,
        handler_role = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        leaveReason,
        substituteExpertId || null,
        substituteExpertName || null,
        user.id,
        user.name,
        user.role,
        now,
        req.params.id,
      ]
    );

    await logOperation(
      'signin',
      req.params.id,
      '标记请假',
      `专家「${recordObj.expertName}」请假。原因：${leaveReason}${
        substituteExpertName ? `，已更换为：${substituteExpertName}` : ''
      }`,
      user.id,
      user.name,
      user.role,
      'pending',
      'leave',
      { leaveReason, substituteExpertId, substituteExpertName }
    );

    if (substituteExpertId && substituteExpertName) {
      const newRecordId = uuidv4();
      await db.run(
        `INSERT INTO expert_signin_records (
          id, project_id, project_no, project_name, arrangement_id,
          expert_id, expert_name, expertise, status, scheduled_arrival_time,
          is_supervision, attachments, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
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
        ]
      );

      await db.run(
        `UPDATE expert_signin_records SET status = 'substituted', updated_at = ? WHERE id = ?`,
        [now, req.params.id]
      );

      await logOperation(
        'signin',
        newRecordId,
        '创建替补签到记录',
        `替补专家「${substituteExpertName}」签到记录已创建`,
        user.id,
        user.name,
        user.role,
        undefined,
        'pending'
      );
    }

    const project = await db.get('SELECT * FROM projects WHERE id = ?', [recordObj.projectId]);
    if (project) {
      const projectObj = convertFields.project(project);
      const arrangement = await db.get(
        'SELECT * FROM project_arrangements WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
        [recordObj.projectId]
      );
      const arrangementObj = arrangement ? convertFields.arrangement(arrangement) : null;
      const allRecords = await db.all(
        'SELECT * FROM expert_signin_records WHERE project_id = ?',
        [recordObj.projectId]
      );
      const allRecordsObj = allRecords.map((r) => convertFields.signinRecord(r));

      const autoException = checkAutoTriggerException(projectObj, arrangementObj, allRecordsObj);
      if (autoException) {
        await checkAndTriggerExceptions(
          projectObj,
          arrangementObj,
          allRecordsObj,
          autoException,
          '标记专家请假时系统自动检测'
        );
      }
    }

    const updated = await db.get('SELECT * FROM expert_signin_records WHERE id = ?', [req.params.id]);
    const updatedObj = convertFields.signinRecord(updated);
    res.json({
      ...updatedObj,
      statusDisplay: signinStatusDisplay.leave,
    });
  } catch (error) {
    console.error('Mark leave error:', error);
    res.status(500).json({ error: '标记请假失败' });
  }
});

export default router;
