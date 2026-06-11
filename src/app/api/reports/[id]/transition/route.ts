import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ReportStatus, Role, LogAction } from '@/lib/types';

interface TransitionBody {
  action:
    | 'receive_materials'
    | 'mark_missing'
    | 'supplement_submit'
    | 'review_pass'
    | 'review_reject'
    | 'settle';
  remark?: string;
  missingMaterials?: string;
  rejectReason?: string;
  settlementAmount?: number;
  paymentMethod?: string;
  settlementDate?: string;
}

const validTransitions: Record<ReportStatus, ReportStatus[]> = {
  DRAFT: [ReportStatus.SUBMITTED],
  SUBMITTED: [ReportStatus.MATERIALS_COMPLETE, ReportStatus.MATERIALS_MISSING],
  MATERIALS_MISSING: [ReportStatus.SUBMITTED, ReportStatus.OVERDUE],
  MATERIALS_COMPLETE: [ReportStatus.REVIEW_PASSED, ReportStatus.REVIEW_REJECTED],
  REVIEW_REJECTED: [ReportStatus.SUBMITTED],
  REVIEW_PASSED: [ReportStatus.SETTLED],
  SETTLED: [],
  OVERDUE: [ReportStatus.SUBMITTED],
};

const actionToStatus: Record<string, ReportStatus> = {
  receive_materials: ReportStatus.MATERIALS_COMPLETE,
  mark_missing: ReportStatus.MATERIALS_MISSING,
  supplement_submit: ReportStatus.SUBMITTED,
  review_pass: ReportStatus.REVIEW_PASSED,
  review_reject: ReportStatus.REVIEW_REJECTED,
  settle: ReportStatus.SETTLED,
};

const actionToLog: Record<string, LogAction> = {
  receive_materials: LogAction.RECEIVE_MATERIALS,
  mark_missing: LogAction.MARK_MISSING,
  supplement_submit: LogAction.SUPPLEMENT,
  review_pass: LogAction.REVIEW_PASS,
  review_reject: LogAction.REVIEW_REJECT,
  settle: LogAction.SETTLE,
};

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireUser();
    const body: TransitionBody = await request.json();
    const id = parseInt(params.id);

    const report = await prisma.salesReport.findUnique({ where: { id } });
    if (!report) {
      return NextResponse.json({ error: '销售上报单不存在' }, { status: 404 });
    }

    const targetStatus = actionToStatus[body.action];
    if (!targetStatus) {
      return NextResponse.json({ error: '无效操作' }, { status: 400 });
    }

    const allowed = validTransitions[report.status];
    if (!allowed.includes(targetStatus)) {
      return NextResponse.json(
        { error: `状态不允许此操作: ${report.status} → ${targetStatus}` },
        { status: 400 }
      );
    }

    if (body.action === 'receive_materials' && user.role !== Role.OPERATION_SUPERVISOR) {
      return NextResponse.json({ error: '仅营运督导可收取材料' }, { status: 403 });
    }
    if (body.action === 'mark_missing' && user.role !== Role.OPERATION_SUPERVISOR) {
      return NextResponse.json({ error: '仅营运督导可标记材料缺失' }, { status: 403 });
    }
    if ((body.action === 'review_pass' || body.action === 'review_reject') && user.role !== Role.LEASING_MANAGER) {
      return NextResponse.json({ error: '仅招商经理可复核' }, { status: 403 });
    }
    if (body.action === 'settle' && user.role !== Role.LEASING_MANAGER) {
      return NextResponse.json({ error: '仅招商经理可结算' }, { status: 403 });
    }
    if (body.action === 'supplement_submit' && user.role !== Role.BRAND_MANAGER) {
      return NextResponse.json({ error: '仅品牌店长可补充提交' }, { status: 403 });
    }

    const updateData: any = {
      status: targetStatus,
    };

    const now = new Date();

    if (body.action === 'supplement_submit') {
      updateData.submittedAt = now;
      updateData.missingMaterials = null;
      updateData.rejectReason = null;
      updateData.isOverdue = false;
      updateData.deadline = null;
      updateData.materialsCheckerId = null;
      updateData.materialsCheckedAt = null;
      updateData.reviewerId = null;
      updateData.reviewedAt = null;
      updateData.materials = {
        updateMany: {
          where: {},
          data: { received: false, receivedAt: null },
        },
      };
    }
    if (body.action === 'receive_materials') {
      updateData.materialsCheckerId = user.id;
      updateData.materialsCheckedAt = now;
      updateData.materials = {
        updateMany: {
          where: { received: false },
          data: { received: true, receivedAt: now },
        },
      };
    }
    if (body.action === 'mark_missing') {
      updateData.materialsCheckerId = user.id;
      updateData.materialsCheckedAt = now;
      updateData.missingMaterials = body.missingMaterials;
    }
    if (body.action === 'review_pass') {
      updateData.reviewerId = user.id;
      updateData.reviewedAt = now;
    }
    if (body.action === 'review_reject') {
      updateData.reviewerId = user.id;
      updateData.reviewedAt = now;
      updateData.rejectReason = body.rejectReason;
    }
    if (body.action === 'settle') {
      updateData.settlerId = user.id;
      updateData.settledAt = now;
      updateData.settlementAmount = body.settlementAmount;
      updateData.settlementDate = body.settlementDate ? new Date(body.settlementDate) : now;
      updateData.paymentMethod = body.paymentMethod;
      if (body.remark) updateData.remark = body.remark;
    }

    const updated = await prisma.salesReport.update({
      where: { id },
      data: updateData,
      include: {
        brand: true,
        activityLogs: { orderBy: { createdAt: 'desc' } },
      },
    });

    await prisma.activityLog.create({
      data: {
        salesReportId: id,
        action: actionToLog[body.action],
        operatorId: user.id,
        operatorName: user.name,
        remark: body.remark || body.missingMaterials || body.rejectReason || '',
        oldStatus: report.status,
        newStatus: targetStatus,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '操作失败' }, { status: 500 });
  }
}
