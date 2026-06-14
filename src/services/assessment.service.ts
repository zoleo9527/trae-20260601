import { BaseService } from './BaseService';
import { STORAGE_KEYS } from '../utils/storage';
import type { DamageAssessment, DamageDetail, CreateAssessmentParams, AssessmentFilter } from '../types/assessment.types';
import { AssessmentStatus } from '../types/assessment.types';
import { mockAssessments, mockDamageDetails } from '../data/mockAssessments';
import { getStorageData, setStorageData } from '../utils/storage';
import { generateAssessmentNo } from '../utils';
import { LogService } from './log.service';
import { OperationType, type OperationLog } from '../types/log.types';
import { UserService } from './user.service';
import { TaskStatus } from '../types/task.types';
import { TaskService } from './task.service';

export class AssessmentService extends BaseService<DamageAssessment> {
  private logService: LogService;
  private userService: UserService;
  private taskService: TaskService;
  private detailsKey: string;

  constructor() {
    super(STORAGE_KEYS.ASSESSMENTS);
    this.logService = new LogService();
    this.userService = new UserService();
    this.taskService = new TaskService();
    this.detailsKey = STORAGE_KEYS.DAMAGE_DETAILS;
    this.initializeData();
  }

  private initializeData(): void {
    const existingAssessments = getStorageData<DamageAssessment[]>(this.storageKey);
    if (!existingAssessments) {
      setStorageData(this.storageKey, mockAssessments);
    }

    const existingDetails = getStorageData<DamageDetail[]>(this.detailsKey);
    if (!existingDetails) {
      setStorageData(this.detailsKey, mockDamageDetails);
    }
  }

  createAssessment(params: CreateAssessmentParams): DamageAssessment {
    const currentUser = this.userService.getCurrentUser();
    const totalAmount = params.partsFee + params.laborFee + (params.materialFee || 0);

    const newAssessment: DamageAssessment = {
      assessmentId: this.generateId(),
      taskId: params.taskId,
      assessmentNo: generateAssessmentNo(),
      assessorId: currentUser.userId,
      assessorName: currentUser.realName,
      assessmentTime: this.getCurrentTime(),
      partsFee: params.partsFee,
      laborFee: params.laborFee,
      materialFee: params.materialFee || 0,
      totalAmount,
      repairMethod: params.repairMethod,
      repairPlan: params.repairPlan,
      status: AssessmentStatus.PENDING_REVIEW,
      createdBy: currentUser.userId,
      createdByName: currentUser.realName,
      createdTime: this.getCurrentTime(),
      updatedTime: this.getCurrentTime()
    };

    const assessments = this.getAll();
    assessments.unshift(newAssessment);
    this.saveAll(assessments);

    const details: DamageDetail[] = params.details.map(d => ({
      detailId: this.generateId(),
      assessmentId: newAssessment.assessmentId,
      partName: d.partName,
      damageType: d.damageType,
      damageLevel: d.damageLevel,
      repairMethod: d.repairMethod,
      partFee: d.partFee,
      laborFee: d.laborFee,
      remark: d.remark,
      createdTime: this.getCurrentTime()
    }));

    const allDetails = getStorageData<DamageDetail[]>(this.detailsKey) || [];
    allDetails.push(...details);
    setStorageData(this.detailsKey, allDetails);

    this.logService.createLog({
      taskId: params.taskId,
      assessmentId: newAssessment.assessmentId,
      operationType: OperationType.CREATE_ASSESSMENT,
      operationDesc: '创建定损意见',
      operatorId: currentUser.userId,
      operatorName: currentUser.realName,
      operatorRole: currentUser.role,
      afterStatus: AssessmentStatus.PENDING_REVIEW,
      remark: `定损金额：${totalAmount}元`
    });

    return newAssessment;
  }

