import { Request, Response } from 'express';
import { AfterSalesService } from '../services/afterSales.service';

const afterSalesService = new AfterSalesService();

export const createFeedback = async (req: Request, res: Response) => {
  try {
    const { packageId, type, description, reportedByCustomer, customerPhone } = req.body;
    const feedback = await afterSalesService.createFeedback(
      packageId,
      type,
      description,
      reportedByCustomer,
      customerPhone
    );
    res.json({ success: true, data: feedback });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const startInvestigation = async (req: Request, res: Response) => {
  try {
    const { feedbackId } = req.params;
    const { handledById } = req.body;
    const feedback = await afterSalesService.startInvestigation(feedbackId, handledById);
    res.json({ success: true, data: feedback });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const traceRootCause = async (req: Request, res: Response) => {
  try {
    const { feedbackId } = req.params;
    const traceResult = await afterSalesService.traceRootCause(feedbackId);
    res.json({ success: true, data: traceResult });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const resolveFeedback = async (req: Request, res: Response) => {
  try {
    const { feedbackId } = req.params;
    const { handledById, rootCauseWaveId, rootCausePickTaskId, resolution } = req.body;
    const feedback = await afterSalesService.resolveFeedback(
      feedbackId,
      handledById,
      rootCauseWaveId,
      rootCausePickTaskId,
      resolution
    );
    res.json({ success: true, data: feedback });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const closeFeedback = async (req: Request, res: Response) => {
  try {
    const { feedbackId } = req.params;
    const { handledById } = req.body;
    const feedback = await afterSalesService.closeFeedback(feedbackId, handledById);
    res.json({ success: true, data: feedback });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getFeedback = async (req: Request, res: Response) => {
  try {
    const { feedbackId } = req.params;
    const feedback = await afterSalesService.getFeedbackById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ success: false, error: '售后反馈不存在' });
    }
    res.json({ success: true, data: feedback });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const listFeedbacks = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string;
    const type = req.query.type as string;
    const result = await afterSalesService.listFeedbacks(page, pageSize, status, type);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getFullTraceabilityChain = async (req: Request, res: Response) => {
  try {
    const { feedbackId } = req.params;
    const chain = await afterSalesService.getFullTraceabilityChain(feedbackId);
    res.json({ success: true, data: chain });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};
