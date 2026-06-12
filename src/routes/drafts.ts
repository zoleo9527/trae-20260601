import { Router, Request, Response } from 'express';
import { DraftService, CreateDraftDTO, UpdateDraftDTO } from '../services/DraftService';
import { RecordFilters } from '../services/RecordService';

const router = Router();
const draftService = new DraftService();

router.post('/', (req: Request, res: Response) => {
  try {
    const data: CreateDraftDTO = req.body;
    const record = draftService.createDraft(data);
    res.status(201).json({
      success: true,
      data: record,
      message: '申报底稿创建成功'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const record = draftService.getDraftById(req.params.id);
    if (!record) {
      res.status(404).json({
        success: false,
        error: '记录不存在'
      });
      return;
    }
    res.json({
      success: true,
      data: record
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const data: UpdateDraftDTO = req.body;
    const userId = req.headers['x-user-id'] as string || 'unknown';
    const record = draftService.updateDraft(req.params.id, data, userId);
    res.json({
      success: true,
      data: record,
      message: '申报底稿更新成功'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:id/submit', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'unknown';
    const record = draftService.submitDraft(req.params.id, userId);
    res.json({
      success: true,
      data: record,
      message: '申报底稿已提交，等待客户确认'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
