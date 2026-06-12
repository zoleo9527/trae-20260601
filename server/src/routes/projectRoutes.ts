import { Router, Request, Response } from 'express';
import { projectService } from '../services/projectService.ts';
import type { ProjectStatus } from '../types.ts';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { page, pageSize, status, handler } = req.query;
    const result = projectService.findAll({
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      status: status as string | undefined,
      handler: handler as string | undefined,
    });

    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const project = projectService.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: { code: 'PROJECT_001', message: '项目不存在' } });
    }
    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { name, client, budget, biddingType, handler, documentHandler, reason } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: { code: 'PROJECT_003', message: '缺少必填字段: name' } });
    }
    if (!client?.trim()) {
      return res.status(400).json({ success: false, error: { code: 'PROJECT_003', message: '缺少必填字段: client' } });
    }
    if (!budget || budget <= 0) {
      return res.status(400).json({ success: false, error: { code: 'PROJECT_003', message: '缺少必填字段: budget' } });
    }
    if (!handler?.trim()) {
      return res.status(400).json({ success: false, error: { code: 'PROJECT_003', message: '缺少必填字段: handler' } });
    }
    if (!documentHandler?.trim()) {
      return res.status(400).json({ success: false, error: { code: 'PROJECT_003', message: '缺少必填字段: documentHandler' } });
    }
    if (!reason?.trim()) {
      return res.status(400).json({ success: false, error: { code: 'PROJECT_003', message: '缺少必填字段: reason' } });
    }

    const project = projectService.create({ name, client, budget, biddingType, handler, documentHandler, reason });
    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

router.patch('/:id', (req: Request, res: Response) => {
  try {
    const project = projectService.update(req.params.id, req.body);
    if (!project) {
      return res.status(404).json({ success: false, error: { code: 'PROJECT_001', message: '项目不存在' } });
    }
    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

router.patch('/:id/status', (req: Request, res: Response) => {
  try {
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: { code: 'PROJECT_003', message: '缺少必填字段: status' } });
    }
    if (!reason?.trim()) {
      return res.status(400).json({ success: false, error: { code: 'PROJECT_003', message: '缺少必填字段: reason' } });
    }

    const userId = req.headers['x-user-id'] as string || '系统';
    const project = projectService.updateStatus(req.params.id, status as ProjectStatus, reason, userId);
    res.json({ success: true, data: project });
  } catch (error: any) {
    const message = error.message || '';
    if (message.includes('PROJECT_001')) {
      return res.status(404).json({ success: false, error: { code: 'PROJECT_001', message: '项目不存在' } });
    }
    if (message.includes('PROJECT_002')) {
      return res.status(400).json({ success: false, error: { code: 'PROJECT_002', message: '状态流转不合规' } });
    }
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    projectService.delete(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

export default router;
