import { Router, Request, Response } from 'express';
import { RecordService, RecordFilters, NoteDTO } from '../services/RecordService';
import { ResponsibilityService } from '../services/ResponsibilityService';
import { UserRole } from '../types';

const router = Router();
const recordService = new RecordService();
const responsibilityService = new ResponsibilityService();

router.get('/:id', (req: Request, res: Response) => {
  try {
    const record = recordService.getRecordById(req.params.id);
    if (!record) {
      res.status(404).json({
        success: false,
        error: '记录不存在'
      });
      return;
    }

    const includeInternal = req.query.includeInternal === 'true';
    const notes = recordService.getNotes(req.params.id, includeInternal);
    const history = recordService.getRecordHistory(req.params.id);
    const responsibilityTrace = responsibilityService.getResponsibilityTrace(req.params.id);

    res.json({
      success: true,
      data: {
        ...record,
        notes,
        history,
        responsibilityTrace,
        responsibilitySummary: responsibilityService.getResponsibilitySummary(req.params.id)
      },
      message: '完整记录包含：申报底稿 + 客户确认 + 退回原因 + 补充备注'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/', (req: Request, res: Response) => {
  try {
    const filters: RecordFilters = {
      projectId: req.query.projectId as string,
      clientId: req.query.clientId as string,
      taxPeriod: req.query.taxPeriod as string,
      status: req.query.status as string,
      currentStage: req.query.currentStage as string
    };

    const records = recordService.getRecords(filters);
    res.json({
      success: true,
      data: records,
      meta: {
        total: records.length
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:id/notes', (req: Request, res: Response) => {
  try {
    const noteData: NoteDTO = req.body;
    const note = recordService.addNote(req.params.id, noteData);
    res.status(201).json({
      success: true,
      data: note,
      message: '备注添加成功'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:id/history', (req: Request, res: Response) => {
  try {
    const history = recordService.getRecordHistory(req.params.id);
    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:id/responsibility', (req: Request, res: Response) => {
  try {
    const trace = responsibilityService.getResponsibilityTrace(req.params.id);
    const summary = responsibilityService.getResponsibilitySummary(req.params.id);
    const incomplete = responsibilityService.getIncompleteResponsibilities(req.params.id);

    res.json({
      success: true,
      data: {
        trace,
        summary,
        incompleteResponsibilities: incomplete
      },
      message: '责任追溯信息'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:id/responsibility/clarify', (req: Request, res: Response) => {
  try {
    const { notes, clarifiedBy } = req.body;
    responsibilityService.clarifyResponsibility(req.params.id, notes, clarifiedBy);
    res.json({
      success: true,
      message: '责任已明确'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
