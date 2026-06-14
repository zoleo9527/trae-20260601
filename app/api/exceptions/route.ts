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
        logs: {
          orderBy: { createdAt: "desc" },
          take: 5,
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

    return NextResponse.json(exceptions);
  } catch (error) {
    console.error("获取异常记录列表失败:", error);
    return NextResponse.json(
      { error: "获取异常记录列表失败" },
      { status: 500 }
    );
  }
}