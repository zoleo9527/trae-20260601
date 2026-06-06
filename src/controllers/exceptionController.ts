import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse, ScreeningExceptionStatus, ScreeningExceptionFilter } from '../types';
import * as exceptionService from '../services/exceptionService';

export function createException(req: AuthenticatedRequest, res: Response) {
  try {
    const { scheduleId, type, title, description, currentHallId, affectedTicketCount } = req.body;
    
    if (!scheduleId || !type || !title || !description) {
      const response: ApiResponse = {
        code: 400,
        message: '缺少必要参数',
        data: null
      };
      return res.status(400).json(response);
    }

    const exception = exceptionService.createException({
      scheduleId,
      type,
      title,
      description,
      reportedBy: req.user!.id,
      currentHallId,
      affectedTicketCount
    });

    const response: ApiResponse = {
      code: 200,
      message: '异常上报成功',
      data: exception
    };
    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      code: 500,
      message: error.message || '创建异常失败',
      data: null
    };
    res.status(500).json(response);
  }
}

export function getExceptionList(req: AuthenticatedRequest, res: Response) {
  try {
    const filter: ScreeningExceptionFilter = {
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.pageSize) || 10,
      status: req.query.status as ScreeningExceptionStatus,
      type: req.query.type as any,
      scheduleId: req.query.scheduleId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    };

    const result = exceptionService.getExceptionList(filter, req.user?.role);

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

export function getExceptionDetail(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const exception = exceptionService.getExceptionById(id);

    if (!exception) {
      const response: ApiResponse = {
        code: 404,
        message: '异常记录不存在',
        data: null
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      code: 200,
      message: 'success',
      data: exception
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

export function updateStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;

    const exception = exceptionService.updateExceptionStatus(
      id,
      status,
      req.user!.id,
      resolution
    );

    const response: ApiResponse = {
      code: 200,
      message: '状态更新成功',
      data: exception
    };
    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      code: 400,
      message: error.message || '状态更新失败',
      data: null
    };
    res.status(400).json(response);
  }
}

export function processHallChange(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { targetHallId } = req.body;

    if (!targetHallId) {
      const response: ApiResponse = {
        code: 400,
        message: '缺少目标影厅ID',
        data: null
      };
      return res.status(400).json(response);
    }

    const exception = exceptionService.processHallChange(
      id,
      targetHallId,
      req.user!.id
    );

    const response: ApiResponse = {
      code: 200,
      message: '换厅处理成功',
      data: exception
    };
    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      code: 400,
      message: error.message || '换厅处理失败',
      data: null
    };
    res.status(400).json(response);
  }
}

export function initiateRefund(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const result = exceptionService.initiateRefundForException(
      id,
      req.user!.id
    );

    const response: ApiResponse = {
      code: 200,
      message: '退票流程已发起，已生成待审核退票记录',
      data: {
        exception: result.exception,
        refunds: result.refunds,
        pendingCount: result.refunds.filter(r => r.status === 'pending').length
      }
    };
    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      code: 400,
      message: error.message || '发起退票失败',
      data: null
    };
    res.status(400).json(response);
  }
}

export function closeException(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    if (!resolution) {
      const response: ApiResponse = {
        code: 400,
        message: '请填写处理结果说明',
        data: null
      };
      return res.status(400).json(response);
    }

    const exception = exceptionService.closeException(
      id,
      req.user!.id,
      resolution
    );

    const response: ApiResponse = {
      code: 200,
      message: '异常已关闭',
      data: exception
    };
    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      code: 400,
      message: error.message || '关闭异常失败',
      data: null
    };
    res.status(400).json(response);
  }
}

export function getStatistics(req: AuthenticatedRequest, res: Response) {
  try {
    const stats = exceptionService.getExceptionStatistics();

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
