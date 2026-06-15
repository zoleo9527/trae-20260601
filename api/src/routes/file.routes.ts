import express, { Request, Response, NextFunction } from 'express';
import { workflowService } from '../services/file-workflow.service';
import { OperatorRole, FileStatus } from '../models/file-lifecycle.model';

const router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    role: OperatorRole;
  };
}

const requireRole = (...allowedRoles: OperatorRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证，请先登录' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: '权限不足',
        required: allowedRoles,
        current: req.user.role
      });
    }
    next();
  };
};

router.get(
  '/logs',
  requireRole(OperatorRole.WINDOW_STAFF, OperatorRole.NOTARY, OperatorRole.ARCHIVE_KEEPER),
  (req: AuthenticatedRequest, res: Response) => {
    const { fileId } = req.query;

    const logs = workflowService.getOperationLogs(fileId as string | undefined);

    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  }
);

router.get(
  '/',
  requireRole(OperatorRole.WINDOW_STAFF, OperatorRole.NOTARY, OperatorRole.ARCHIVE_KEEPER),
  (req: AuthenticatedRequest, res: Response) => {
    const { status, role } = req.query;

    let files = workflowService.getAllFiles();

    if (status) {
      files = workflowService.getFilesByStatus(status as FileStatus);
    }

    if (role) {
      files = workflowService.getFilesByRole(role as OperatorRole);
    }

    res.json({
      success: true,
      data: files,
      count: files.length
    });
  }
);

router.get(
  '/:fileId',
  requireRole(OperatorRole.WINDOW_STAFF, OperatorRole.NOTARY, OperatorRole.ARCHIVE_KEEPER),
  (req: AuthenticatedRequest, res: Response) => {
    const { fileId } = req.params;

    const file = workflowService.getFileById(fileId);

    if (!file) {
      return res.status(404).json({ error: '卷宗不存在' });
    }

    res.json({
      success: true,
      data: file
    });
  }
);

router.post(
  '/:fileId/archive/start',
  requireRole(OperatorRole.WINDOW_STAFF, OperatorRole.NOTARY),
  (req: AuthenticatedRequest, res: Response) => {
    const { fileId } = req.params;
    const file = workflowService.getFileById(fileId);

    if (!file) {
      return res.status(404).json({ error: '卷宗不存在' });
    }

    try {
      const result = workflowService.startArchiveProcess(
        file,
        req.user!.id,
        req.user!.name
      );

      res.json({
        success: true,
        data: result,
        timestamp: new Date(),
        message: '归档流程已启动'
      });
    } catch (error) {
      res.status(400).json({ error: '启动归档失败', details: error });
    }
  }
);

router.post(
  '/:fileId/archive/complete',
  requireRole(OperatorRole.WINDOW_STAFF, OperatorRole.NOTARY, OperatorRole.ARCHIVE_KEEPER),
  (req: AuthenticatedRequest, res: Response) => {
    const { fileId } = req.params;
    const { archiveLocation, archiveReason, archiveNote, notarialApproval } = req.body;

    const file = workflowService.getFileById(fileId);
    if (!file) {
      return res.status(404).json({ error: '卷宗不存在' });
    }

    try {
      const result = workflowService.completeArchive(
        file,
        archiveLocation,
        archiveReason,
        archiveNote,
        req.user!.id,
        req.user!.name,
        notarialApproval
      );

      if (req.user!.role === OperatorRole.NOTARY || req.user!.role === OperatorRole.ARCHIVE_KEEPER) {
        workflowService.autoTransferToCollection(
          fileId,
          req.user!.id,
          req.user!.name,
          OperatorRole.ARCHIVE_KEEPER
        );
      }

      res.json({
        success: true,
        data: result,
        operationLog: {
          action: 'COMPLETE_ARCHIVE',
          operator: req.user!.name,
          timestamp: new Date()
        },
        message: '归档已完成，已自动转移至档案室等待领取'
      });
    } catch (error) {
      res.status(400).json({ error: '完成归档失败' });
    }
  }
);

