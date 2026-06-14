import type { Request, Response } from '../Router';
import { LogService } from '../../services/log.service';
import type { LogFilter } from '../../types/log.types';
import { OperationType } from '../../types/log.types';

const logService = new LogService();

export const logController = {
  getLogs: (req: Request, res: Response) => {
    try {
      const query = req.query || {};
      const filters: LogFilter = {
        taskId: query.taskId as string | undefined,
        assessmentId: query.assessmentId as string | undefined,
        operatorId: query.operatorId as string | undefined,
        operationType: query.operationType ? (query.operationType as OperationType) : undefined,
        startDate: query.startDate as string | undefined,
        endDate: query.endDate as string | undefined,
        page: query.page ? parseInt(query.page as string) : 1,
        pageSize: query.pageSize ? parseInt(query.pageSize as string) : 20
      };

      const result = logService.getLogs(filters);
      
      res.status = 200;
      res.json({
        success: true,
        data: result,
        message: '查询成功'
      });
    } catch (error) {
      res.status = 500;
      res.json({
        success: false,
        data: null,
        message: (error as Error).message
      });
    }
  },

  getTaskLogs: (req: Request, res: Response) => {
    try {
      const taskId = req.params?.taskId;
      
      if (!taskId) {
        res.status = 400;
        res.json({ success: false, data: null, message: '任务ID缺失' });
        return;
      }

      const logs = logService.getTaskLogs(taskId);
      const timeline = logService.buildTimeline(logs);
      
      res.status = 200;
      res.json({
        success: true,
        data: {
          taskId,
          logs,
          timeline
        },
        message: '查询成功'
      });
    } catch (error) {
      res.status = 500;
      res.json({
        success: false,
        data: null,
        message: (error as Error).message
      });
    }
  },

  getAssessmentLogs: (req: Request, res: Response) => {
    try {
      const assessmentId = req.params?.assessmentId;
      
      if (!assessmentId) {
        res.status = 400;
        res.json({ success: false, data: null, message: '定损ID缺失' });
        return;
      }

      const logs = logService.getAssessmentLogs(assessmentId);
      const timeline = logService.buildTimeline(logs);
      
      res.status = 200;
      res.json({
        success: true,
        data: {
          assessmentId,
          logs,
          timeline
        },
        message: '查询成功'
      });
    } catch (error) {
      res.status = 500;
      res.json({
        success: false,
        data: null,
        message: (error as Error).message
      });
    }
  },

  exportLogs: (req: Request, res: Response) => {
    try {
      const query = req.query || {};
      const filters: LogFilter = {
        taskId: query.taskId as string | undefined,
        startDate: query.startDate as string | undefined,
        endDate: query.endDate as string | undefined
      };

      const result = logService.getLogs(filters);
      
      const exportData = {
        exportTime: new Date().toISOString(),
        filters,
        total: result.total,
        logs: result.list
      };

      res.status = 200;
      res.json({
        success: true,
        data: {
          downloadUrl: `data:text/json;base64,${btoa(JSON.stringify(exportData, null, 2))}`,
          fileName: `logs_${Date.now()}.json`,
          count: result.total
        },
        message: '导出成功'
      });
    } catch (error) {
      res.status = 500;
      res.json({
        success: false,
        data: null,
        message: (error as Error).message
      });
    }
  }
};