  reviewAssessment(assessmentId: string, action: 'approve' | 'reject', reviewComment: string, remark?: string): DamageAssessment {
    const assessments = this.getAll();
    const assessmentIndex = assessments.findIndex(a => a.assessmentId === assessmentId);
    if (assessmentIndex === -1) {
      throw new Error('定损意见不存在');
    }

    const currentUser = this.userService.getCurrentUser();
    const oldStatus = assessments[assessmentIndex].status;
    const newStatus = action === 'approve' ? AssessmentStatus.APPROVED : AssessmentStatus.REJECTED;

    assessments[assessmentIndex] = {
      ...assessments[assessmentIndex],
      status: newStatus,
      reviewerId: currentUser.userId,
      reviewerName: currentUser.realName,
      reviewTime: this.getCurrentTime(),
      reviewComment,
      updatedTime: this.getCurrentTime()
    };

    this.saveAll(assessments);

    if (action === 'approve') {
      this.taskService.completeSurvey(assessments[assessmentIndex].taskId, '定损审核通过');
    }

    this.logService.createLog({
      taskId: assessments[assessmentIndex].taskId,
      assessmentId,
      operationType: action === 'approve' ? OperationType.APPROVE_ASSESSMENT : OperationType.REJECT_ASSESSMENT,
      operationDesc: action === 'approve' ? '审核通过' : '审核拒绝',
      operatorId: currentUser.userId,
      operatorName: currentUser.realName,
      operatorRole: currentUser.role,
      beforeStatus: oldStatus,
      afterStatus: newStatus,
      remark: remark || reviewComment
    });

    return assessments[assessmentIndex];
  }

  getAssessmentById(assessmentId: string): DamageAssessment | undefined {
    const assessments = this.getAll();
    return assessments.find(a => a.assessmentId === assessmentId);
  }

  getAssessmentByTaskId(taskId: string): DamageAssessment | undefined {
    const assessments = this.getAll();
    return assessments.find(a => a.taskId === taskId);
  }

  getDetailsByAssessmentId(assessmentId: string): DamageDetail[] {
    const details = getStorageData<DamageDetail[]>(this.detailsKey) || [];
    return details.filter(d => d.assessmentId === assessmentId);
  }

