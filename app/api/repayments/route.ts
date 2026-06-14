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
            borrowerName: true,
            borrowerPhone: true,
            amount: true,
          },
        },
        collections: true,
        exceptions: true,
      },
      orderBy: [
        { applicationId: "asc" },
        { period: "asc" },
      ],
    });

    return NextResponse.json(repayments);
  } catch (error) {
    console.error("获取还款计划列表失败:", error);
    return NextResponse.json(
      { error: "获取还款计划列表失败" },
      { status: 500 }
    );
  }
}