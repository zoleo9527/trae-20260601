import express, { Request, Response, NextFunction } from 'express';
import { batchService } from '../services/batch-processing.service';
import { OperatorRole } from '../models/file-lifecycle.model';

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

router.post(
  '/expired-files',
  requireRole(OperatorRole.WINDOW_STAFF, OperatorRole.ARCHIVE_KEEPER),
  (req: AuthenticatedRequest, res: Response) => {
    const result = batchService.processExpiredFiles();

    res.json({
      success: result.success,
      summary: {
        processed: result.processedCount,
        failed: result.failedCount,
        timestamp: new Date()
      },
      results: result.results,
      reminders: result.reminders,
      logs: result.logs
    });
  }
);

router.post(
  '/send-reminders',
  requireRole(OperatorRole.WINDOW_STAFF, OperatorRole.NOTARY, OperatorRole.ARCHIVE_KEEPER),
  (req: AuthenticatedRequest, res: Response) => {
    const result = batchService.sendPendingReminders();

    res.json({
      success: result.success,
      summary: {
        processed: result.processedCount,
        remindersTriggered: result.reminders.length,
        timestamp: new Date()
      },
      results: result.results,
      reminders: result.reminders,
      logs: result.logs
    });
  }
);

router.post(
  '/transfer-responsibility',
  requireRole(OperatorRole.WINDOW_STAFF, OperatorRole.ARCHIVE_KEEPER),
  (req: AuthenticatedRequest, res: Response) => {
    const { fromRole, toRole, reason } = req.body;

    const result = batchService.transferResponsibility(
      fromRole as OperatorRole,
      toRole as OperatorRole,
      reason
    );

    res.json({
      success: result.success,
      summary: {
        processed: result.processedCount,
        failed: result.failedCount,
        reason,
        timestamp: new Date()
      },
      results: result.results,
      reminders: result.reminders,
      logs: result.logs
    });
  }
);

router.post(
  '/complete-archive',
  requireRole(OperatorRole.WINDOW_STAFF, OperatorRole.NOTARY),
  (req: AuthenticatedRequest, res: Response) => {
    const { fileIds, archiveLocation, archiveReason } = req.body;

    const result = batchService.batchCompleteArchive(
      fileIds,
      archiveLocation,
      archiveReason,
      req.user!.id,
      req.user!.name,
      req.user!.role
    );

    res.json({
      success: result.success,
      summary: {
        processed: result.processedCount,
        failed: result.failedCount,
        timestamp: new Date()
      },
      results: result.results,
      reminders: result.reminders,
      logs: result.logs
    });
  }
);

export default router;