  getAssessments(filters?: AssessmentFilter): { list: DamageAssessment[]; total: number; page: number; pageSize: number } {
    let assessments = this.getAll();

    if (filters) {
      if (filters.taskId) {
        assessments = assessments.filter(a => a.taskId === filters.taskId);
      }
      if (filters.status) {
        assessments = assessments.filter(a => a.status === filters.status);
      }
      if (filters.assessorId) {
        assessments = assessments.filter(a => a.assessorId === filters.assessorId);
      }
      if (filters.startDate) {
        assessments = assessments.filter(a => a.createdTime >= filters.startDate!);
      }
      if (filters.endDate) {
        assessments = assessments.filter(a => a.createdTime <= filters.endDate!);
      }
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        assessments = assessments.filter(a =>
          a.assessmentNo.toLowerCase().includes(keyword) ||
          a.assessorName.toLowerCase().includes(keyword)
        );
      }

      assessments.sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());

      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      return {
        list: assessments.slice(start, end),
        total: assessments.length,
        page,
        pageSize
      };
    }

    assessments.sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());
    return {
      list: assessments,
      total: assessments.length,
      page: 1,
      pageSize: assessments.length
    };
  }

  getAssessmentStats(): { pending: number; approved: number; rejected: number } {
    const assessments = this.getAll();
    return {
      pending: assessments.filter(a => a.status === AssessmentStatus.PENDING_REVIEW).length,
      approved: assessments.filter(a => a.status === AssessmentStatus.APPROVED).length,
      rejected: assessments.filter(a => a.status === AssessmentStatus.REJECTED).length
    };
  }

  updateAssessment(assessmentId: string, params: Partial<CreateAssessmentParams>): DamageAssessment {
    const assessments = this.getAll();
    const assessmentIndex = assessments.findIndex(a => a.assessmentId === assessmentId);
    if (assessmentIndex === -1) {
      throw new Error('定损意见不存在');
    }

    const currentUser = this.userService.getCurrentUser();
    const oldStatus = assessments[assessmentIndex].status;

    if (oldStatus === AssessmentStatus.APPROVED) {
      throw new Error('已审核通过的定损意见不能修改');
    }

    const updatedAssessment = {
      ...assessments[assessmentIndex],
      ...(params.partsFee !== undefined && { partsFee: params.partsFee }),
      ...(params.laborFee !== undefined && { laborFee: params.laborFee }),
      ...(params.materialFee !== undefined && { materialFee: params.materialFee }),
      ...(params.repairMethod !== undefined && { repairMethod: params.repairMethod }),
      ...(params.repairPlan !== undefined && { repairPlan: params.repairPlan }),
      totalAmount: (params.partsFee || assessments[assessmentIndex].partsFee) + 
                   (params.laborFee || assessments[assessmentIndex].laborFee) + 
                   ((params.materialFee || assessments[assessmentIndex].materialFee) || 0),
      updatedTime: this.getCurrentTime()
    };

    assessments[assessmentIndex] = updatedAssessment;
    this.saveAll(assessments);

    if (params.details && params.details.length > 0) {
      const existingDetails = getStorageData<DamageDetail[]>(this.detailsKey) || [];
      const filteredDetails = existingDetails.filter(d => d.assessmentId !== assessmentId);
      const newDetails = params.details.map(d => ({
        detailId: this.generateId(),
        assessmentId,
        partName: d.partName,
        damageType: d.damageType,
        damageLevel: d.damageLevel,
        repairMethod: d.repairMethod,
        partFee: d.partFee,
        laborFee: d.laborFee,
        remark: d.remark,
        createdTime: this.getCurrentTime()
      }));
      setStorageData(this.detailsKey, [...filteredDetails, ...newDetails]);
    }

    this.logService.createLog({
      taskId: updatedAssessment.taskId,
      assessmentId,
      operationType: OperationType.UPDATE_ASSESSMENT,
      operationDesc: '修改定损意见',
      operatorId: currentUser.userId,
      operatorName: currentUser.realName,
      operatorRole: currentUser.role,
      beforeStatus: oldStatus,
      afterStatus: updatedAssessment.status,
      remark: params.remark || '修改了定损意见'
    });

    return updatedAssessment;
  }

  submitAssessment(assessmentId: string, remark?: string): DamageAssessment {
    const assessments = this.getAll();
    const assessmentIndex = assessments.findIndex(a => a.assessmentId === assessmentId);
    if (assessmentIndex === -1) {
      throw new Error('定损意见不存在');
    }

    const currentUser = this.userService.getCurrentUser();
    const oldStatus = assessments[assessmentIndex].status;

    assessments[assessmentIndex] = {
      ...assessments[assessmentIndex],
      status: AssessmentStatus.PENDING_REVIEW,
      updatedTime: this.getCurrentTime()
    };

    this.saveAll(assessments);

    this.logService.createLog({
      taskId: assessments[assessmentIndex].taskId,
      assessmentId,
      operationType: OperationType.SUBMIT_ASSESSMENT,
      operationDesc: '提交定损意见',
      operatorId: currentUser.userId,
      operatorName: currentUser.realName,
      operatorRole: currentUser.role,
      beforeStatus: oldStatus,
      afterStatus: AssessmentStatus.PENDING_REVIEW,
      remark: remark || '已提交审核'
    });

    return assessments[assessmentIndex];
  }

  getAssessmentHistory(assessmentId: string): OperationLog[] {
    return this.logService.getAssessmentLogs(assessmentId);
  }

  getAssessmentWithDetails(assessmentId: string): (DamageAssessment & { details: DamageDetail[]; history: OperationLog[] }) | undefined {
    const assessment = this.getAssessmentById(assessmentId);
    if (!assessment) return undefined;

    const details = this.getDetailsByAssessmentId(assessmentId);
    const history = this.getAssessmentHistory(assessmentId);

    return {
      ...assessment,
      details,
      history
    };
  }
}
