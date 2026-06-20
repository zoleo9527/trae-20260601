import { Router, Request, Response } from 'express';
import * as gradeService from '../services/grade.service';
import { ApiResponse } from '../types';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const judgment = gradeService.createGradeJudgment(req.body);
    res.json({ success: true, data: judgment, message: '品级判定创建成功' } as ApiResponse<typeof judgment>);
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message } as ApiResponse<null>);
  }
});

router.get('/', (req: Request, res: Response) => {
  const judgments = gradeService.getAllGradeJudgments();
  res.json({ success: true, data: judgments } as ApiResponse<typeof judgments>);
});

router.get('/:id', (req: Request, res: Response) => {
  const judgment = gradeService.getGradeJudgmentById(req.params.id);
  if (!judgment) {
    return res.status(404).json({ success: false, error: '品级判定不存在' } as ApiResponse<null>);
  }
  res.json({ success: true, data: judgment } as ApiResponse<typeof judgment>);
});

router.get('/batch/:batchId', (req: Request, res: Response) => {
  const judgments = gradeService.getGradeJudgmentsByBatchId(req.params.batchId);
  res.json({ success: true, data: judgments } as ApiResponse<typeof judgments>);
});

router.patch('/:id/review', (req: Request, res: Response) => {
  try {
    const { new_grade, new_unit_price, reviewer_id, reviewer_name, reason } = req.body;
    const result = gradeService.updateGradeJudgment(
      req.params.id,
      new_grade,
      new_unit_price,
      reviewer_id,
      reviewer_name,
      reason
    );
    res.json({ 
      success: true, 
      data: result, 
      message: '品级复核完成' 
    } as ApiResponse<typeof result>);
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message } as ApiResponse<null>);
  }
});

export default router;
