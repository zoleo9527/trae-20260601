import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const businessType = searchParams.get("businessType");

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (businessType) where.businessType = businessType;

    const exceptions = await prisma.exceptionRecord.findMany({
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
        repayment: {
          include: {
            application: {
              select: {
                id: true,
                borrowerName: true,
                borrowerPhone: true,
              },
            },
          },
        },
        reminders: {
          orderBy: { sentAt: "desc" },
          take: 3,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const exceptionIds = exceptions.map(e => e.id);
    const logs = await prisma.operationLog.findMany({
      where: {
        businessId: { in: exceptionIds },
        businessType: "EXCEPTION",
      },
      orderBy: { createdAt: "desc" },
    });

    const logsMap = new Map<string, any[]>();
    logs.forEach(log => {
      const list = logsMap.get(log.businessId) || [];
      list.push(log);
      logsMap.set(log.businessId, list);
    });

    const result = exceptions.map(exception => ({
      ...exception,
      logs: logsMap.get(exception.id) || [],
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("获取异常记录列表失败:", error);
    return NextResponse.json(
      { error: "获取异常记录列表失败" },
      { status: 500 }
    );
  }
}