router.post(
  '/:fileId/transfer-to-collection',
  requireRole(OperatorRole.WINDOW_STAFF, OperatorRole.NOTARY, OperatorRole.ARCHIVE_KEEPER),
  (req: AuthenticatedRequest, res: Response) => {
    const { fileId } = req.params;
    const { assignedRole, assignedOperatorId, assignedOperatorName, transferReason } = req.body;

    const file = workflowService.getFileById(fileId);
    if (!file) {
      return res.status(404).json({ error: '卷宗不存在' });
    }

    try {
      const assignedTo = {
        role: assignedRole || OperatorRole.ARCHIVE_KEEPER,
        operatorId: assignedOperatorId || 'USER-A001',
        operatorName: assignedOperatorName || '李档案'
      };

      const { file: updatedFile, handoverRecord } = workflowService.transferToCollectionConfirmation(
        file,
        assignedTo,
        transferReason || '归档完成，转移至档案室等待领取',
        req.user!.id,
        req.user!.name
      );

      const history = workflowService.getFileHistory(fileId);

      res.json({
        success: true,
        data: updatedFile,
        handoverRecord,
        transferredContext: {
          responsiblePerson: updatedFile.responsiblePerson,
          archiveInfo: updatedFile.archiveInfo,
          responsibilityChain: updatedFile.responsibilityChain,
          recentHistory: history.slice(0, 5)
        },
        operationLog: {
          action: 'TRANSFER_TO_COLLECTION',
          from: req.user!.name,
          to: assignedTo.operatorName,
          reason: transferReason,
          timestamp: new Date()
        },
        message: '卷宗已转移至档案室，等待领取确认'
      });
    } catch (error) {
      res.status(400).json({ error: '转移至领取确认失败' });
    }
  }
);

router.get(
  '/:fileId/collection-context',
  requireRole(OperatorRole.ARCHIVE_KEEPER),
  (req: AuthenticatedRequest, res: Response) => {
    const { fileId } = req.params;

    const context = workflowService.getTransferContext(fileId);
    const handoverRecord = workflowService.getHandoverRecord(fileId);

    res.json({
      success: true,
      data: {
        ...context,
        pendingHandover: handoverRecord || null
      }
    });
  }
);

router.get(
  '/:fileId/collection-context/detailed',
  requireRole(OperatorRole.ARCHIVE_KEEPER),
  (req: AuthenticatedRequest, res: Response) => {
    const { fileId } = req.params;

    const collectionContext = workflowService.getCollectionContext(fileId);
    const file = workflowService.getFileById(fileId);

    if (!collectionContext || !file) {
      return res.status(404).json({ error: '领取上下文不存在' });
    }

    res.json({
      success: true,
      data: {
        fileInfo: {
          id: file.id,
          appointmentNumber: file.appointmentNumber,
          applicationId: file.applicationId,
          currentStatus: file.currentStatus,
          expiresAt: file.expiresAt
        },
        archiveContext: collectionContext.archiveContext,
        handoverRecord: collectionContext.handoverRecord,
        responsibilityChain: collectionContext.responsibilityChain,
        recentHistory: collectionContext.recentHistory,
        pendingCorrections: collectionContext.pendingCorrections,
        allHistory: workflowService.getFileHistory(fileId)
      }
    });
  }
);

router.post(
  '/:fileId/collection/confirm',
  requireRole(OperatorRole.ARCHIVE_KEEPER),
  (req: AuthenticatedRequest, res: Response) => {
    const { fileId } = req.params;
    const { collectorName, collectorId, collectionNote } = req.body;

    const file = workflowService.getFileById(fileId);
    if (!file) {
      return res.status(404).json({ error: '卷宗不存在' });
    }

    try {
      const result = workflowService.confirmCollection(
        file,
        collectorName,
        collectorId,
        collectionNote,
        req.user!.id,
        req.user!.name
      );

      res.json({
        success: true,
        data: result,
        operationLog: {
          action: 'CONFIRM_COLLECTION',
          collector: collectorName,
          operator: req.user!.name,
          timestamp: new Date()
        },
        message: '领取确认已完成'
      });
    } catch (error) {
      res.status(400).json({ error: '确认领取失败' });
    }
  }
);

router.post(
  '/:fileId/correction',
  requireRole(OperatorRole.WINDOW_STAFF, OperatorRole.NOTARY, OperatorRole.ARCHIVE_KEEPER),
  (req: AuthenticatedRequest, res: Response) => {
    const { fileId } = req.params;
    const { correctionContent } = req.body;

    const file = workflowService.getFileById(fileId);
    if (!file) {
      return res.status(404).json({ error: '卷宗不存在' });
    }

    try {
      const result = workflowService.requestCorrection(
        file,
        correctionContent,
        req.user!.id,
        req.user!.name,
        req.user!.role
      );

      res.json({
        success: true,
        data: result,
        reminder: {
          type: 'CORRECTION_PENDING',
          recipient: result.responsiblePerson?.operatorId,
          recipientName: result.responsiblePerson?.operatorName,
          message: `卷宗需要补正: ${correctionContent}`,
          actionRequired: '联系申请人补充材料'
        },
        message: '补正通知已发送'
      });
    } catch (error) {
      res.status(400).json({ error: '发起补正失败' });
    }
  }
);

