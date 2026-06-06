import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse, RefundFilter, RefundStatus, RefundReason } from '../types';
import * as refundService from '../services/refundService';

export function createRefund(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      orderId, scheduleId, exceptionId, userId, userName,
      phone, ticketCount, totalAmount, reason, remark
    } = req.body;

    if (!orderId || !scheduleId || !userId || !userName || !phone || !ticketCount || !totalAmount || !reason) {
      const response: ApiResponse = {
        code: 400,
        message: '缺少必要参数',
        data: null
      };
      return res.status(400).json(response);
    }

    const refund = refundService.createRefund({
      orderId, scheduleId, exceptionId, userId, userName,
      phone, ticketCount, totalAmount, reason, remark
    });

    const response: ApiResponse = {
      code: 200,
      message: '退票申请提交成功',
      data: refund
    };
    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      code: 500,
      message: error.message || '提交退票申请失败',
      data: null
    };
    res.status(500).json(response);
  }
}

export function getRefundList(req: AuthenticatedRequest, res: Response) {
  try {
    const filter: RefundFilter = {
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.pageSize) || 10,
      status: req.query.status as RefundStatus,
      reason: req.query.reason as RefundReason,
      scheduleId: req.query.scheduleId as string,
      exceptionId: req.query.exceptionId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      keyword: req.query.keyword as string
    };

    const result = refundService.getRefundList(filter);

    const response: ApiResponse = {
      code: 200,
      message: 'success',
      data: result
    };
    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      code: 500,
      message: error.message || '查询失败',
      data: null
    };
    res.status(500).json(response);
  }
}

export function getRefundDetail(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const refund = refundService.getRefundById(id);

    if (!refund) {
      const response: ApiResponse = {
        code: 404,
        message: '退票记录不存在',
        data: null
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      code: 200,
      message: 'success',
      data: refund
    };
    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      code: 500,
      message: error.message || '查询失败',
      data: null
    };
    res.status(500).json(response);
  }
}

export function approveRefund(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const refund = refundService.approveRefund(id, req.user!.id);

    const response: ApiResponse = {
      code: 200,
      message: '退票审批通过',
      data: refund
    };
    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      code: 400,
      message: error.message || '审批失败',
      data: null
    };
    res.status(400).json(response);
  }
}

export function rejectRefund(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { rejectReason } = req.body;

    if (!rejectReason) {
      const response: ApiResponse = {
        code: 400,
        message: '请填写驳回原因',
        data: null
      };
      return res.status(400).json(response);
    }

    const refund = refundService.rejectRefund(id, req.user!.id, rejectReason);

    const response: ApiResponse = {
      code: 200,
      message: '退票已驳回',
      data: refund
    };
    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      code: 400,
      message: error.message || '驳回失败',
      data: null
    };
    res.status(400).json(response);
  }
}

export function processRefund(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const refund = refundService.processRefund(id);

    const response: ApiResponse = {
      code: 200,
      message: '退款执行成功',
      data: refund
    };
    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      code: 400,
      message: error.message || '退款执行失败',
      data: null
    };
    res.status(400).json(response);
  }
}

export function getRefundsByExceptionId(req: AuthenticatedRequest, res: Response) {
  try {
    const { exceptionId } = req.params;
    const refunds = refundService.getRefundsByExceptionId(exceptionId);

    const response: ApiResponse = {
      code: 200,
      message: 'success',
      data: refunds
    };
    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      code: 500,
      message: error.message || '查询失败',
      data: null
    };
    res.status(500).json(response);
  }
}

export function getStatistics(req: AuthenticatedRequest, res: Response) {
  try {
    const stats = refundService.getRefundStatistics();

    const response: ApiResponse = {
      code: 200,
      message: 'success',
      data: stats
    };
    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      code: 500,
      message: error.message || '获取统计失败',
      data: null
    };
    res.status(500).json(response);
  }
}

export function getReviewList(req: AuthenticatedRequest, res: Response) {
  try {
    const { startDate, endDate, page, pageSize } = req.query;

    const result = refundService.getRefundReviewList(
      startDate as string,
      endDate as string,
      Number(page) || 1,
      Number(pageSize) || 20
    );

    const response: ApiResponse = {
      code: 200,
      message: 'success',
      data: result
    };
    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      code: 500,
      message: error.message || '查询失败',
      data: null
    };
    res.status(500).json(response);
  }
}
