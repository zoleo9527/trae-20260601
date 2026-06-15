import express, { Request, Response } from 'express';
import { BatchProcessingService } from '../services/batch-processing.service';
import { sampleFiles } from '../data/sample-data';
import { OperatorRole } from '../models/file-lifecycle.model';

const router = express.Router();
const batchService = new BatchProcessingService();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    role: OperatorRole;
  };
}

router.post('/expired-files', (req: AuthenticatedRequest, res: Response) => {
  const result = batchService.processExpiredFiles(sampleFiles);

  res.json({
    success: result.success,
    summary: {
      processed: result.processedCount,
      failed: result.failedCount,
      timestamp: new Date()
    },
    results: result.results,
    reminders: result.reminders
  });
});

router.post('/send-reminders', (req: AuthenticatedRequest, res: Response) => {
  const result = batchService.sendPendingReminders(sampleFiles);

  res.json({
    success: result.success,
    summary: {
      processed: result.processedCount,
      remindersTriggered: result.reminders.length,
      timestamp: new Date()
    },
    results: result.results,
    reminders: result.reminders
  });
});

router.post('/transfer-responsibility', (req: AuthenticatedRequest, res: Response) => {
  const { fromRole, toRole, reason } = req.body;

  const result = batchService.transferResponsibility(
    sampleFiles,
    fromRole,
    toRole,
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
    reminders: result.reminders
  });
});

export default router;
