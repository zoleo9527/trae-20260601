import { TicketService } from './TicketService';
import { v4 as uuidv4 } from 'uuid';

export type TestStepResult = {
  name: string;
  success: boolean;
  duplicated: boolean;
  message?: string;
  payload?: unknown;
};

export function runFullFlowDemo(): {
  steps: TestStepResult[];
  ticketId?: string;
  applicationId?: string;
} {
  const steps: TestStepResult[] = [];
  const idPrefix = 'demo-' + Date.now();

  const cs = '张客服';
  const eng = '李工程师';
  const pa = '王管理员';

  const createReq = {
    source: '400热线',
    customer: {
      name: '陈先生',
      phone: '13800001111',
      address: '北京市朝阳区XX小区3号楼2单元501',
    },
    appliance: {
      type: '空调',
      brand: '格力',
      model: 'KFR-35GW',
      purchaseDate: '2022-06-15',
      warranty: true,
      serialNo: 'GL20220615A088',
    },
    complaintDescription: '空调制冷效果差，有时出热风，伴有异常噪音',
    operator: cs,
    idempotencyKey: `${idPrefix}-create`,
  };
  const r1 = TicketService.createTicket(createReq);
  steps.push({
    name: '【客服】1. 创建工单',
    success: r1.success,
    duplicated: r1.duplicated || false,
    message: r1.message,
    payload: { ticketNo: r1.ticket?.ticketNo, status: r1.ticket?.status },
  });
  if (!r1.success || !r1.ticket) return { steps };
  const ticketId = r1.ticket.id;

  const r1b = TicketService.createTicket(createReq);
  steps.push({
    name: '【客服】1b. 重试创建（幂等）',
    success: r1b.success,
    duplicated: r1b.duplicated || false,
    message: r1b.message,
    payload: { sameTicketNo: r1b.ticket?.ticketNo === r1.ticket.ticketNo },
  });

  const r2 = TicketService.assignEngineer({
    ticketId,
    engineer: eng,
    operator: cs,
    idempotencyKey: `${idPrefix}-assign`,
    remark: '客户要求上午上门',
  });
  steps.push({
    name: '【客服】2. 派单给工程师',
    success: r2.success,
    duplicated: r2.duplicated || false,
    message: r2.message,
    payload: { status: r2.ticket?.status, currentHandler: r2.ticket?.currentHandler },
  });

  const r3 = TicketService.startDiagnosis(ticketId, eng, `${idPrefix}-startDiag`);
  steps.push({
    name: '【工程师】3. 开始诊断',
    success: r3.success,
    duplicated: r3.duplicated || false,
    message: r3.message,
    payload: { status: (r3 as { ticket?: { status?: string } }).ticket?.status },
  });

  const r4 = TicketService.submitDiagnosis({
    ticketId,
    diagnosis: {
      symptoms: ['制冷不足', '出热风', '异常噪音'],
      faultCode: 'E3',
      faultDescription: '经检测：压缩机启动电容容量衰减（20uF降至4uF），四通阀轻微串气',
      solution: '更换压缩机启动电容，清洗四通阀；如清洗无效则更换四通阀',
      needParts: true,
      estimateMinutes: 90,
      laborFee: 180,
      remark: '电容为常见易损件，建议优先备货；四通阀暂按需申请',
    },
    operator: eng,
    idempotencyKey: `${idPrefix}-diag`,
  });
  steps.push({
    name: '【工程师】4. 提交故障诊断',
    success: r4.success,
    duplicated: r4.duplicated || false,
    message: r4.message,
    payload: {
      status: r4.ticket?.status,
      needParts: r4.ticket?.diagnosis?.needParts,
      nextAction: r4.nextAction,
    },
  });

  const r5 = TicketService.submitPartsApplication({
    ticketId,
    items: [
      {
        id: uuidv4(),
        name: '压缩机启动电容',
        sku: 'CAP-C-20UF-450V',
        quantity: 1,
        unit: '个',
        reason: '容量衰减，导致压缩机无法正常启动',
      },
      {
        id: uuidv4(),
        name: '四通阀',
        sku: 'V-SF-4W-1P',
        quantity: 1,
        unit: '个',
        reason: '串气，影响冷热切换（备用）',
      },
    ],
    operator: eng,
    idempotencyKey: `${idPrefix}-parts`,
    remark: '客户家距仓库约15公里，请安排同城急送',
  });
  steps.push({
    name: '【工程师】5. 提交配件申请（携带诊断备注）',
    success: r5.success,
    duplicated: r5.duplicated || false,
    message: r5.message,
    payload: {
      status: r5.ticket?.status,
      applicationCount: r5.ticket?.partsApplications.length,
      carriedRemark: r5.application?.diagnosisRemarkCarried,
    },
  });
  if (!r5.application) return { steps, ticketId };
  const applicationId = r5.application.id;

  const r6 = TicketService.reviewPartsApplication({
    applicationId,
    approved: true,
    reviewRemark: '两件都有库存，已安排同城急送，预计2小时内送达',
    operator: pa,
    idempotencyKey: `${idPrefix}-review`,
  });
  steps.push({
    name: '【配件管理员】6. 配件审核通过',
    success: r6.success,
    duplicated: r6.duplicated || false,
    message: r6.message,
    payload: {
      status: r6.ticket?.status,
      applicationStatus: r6.application?.status,
      reviewRemark: r6.application?.reviewRemark,
    },
  });

  const r7 = TicketService.startRepair(ticketId, eng, `${idPrefix}-startRepair`);
  steps.push({
    name: '【工程师】7. 开始维修',
    success: r7.success,
    duplicated: (r7 as { duplicated?: boolean }).duplicated || false,
    payload: { status: (r7 as { ticket?: { status?: string } }).ticket?.status },
  });

  const r8 = TicketService.completeRepair({
    ticketId,
    finalReport:
      '已更换压缩机启动电容（20uF/450V），四通阀经清洗后恢复正常，未更换；通电试机30分钟，制冷正常，无异常噪音。客户签字确认。',
    operator: eng,
    idempotencyKey: `${idPrefix}-complete`,
  });
  steps.push({
    name: '【工程师】8. 维修完成',
    success: r8.success,
    duplicated: r8.duplicated || false,
    message: r8.message,
    payload: { status: r8.ticket?.status, completedAt: r8.ticket?.completedAt },
  });

  const apps = TicketService.getPartsApplicationsByTicket(ticketId);
  steps.push({
    name: '【回看】配件申请回看',
    success: true,
    duplicated: false,
    message: `共${apps.length}条申请记录`,
    payload: apps.map((a) => ({
      id: a.id,
      status: a.status,
      items: a.items.map((i) => i.name + '×' + i.quantity),
      carriedRemark: a.diagnosisRemarkCarried,
    })),
  });

  const exp = TicketService.exportTickets({});
  steps.push({
    name: '【导出】导出任务',
    success: exp.recordCount > 0,
    duplicated: false,
    message: `导出${exp.recordCount}条，合计人工费${exp.totalLaborFee}元`,
    payload: { exportedAt: exp.exportedAt, recordCount: exp.recordCount },
  });

  return { steps, ticketId, applicationId };
}

