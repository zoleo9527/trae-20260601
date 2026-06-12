import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import { ArrangementStatus, arrangementStatusDisplay, Project } from '../types';
import { getArrangementAvailableTransitions } from '../utils/statusMachine';
import { logOperation, parseAttachmentJson } from '../utils/operationLogger';
import { convertToCamelCase, convertFields } from '../utils/fieldConverter';

const router = express.Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { projectId, status } = req.query;

    let sql = 'SELECT * FROM project_arrangements WHERE 1=1';
    const params: string[] = [];

    if (projectId) {
      sql += ' AND project_id = ?';
      params.push(projectId as string);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status as string);
    }

    sql += ' ORDER BY created_at DESC';

    const arrangements = await db.all(sql, params);

    const result = arrangements.map((a) => ({
      ...convertFields.arrangement(a),
      statusDisplay: arrangementStatusDisplay[a.status as ArrangementStatus],
    }));

    res.json(result);
  } catch (error) {
    console.error('Get arrangements error:', error);
    res.status(500).json({ error: '获取开评标安排列表失败' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const arrangement = await db.get('SELECT * FROM project_arrangements WHERE id = ?', [req.params.id]);

    if (!arrangement) {
      res.status(404).json({ error: '开评标安排不存在' });
      return;
    }

    const arrangementObj = convertFields.arrangement(arrangement);
    const result = {
      ...arrangementObj,
      statusDisplay: arrangementStatusDisplay[arrangementObj.status as ArrangementStatus],
    };

    res.json(result);
  } catch (error) {
    console.error('Get arrangement error:', error);
    res.status(500).json({ error: '获取开评标安排详情失败' });
  }
});

router.get('/:id/transitions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const arrangement = await db.get('SELECT * FROM project_arrangements WHERE id = ?', [req.params.id]);

    if (!arrangement) {
      res.status(404).json({ error: '开评标安排不存在' });
      return;
    }

    const arrangementObj = convertFields.arrangement(arrangement);
    const user = req.user!;
    const transitions = getArrangementAvailableTransitions(
      arrangementObj.status as ArrangementStatus,
      user.role
    );

    res.json(transitions);
  } catch (error) {
    console.error('Get transitions error:', error);
    res.status(500).json({ error: '获取可用操作失败' });
  }
});

router.post('/', authMiddleware, roleMiddleware('project_specialist'), async (req: AuthRequest, res) => {
  try {
    const {
      projectId,
      biddingDate,
      biddingStartTime,
      biddingEndTime,
      biddingLocation,
      roomNumber,
      expertIds,
      supervisionExpertId,
      supervisionExpertName,
      documentPreparation,
      venueReservation,
      equipmentCheck,
      materialPrinting,
      financeConfirmed,
      depositReceived,
      feeCalculated,
    } = req.body;

    if (!projectId || !biddingDate || !biddingStartTime || !biddingEndTime || !biddingLocation || !roomNumber || !expertIds) {
      res.status(400).json({ error: '必填字段不能为空' });
      return;
    }

    const db = await getDb();
    const user = req.user!;

    const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      res.status(404).json({ error: '项目不存在' });
      return;
    }

    const projectObj = convertFields.project(project);

    const arrangementId = uuidv4();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO project_arrangements (
        id, project_id, project_no, project_name, status,
        bidding_date, bidding_start_time, bidding_end_time,
        bidding_location, room_number, expert_count, expert_ids,
        supervision_expert_id, supervision_expert_name,
        document_preparation, venue_reservation, equipment_check,
        material_printing, finance_confirmed, deposit_received,
        fee_calculated, applicant_id, applicant_name, applicant_role,
        attachments, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        arrangementId,
        projectId,
        projectObj.projectNo,
        projectObj.name,
        'pending',
        biddingDate,
        biddingStartTime,
        biddingEndTime,
        biddingLocation,
        roomNumber,
        expertIds.length,
        JSON.stringify(expertIds),
        supervisionExpertId,
        supervisionExpertName,
        documentPreparation ? 1 : 0,
        venueReservation ? 1 : 0,
        equipmentCheck ? 1 : 0,
        materialPrinting ? 1 : 0,
        financeConfirmed ? 1 : 0,
        depositReceived ? 1 : 0,
        feeCalculated ? 1 : 0,
        user.id,
        user.name,
        user.role,
        '[]',
        now,
        now,
      ]
    );

    await db.run(
      `UPDATE projects SET 
        status = 'arrangement_pending',
        estimated_bidding_date = ?,
        bidding_location = ?,
        room_number = ?,
        updated_at = ?
       WHERE id = ?`,
      [biddingDate, biddingLocation, roomNumber, now, projectId]
    );

    await logOperation(
      'arrangement',
      arrangementId,
      '创建开评标安排',
      `为项目「${project.name}」创建开评标安排`,
      user.id,
      user.name,
      user.role,
      undefined,
      'pending'
    );

    await logOperation(
      'project',
      projectId,
      '更新项目状态',
      '项目状态变更为：待安排',
      user.id,
      user.name,
      user.role,
      projectObj.status,
      'arrangement_pending'
    );

    const arrangement = await db.get('SELECT * FROM project_arrangements WHERE id = ?', [arrangementId]);
    const arrangementObj = convertFields.arrangement(arrangement);
    res.json({
      ...arrangementObj,
      statusDisplay: arrangementStatusDisplay.pending,
    });
  } catch (error) {
    console.error('Create arrangement error:', error);
    res.status(500).json({ error: '创建开评标安排失败' });
  }
});

