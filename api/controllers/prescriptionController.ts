import { Request, Response } from 'express';
import { prescriptionService } from '../services/prescriptionService';
import type {
  CreatePrescriptionRequest,
  ReviewRequest,
  DecoctRequest,
  DeliveryRequest,
  SignRequest,
  PrescriptionStatus,
  Role,
} from '../../shared/types';

export const getAllPrescriptions = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as PrescriptionStatus | undefined;
    const prescriptions = await prescriptionService.getAllPrescriptions(status);
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: '获取处方列表失败' });
  }
};

export const getPrescriptionsByRole = async (req: Request, res: Response) => {
  try {
    const role = req.params.role as Role;
    const prescriptions = await prescriptionService.getByRole(role);
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: '获取待办列表失败' });
  }
};

export const getHistoryByRole = async (req: Request, res: Response) => {
  try {
    const role = req.params.role as Role;
    const prescriptions = await prescriptionService.getHistoryByRole(role);
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: '获取历史记录失败' });
  }
};

export const getTodoCount = async (req: Request, res: Response) => {
  try {
    const role = req.params.role as Role;
    const count = await prescriptionService.getTodoCountByRole(role);
    res.json(count);
  } catch (error) {
    res.status(500).json({ error: '获取统计信息失败' });
  }
};

export const getPrescriptionDetail = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const detail = await prescriptionService.getDetail(id);
    if (!detail) {
      res.status(404).json({ error: '处方不存在' });
      return;
    }
    res.json(detail);
  } catch (error) {
    res.status(500).json({ error: '获取处方详情失败' });
  }
};

export const createPrescription = async (req: Request, res: Response) => {
  try {
    const data = req.body as CreatePrescriptionRequest;
    const prescription = await prescriptionService.create(data);
    res.status(201).json(prescription);
  } catch (error) {
    res.status(500).json({ error: '创建处方失败' });
  }
};

export const reviewPrescription = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const data = req.body as ReviewRequest;
    const result = await prescriptionService.review(id, data);
    if (!result) {
      res.status(400).json({ error: '处方状态不正确或不存在' });
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: '审核失败' });
  }
};

export const decoctPrescription = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const data = req.body as DecoctRequest;
    const result = await prescriptionService.decoct(id, data);
    if (!result) {
      res.status(400).json({ error: '处方状态不正确或不存在' });
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: '煎药操作失败' });
  }
};

export const deliveryPrescription = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const data = req.body as DeliveryRequest;
    const result = await prescriptionService.delivery(id, data);
    if (!result) {
      res.status(400).json({ error: '处方状态不正确或不存在' });
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: '配送出库失败' });
  }
};

export const signPrescription = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const data = req.body as SignRequest;
    const result = await prescriptionService.sign(id, data);
    if (!result) {
      res.status(400).json({ error: '处方状态不正确或不存在' });
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: '签收操作失败' });
  }
};
