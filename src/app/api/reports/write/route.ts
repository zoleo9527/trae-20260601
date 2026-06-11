import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { Role, ReportStatus, LogAction, MaterialType } from '@/lib/types';
import { MATERIAL_DEFAULTS, generateReportNo } from '@/lib/report-mutations';

interface MaterialInput {
  id?: number;
  name: string;
  type: string;
  received?: boolean;
  remark?: string;
}

interface ReportBody {
  id?: number;
  reportMonth: string;
  salesAmount: number;
  rentDeduction: number;
  remark?: string;
  materials: MaterialInput[];
  submit: boolean;
}

export async function POST(request: Request) {
  try {
    const user = requireUser();
    if (user.role !== Role.BRAND_MANAGER || !user.brandId) {
      return NextResponse.json({ error: '仅品牌店长可新建销售上报' }, { status: 403 });
    }

    const body: ReportBody = await request.json();

    if (!body.reportMonth) {
      return NextResponse.json({ error: '请选择上报月份' }, { status: 400 });
    }
    if (!body.salesAmount || body.salesAmount <= 0) {
      return NextResponse.json({ error: '请填写销售金额' }, { status: 400 });
    }

    const salesAmount = Number(body.salesAmount);
    const rentDeduction = Number(body.rentDeduction || 0);
    const netSettlement = salesAmount - rentDeduction;

    const monthCount = await prisma.salesReport.count({
      where: { reportMonth: body.reportMonth },
    });
    const reportNo = generateReportNo(body.reportMonth, monthCount);

    const materialsData = body.materials?.length > 0
      ? body.materials.map((m) => ({
          name: m.name,
          type: m.type,
          received: !!m.received,
          remark: m.remark || null,
          receivedAt: m.received ? new Date() : null,
        }))
      : MATERIAL_DEFAULTS.map((m) => ({
          name: m.name,
          type: m.type,
          received: false,
        }));

    const report = await prisma.salesReport.create({
      data: {
        reportNo,
        brandId: user.brandId,
        reportMonth: body.reportMonth,
        salesAmount,
        rentDeduction,
        netSettlement,
        status: body.submit ? ReportStatus.SUBMITTED : ReportStatus.DRAFT,
        remark: body.remark || null,
        submitterId: user.id,
        submittedAt: body.submit ? new Date() : null,
        deadline: body.submit
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          : null,
        materials: {
          create: materialsData,
        },
      },
      include: { materials: true },
    });

    if (body.submit) {
      await prisma.activityLog.create({
        data: {
          salesReportId: report.id,
          action: LogAction.SUBMIT,
          operatorId: user.id,
          operatorName: user.name,
          remark: '提交销售上报',
          oldStatus: ReportStatus.DRAFT,
          newStatus: ReportStatus.SUBMITTED,
        },
      });
    }

    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '创建失败' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = requireUser();
    if (user.role !== Role.BRAND_MANAGER || !user.brandId) {
      return NextResponse.json({ error: '仅品牌店长可编辑销售上报' }, { status: 403 });
    }

    const body: ReportBody = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: '缺少单据ID' }, { status: 400 });
    }

    const report = await prisma.salesReport.findUnique({
      where: { id: body.id },
      include: { materials: true },
    });

    if (!report) {
      return NextResponse.json({ error: '单据不存在' }, { status: 404 });
    }
    if (report.brandId !== user.brandId) {
      return NextResponse.json({ error: '无权限编辑此单据' }, { status: 403 });
    }

    const editableStatuses = [
      ReportStatus.DRAFT,
      ReportStatus.MATERIALS_MISSING,
      ReportStatus.REVIEW_REJECTED,
      ReportStatus.OVERDUE,
    ];
    if (!editableStatuses.includes(report.status as ReportStatus)) {
      return NextResponse.json({ error: '当前状态不可编辑' }, { status: 400 });
    }

    const salesAmount = Number(body.salesAmount || report.salesAmount);
    const rentDeduction = Number(body.rentDeduction ?? report.rentDeduction);
    const netSettlement = salesAmount - rentDeduction;

    const newStatus = body.submit ? ReportStatus.SUBMITTED : ReportStatus.DRAFT;

    await prisma.material.deleteMany({ where: { salesReportId: report.id } });

    const materialsData = body.materials?.length > 0
      ? body.materials.map((m) => ({
          name: m.name,
          type: m.type,
          received: !!m.received,
          remark: m.remark || null,
          receivedAt: m.received ? new Date() : null,
        }))
      : report.materials.map((m) => ({
          name: m.name,
          type: m.type,
          received: m.received,
          remark: m.remark,
          receivedAt: m.receivedAt,
        }));

    const updateData: any = {
      reportMonth: body.reportMonth || report.reportMonth,
      salesAmount,
      rentDeduction,
      netSettlement,
      remark: body.remark !== undefined ? body.remark || null : report.remark,
      status: newStatus,
      submitterId: report.submitterId || user.id,
      submittedAt: body.submit ? new Date() : report.submittedAt,
      deadline: body.submit
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        : report.deadline,
      materials: {
        create: materialsData,
      },
    };

    if (
      [ReportStatus.MATERIALS_MISSING, ReportStatus.REVIEW_REJECTED, ReportStatus.OVERDUE].includes(
        report.status as ReportStatus
      ) &&
      body.submit
    ) {
      updateData.missingMaterials = null;
      updateData.rejectReason = null;
      updateData.isOverdue = false;
      updateData.deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      updateData.materialsCheckerId = null;
      updateData.materialsCheckedAt = null;
      updateData.reviewerId = null;
      updateData.reviewedAt = null;
    }

    const updated = await prisma.salesReport.update({
      where: { id: report.id },
      data: updateData,
      include: { materials: true },
    });

    if (body.submit) {
      await prisma.activityLog.create({
        data: {
          salesReportId: report.id,
          action:
            report.status === ReportStatus.DRAFT ? LogAction.SUBMIT : LogAction.SUPPLEMENT,
          operatorId: user.id,
          operatorName: user.name,
          remark:
            report.status === ReportStatus.DRAFT
              ? '提交销售上报'
              : '补充材料后重新提交',
          oldStatus: report.status,
          newStatus: ReportStatus.SUBMITTED,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '更新失败' }, { status: 500 });
  }
}