router.post('/:id/submit', authMiddleware, roleMiddleware('project_specialist'), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const arrangement = await db.get('SELECT * FROM project_arrangements WHERE id = ?', [req.params.id]);

    if (!arrangement) {
      res.status(404).json({ error: '开评标安排不存在' });
      return;
    }

    const arrangementObj = convertFields.arrangement(arrangement);

    if (arrangementObj.status !== 'pending' && arrangementObj.status !== 'modified') {
      res.status(400).json({ error: '当前状态不允许提交审核' });
      return;
    }

    const now = new Date().toISOString();

    await db.run(
      `UPDATE project_arrangements SET 
        status = 'reviewing',
        updated_at = ?
       WHERE id = ?`,
      [now, req.params.id]
    );

    await db.run(
      `UPDATE projects SET 
        status = 'arrangement_reviewing',
        updated_at = ?
       WHERE id = ?`,
      [now, arrangementObj.projectId]
    );

    await logOperation(
      'arrangement',
      req.params.id,
      '提交审核',
      '开评标安排已提交审核',
      user.id,
      user.name,
      user.role,
      arrangementObj.status,
      'reviewing'
    );

    await logOperation(
      'project',
      arrangementObj.projectId,
      '更新项目状态',
      '项目状态变更为：安排审核中',
      user.id,
      user.name,
      user.role,
      'arrangement_pending',
      'arrangement_reviewing'
    );

    const updated = await db.get('SELECT * FROM project_arrangements WHERE id = ?', [req.params.id]);
    const updatedObj = convertFields.arrangement(updated);
    res.json({
      ...updatedObj,
      statusDisplay: arrangementStatusDisplay.reviewing,
    });
  } catch (error) {
    console.error('Submit arrangement error:', error);
    res.status(500).json({ error: '提交审核失败' });
  }
});

