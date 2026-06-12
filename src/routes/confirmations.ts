import { Router, Request, Response } from 'express';
import {
  ConfirmationService,
  CreateConfirmationDTO,
  ProvideMaterialsDTO,
  ReturnRecordDTO
} from '../services/ConfirmationService';
import { ConfirmResult } from '../types';

const router = Router();
const confirmationService = new ConfirmationService();

router.post('/:recordId', (req: Request, res: Response) => {
  try {
    const data: CreateConfirmationDTO = req.body;
    const record = confirmationService.createConfirmation(req.params.recordId, data);
    res.status(201).json({
      success: true,
      data: record,
      message: '客户确认任务已创建'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:recordId', (req: Request, res: Response) => {
  try {
    const record = confirmationService.getConfirmationDetails(req.params.recordId);
    if (!record) {
      res.status(404).json({
        success: false,
        error: '记录不存在'
      });
      return;
    }
    res.json({
      success: true,
      data: {
        recordId: record.id,
        taxPeriod: record.taxPeriod,
        currentStage: record.currentStage,
        confirmationInfo: record.confirmationInfo,
        previousConclusion: {
          taxType: record.draftInfo.draftContent.taxType,
          taxableAmount: record.draftInfo.draftContent.taxableAmount,
          taxAmount: record.draftInfo.draftContent.taxAmount,
          conclusions: record.draftInfo.draftContent.conclusions,
          applicablePolicies: record.draftInfo.draftContent.applicablePolicies,
          specialAdjustments: record.draftInfo.draftContent.specialAdjustments,
          calculations: record.draftInfo.draftContent.calculations,
          riskNotes: record.draftInfo.draftContent.riskNotes,
          sourceDocuments: record.draftInfo.sourceDocuments
        },
        draftSummary: {
          taxType: record.draftInfo.draftContent.taxType,
          taxableAmount: record.draftInfo.draftContent.taxableAmount,
          taxAmount: record.draftInfo.draftContent.taxAmount,
          conclusions: record.draftInfo.draftContent.conclusions,
          riskNotes: record.draftInfo.draftContent.riskNotes
        },
        returnInfo: record.returnInfo,
        supplementaryNotes: record.supplementaryNotes.filter(n => n.isVisibleToClient),
        responsibilityTrace: record.responsibilityTrace,
        workflowHistory: record.workflowHistory
      },
      message: '在同一工作面展示：上一环节结论 + 底稿摘要 + 确认状态 + 退回原因（如有） + 补充备注 + 责任追溯'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:recordId/provide-materials', (req: Request, res: Response) => {
  try {
    const data: ProvideMaterialsDTO = req.body;
    const userId = req.headers['x-user-id'] as string || 'unknown';
    const record = confirmationService.provideMaterials(req.params.recordId, data.materials, userId);
    res.json({
      success: true,
      data: record,
      message: '材料已提供'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:recordId/confirm', (req: Request, res: Response) => {
  try {
    const result: ConfirmResult = req.body;
    const userId = req.headers['x-user-id'] as string || 'unknown';
    const record = confirmationService.confirmRecord(req.params.recordId, result, userId);
    res.json({
      success: true,
      data: record,
      message: '申报底稿已确认'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:recordId/return', (req: Request, res: Response) => {
  try {
    const data: ReturnRecordDTO = req.body;
    const record = confirmationService.returnRecord(req.params.recordId, data);
    res.json({
      success: true,
      data: record,
      message: '申报底稿已退回',
      responsibilityNote: record.returnInfo?.responsibilityNotes || '退回原因已记录'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:recordId/notes', (req: Request, res: Response) => {
  try {
    const record = confirmationService.addNoteToRecord(req.params.recordId, req.body);
    res.json({
      success: true,
      data: record,
      message: '备注已添加'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
