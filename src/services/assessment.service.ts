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

const ASSESSMENT_STATUS_FLOW: Record<AssessmentStatus, AssessmentStatus[]> = {
  [AssessmentStatus.DRAFT]: [AssessmentStatus.PENDING_REVIEW],
  [AssessmentStatus.PENDING_REVIEW]: [AssessmentStatus.APPROVED, AssessmentStatus.REJECTED],
  [AssessmentStatus.APPROVED]: [],
  [AssessmentStatus.REJECTED]: [AssessmentStatus.PENDING_REVIEW]
};

const ASSESSMENT_STATUS_TRANSITION_ERRORS: Record<string, string> = {
  'APPROVED -> *': '已审核通过的定损意见不能变更状态',
  'PENDING_REVIEW -> DRAFT': '已提交的定损意见不能返回草稿'
};

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

  private validateStatusTransition(fromStatus: AssessmentStatus, toStatus: AssessmentStatus): void {
    if (fromStatus === toStatus) {
      throw new Error(`定损意见已是【${this.getStatusLabel(fromStatus)}】状态`);
    }

    const allowedStatuses = ASSESSMENT_STATUS_FLOW[fromStatus];
    if (!allowedStatuses.includes(toStatus)) {
      const errorKey = `${fromStatus} -> ${toStatus}`;
      const errorMessage = ASSESSMENT_STATUS_TRANSITION_ERRORS[errorKey] ||
                          `定损状态不能从【${this.getStatusLabel(fromStatus)}】变更为【${this.getStatusLabel(toStatus)}】`;
      throw new Error(errorMessage);
    }
  }

  private getStatusLabel(status: AssessmentStatus): string {
    const labels: Record<AssessmentStatus, string> = {
      [AssessmentStatus.DRAFT]: '草稿',
      [AssessmentStatus.PENDING_REVIEW]: '待审核',
      [AssessmentStatus.APPROVED]: '已确认',
      [AssessmentStatus.REJECTED]: '已拒绝'
    };
    return labels[status];
  }

  createAssessment(params: CreateAssessmentParams): DamageAssessment {
    const task = this.taskService.getTaskById(params.taskId);
    if (!task) {
      throw new Error('关联的任务不存在');
    }

    if (task.status !== TaskStatus.PENDING_ASSESSMENT) {
      throw new Error(`任务状态为【${this.taskService.getTaskStatusLabel(task.status)}】，只能在【待定损】状态下创建定损意见`);
    }

    const existingAssessment = this.getAssessmentByTaskId(params.taskId);
    if (existingAssessment) {
      throw new Error('该任务已有定损意见，不能重复创建');
    }

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
      status: AssessmentStatus.DRAFT,
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
      afterStatus: AssessmentStatus.DRAFT,
      remark: `定损金额：${totalAmount}元`
    });

    return newAssessment;
  }

  submitAssessment(assessmentId: string, remark?: string): DamageAssessment {
    const assessments = this.getAll();
    const assessmentIndex = assessments.findIndex(a => a.assessmentId === assessmentId);
    if (assessmentIndex === -1) {
      throw new Error('定损意见不存在');
    }

    const assessment = assessments[assessmentIndex];
    this.validateStatusTransition(assessment.status, AssessmentStatus.PENDING_REVIEW);

    const currentUser = this.userService.getCurrentUser();
    const oldStatus = assessment.status;

    assessments[assessmentIndex] = {
      ...assessment,
      status: AssessmentStatus.PENDING_REVIEW,
      updatedTime: this.getCurrentTime()
    };

    this.saveAll(assessments);

    this.logService.createLog({
      taskId: assessment.taskId,
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

  reviewAssessment(assessmentId: string, action: 'approve' | 'reject', reviewComment: string, remark?: string): DamageAssessment {
    const assessments = this.getAll();
    const assessmentIndex = assessments.findIndex(a => a.assessmentId === assessmentId);
    if (assessmentIndex === -1) {
      throw new Error('定损意见不存在');
    }

    const assessment = assessments[assessmentIndex];

    if (assessment.status === AssessmentStatus.APPROVED) {
      throw new Error('该定损意见已审核通过，不能重复审核');
    }

    if (assessment.status !== AssessmentStatus.PENDING_REVIEW) {
      throw new Error(`当前状态为【${this.getStatusLabel(assessment.status)}】，只能审核【待审核】状态的定损意见`);
    }

    const currentUser = this.userService.getCurrentUser();
    const oldStatus = assessment.status;
    const newStatus = action === 'approve' ? AssessmentStatus.APPROVED : AssessmentStatus.REJECTED;

    assessments[assessmentIndex] = {
      ...assessment,
      status: newStatus,
      reviewerId: currentUser.userId,
      reviewerName: currentUser.realName,
      reviewTime: this.getCurrentTime(),
      reviewComment,
      updatedTime: this.getCurrentTime()
    };

    this.saveAll(assessments);

    if (action === 'approve') {
      this.taskService.updateTaskStatus(assessment.taskId, TaskStatus.COMPLETED, '定损审核通过，任务完成');
    }

    this.logService.createLog({
      taskId: assessment.taskId,
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

  updateAssessment(assessmentId: string, params: Partial<CreateAssessmentParams>): DamageAssessment {
    const assessments = this.getAll();
    const assessmentIndex = assessments.findIndex(a => a.assessmentId === assessmentId);
    if (assessmentIndex === -1) {
      throw new Error('定损意见不存在');
    }

    const currentUser = this.userService.getCurrentUser();
    const assessment = assessments[assessmentIndex];

    if (assessment.status === AssessmentStatus.APPROVED) {
      throw new Error('已审核通过的定损意见不能修改');
    }

    const updatedAssessment = {
      ...assessment,
      ...(params.partsFee !== undefined && { partsFee: params.partsFee }),
      ...(params.laborFee !== undefined && { laborFee: params.laborFee }),
      ...(params.materialFee !== undefined && { materialFee: params.materialFee }),
      ...(params.repairMethod !== undefined && { repairMethod: params.repairMethod }),
      ...(params.repairPlan !== undefined && { repairPlan: params.repairPlan }),
      totalAmount: (params.partsFee || assessment.partsFee) +
                   (params.laborFee || assessment.laborFee) +
                   ((params.materialFee || assessment.materialFee) || 0),
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
      remark: params.remark || '修改了定损意见'
    });

    return updatedAssessment;
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
