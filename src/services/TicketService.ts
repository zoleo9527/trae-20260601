import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import type {
  ServiceTicket,
  TimelineEntry,
  CommunicationRecord,
  PartsApplication,
  CreateTicketRequest,
  AssignEngineerRequest,
  SubmitDiagnosisRequest,
  SubmitPartsApplicationRequest,
  ReviewPartsRequest,
  CompleteRepairRequest,
  Role,
  TicketStatus,
} from '../types';

const STORAGE_KEY = 'appliance_after_sales_tickets_v1';
const EXPORT_LOG_KEY = 'appliance_after_sales_exports_v1';

function read(): ServiceTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ServiceTicket[];
  } catch {
    return [];
  }
}

function write(data: ServiceTicket[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data, null, 2));
}

function now(): string {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

function makeTimeline(params: {
  status: TicketStatus;
  fromStatus?: TicketStatus;
  operator: string;
  operatorRole: Role;
  remark?: string;
}): TimelineEntry {
  return {
    id: uuidv4(),
    status: params.status,
    fromStatus: params.fromStatus,
    operator: params.operator,
    operatorRole: params.operatorRole,
    occurredAt: now(),
    remark: params.remark,
  };
}

function makeCommunication(params: {
  role: Role;
  person: string;
  content: string;
  screenshotUrl?: string;
}): CommunicationRecord {
  return {
    id: uuidv4(),
    role: params.role,
    person: params.person,
    content: params.content,
    screenshotUrl: params.screenshotUrl,
    createdAt: now(),
  };
}

function generateTicketNo(): string {
  const all = read();
  const seq = String(all.length + 1).padStart(4, '0');
  return `AS${dayjs().format('YYYYMMDD')}${seq}`;
}

function checkIdempotency(ticketId: string, key: string, data: ServiceTicket[]): { dup: boolean; idx: number } {
  const idx = data.findIndex((t) => t.id === ticketId);
  if (idx < 0) return { dup: false, idx: -1 };
  const t = data[idx];
  if (t.idempotencyKeys[key]) return { dup: true, idx };
  t.idempotencyKeys[key] = true;
  return { dup: false, idx };
}

export const TicketService = {
  listTickets(role?: Role): ServiceTicket[] {
    const all = read();
    if (!role) return all;
    return all.filter((t) => t.currentHandler === role || t.status === 'completed' || t.status === 'cancelled');
  },

  getTicket(id: string): ServiceTicket | undefined {
    return read().find((t) => t.id === id);
  },

  getByTicketNo(ticketNo: string): ServiceTicket | undefined {
    return read().find((t) => t.ticketNo === ticketNo);
  },

  createTicket(req: CreateTicketRequest): { success: boolean; duplicated: boolean; ticket?: ServiceTicket; message?: string } {
    const all = read();
    const globalKey = `create:${req.idempotencyKey}`;
    if (localStorage.getItem(globalKey) === '1') {
      const existed = all[all.length - 1];
      return { success: true, duplicated: true, ticket: existed, message: '幂等命中，返回上一次创建的工单' };
    }

    const id = uuidv4();
    const ticket: ServiceTicket = {
      id,
      ticketNo: generateTicketNo(),
      source: req.source,
      customer: req.customer,
      appliance: req.appliance,
      complaintDescription: req.complaintDescription,
      createdAt: now(),
      createdBy: req.operator,
      status: 'created',
      currentHandler: 'customer_service',
      handlers: { customer_service: req.operator },
      partsApplications: [],
      onSiteRecords: [],
      communications: [
        makeCommunication({
          role: 'customer_service',
          person: req.operator,
          content: `受理客户报修：${req.complaintDescription}`,
        }),
      ],
      timeline: [
        makeTimeline({
          status: 'created',
          operator: req.operator,
          operatorRole: 'customer_service',
          remark: `来源：${req.source}`,
        }),
      ],
      idempotencyKeys: {},
    };
    all.push(ticket);
    write(all);
    localStorage.setItem(globalKey, '1');
    return { success: true, duplicated: false, ticket, message: '工单创建成功' };
  },

  assignEngineer(req: AssignEngineerRequest): { success: boolean; duplicated: boolean; ticket?: ServiceTicket; message?: string } {
    const all = read();
    const { dup, idx } = checkIdempotency(req.ticketId, `assign:${req.idempotencyKey}`, all);
    if (idx < 0) return { success: false, duplicated: false, message: '工单不存在' };
    if (dup) return { success: true, duplicated: true, ticket: all[idx], message: '幂等命中，已派单' };
    const t = all[idx];
    if (t.status !== 'created') {
      return { success: false, duplicated: false, message: `当前状态${t.status}不可派单` };
    }
    const fromStatus = t.status;
    t.status = 'assigned_to_engineer';
    t.currentHandler = 'engineer';
    t.handlers.engineer = req.engineer;
    t.timeline.push(
      makeTimeline({
        status: t.status,
        fromStatus,
        operator: req.operator,
        operatorRole: 'customer_service',
        remark: req.remark ? `派单给 ${req.engineer}；${req.remark}` : `派单给 ${req.engineer}`,
      })
    );
    t.communications.push(
      makeCommunication({
        role: 'customer_service',
        person: req.operator,
        content: `已将工单派给工程师：${req.engineer}${req.remark ? `。备注：${req.remark}` : ''}`,
      })
    );
    write(all);
    return { success: true, duplicated: false, ticket: t, message: '派单成功' };
  },

  startDiagnosis(ticketId: string, operator: string, idempotencyKey: string) {
    const all = read();
    const idx = all.findIndex((t) => t.id === ticketId);
    if (idx < 0) return { success: false, message: '工单不存在' };
    const t = all[idx];
    const key = `startDiag:${idempotencyKey}`;
    if (t.idempotencyKeys[key]) return { success: true, duplicated: true, ticket: t, message: '幂等命中' };
    if (t.status !== 'assigned_to_engineer') return { success: false, message: '当前状态不可进入诊断' };
    t.idempotencyKeys[key] = true;
    const fromStatus = t.status;
    t.status = 'diagnosing';
    t.timeline.push(
      makeTimeline({
        status: t.status,
        fromStatus,
        operator,
        operatorRole: 'engineer',
        remark: '工程师开始现场故障诊断',
      })
    );
    write(all);
    return { success: true, duplicated: false, ticket: t, message: '进入诊断' };
  },

  submitDiagnosis(req: SubmitDiagnosisRequest): { success: boolean; duplicated: boolean; ticket?: ServiceTicket; message?: string; nextAction?: string } {
    const all = read();
    const { dup, idx } = checkIdempotency(req.ticketId, `diag:${req.idempotencyKey}`, all);
    if (idx < 0) return { success: false, duplicated: false, message: '工单不存在' };
    if (dup) return { success: true, duplicated: true, ticket: all[idx], message: '幂等命中，已提交过诊断' };
    const t = all[idx];
    if (t.status !== 'diagnosing' && t.status !== 'parts_rejected') {
      return { success: false, duplicated: false, message: `当前状态${t.status}不可提交诊断` };
    }
    const fromStatus = t.status;
    t.diagnosis = req.diagnosis;
    if (req.diagnosis.needParts) {
      t.status = 'diagnosed_need_parts';
      t.timeline.push(
        makeTimeline({
          status: t.status,
          fromStatus,
          operator: req.operator,
          operatorRole: 'engineer',
          remark: req.diagnosis.remark
            ? `诊断完成，需申请配件。${req.diagnosis.remark}`
            : '诊断完成，需申请配件',
        })
      );
      t.communications.push(
        makeCommunication({
          role: 'engineer',
          person: req.operator,
          content: `【故障诊断】${req.diagnosis.faultDescription}。处理方案：${req.diagnosis.solution}${req.diagnosis.remark ? `。备注：${req.diagnosis.remark}` : ''}。待配件管理员处理申请。`,
        })
      );
      write(all);
      return {
        success: true,
        duplicated: false,
        ticket: t,
        message: '诊断完成，请继续提交配件申请',
        nextAction: 'apply_parts',
      };
    } else {
      t.status = 'diagnosed_no_parts';
      t.currentHandler = 'engineer';
      t.timeline.push(
        makeTimeline({
          status: t.status,
          fromStatus,
          operator: req.operator,
          operatorRole: 'engineer',
          remark: req.diagnosis.remark
            ? `诊断完成，无需配件。${req.diagnosis.remark}`
            : '诊断完成，无需配件，可直接进行维修',
        })
      );
      write(all);
      return {
        success: true,
        duplicated: false,
        ticket: t,
        message: '诊断完成，无需配件，可开始维修',
        nextAction: 'start_repair',
      };
    }
  },

  submitPartsApplication(req: SubmitPartsApplicationRequest): {
    success: boolean;
    duplicated: boolean;
    ticket?: ServiceTicket;
    application?: PartsApplication;
    message?: string;
  } {
    const all = read();
    const { dup, idx } = checkIdempotency(req.ticketId, `parts:${req.idempotencyKey}`, all);
    if (idx < 0) return { success: false, duplicated: false, message: '工单不存在' };
    if (dup) {
      const t = all[idx];
      return {
        success: true,
        duplicated: true,
        ticket: t,
        application: t.partsApplications[t.partsApplications.length - 1],
        message: '幂等命中，已提交过配件申请',
      };
    }
    const t = all[idx];
    if (t.status !== 'diagnosed_need_parts' && t.status !== 'parts_rejected') {
      return { success: false, duplicated: false, message: `当前状态${t.status}不可提交配件申请` };
    }
    if (!t.diagnosis) return { success: false, duplicated: false, message: '请先提交故障诊断' };
    const carriedRemark = req.remark
      ? `【诊断备注】${t.diagnosis.remark || ''}。【申请备注】${req.remark}`
      : t.diagnosis.remark || '';
    const app: PartsApplication = {
      id: uuidv4(),
      ticketId: t.id,
      appliedBy: req.operator,
      appliedAt: now(),
      items: req.items,
      diagnosisRemarkCarried: carriedRemark,
      status: 'pending',
    };
    const fromStatus = t.status;
    t.partsApplications.push(app);
    t.status = 'parts_applying';
    t.currentHandler = 'parts_admin';
    if (!t.handlers.parts_admin) t.handlers.parts_admin = req.operator;
    t.timeline.push(
      makeTimeline({
        status: t.status,
        fromStatus,
        operator: req.operator,
        operatorRole: 'engineer',
        remark: `提交配件申请，共${req.items.length}项。携带诊断备注：${carriedRemark || '无'}`,
      })
    );
    t.communications.push(
      makeCommunication({
        role: 'engineer',
        person: req.operator,
        content: `提交配件申请：${req.items.map((i) => `${i.name}×${i.quantity}${i.unit}`).join('，')}。${carriedRemark ? `备注：${carriedRemark}` : ''}`,
      })
    );
    write(all);
    return {
      success: true,
      duplicated: false,
      ticket: t,
      application: app,
      message: '配件申请已提交，请等待审核',
    };
  },

  reviewPartsApplication(req: ReviewPartsRequest): {
    success: boolean;
    duplicated: boolean;
    ticket?: ServiceTicket;
    application?: PartsApplication;
    message?: string;
  } {
    const all = read();
    const idx = all.findIndex(
      (t) => t.partsApplications.some((a) => a.id === req.applicationId)
    );
    if (idx < 0) return { success: false, duplicated: false, message: '申请不存在' };
    const t = all[idx];
    const appIdx = t.partsApplications.findIndex((a) => a.id === req.applicationId);
    const app = t.partsApplications[appIdx];
    const key = `review:${req.applicationId}:${req.idempotencyKey}`;
    if (t.idempotencyKeys[key]) {
      return { success: true, duplicated: true, ticket: t, application: app, message: '幂等命中，已审核' };
    }
    if (app.status !== 'pending') return { success: false, duplicated: false, message: '该申请已处理' };
    if (t.status !== 'parts_applying') return { success: false, duplicated: false, message: `当前状态${t.status}不可审核` };
    t.idempotencyKeys[key] = true;
    app.status = req.approved ? 'approved' : 'rejected';
    app.reviewBy = req.operator;
    app.reviewAt = now();
    app.reviewRemark = req.reviewRemark;
    const fromStatus = t.status;
    if (req.approved) {
      t.status = 'parts_approved';
      t.currentHandler = 'engineer';
      t.timeline.push(
        makeTimeline({
          status: t.status,
          fromStatus,
          operator: req.operator,
          operatorRole: 'parts_admin',
          remark: req.reviewRemark ? `配件申请已批准。${req.reviewRemark}` : '配件申请已批准',
        })
      );
      t.communications.push(
        makeCommunication({
          role: 'parts_admin',
          person: req.operator,
          content: `配件申请已批准。${req.reviewRemark ? `审核备注：${req.reviewRemark}` : ''}`,
        })
      );
    } else {
      t.status = 'parts_rejected';
      t.currentHandler = 'engineer';
      t.timeline.push(
        makeTimeline({
          status: t.status,
          fromStatus,
          operator: req.operator,
          operatorRole: 'parts_admin',
          remark: req.reviewRemark ? `配件申请已驳回。${req.reviewRemark}` : '配件申请已驳回',
        })
      );
      t.communications.push(
        makeCommunication({
          role: 'parts_admin',
          person: req.operator,
          content: `配件申请被驳回。${req.reviewRemark ? `原因：${req.reviewRemark}` : ''}`,
        })
      );
    }
    write(all);
    return {
      success: true,
      duplicated: false,
      ticket: t,
      application: app,
      message: req.approved ? '已批准，工程师可开始维修' : '已驳回，工程师可调整后重新提交',
    };
  },

  startRepair(ticketId: string, operator: string, idempotencyKey: string) {
    const all = read();
    const idx = all.findIndex((t) => t.id === ticketId);
    if (idx < 0) return { success: false, message: '工单不存在' };
    const t = all[idx];
    const key = `startRepair:${idempotencyKey}`;
    if (t.idempotencyKeys[key]) return { success: true, duplicated: true, ticket: t, message: '幂等命中' };
    if (t.status !== 'diagnosed_no_parts' && t.status !== 'parts_approved') {
      return { success: false, message: '当前状态不可开始维修' };
    }
    t.idempotencyKeys[key] = true;
    const fromStatus = t.status;
    t.status = 'repairing';
    t.timeline.push(
      makeTimeline({
        status: t.status,
        fromStatus,
        operator,
        operatorRole: 'engineer',
        remark: '开始维修作业',
      })
    );
    write(all);
    return { success: true, duplicated: false, ticket: t };
  },

  completeRepair(req: CompleteRepairRequest): { success: boolean; duplicated: boolean; ticket?: ServiceTicket; message?: string } {
    const all = read();
    const { dup, idx } = checkIdempotency(req.ticketId, `complete:${req.idempotencyKey}`, all);
    if (idx < 0) return { success: false, duplicated: false, message: '工单不存在' };
    if (dup) return { success: true, duplicated: true, ticket: all[idx], message: '幂等命中' };
    const t = all[idx];
    if (t.status !== 'repairing') return { success: false, duplicated: false, message: '当前状态不可完成' };
    const fromStatus = t.status;
    t.status = 'completed';
    t.currentHandler = 'customer_service';
    t.finalReport = req.finalReport;
    t.completedAt = now();
    t.timeline.push(
      makeTimeline({
        status: t.status,
        fromStatus,
        operator: req.operator,
        operatorRole: 'engineer',
        remark: '维修完成',
      })
    );
    t.communications.push(
      makeCommunication({
        role: 'engineer',
        person: req.operator,
        content: `维修完成，完工报告：${req.finalReport}`,
      })
    );
    write(all);
    return { success: true, duplicated: false, ticket: t, message: '维修完成' };
  },

  addCommunication(ticketId: string, record: Omit<CommunicationRecord, 'id' | 'createdAt'>) {
    const all = read();
    const idx = all.findIndex((t) => t.id === ticketId);
    if (idx < 0) return { success: false };
    all[idx].communications.push(makeCommunication(record));
    write(all);
    return { success: true };
  },

  getPartsApplicationsByTicket(ticketId: string): PartsApplication[] {
    const t = this.getTicket(ticketId);
    return t ? t.partsApplications : [];
  },

  exportTickets(filter: { startDate?: string; endDate?: string; status?: TicketStatus; role?: Role } = {}): {
    exportedAt: string;
    recordCount: number;
    totalLaborFee: number;
    rows: Array<Record<string, string | number>>;
  } {
    const all = read();
    let rows = all;
    if (filter.startDate) rows = rows.filter((t) => t.createdAt >= filter.startDate!);
    if (filter.endDate) rows = rows.filter((t) => t.createdAt <= filter.endDate! + ' 23:59:59');
    if (filter.status) rows = rows.filter((t) => t.status === filter.status);
    if (filter.role) rows = rows.filter((t) => t.currentHandler === filter.role);

    const exportRows = rows.map((t) => ({
      工单号: t.ticketNo,
      创建时间: t.createdAt,
      客户: `${t.customer.name} ${t.customer.phone}`,
      地址: t.customer.address,
      家电: `${t.appliance.brand} ${t.appliance.model}`,
      来源: t.source,
      当前状态: t.status,
      客服: t.handlers.customer_service || '',
      工程师: t.handlers.engineer || '',
      配件管理员: t.handlers.parts_admin || '',
      故障描述: t.diagnosis?.faultDescription || '',
      是否需配件: t.diagnosis?.needParts ? '是' : '否',
      配件申请次数: t.partsApplications.length,
      配件项: t.partsApplications.map((a) => a.items.map((i) => `${i.name}×${i.quantity}`).join('|')).join('||'),
      人工费: t.diagnosis?.laborFee || 0,
      完成时间: t.completedAt || '',
    }));

    const record = {
      exportId: uuidv4(),
      exportedAt: now(),
      filter: JSON.stringify(filter),
      recordCount: exportRows.length,
      operator: filter.role || 'system',
    };
    const logs = JSON.parse(localStorage.getItem(EXPORT_LOG_KEY) || '[]');
    logs.push(record);
    localStorage.setItem(EXPORT_LOG_KEY, JSON.stringify(logs));

    return {
      exportedAt: record.exportedAt,
      recordCount: exportRows.length,
      totalLaborFee: exportRows.reduce((s, r) => s + (r.人工费 as number), 0),
      rows: exportRows,
    };
  },

  getExportLogs() {
    return JSON.parse(localStorage.getItem(EXPORT_LOG_KEY) || '[]');
  },

  getDashboard() {
    const all = read();
    return {
      total: all.length,
      byStatus: all.reduce<Record<string, number>>((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {}),
      pendingParts: all.filter((t) => t.status === 'parts_applying').length,
      inDiagnosis: all.filter((t) => t.status === 'diagnosing').length,
      completed: all.filter((t) => t.status === 'completed').length,
    };
  },
};
