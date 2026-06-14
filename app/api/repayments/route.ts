import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const applicationId = searchParams.get("applicationId");

    const where: any = {};
    if (status) where.status = status;
    if (applicationId) where.applicationId = applicationId;

    const repayments = await prisma.repaymentPlan.findMany({
      where,
      include: {
        application: {
          select: {
            id: true,
            borrowerName: true,
            borrowerPhone: true,
            amount: true,
            status: true,
          },
        },
        collections: {
          orderBy: { collectedAt: "desc" },
        },
        exceptions: {
          include: {
            reminders: {
              orderBy: { sentAt: "desc" },
            },
          },
        },
      },
      orderBy: [
        { applicationId: "asc" },
        { period: "asc" },
      ],
    });

    const repaymentIds = repayments.map(r => r.id);
    const logs = await prisma.operationLog.findMany({
      where: {
        businessId: { in: repaymentIds },
        businessType: "REPAYMENT",
      },
      orderBy: { createdAt: "asc" },
    });

    const logsMap = new Map<string, any[]>();
    logs.forEach(log => {
      const list = logsMap.get(log.businessId) || [];
      list.push(log);
      logsMap.set(log.businessId, list);
    });

    const result = repayments.map(repayment => ({
      ...repayment,
      operationLogs: logsMap.get(repayment.id) || [],
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("获取还款计划列表失败:", error);
    return NextResponse.json(
      { error: "获取还款计划列表失败" },
      { status: 500 }
    );
  }
}