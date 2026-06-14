import { db } from '../database';
import { User, Application, ApplicationStatus, MaterialRecord, SupplementNotice, FeeItem } from '../types';
import { OperationLogService } from './operationLog.service';

export interface CreateApplicationParams {
  applicantName: string;
  applicantIdNo: string;
  notaryType: string;
  appointmentNo?: string;
}

export interface SubmitMaterialParams {
  applicationId: string;
  materials: Array<{
    name: string;
    isOriginal: boolean;
    remark?: string;
  }>;
}

export interface IssueSupplementNoticeParams {
  applicationId: string;
  reason: string;
  requiredMaterials: string[];
  deadline: Date;
}

export interface RespondSupplementNoticeParams {
  noticeId: string;
  responseRemark?: string;
}

export class ApplicationService {
  static createApplication(params: CreateApplicationParams, operator: User): Application {
    const applicationNo = this.generateApplicationNo();

    const payment = db.addPaymentRecord({
      applicationId: '',
      amount: 0,
      feeItems: [],
      status: 'UNPAID',
    });

    const certificate = db.addCertificateRecord({
      applicationId: '',
      status: 'NOT_ARRANGED',
    });

    const app = db.addApplication({
      applicationNo,
      applicantName: params.applicantName,
      applicantIdNo: params.applicantIdNo,
      notaryType: params.notaryType,
      appointmentNo: params.appointmentNo,
      status: 'PENDING_MATERIALS',
      materials: [],
      supplementNotices: [],
      payment,
      certificate,
    });

    db.updatePaymentRecord(payment.id, { applicationId: app.id });
    db.updateCertificateRecord(certificate.id, { applicationId: app.id });

    OperationLogService.logOperation({
      applicationId: app.id,
      operator,
      operation: '创建公证申请',
      newStatus: 'PENDING_MATERIALS',
      remark: `申请号: ${applicationNo}, 公证类型: ${params.notaryType}${params.appointmentNo ? `, 预约号: ${params.appointmentNo}` : ''}`,
    });

    return app;
  }

  static submitMaterials(params: SubmitMaterialParams, operator: User): Application | { error: string[] } {
    const app = db.getApplicationById(params.applicationId);
    
    if (!app) {
      return { error: ['申请记录不存在'] };
    }

    const allowedStatuses: ApplicationStatus[] = ['PENDING_MATERIALS', 'SUPPLEMENT_NEEDED'];
    if (!allowedStatuses.includes(app.status)) {
      return { error: [`当前状态[${app.status}]不允许提交材料`] };
    }

    const previousStatus = app.status;
    const newMaterials: MaterialRecord[] = [];

    for (const mat of params.materials) {
      const material = db.addMaterialRecord({
        name: mat.name,
        submittedBy: operator.id,
        submittedAt: db.now(),
        isOriginal: mat.isOriginal,
        remark: mat.remark,
      });
      newMaterials.push(material);
    }

    const allMaterials = [...app.materials, ...newMaterials];
    const newStatus: ApplicationStatus = 'MATERIALS_SUBMITTED';

    const updatedApp = db.updateApplication(app.id, {
      status: newStatus,
      materials: allMaterials,
    });

    OperationLogService.logOperation({
      applicationId: app.id,
      operator,
      operation: '提交申请材料',
      previousStatus,
      newStatus,
      remark: `提交材料${newMaterials.length}份: ${newMaterials.map(m => m.name).join(', ')}`,
    });

    return updatedApp!;
  }

  static reviewAndSetPayment(params: { applicationId: string; feeItems: FeeItem[] }, operator: User): Application | { error: string[] } {
    const app = db.getApplicationById(params.applicationId);
    
    if (!app) {
      return { error: ['申请记录不存在'] };
    }

    if (app.status !== 'MATERIALS_SUBMITTED') {
      return { error: [`当前状态[${app.status}]不允许审核`] };
    }

    const previousStatus = app.status;
    const totalAmount = params.feeItems.reduce((sum, item) => sum + item.amount * item.quantity, 0);

    db.updatePaymentRecord(app.payment.id, {
      amount: totalAmount,
      feeItems: params.feeItems,
      status: 'PENDING_REGISTRATION',
    });

    const newStatus: ApplicationStatus = 'PENDING_PAYMENT';
    db.updateApplication(app.id, { status: newStatus });

    OperationLogService.logOperation({
      applicationId: app.id,
      operator,
      operation: '审核材料通过，待缴费',
      previousStatus,
      newStatus,
      remark: `应缴费用: ¥${totalAmount.toFixed(2)}, 费用项: ${params.feeItems.map(f => `${f.name}×${f.quantity}`).join(', ')}`,
    });

    return db.getApplicationById(app.id)!;
  }

  static issueSupplementNotice(params: IssueSupplementNoticeParams, operator: User): SupplementNotice | { error: string[] } {
    const app = db.getApplicationById(params.applicationId);
    
    if (!app) {
      return { error: ['申请记录不存在'] };
    }

    const previousStatus = app.status;
    const newStatus: ApplicationStatus = 'SUPPLEMENT_NEEDED';

    const notice = db.addSupplementNotice({
      applicationId: params.applicationId,
      issuedBy: operator.id,
      issuedAt: db.now(),
      reason: params.reason,
      requiredMaterials: params.requiredMaterials,
      deadline: params.deadline,
      isCompleted: false,
    });

    const updatedNotices = [...app.supplementNotices, notice];
    db.updateApplication(app.id, {
      status: newStatus,
      supplementNotices: updatedNotices,
    });

    OperationLogService.logOperation({
      applicationId: app.id,
      operator,
      operation: '发出补正通知',
      previousStatus,
      newStatus,
      remark: `补正原因: ${params.reason}, 需补充: ${params.requiredMaterials.join(', ')}, 截止日期: ${params.deadline.toLocaleDateString('zh-CN')}`,
    });

    return notice;
  }

  static getApplicationById(id: string): Application | undefined {
    return db.getApplicationById(id);
  }

  static getApplicationByNo(applicationNo: string): Application | undefined {
    return db.getApplicationByNo(applicationNo);
  }

  static getAllApplications(): Application[] {
    return db.getApplications();
  }

  static getApplicationsByStatus(status: ApplicationStatus): Application[] {
    return db.getApplications().filter(app => app.status === status);
  }

  static getStuckApplications(): Application[] {
    return db.getApplications().filter(app => {
      if (app.status === 'PENDING_MATERIALS') {
        const hours = (db.now().getTime() - app.createdAt.getTime()) / (1000 * 60 * 60);
        return hours > 120;
      }
      if (app.status === 'SUPPLEMENT_NEEDED') {
        const latestNotice = app.supplementNotices[0];
        if (latestNotice && !latestNotice.isCompleted && latestNotice.deadline < db.now()) {
          return true;
        }
      }
      if (app.status === 'MATERIALS_SUBMITTED') {
        const hours = (db.now().getTime() - app.updatedAt.getTime()) / (1000 * 60 * 60);
        return hours > 48;
      }
      if (app.status === 'PENDING_PAYMENT') {
        const hours = (db.now().getTime() - app.updatedAt.getTime()) / (1000 * 60 * 60);
        return hours > 72;
      }
      return false;
    });
  }

  private static generateApplicationNo(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${year}${month}${day}${random}`;
  }
}
