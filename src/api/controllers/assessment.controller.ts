import type { Request, Response } from '../Router';
import { AssessmentService } from '../../services/assessment.service';
import type { CreateAssessmentParams, AssessmentFilter } from '../../types/assessment.types';
import { AssessmentStatus } from '../../types/assessment.types';

const assessmentService = new AssessmentService();

export const assessmentController = {
  createAssessment: (req: Request, res: Response) => {
    try {
      const params = req.body as unknown as CreateAssessmentParams;
      
      if (!params.taskId) {
        res.status = 400;
        res.json({ success: false, data: null, message: '任务ID缺失' });
        return;
      }

      const assessment = assessmentService.createAssessment(params);
      
      res.status = 201;
      res.json({
        success: true,
        data: {
          assessmentId: assessment.assessmentId,
          assessmentNo: assessment.assessmentNo,
          status: assessment.status,
          totalAmount: assessment.totalAmount,
          createdTime: assessment.createdTime
        },
        message: '定损意见创建成功'
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

  submitAssessment: (req: Request, res: Response) => {
    try {
      const assessmentId = req.params?.assessmentId;
      const { remark } = req.body as { remark?: string };
      
      if (!assessmentId) {
        res.status = 400;
        res.json({ success: false, data: null, message: '定损ID缺失' });
        return;
      }

      const assessment = assessmentService.submitAssessment(assessmentId, remark);
      
      res.status = 200;
      res.json({
        success: true,
        data: {
          assessmentId: assessment.assessmentId,
          status: assessment.status,
          updatedTime: assessment.updatedTime
        },
        message: '定损意见已提交审核'
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

  reviewAssessment: (req: Request, res: Response) => {
    try {
      const assessmentId = req.params?.assessmentId;
      const { action, reviewComment, remark } = req.body as { 
        action: 'approve' | 'reject'; 
        reviewComment: string; 
        remark?: string 
      };
      
      if (!assessmentId || !action || !reviewComment) {
        res.status = 400;
        res.json({ success: false, data: null, message: '参数缺失' });
        return;
      }

      const assessment = assessmentService.reviewAssessment(assessmentId, action, reviewComment, remark);
      
      res.status = 200;
      res.json({
        success: true,
        data: {
          assessmentId: assessment.assessmentId,
          status: assessment.status,
          reviewTime: assessment.reviewTime,
          reviewerId: assessment.reviewerId,
          reviewerName: assessment.reviewerName
        },
        message: action === 'approve' ? '审核通过' : '审核拒绝'
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

  updateAssessment: (req: Request, res: Response) => {
    try {
      const assessmentId = req.params?.assessmentId;
      const params = req.body as Partial<CreateAssessmentParams>;
      
      if (!assessmentId) {
        res.status = 400;
        res.json({ success: false, data: null, message: '定损ID缺失' });
        return;
      }

      const assessment = assessmentService.updateAssessment(assessmentId, params);
      
      res.status = 200;
      res.json({
        success: true,
        data: {
          assessmentId: assessment.assessmentId,
          status: assessment.status,
          updatedTime: assessment.updatedTime
        },
        message: '定损意见更新成功'
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

  getAssessmentDetail: (req: Request, res: Response) => {
    try {
      const assessmentId = req.params?.assessmentId;
      
      if (!assessmentId) {
        res.status = 400;
        res.json({ success: false, data: null, message: '定损ID缺失' });
        return;
      }

      const assessment = assessmentService.getAssessmentWithDetails(assessmentId);
      
      if (!assessment) {
        res.status = 404;
        res.json({ success: false, data: null, message: '定损意见不存在' });
        return;
      }

      res.status = 200;
      res.json({
        success: true,
        data: assessment,
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

  getAssessmentHistory: (req: Request, res: Response) => {
    try {
      const assessmentId = req.params?.assessmentId;
      
      if (!assessmentId) {
        res.status = 400;
        res.json({ success: false, data: null, message: '定损ID缺失' });
        return;
      }

      const history = assessmentService.getAssessmentHistory(assessmentId);
      
      res.status = 200;
      res.json({
        success: true,
        data: {
          assessmentId,
          history
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

  getAssessmentList: (req: Request, res: Response) => {
    try {
      const query = req.query || {};
      const filters: AssessmentFilter = {
        taskId: query.taskId as string | undefined,
        status: query.status ? (query.status as AssessmentStatus) : undefined,
        assessorId: query.assessorId as string | undefined,
        startDate: query.startDate as string | undefined,
        endDate: query.endDate as string | undefined,
        keyword: query.keyword as string | undefined,
        page: query.page ? parseInt(query.page as string) : 1,
        pageSize: query.pageSize ? parseInt(query.pageSize as string) : 20
      };

      const result = assessmentService.getAssessments(filters);
      
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

  getAssessmentStats: (_req: Request, res: Response) => {
    try {
      const stats = assessmentService.getAssessmentStats();
      
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