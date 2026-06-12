import { Router, Request, Response } from 'express';
import { documentService } from '../services/documentService.ts';
import type { DocumentStatus } from '../types.ts';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { projectId, status } = req.query;
    const documents = documentService.findAll({
      projectId: projectId as string | undefined,
      status: status as string | undefined,
    });
    res.json({ success: true, data: documents });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const document = documentService.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, error: { code: 'DOCUMENT_001', message: '文档不存在' } });
    }
    res.json({ success: true, data: document });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

router.patch('/:id', (req: Request, res: Response) => {
  try {
    const document = documentService.update(req.params.id, req.body);
    if (!document) {
      return res.status(404).json({ success: false, error: { code: 'DOCUMENT_001', message: '文档不存在' } });
    }
    res.json({ success: true, data: document });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

router.patch('/:id/status', (req: Request, res: Response) => {
  try {
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: { code: 'DOCUMENT_002', message: '缺少必填字段: status' } });
    }
    if (!reason?.trim()) {
      return res.status(400).json({ success: false, error: { code: 'DOCUMENT_002', message: '缺少必填字段: reason' } });
    }

    const userId = req.headers['x-user-id'] as string || '系统';
    const document = documentService.updateStatus(req.params.id, status as DocumentStatus, reason, userId);
    res.json({ success: true, data: document });
  } catch (error: any) {
    const message = error.message || '';
    if (message.includes('DOCUMENT_001')) {
      return res.status(404).json({ success: false, error: { code: 'DOCUMENT_001', message: '文档不存在' } });
    }
    if (message.includes('DOCUMENT_002')) {
      return res.status(400).json({ success: false, error: { code: 'DOCUMENT_002', message: message.split(':')[1] || '操作失败' } });
    }
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

router.post('/:id/qa-records', (req: Request, res: Response) => {
  try {
    const { question, answer, answeredBy } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ success: false, error: { code: 'DOCUMENT_002', message: '缺少必填字段: question' } });
    }
    if (!answer?.trim()) {
      return res.status(400).json({ success: false, error: { code: 'DOCUMENT_002', message: '缺少必填字段: answer' } });
    }

    const qaRecord = documentService.addQARecord(req.params.id, { question, answer, answeredBy: answeredBy || '系统' });
    res.json({ success: true, data: qaRecord });
  } catch (error: any) {
    const message = error.message || '';
    if (message.includes('DOCUMENT_001')) {
      return res.status(404).json({ success: false, error: { code: 'DOCUMENT_001', message: '文档不存在' } });
    }
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

router.post('/:id/evaluation', (req: Request, res: Response) => {
  try {
    const { scheduledAt, location, evaluators } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({ success: false, error: { code: 'DOCUMENT_002', message: '缺少必填字段: scheduledAt' } });
    }
    if (!location?.trim()) {
      return res.status(400).json({ success: false, error: { code: 'DOCUMENT_002', message: '缺少必填字段: location' } });
    }
    if (!evaluators || evaluators.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'DOCUMENT_002', message: '缺少必填字段: evaluators' } });
    }

    const evaluation = documentService.scheduleEvaluation(req.params.id, { scheduledAt, location, evaluators });
    res.json({ success: true, data: evaluation });
  } catch (error: any) {
    const message = error.message || '';
    if (message.includes('DOCUMENT_001')) {
      return res.status(404).json({ success: false, error: { code: 'DOCUMENT_001', message: '文档不存在' } });
    }
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

export default router;
