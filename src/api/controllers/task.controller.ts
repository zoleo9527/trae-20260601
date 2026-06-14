import type { Request, Response } from '../Router';
import { TaskService } from '../../services/task.service';
import type { CreateTaskParams, TaskFilter } from '../../types/task.types';
import { TaskStatus, UrgencyLevel } from '../../types/task.types';

const taskService = new TaskService();

export const taskController = {
  createTask: (req: Request, res: Response) => {
    try {
      const params = req.body as unknown as CreateTaskParams;
      params.urgencyLevel = (params.urgencyLevel as number) || UrgencyLevel.NORMAL;
      
      const task = taskService.createTask(params);
      
      res.status = 201;
      res.json({
        success: true,
        data: {
          taskId: task.taskId,
          taskNo: task.taskNo,
          status: task.status,
          createdTime: task.createdTime
        },
        message: '任务创建成功'
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

  assignTask: (req: Request, res: Response) => {
    try {
      const taskId = req.params?.taskId;
      const { surveyorId, remark } = req.body as { surveyorId: string; remark?: string };
      
      if (!taskId || !surveyorId) {
        res.status = 400;
        res.json({ success: false, data: null, message: '参数缺失' });
        return;
      }

      const task = taskService.assignTask(taskId, surveyorId, remark);
      
      res.status = 200;
      res.json({
        success: true,
        data: {
          taskId: task.taskId,
          assignedSurveyorId: task.assignedSurveyorId,
          assignedSurveyorName: task.assignedSurveyorName,
          assignedTime: task.assignedTime,
          status: task.status
        },
        message: '任务分配成功'
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

  acceptTask: (req: Request, res: Response) => {
    try {
      const taskId = req.params?.taskId;
      const { remark } = req.body as { remark?: string };
      
      if (!taskId) {
        res.status = 400;
        res.json({ success: false, data: null, message: '任务ID缺失' });
        return;
      }

      const task = taskService.acceptTask(taskId, remark);
      
      res.status = 200;
      res.json({
        success: true,
        data: {
          taskId: task.taskId,
          status: task.status,
          updatedTime: task.updatedTime
        },
        message: '接单成功'
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

  startSurvey: (req: Request, res: Response) => {
    try {
      const taskId = req.params?.taskId;
      const { surveyLocation, remark } = req.body as { surveyLocation: string; remark?: string };
      
      if (!taskId || !surveyLocation) {
        res.status = 400;
        res.json({ success: false, data: null, message: '参数缺失' });
        return;
      }

      const task = taskService.startSurvey(taskId, surveyLocation, remark);
      
      res.status = 200;
      res.json({
        success: true,
        data: {
          taskId: task.taskId,
          status: task.status,
          surveyStartTime: task.surveyStartTime
        },
        message: '开始查勘'
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

  completeSurvey: (req: Request, res: Response) => {
    try {
      const taskId = req.params?.taskId;
      const { remark } = req.body as { remark?: string };
      
      if (!taskId) {
        res.status = 400;
        res.json({ success: false, data: null, message: '任务ID缺失' });
        return;
      }

      const task = taskService.completeSurvey(taskId, remark);
      
      res.status = 200;
      res.json({
        success: true,
        data: {
          taskId: task.taskId,
          status: task.status,
          surveyEndTime: task.surveyEndTime
        },
        message: '查勘完成'
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

  cancelTask: (req: Request, res: Response) => {
    try {
      const taskId = req.params?.taskId;
      const { remark } = req.body as { remark?: string };
      
      if (!taskId) {
        res.status = 400;
        res.json({ success: false, data: null, message: '任务ID缺失' });
        return;
      }

      const task = taskService.cancelTask(taskId, remark);
      
      res.status = 200;
      res.json({
        success: true,
        data: {
          taskId: task.taskId,
          status: task.status
        },
        message: '任务已取消'
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

  getTaskDetail: (req: Request, res: Response) => {
    try {
      const taskId = req.params?.taskId;
      
      if (!taskId) {
        res.status = 400;
        res.json({ success: false, data: null, message: '任务ID缺失' });
        return;
      }

      const task = taskService.getTaskWithDetails(taskId);
      
      if (!task) {
        res.status = 404;
        res.json({ success: false, data: null, message: '任务不存在' });
        return;
      }

      res.status = 200;
      res.json({
        success: true,
        data: task,
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

  getTaskTimeline: (req: Request, res: Response) => {
    try {
      const taskId = req.params?.taskId;
      
      if (!taskId) {
        res.status = 400;
        res.json({ success: false, data: null, message: '任务ID缺失' });
        return;
      }

      const timeline = taskService.getTaskTimeline(taskId);
      
      res.status = 200;
      res.json({
        success: true,
        data: {
          taskId,
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

  getTaskList: (req: Request, res: Response) => {
    try {
      const query = req.query || {};
      const filters: TaskFilter = {
        status: query.status ? (query.status as TaskStatus) : undefined,
        surveyorId: query.surveyorId as string | undefined,
        urgencyLevel: query.urgencyLevel ? parseInt(query.urgencyLevel as string) : undefined,
        startDate: query.startDate as string | undefined,
        endDate: query.endDate as string | undefined,
        keyword: query.keyword as string | undefined,
        page: query.page ? parseInt(query.page as string) : 1,
        pageSize: query.pageSize ? parseInt(query.pageSize as string) : 20
      };

      const result = taskService.getTasks(filters);
      
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

  getTaskStats: (_req: Request, res: Response) => {
    try {
      const stats = taskService.getTaskStats();
      
      res.status = 200;
      res.json({
        success: true,
        data: stats,
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
  }
};