router.get(
  '/:fileId/history',
  requireRole(OperatorRole.WINDOW_STAFF, OperatorRole.NOTARY, OperatorRole.ARCHIVE_KEEPER),
  (req: AuthenticatedRequest, res: Response) => {
    const { fileId } = req.params;

    const history = workflowService.getFileHistory(fileId);

    res.json({
      success: true,
      data: history,
      count: history.length
    });
  }
);

router.get(
  '/reminders/my',
  requireRole(OperatorRole.WINDOW_STAFF, OperatorRole.NOTARY, OperatorRole.ARCHIVE_KEEPER),
  (req: AuthenticatedRequest, res: Response) => {
    const reminders = workflowService.getPendingReminders(req.user!.id);

    res.json({
      success: true,
      data: reminders,
      count: reminders.length,
      summary: {
        urgent: reminders.filter(r => r.priority === 'URGENT').length,
        high: reminders.filter(r => r.priority === 'HIGH').length,
        medium: reminders.filter(r => r.priority === 'MEDIUM').length,
        low: reminders.filter(r => r.priority === 'LOW').length
      }
    });
  }
);

router.post(
  '/reminders/:reminderId/acknowledge',
  requireRole(OperatorRole.WINDOW_STAFF, OperatorRole.NOTARY, OperatorRole.ARCHIVE_KEEPER),
  (req: AuthenticatedRequest, res: Response) => {
    const { reminderId } = req.params;

    const success = workflowService.acknowledgeReminder(
      reminderId,
      req.user!.id,
      req.user!.name
    );

    res.json({
      success,
      acknowledgedAt: success ? new Date() : null,
      message: success ? '提醒已确认' : '确认失败'
    });
  }
);

router.get(
  '/handover/pending',
  requireRole(OperatorRole.ARCHIVE_KEEPER),
  (req: AuthenticatedRequest, res: Response) => {
    const files = workflowService.getFilesByStatus(FileStatus.PENDING_COLLECTION);

    const pendingHandovers = files.map(file => ({
      file,
      handover: workflowService.getHandoverRecord(file.id),
      collectionContext: workflowService.getCollectionContext(file.id)
    }));

    res.json({
      success: true,
      data: pendingHandovers,
      count: pendingHandovers.length
    });
  }
);

router.post(
  '/handover/:handoverId/acknowledge',
  requireRole(OperatorRole.ARCHIVE_KEEPER),
  (req: AuthenticatedRequest, res: Response) => {
    const { handoverId } = req.params;

    const success = workflowService.acknowledgeHandover(handoverId, req.user!.id);

    res.json({
      success,
      acknowledgedAt: success ? new Date() : null,
      message: success ? '交接已确认' : '确认失败'
    });
  }
);

router.get(
  '/scenarios/imperfect',
  requireRole(OperatorRole.WINDOW_STAFF, OperatorRole.NOTARY, OperatorRole.ARCHIVE_KEEPER),
  (req: AuthenticatedRequest, res: Response) => {
    const scenarios = workflowService.generateImperfectScenarios();

    res.json({
      success: true,
      data: scenarios,
      count: scenarios.length,
      message: '以下是可能出现的流程断裂场景，可触发相应提醒'
    });
  }
);

router.post(
  '/scenarios/:scenarioId/trigger-reminder',
  requireRole(OperatorRole.WINDOW_STAFF, OperatorRole.NOTARY, OperatorRole.ARCHIVE_KEEPER),
  (req: AuthenticatedRequest, res: Response) => {
    const { scenarioId } = req.params;

    const scenarios = workflowService.generateImperfectScenarios();
    const scenario = scenarios.find(s => s.scenarioId === scenarioId);

    if (!scenario) {
      return res.status(404).json({ error: '场景不存在' });
    }

    const reminder = scenario.triggerReminder();

    res.json({
      success: true,
      data: reminder,
      message: `已触发提醒：${scenario.scenario}`
    });
  }
);

export default router;