router.post('/:id/approve', authMiddleware, roleMiddleware('review_secretary'), async (req: AuthRequest, res) => {
  try {
    const { reviewComment } = req.body;
    const db = await getDb();
    const user = req.user!;
    const arrangement = await db.get('SELECT * FROM project_arrangements WHERE id = ?', [req.params.id]);

    if (!arrangement) {
      res.status(404).json({ error: '开评标安排不存在' });
      return;
    }

    const arrangementObj = convertFields.arrangement(arrangement);

    if (arrangementObj.status !== 'reviewing') {
      res.status(400).json({ error: '当前状态不允许审核通过' });
      return;
    }

    const now = new Date().toISOString();

    await db.run(
      `UPDATE project_arrangements SET 
        status = 'approved',
        reviewer_id = ?,
        reviewer_name = ?,
        review_comment = ?,
        reviewed_at = ?,
        updated_at = ?
       WHERE id = ?`,
      [user.id, user.name, reviewComment, now, now, req.params.id]
    );

    await db.run(
      `UPDATE projects SET 
        status = 'arrangement_approved',
        updated_at = ?
       WHERE id = ?`,
      [now, arrangementObj.projectId]
    );

    await logOperation(
      'arrangement',
      req.params.id,
      '审核通过',
      `开评标安排审核通过。${reviewComment ? '审核意见：' + reviewComment : ''}`,
      user.id,
      user.name,
      user.role,
      'reviewing',
      'approved'
    );

    await logOperation(
      'project',
      arrangementObj.projectId,
      '更新项目状态',
      '项目状态变更为：安排已通过',
      user.id,
      user.name,
      user.role,
      'arrangement_reviewing',
      'arrangement_approved'
    );

    const expertIds = arrangementObj.expertIds || [];
    if (expertIds.length > 0) {
      const now = new Date().toISOString();
      const scheduledArrivalTime = `${arrangementObj.biddingDate}T${arrangementObj.biddingStartTime || '09:00:00'}`;

      for (const expertId of expertIds) {
        const expert = await db.get('SELECT * FROM experts WHERE id = ?', [expertId]);
        const expertObj = expert ? convertFields.expert(expert) : null;

        const supervisionExpertId = arrangementObj.supervisionExpertId;
        const isSupervision = supervisionExpertId && expertId === supervisionExpertId ? 1 : 0;

        const signinId = uuidv4();
        await db.run(
          `INSERT INTO expert_signin_records (
            id, project_id, project_no, project_name, arrangement_id,
            expert_id, expert_name, expertise, status, scheduled_arrival_time,
            is_supervision, attachments, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            signinId,
            arrangementObj.projectId,
            arrangementObj.projectNo,
            arrangementObj.projectName,
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
          `安排审批通过，自动创建专家「${expertObj?.name || expertId}」签到记录`,
          user.id,
          user.name,
          user.role,
          undefined,
          'pending'
        );
      }

      await db.run(
        `UPDATE projects SET 
          status = 'expert_signin_pending',
          updated_at = ?
         WHERE id = ?`,
        [now, arrangementObj.projectId]
      );

      await logOperation(
        'project',
        arrangementObj.projectId,
        '更新项目状态',
        '已初始化专家签到，项目状态变更为：待专家签到',
        user.id,
        user.name,
        user.role,
        'arrangement_approved',
        'expert_signin_pending'
      );
    }

    const updated = await db.get('SELECT * FROM project_arrangements WHERE id = ?', [req.params.id]);
    const updatedObj = convertFields.arrangement(updated);
    res.json({
      ...updatedObj,
      statusDisplay: arrangementStatusDisplay.approved,
    });
  } catch (error) {
    console.error('Approve arrangement error:', error);
    res.status(500).json({ error: '审核通过失败' });
  }
});

router.post('/:id/reject', authMiddleware, roleMiddleware('review_secretary'), async (req: AuthRequest, res) => {
  try {
    const { rejectReason } = req.body;
    const db = await getDb();
    const user = req.user!;
    const arrangement = await db.get('SELECT * FROM project_arrangements WHERE id = ?', [req.params.id]);

    if (!arrangement) {
      res.status(404).json({ error: '开评标安排不存在' });
      return;
    }

    const arrangementObj = convertFields.arrangement(arrangement);

    if (arrangementObj.status !== 'reviewing') {
      res.status(400).json({ error: '当前状态不允许退回' });
      return;
    }

    if (!rejectReason) {
      res.status(400).json({ error: '请填写退回原因' });
      return;
    }

    const now = new Date().toISOString();

    await db.run(
      `UPDATE project_arrangements SET 
        status = 'rejected',
        reviewer_id = ?,
        reviewer_name = ?,
        reject_reason = ?,
        rejected_at = ?,
        block_reason = ?,
        block_at = ?,
        block_handler_id = ?,
        block_handler_name = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        user.id,
        user.name,
        rejectReason,
        now,
        `开评标安排已被退回：${rejectReason}`,
        now,
        arrangementObj.applicantId,
        arrangementObj.applicantName,
        now,
        req.params.id,
      ]
    );

    await db.run(
      `UPDATE projects SET 
        status = 'arrangement_rejected',
        current_handler_id = ?,
        current_handler_name = ?,
        current_handler_role = ?,
        updated_at = ?
       WHERE id = ?`,
      [arrangementObj.applicantId, arrangementObj.applicantName, arrangementObj.applicantRole, now, arrangementObj.projectId]
    );

    await logOperation(
      'arrangement',
      req.params.id,
      '审核退回',
      `开评标安排已被退回。退回原因：${rejectReason}`,
      user.id,
      user.name,
      user.role,
      'reviewing',
      'rejected'
    );

    await logOperation(
      'project',
      arrangementObj.projectId,
      '更新项目状态',
      '项目状态变更为：安排已退回',
      user.id,
      user.name,
      user.role,
      'arrangement_reviewing',
      'arrangement_rejected'
    );

    const updated = await db.get('SELECT * FROM project_arrangements WHERE id = ?', [req.params.id]);
    const updatedObj = convertFields.arrangement(updated);
    res.json({
      ...updatedObj,
      statusDisplay: arrangementStatusDisplay.rejected,
    });
  } catch (error) {
    console.error('Reject arrangement error:', error);
    res.status(500).json({ error: '退回失败' });
  }
});

router.put('/:id', authMiddleware, roleMiddleware('project_specialist'), async (req: AuthRequest, res) => {
  try {
    const {
      biddingDate,
      biddingStartTime,
      biddingEndTime,
      biddingLocation,
      roomNumber,
      expertIds,
      supervisionExpertId,
      supervisionExpertName,
      documentPreparation,
      venueReservation,
      equipmentCheck,
      materialPrinting,
      financeConfirmed,
      depositReceived,
      feeCalculated,
    } = req.body;

    const db = await getDb();
    const user = req.user!;
    const arrangement = await db.get('SELECT * FROM project_arrangements WHERE id = ?', [req.params.id]);

    if (!arrangement) {
      res.status(404).json({ error: '开评标安排不存在' });
      return;
    }

    const arrangementObj = convertFields.arrangement(arrangement);

    if (arrangementObj.status === 'approved' || arrangementObj.status === 'reviewing') {
      res.status(400).json({ error: '当前状态不允许修改' });
      return;
    }

    const now = new Date().toISOString();
    const newStatus = arrangementObj.status === 'rejected' ? 'modified' : arrangementObj.status;

    await db.run(
      `UPDATE project_arrangements SET 
        bidding_date = ?,
        bidding_start_time = ?,
        bidding_end_time = ?,
        bidding_location = ?,
        room_number = ?,
        expert_count = ?,
        expert_ids = ?,
        supervision_expert_id = ?,
        supervision_expert_name = ?,
        document_preparation = ?,
        venue_reservation = ?,
        equipment_check = ?,
        material_printing = ?,
        finance_confirmed = ?,
        deposit_received = ?,
        fee_calculated = ?,
        status = ?,
        last_modified_at = ?,
        modification_count = modification_count + 1,
        block_reason = NULL,
        block_at = NULL,
        block_handler_id = NULL,
        block_handler_name = NULL,
        updated_at = ?
       WHERE id = ?`,
      [
        biddingDate || arrangement.bidding_date,
        biddingStartTime || arrangement.bidding_start_time,
        biddingEndTime || arrangement.bidding_end_time,
        biddingLocation || arrangement.bidding_location,
        roomNumber || arrangement.room_number,
        expertIds ? expertIds.length : arrangement.expert_count,
        expertIds ? JSON.stringify(expertIds) : arrangement.expert_ids,
        supervisionExpertId !== undefined ? supervisionExpertId : arrangement.supervision_expert_id,
        supervisionExpertName !== undefined ? supervisionExpertName : arrangement.supervision_expert_name,
        documentPreparation !== undefined ? (documentPreparation ? 1 : 0) : arrangement.document_preparation,
        venueReservation !== undefined ? (venueReservation ? 1 : 0) : arrangement.venue_reservation,
        equipmentCheck !== undefined ? (equipmentCheck ? 1 : 0) : arrangement.equipment_check,
        materialPrinting !== undefined ? (materialPrinting ? 1 : 0) : arrangement.material_printing,
        financeConfirmed !== undefined ? (financeConfirmed ? 1 : 0) : arrangement.finance_confirmed,
        depositReceived !== undefined ? (depositReceived ? 1 : 0) : arrangement.deposit_received,
        feeCalculated !== undefined ? (feeCalculated ? 1 : 0) : arrangement.fee_calculated,
        newStatus,
        now,
        now,
        req.params.id,
      ]
    );

    await logOperation(
      'arrangement',
      req.params.id,
      '修改开评标安排',
      `修改开评标安排，修改次数：${arrangementObj.modificationCount + 1}`,
      user.id,
      user.name,
      user.role,
      arrangementObj.status,
      newStatus
    );

    const updated = await db.get('SELECT * FROM project_arrangements WHERE id = ?', [req.params.id]);
    const updatedObj = convertFields.arrangement(updated);
    res.json({
      ...updatedObj,
      statusDisplay: arrangementStatusDisplay[newStatus as ArrangementStatus],
    });
  } catch (error) {
    console.error('Update arrangement error:', error);
    res.status(500).json({ error: '修改开评标安排失败' });
  }
});

export default router;