export function runRejectFlowDemo(): {
  steps: TestStepResult[];
  ticketId?: string;
} {
  const steps: TestStepResult[] = [];
  const idPrefix = 'rej-' + Date.now();
  const cs = '赵客服';
  const eng = '钱工程师';
  const pa = '孙管理员';

  const cr = TicketService.createTicket({
    source: '官网',
    customer: { name: '周女士', phone: '13900002222', address: '上海市浦东新区YY路88号' },
    appliance: {
      type: '洗衣机',
      brand: '海尔',
      model: 'EG10014BD959WU1',
      purchaseDate: '2023-01-10',
      warranty: true,
    },
    complaintDescription: '不排水，面板显示E1错误',
    operator: cs,
    idempotencyKey: `${idPrefix}-c`,
  });
  steps.push({
    name: '【驳回流程】创建工单',
    success: cr.success,
    duplicated: false,
    payload: cr.ticket ? { ticketNo: cr.ticket.ticketNo } : undefined,
    message: cr.message,
  });
  if (!cr.ticket) return { steps };
  const ticketId = cr.ticket.id;

  TicketService.assignEngineer({
    ticketId,
    engineer: eng,
    operator: cs,
    idempotencyKey: `${idPrefix}-a`,
  });
  TicketService.startDiagnosis(ticketId, eng, `${idPrefix}-sd`);
  const dr = TicketService.submitDiagnosis({
    ticketId,
    diagnosis: {
      symptoms: ['不排水', 'E1报错'],
      faultCode: 'E1',
      faultDescription: '排水泵叶轮被硬币卡住，线圈烧毁',
      solution: '更换排水泵总成',
      needParts: true,
      laborFee: 120,
    },
    operator: eng,
    idempotencyKey: `${idPrefix}-d`,
  });
  steps.push({
    name: '【驳回流程】提交诊断（需配件）',
    success: dr.success,
    duplicated: false,
    message: dr.message,
    payload: dr.ticket ? { status: dr.ticket.status } : undefined,
  });

  const pr = TicketService.submitPartsApplication({
    ticketId,
    items: [
      {
        id: uuidv4(),
        name: '排水泵总成（非原装）',
        quantity: 1,
        unit: '个',
        reason: '客户想节省费用',
      },
    ],
    operator: eng,
    idempotencyKey: `${idPrefix}-p`,
  });
  steps.push({
    name: '【驳回流程】提交配件申请',
    success: pr.success,
    duplicated: false,
    payload: pr.application ? { items: pr.application.items.map((i) => i.name) } : undefined,
    message: pr.message,
  });
  if (!pr.application) return { steps, ticketId };

  const rr = TicketService.reviewPartsApplication({
    applicationId: pr.application.id,
    approved: false,
    reviewRemark: '该机型必须使用原装排水泵（料号：WD-DP-0031），非原装不兼容；已为你预留库存，需重新提交',
    operator: pa,
    idempotencyKey: `${idPrefix}-r`,
  });
  steps.push({
    name: '【驳回流程】管理员驳回申请',
    success: rr.success,
    duplicated: false,
    message: rr.message,
    payload: rr.application
      ? { status: rr.application.status, reviewRemark: rr.application.reviewRemark }
      : undefined,
  });

  const pr2 = TicketService.submitPartsApplication({
    ticketId,
    items: [
      {
        id: uuidv4(),
        name: '原装排水泵总成',
        sku: 'WD-DP-0031',
        quantity: 1,
        unit: '个',
        reason: '原排水泵线圈烧毁，叶轮卡死后物理损伤',
      },
    ],
    operator: eng,
    idempotencyKey: `${idPrefix}-p2`,
    remark: '按管理员要求更换为原装件',
  });
  steps.push({
    name: '【驳回流程】工程师重新提交',
    success: pr2.success,
    duplicated: false,
    message: pr2.message,
    payload: pr2.ticket
      ? { status: pr2.ticket.status, carriedRemark: pr2.application?.diagnosisRemarkCarried }
      : undefined,
  });

  return { steps, ticketId };
}
