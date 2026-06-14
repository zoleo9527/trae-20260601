import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const application = await prisma.loanApplication.findUnique({
      where: { id: params.id },
      include: {
        riskDocuments: true,
        confirmation: {
          include: {
            operator: true,
          },
        },
        repaymentPlans: {
          orderBy: {
            period: "asc",
          },
        },
        exceptions: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "借款申请不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("获取借款申请详情失败:", error);
    return NextResponse.json(
      { error: "获取借款申请详情失败" },
      { status: 500 }
    );
  }
}